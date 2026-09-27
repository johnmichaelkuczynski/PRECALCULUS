#!/usr/bin/env node
/**
 * Post-build prerender script.
 *
 * Generates a static HTML file for every lecture and week URL so that
 * search-engine crawlers can read the content without running JavaScript.
 *
 * Strategy:
 *  1. Read the built index.html from dist/public as the shell template.
 *  2. Query the running API (or fall back to sequential IDs) to get lecture
 *     IDs from the live database.
 *  3. For each lecture: write dist/public/lectures/{id}/index.html with a
 *     unique <title>, <meta description>, <link canonical>, and an inline
 *     <article> containing the lecture content embedded in #root so crawlers
 *     see it before JS loads.
 *  4. For each week: write dist/public/weeks/{n}/index.html similarly.
 *  5. Regenerate public/sitemap.xml with all lecture + week URLs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPICS, WEEK_META } from "./course-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist", "public");
const publicDir = path.resolve(__dirname, "..", "public");

const SITE_BASE = "https://finance101.xyz";
const BASE_PATH = process.env.BASE_PATH ?? "/";

// ---------------------------------------------------------------------------
// 1. Load the built shell HTML
// ---------------------------------------------------------------------------
const shellPath = path.join(distDir, "index.html");
if (!fs.existsSync(shellPath)) {
  console.error(`[prerender] ERROR: ${shellPath} not found. Run vite build first.`);
  process.exit(1);
}
const shellHtml = fs.readFileSync(shellPath, "utf8");

// ---------------------------------------------------------------------------
// 2. Get real lecture IDs from the API (with DB fallback)
// ---------------------------------------------------------------------------

/** @returns {Promise<Array<{id: number, title: string, weekNumber: number}>>} */
async function fetchLectureIds() {
  // 1. Try DATABASE_URL via psql (most reliable — always available in Replit builds)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const { execSync } = await import("node:child_process");
      const rows = execSync(
        `psql "${dbUrl}" -t -A -F '|' -c "SELECT id, title, week_number FROM lectures ORDER BY id"`,
        { encoding: "utf8" }
      )
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [id, title, weekNumber] = line.split("|");
          return { id: Number(id), title, weekNumber: Number(weekNumber) };
        });
      if (rows.length > 0) {
        console.log(`[prerender] Fetched ${rows.length} lecture IDs from DATABASE_URL`);
        return rows;
      }
    } catch (e) {
      console.warn("[prerender] psql query failed:", e.message);
    }
  }

  // 2. Fallback: sequential IDs 1..N in TOPICS insertion order
  console.warn("[prerender] DATABASE_URL unavailable — using sequential IDs (DB may differ)");
  return TOPICS.map((t, i) => ({ id: i + 1, title: t.lectureTitle, weekNumber: t.weekNumber }));
}

const lectureIds = await fetchLectureIds();

// Build lookup: lectureTitle -> DB id (or fallback)
const titleToId = new Map(lectureIds.map((l) => [l.title, l.id]));

// Merge DB ids into TOPICS
const lectures = TOPICS.map((t, i) => ({
  ...t,
  id: titleToId.get(t.lectureTitle) ?? i + 1,
}));

// ---------------------------------------------------------------------------
// 3. Helper: patch the HTML shell for a given page
// ---------------------------------------------------------------------------

/** Escape HTML special chars so embedded text is safe */
function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Keep crawler-facing descriptions in the useful search-snippet range. */
function metaDescription(description) {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}

