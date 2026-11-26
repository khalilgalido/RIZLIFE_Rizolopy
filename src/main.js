/* Entry point: fonts, styles, artwork and the game. */
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/playfair-display/latin-800.css";
import "@fontsource/playfair-display/latin-900.css";
import "@fontsource/playfair-display/latin-600-italic.css";
import "@fontsource/playfair-display/latin-400-italic.css";
import "@fontsource/lato/latin-400.css";
import "@fontsource/lato/latin-700.css";
import "@fontsource/lato/latin-900.css";
import "@fontsource/noto-sans-tagalog/400.css";
import "./style.css";
import { startEmojiArt } from "./art.js";
import { boot } from "./game.js";

startEmojiArt();
// Phaser draws text onto a canvas, so the fonts must be ready before the board is built.
Promise.all([
  document.fonts.load('900 72px "Playfair Display"'),
  document.fonts.load('italic 600 26px "Playfair Display"'),
  document.fonts.load('800 17px "Playfair Display"'),
  document.fonts.load('700 13px "Lato"'),
  document.fonts.load('900 24px "Lato"'),
  document.fonts.load('400 12px "Lato"'),
  document.fonts.load('400 24px "Noto Sans Tagalog"', "ᜇᜒᜐᜎ᜔"),
]).catch(() => {}).finally(boot);
