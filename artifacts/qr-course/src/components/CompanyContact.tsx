import zhiLogo from "@/assets/zhi-logo.png";

export function CompanyContact({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="https://zhisystems.ai/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        compact ? "gap-2 text-xs" : "gap-2.5 text-sm"
      }`}
      aria-label="Contact Us at ZHI Systems"
    >
      <img
        src={zhiLogo}
        alt="ZHI Systems logo"
        className={`shrink-0 rounded-sm border border-border object-contain ${
          compact ? "h-6 w-6" : "h-7 w-7"
        }`}
      />
      <span className="font-medium underline-offset-4 hover:underline">Contact Us</span>
    </a>
  );
}