/** Serialize JSON-LD without allowing content to close the script element. */
function serializeStructuredData(structuredData) {
  return JSON.stringify(structuredData, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * Build page-specific JSON-LD. The course entity remains on the landing page
 * only; child pages describe the document a crawler is currently reading.
 */
function pageStructuredData({ kind, title, description, canonical, weekNumber, lecture }) {
  const websiteId = `${SITE_BASE}/#website`;
  const organizationId = `${SITE_BASE}/#organization`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  const pageId = `${canonical}#webpage`;

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Economics 101",
      item: `${SITE_BASE}/`,
    },
  ];

  if (weekNumber) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: WEEK_META[weekNumber].title,
      item: `${SITE_BASE}/weeks/${weekNumber}`,
    });
  }

  if (kind === "lecture") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: lecture.lectureTitle,
      item: canonical,
    });
  }

  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "Economics 101",
      url: `${SITE_BASE}/`,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Economics 101",
      url: `${SITE_BASE}/`,
      publisher: { "@id": organizationId },
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbItems,
    },
  ];

  if (kind === "lecture") {
    graph.push(
      {
        "@type": "WebPage",
        "@id": pageId,
        url: canonical,
        name: title,
        description,
        isPartOf: { "@id": websiteId },
        breadcrumb: { "@id": breadcrumbId },
        mainEntity: { "@id": `${canonical}#article` },
      },
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        url: canonical,
        headline: lecture.lectureTitle,
        name: lecture.lectureTitle,
        description,
        articleSection: `Week ${lecture.weekNumber}`,
        author: { "@id": organizationId },
        publisher: { "@id": organizationId },
        isPartOf: { "@id": websiteId },
        mainEntityOfPage: { "@id": pageId },
        breadcrumb: { "@id": breadcrumbId },
        learningResourceType: "Lecture",
        educationalLevel: "Beginner",
        inLanguage: "en",
      },
    );
  } else {
    const weekLectures = lectures.filter((lecture) => lecture.weekNumber === weekNumber);
    graph.push({
      "@type": ["WebPage", "CollectionPage"],
      "@id": pageId,
      url: canonical,
      name: title,
      description,
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": breadcrumbId },
      mainEntity: {
        "@type": "ItemList",
        "@id": `${canonical}#lectures`,
        name: `${WEEK_META[weekNumber].title} lectures`,
        numberOfItems: weekLectures.length,
        itemListElement: weekLectures.map((lecture, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: lecture.lectureTitle,
          url: `${SITE_BASE}${`${BASE_PATH}lectures/${lecture.id}`.replace(/\/\//g, "/")}`,
        })),
      },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Build a static HTML page from the shell.
 * @param {object} opts
 * @param {string} opts.title         - <title> tag content
 * @param {string} opts.description   - meta description
 * @param {string} opts.canonical     - canonical URL (full https://…)
 * @param {string} opts.bodyHtml      - inner HTML placed inside #root
 * @param {object} opts.structuredData - JSON-LD to emit for this page
 */
function buildPage({ title, description, canonical, bodyHtml, structuredData }) {
  let html = shellHtml;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escHtml(description)}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escHtml(canonical)}" />`
  );

  // Replace OG/Twitter title
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escHtml(title)}" />`
  );

  // Replace OG/Twitter description
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escHtml(description)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escHtml(description)}" />`
  );

  // Replace og:url
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escHtml(canonical)}" />`
  );

  // Replace the landing-page Course schema so child pages describe themselves.
  html = html.replace(
    /<script id="course-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="page-structured-data" type="application/ld+json">\n${serializeStructuredData(structuredData)}\n</script>`
  );

  // Inject static content into #root so crawlers see it
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${bodyHtml}</div>`
  );

  return html;
}

/** Write a file, creating directories as needed */
function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

// ---------------------------------------------------------------------------
// 4. Generate lecture pages
// ---------------------------------------------------------------------------

console.log(`[prerender] Generating ${lectures.length} lecture pages…`);

for (const lec of lectures) {
  const urlPath = `${BASE_PATH}lectures/${lec.id}`.replace(/\/\//g, "/");
  const canonical = `${SITE_BASE}${urlPath === "/" ? "" : urlPath}`;

  const title = `${lec.lectureTitle} — Economics 101`;
  const description = metaDescription(
    lec.metaDescription ??
      `${lec.lectureTitle}: ${lec.blurb} Learn the economics concepts and models behind the topic.`
  );

  const bodyHtml = `<article style="padding:2rem;max-width:860px;margin:0 auto;font-family:Georgia,serif;line-height:1.7">
