import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const gameRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(gameRoot, "..", "..");
const audioDir = path.resolve(repoRoot, "lexicon", "audio");

function resolveInsideAudioDir(pathname: string): string | null {
  const relative = decodeURIComponent(pathname).replace(/^\/audio\/?/, "");
  if (!relative) return null;
  const resolved = path.resolve(audioDir, relative);
  if (!resolved.startsWith(audioDir + path.sep)) return null;
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return null;
  return resolved;
}

// The recordings stay in the lexicon package. The game reaches them at /audio/*
// rather than keeping a second copy of its own.
function lexiconAudio(): Plugin[] {
  return [
    {
      name: "klallam-lexicon-audio-serve",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? "";
          if (!url.startsWith("/audio/")) return next();
          const file = resolveInsideAudioDir(new URL(url, "http://localhost").pathname);
          if (file === null) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }
          res.setHeader("Content-Type", "audio/mpeg");
          fs.createReadStream(file).pipe(res);
        });
      },
    },
    {
      name: "klallam-lexicon-audio-build",
      apply: "build",
      generateBundle() {
        for (const name of fs.readdirSync(audioDir)) {
          if (path.extname(name).toLowerCase() !== ".mp3") continue;
          this.emitFile({
            type: "asset",
            fileName: `audio/${name}`,
            source: fs.readFileSync(path.join(audioDir, name)),
          });
        }
      },
    },
  ];
}

export default defineConfig({
  plugins: [lexiconAudio()],
  // The lexicon package ships TypeScript source, so it must go through the
  // transform pipeline rather than the dependency pre-bundler.
  optimizeDeps: { exclude: ["@klallam/lexicon"] },
  server: {
    // The game root sits two levels below the lexicon it imports, so the dev server
    // has to be told about it. Named explicitly rather than opening the whole repo,
    // because game:lan puts this server on the local network.
    fs: {
      allow: [gameRoot, path.resolve(repoRoot, "lexicon"), path.resolve(repoRoot, "node_modules")],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
