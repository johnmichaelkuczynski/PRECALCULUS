import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  inverted?: boolean;
}

function normalize(src: string): string {
  let s = src.replace(/\r\n/g, "\n");
  // Tutors may return standard LaTeX delimiters instead of Markdown math delimiters.
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) => `$${inner}$`);
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => `$$${inner}$$`);

  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner: string) => {
    const collapsed = inner.replace(/\s+/g, " ").trim();
    return `\n\n$$\n${collapsed}\n$$\n\n`;
  });

  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
}

export function MarkdownRenderer({ content, inverted = false }: MarkdownRendererProps) {
  const normalized = normalize(content ?? "");
  const base =
    "prose max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-a:text-primary prose-pre:bg-slate-50 prose-code:before:content-none prose-code:after:content-none";
  const theme = inverted
    ? "prose-invert text-inherit prose-headings:text-inherit prose-strong:text-inherit prose-code:text-inherit prose-a:text-inherit"
    : "prose-slate dark:prose-invert";
  return (
    <div className={`${base} ${theme}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, output: "html" }]]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
