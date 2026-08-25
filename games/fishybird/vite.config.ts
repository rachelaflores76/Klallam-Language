import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const gameRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(gameRoot, "..", "..");

export default defineConfig({
  // The lexicon package ships TypeScript source, so it must go through the
  // transform pipeline rather than the dependency pre-bundler.
  optimizeDeps: { exclude: ["@klallam/lexicon"] },
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
