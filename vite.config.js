import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` makes one self-contained dist/index.html: it works on GitHub Pages
// and also when opened straight from a folder by double-clicking.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  build: { assetsInlineLimit: 100000000, chunkSizeWarningLimit: 4000 },
});
