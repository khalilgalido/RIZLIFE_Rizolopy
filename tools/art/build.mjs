/* Writes the original Rizolopy artwork to src/assets/svg/ (run with `npm run art`). */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PORTRAITS } from "./portraits.mjs";
import { EMBLEMS, EMOJI_MAP } from "./emblems.mjs";

const out = join(dirname(fileURLToPath(import.meta.url)), "../../src/assets/svg");
mkdirSync(out, { recursive: true });
let n = 0;
for (const [id, svg] of Object.entries(PORTRAITS)) { writeFileSync(join(out, `char-${id}.svg`), svg); n++; }
for (const [id, svg] of Object.entries(EMBLEMS)) { writeFileSync(join(out, `${id}.svg`), svg); n++; }
writeFileSync(join(out, "manifest.json"), JSON.stringify({ emoji: EMOJI_MAP, characters: Object.keys(PORTRAITS) }, null, 2) + "\n");
console.log(`wrote ${n} SVG files to ${out}`);