<p style="font-size:.85rem;color:#666;margin-bottom:.5rem">Week ${lec.weekNumber}</p>
<h1 style="font-size:2rem;font-weight:700;margin-bottom:1.5rem">${escHtml(lec.lectureTitle)}</h1>
${lec.body
  .split("\n\n")
  .map((para) => `<p>${escHtml(para.replace(/^#+\s*/, ""))}</p>`)
  .join("\n")}
</article>`;

  const html = buildPage({
    title,
    description,
    canonical,
    bodyHtml,
    structuredData: pageStructuredData({
      kind: "lecture",
      title,
      description,
      canonical,
      weekNumber: lec.weekNumber,
      lecture: lec,
    }),
  });
  const outPath = path.join(distDir, "lectures", String(lec.id), "index.html");
  writeFile(outPath, html);
}

// ---------------------------------------------------------------------------
// 5. Generate week pages
// ---------------------------------------------------------------------------

console.log(`[prerender] Generating week pages…`);

for (const [weekNumStr, meta] of Object.entries(WEEK_META)) {
  const weekNumber = Number(weekNumStr);
  const urlPath = `${BASE_PATH}weeks/${weekNumber}`.replace(/\/\//g, "/");
  const canonical = `${SITE_BASE}${urlPath}`;

  const title = `${meta.title} — Economics 101`;
  const description = metaDescription(meta.metaDescription ?? meta.summary);

  const weekLectures = lectures.filter((l) => l.weekNumber === weekNumber);

  const lectureListHtml = weekLectures
    .map(
      (l) =>
        `<li><a href="${escHtml(`${BASE_PATH}lectures/${l.id}`.replace(/\/\//g, "/"))}">${escHtml(l.lectureTitle)}</a> — ${escHtml(l.blurb)}</li>`
    )
    .join("\n");

  const bodyHtml = `<div style="padding:2rem;max-width:860px;margin:0 auto;font-family:Georgia,serif;line-height:1.7">
<h1 style="font-size:2rem;font-weight:700;margin-bottom:1rem">${escHtml(meta.title)}</h1>
<p style="font-size:1.1rem;color:#444;margin-bottom:2rem">${escHtml(meta.summary)}</p>
<h2 style="font-size:1.3rem;font-weight:600;margin-bottom:1rem">Lectures</h2>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:.5rem">
${lectureListHtml}
</ul>
</div>`;

  const html = buildPage({
    title,
    description,
    canonical,
    bodyHtml,
    structuredData: pageStructuredData({
      kind: "week",
      title,
      description,
      canonical,
      weekNumber,
    }),
  });
  const outPath = path.join(distDir, "weeks", String(weekNumber), "index.html");
  writeFile(outPath, html);
}

// ---------------------------------------------------------------------------
// 6. Regenerate sitemap.xml
// ---------------------------------------------------------------------------

console.log(`[prerender] Regenerating sitemap.xml…`);

const today = new Date().toISOString().slice(0, 10);

const weekUrls = [1, 2, 3, 4]
  .map(
    (n) => `  <url>
    <loc>${SITE_BASE}/weeks/${n}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n");

const lectureUrls = lectures
  .map(
    (l) => `  <url>
    <loc>${SITE_BASE}/lectures/${l.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_BASE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${weekUrls}
${lectureUrls}
</urlset>
`;

// Write to both dist/public (served) and public (source of truth)
writeFile(path.join(distDir, "sitemap.xml"), sitemap);
writeFile(path.join(publicDir, "sitemap.xml"), sitemap);

console.log(
  `[prerender] Done. Generated ${lectures.length} lecture pages, 4 week pages, and updated sitemap.xml.`
);
