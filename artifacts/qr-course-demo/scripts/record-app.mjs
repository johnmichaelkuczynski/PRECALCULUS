import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve('artifacts/qr-course-demo/recordings');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: '/repl/tools/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const base = 'http://localhost:80';
const responseProblems = [];
page.on('response', response => {
  if (response.url().includes('/api/') && response.status() >= 400) {
    responseProblems.push(`${response.status()} ${response.url()}`);
  }
});
const markers = {};
const started = performance.now();
function mark(stage) {
  markers[stage] = Number(((performance.now() - started) / 1000).toFixed(2));
  console.log(stage, markers[stage]);
}
async function hold(stage, seconds) {
  const remaining = seconds * 1000 - (performance.now() - started - markers[stage] * 1000);
  if (remaining > 0) await page.waitForTimeout(remaining);
}
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('button-start').waitFor();
  mark('landing');
  await hold('landing', 14);

  await page.getByTestId('button-start').click();
  await page.getByRole('heading', { name: 'Precalculus', exact: true }).waitFor();
  await page.getByText('Week 1: Functions and their graphs').waitFor();
  mark('dashboard');
  await hold('dashboard', 11);

  await page.locator('a[href="/weeks/1"]').first().click();
  await page.locator('a[href="/lectures/2"]').first().waitFor();
  mark('week');
  await page.waitForTimeout(5_000);
  await page.locator('a[href="/lectures/2"]').first().click();
  await page.getByTestId('input-math-chat').waitFor();
  await hold('week', 13);

  const dismissSuggestions = page.getByTestId('button-dismiss-all-suggestions');
  if (await dismissSuggestions.isVisible()) await dismissSuggestions.click();
  mark('tutor');
  const input = page.getByTestId('input-math-chat');
  await input.fill('For f(x)=');
  await page.getByTestId('mathkb-tab-Algebra').click();
  await page.getByTestId('mathkb-key-Algebra-√').click();
  await input.type('x+2', { delay: 130 });
  await input.press('End');
  await input.type(' what is its domain?', { delay: 65 });
  const question = await input.inputValue();
  if (!question.includes('√(x+2)')) throw new Error(`Math keyboard inserted incorrectly: ${question}`);
  await page.getByTestId('button-send-math-chat').click();
  const tutorResponse = await page.waitForResponse(
    response => response.url().includes('/api/tutor/ask') && response.request().method() === 'POST',
    { timeout: 45_000 },
  );
  const tutor = await tutorResponse.json();
  if (tutorResponse.status() !== 200 || !tutor.text || tutor.text.includes('trouble reaching')) {
    throw new Error(`Tutor did not return a usable answer: ${JSON.stringify(tutor)}`);
  }
  console.log('Verified tutor:', tutor.text.slice(0, 240));
  await hold('tutor', 20);

  await page.goto(`${base}/assignments`, { waitUntil: 'domcontentloaded' });
  await page.locator('a[href^="/assignments/"]').first().waitFor();
  mark('homework');
  await page.waitForTimeout(3_000);
  await page.locator('a[href^="/assignments/"]').first().click();
  const answer = page.locator('textarea').first();
  await answer.waitFor();
  await answer.fill('d = ');
  await page.getByTestId('mathkb-tab-Algebra').click();
  await page.getByTestId('mathkb-key-Algebra-√').click();
  await answer.type('(x₂−x₁)²+(y₂−y₁)²', { delay: 65 });
  await hold('homework', 17);

  if (responseProblems.length) throw new Error(`API responses failed: ${responseProblems.join(', ')}`);
  await page.screenshot({ path: `${outDir}/last-frame.png` });
  await context.close();
  await page.video().saveAs(`${outDir}/app-footage.webm`);
  await writeFile(`${outDir}/markers.json`, JSON.stringify({ markers, question, tutor: tutor.text }, null, 2));
  console.log('Recorded actual app:', `${outDir}/app-footage.webm`);
} finally {
  await browser.close();
}