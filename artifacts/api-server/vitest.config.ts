import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // ESM project — let vitest transform workspace sources through vite/esbuild
    // rather than relying on the tsc-compiled dist outputs.
    pool: "forks",
    // Resolve workspace package aliases so vi.mock paths match.
    alias: {
      "@workspace/db": new URL("../../lib/db/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
