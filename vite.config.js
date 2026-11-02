import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  esbuild: { jsx: "automatic" },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  test: { include: ["tests/finance.test.js"] },
});
