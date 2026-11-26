/* Artwork: Microsoft Fluent Emoji 3D (MIT licence, see LICENSES.md), stored in src/assets/art
   and named by Unicode code point. Used as Phaser textures and swapped in for emoji in the HTML UI. */

const files = import.meta.glob("./assets/art/*.webp", { eager: true, query: "?url", import: "default" });

const byCode = {};
for (const [path, url] of Object.entries(files)) {
  const code = path.split("/").pop().replace(".webp", "");
  byCode[code] = url;
}

function codeOf(emoji) {
  return [...emoji].map(ch => ch.codePointAt(0).toString(16)).filter(c => c !== "fe0f").join("-");
}

export function artUrl(emoji) { return byCode[codeOf(emoji)] || null; }
export function artKey(emoji) { const c = codeOf(emoji); return byCode[c] ? "art-" + c : null; }
export const ALL_ART = Object.entries(byCode).map(([code, url]) => ({ key: "art-" + code, url }));

/* Replace emoji characters in the page with the 3D artwork, like twemoji does. */
const EMOJI_RE = /\p{Extended_Pictographic}️?/gu;

function swapTextNode(node) {
  const text = node.nodeValue;
  EMOJI_RE.lastIndex = 0;
  if (!EMOJI_RE.test(text)) return;
  EMOJI_RE.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let last = 0, m, changed = false;
  while ((m = EMOJI_RE.exec(text))) {
    const url = artUrl(m[0]);
    if (!url) continue;
    changed = true;
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const img = document.createElement("img");
    img.className = "emo";
    img.src = url;
    img.alt = m[0];
    img.draggable = false;
    frag.appendChild(img);
    last = m.index + m[0].length;
  }
  if (!changed) return;
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  node.parentNode.replaceChild(frag, node);
}

function swapIn(root) {
  if (root.nodeType === 3) { if (root.parentNode && !root.parentNode.closest("input,textarea,canvas,title,script,style")) swapTextNode(root); return; }
  if (root.nodeType !== 1 || root.matches("input,textarea,canvas,script,style")) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => n.parentNode && !n.parentNode.closest("input,textarea,canvas,script,style") && swapTextNode(n));
}

export function startEmojiArt() {
  swapIn(document.body);
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === "characterData") swapIn(m.target);
      m.addedNodes.forEach(swapIn);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
