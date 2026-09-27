import { Download } from "lucide-react";

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

// The 29 course topics, in the order used by the course PDF.
export const COURSE_TOPICS = [
  "Real numbers, intervals, and absolute value",
  "Functions and notation",
  "Graphs of functions",
  "Transformations of graphs",
  "Combining and composing functions",
  "Inverse functions",
  "Linear functions and rates of change",
  "Quadratic functions",
  "Polynomial functions and their graphs",
  "Polynomial division",
  "Zeros of polynomials",
  "Complex numbers",
  "Rational functions and asymptotes",
  "Polynomial and rational inequalities",
  "Exponential functions",
  "Logarithmic functions",
  "Properties of logarithms",
  "Exponential growth and decay",
  "Angles and radian measure",
  "The unit circle and the trigonometric functions",
  "Graphs of sine and cosine",
  "Trigonometric identities",
  "Inverse trigonometric functions and trigonometric equations",
  "The laws of sines and cosines",
  "Polar coordinates and complex numbers",
  "Conic sections",
  "Vectors in the plane",
  "Sequences and series",
  "Capstone synthesis",
];

// Small, unobtrusive vertical topics list that sits at the top-left of the
// landing page and dashboard, with course download links underneath.
export function TopicsList({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`w-56 shrink-0 ${className}`}
      aria-label="Topics covered in this course"
    >
      <h2 className="font-serif font-bold text-sm mb-0.5">Course map</h2>
      <p className="text-[11px] text-muted-foreground mb-2">
        {COURSE_TOPICS.length} topics
      </p>
      <ul className="flex flex-col gap-1.5">
        {COURSE_TOPICS.map((t) => (
          <li
            key={t}
            className="text-[11px] leading-snug text-muted-foreground"
          >
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-1.5">
        <a
          href={`${apiBase}/course/download?format=pdf`}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          data-testid="link-download-pdf"
        >
          <Download className="w-3.5 h-3.5" />
          Download Course (PDF)
        </a>
        <a
          href={`${apiBase}/course/download?format=txt`}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 text-center"
          data-testid="link-download-txt"
        >
          or download as plain text (.txt)
        </a>
        <p className="text-[10px] text-muted-foreground text-center leading-snug">
          Lecture notes, practice homework, and exam problems.
        </p>
      </div>
    </aside>
  );
}
