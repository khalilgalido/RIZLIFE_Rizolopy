/* A small word filter for in-game chat. Rizolopy is played by students, so
 * common English and Filipino swear words and insults are masked with ★.
 * It is not perfect (nothing is); the host can also turn chat off for everyone.
 */

// matched anywhere inside a word ("fuuuck", "bullsh1t")
const ANYWHERE = [
  "fuck", "fuk", "fck", "shit", "bitch", "biatch", "cunt", "pussy", "whore", "slut", "bastard",
  "asshole", "nigg", "nigga", "faggot", "retard", "porn", "penis", "vagina", "tits", "dildo", "motherf",
  "putangina", "putanginamo", "putang", "tangina", "tanginamo", "punyeta", "pakyu", "pakshet", "pakingshet",
  "tarantado", "kantot", "hindot", "kupal", "burat", "bilat", "pokpok", "ulol", "ulul",
  "gago", "gaga", "bwisit", "bwiset", "kingina", "kinginamo", "inamo", "tamod",
];
// matched only as the whole word, because they hide inside innocent words
// ("ass" in "class", "puta" in "computation", "tanga" in "tangan", "cock" in "peacock").
// "Pepe" is left alone on purpose: it was Rizal's nickname.
const WHOLE = [
  "ass", "asses", "boob", "boobs", "dick", "dicks", "cock", "fag", "damn", "dumbass", "crap", "piss", "sex", "sexy", "hoe", "hoes", "wtf", "stfu", "fu", "kys",
  "puta", "puke", "titi", "tite", "tanga", "bobo", "boba", "tange", "inutil", "engot", "shet", "syet",
  "ampota", "amputa", "pota", "potek", "yawa", "piste", "pisti", "buang", "bilatibay",
];

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "l", "+": "t" };

const letters = word => word.toLowerCase().split("").map(c => LEET[c] || c).join("").replace(/[^a-z]/g, "");
/** fold a word to plain letters: lowercase, leetspeak undone, repeated letters squeezed ("fuuuck" -> "fuck") */
const fold = word => letters(word).replace(/(.)\1+/g, "$1");
/** the same, but keeping doubles so "ass" never matches "as" ("asssss" -> "ass") */
const fold2 = word => letters(word).replace(/(.)\1{2,}/g, "$1$1");
const ANY_F = ANYWHERE.map(fold);
const WHOLE_F = new Set(WHOLE.map(fold2));

function isBad(word) {
  const f = fold(word);
  if (!f) return false;
  if (WHOLE_F.has(fold2(word))) return true;
  return ANY_F.some(w => f.includes(w));
}

const mask = w => w.replace(/[^\s]/g, "★");

/** Clean one chat message. Returns { text, flagged } with bad words masked. */
export function cleanChat(raw, maxLen = 80) {
  let text = String(raw || "")
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁯]/g, "") // control and invisible characters
    .replace(/\s+/g, " ").trim();
  // squash ridiculous runs ("!!!!!!!!!!!!!", "hahahahahahahahaha") so bubbles stay small
  text = text.replace(/(.)\1{5,}/gu, "$1$1$1$1$1");
  text = Array.from(text).slice(0, maxLen).join("");
  let flagged = false;
  // whole words, keeping the punctuation around them
  text = text.replace(/[^\s]+/g, tok => {
    if (isBad(tok)) { flagged = true; return mask(tok); }
    return tok;
  });
  // spaced-out or split words: "f u c k", "tang ina", "putang ina mo"
  const words = text.split(" ");
  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const group = words.slice(i, i + n);
      const joined = fold(group.join(""));
      const allShort = group.every(w => letters(w).length <= 2);
      const hit = (allShort && ANY_F.some(w => joined.includes(w))) || ANY_F.some(w => w.length >= 6 && joined === w) || (allShort && WHOLE_F.has(fold2(group.join(""))));
      if (hit) { flagged = true; for (let k = i; k < i + n; k++) words[k] = mask(words[k]); }
    }
  }
  text = words.join(" ")
    // the rest of a masked Filipino curse: "★★★★★★ ina mo"
    .replace(/(★+)\s+(ina\s+mo|ina|mo)(?=\s|$|[!?.,])/gi, (m, a, b) => a + " " + mask(b));
  // links are not allowed in chat
  if (/(https?:\/\/|www\.)\S+/i.test(text)) { flagged = true; text = text.replace(/(https?:\/\/|www\.)\S+/gi, "(link removed)"); }
  return { text, flagged };
}
