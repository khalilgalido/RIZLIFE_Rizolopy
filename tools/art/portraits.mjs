/* Original character portraits for Rizalopoly.
   Flat illustrated busts on a sun-ray medallion, drawn in the game palette.
   Run `npm run art` to regenerate the SVG files in src/assets/svg/. */

const INK = "#2b1611";

// shared building blocks ---------------------------------------------------
const rays = (bg, light) => {
  let r = "";
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI * 2) / 16;
    const a1 = a - 0.09, a2 = a + 0.09;
    r += `<path d="M128 128 L${128 + Math.cos(a1) * 190} ${128 + Math.sin(a1) * 190} L${128 + Math.cos(a2) * 190} ${128 + Math.sin(a2) * 190}Z" fill="${light}" opacity=".35"/>`;
  }
  return `<rect width="256" height="256" fill="${bg}"/>${r}
  <circle cx="128" cy="128" r="104" fill="none" stroke="${light}" stroke-width="3" opacity=".5"/>`;
};

const head = (skin, shade) => `
  <path d="M110 168 h36 v28 h-36z" fill="${shade}"/>
  <ellipse cx="128" cy="118" rx="40" ry="48" fill="${skin}" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="88" cy="122" rx="7" ry="11" fill="${skin}" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="168" cy="122" rx="7" ry="11" fill="${skin}" stroke="${INK}" stroke-width="4"/>`;

const face = ({ brow = INK, lash = false, blush = "#e0896b", smile = true } = {}) => `
  <path d="M104 106 q9 -6 18 0" stroke="${brow}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M134 106 q9 -6 18 0" stroke="${brow}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="113" cy="118" rx="5" ry="6" fill="${INK}"/><circle cx="115" cy="116" r="1.8" fill="#fff"/>
  <ellipse cx="143" cy="118" rx="5" ry="6" fill="${INK}"/><circle cx="145" cy="116" r="1.8" fill="#fff"/>
  ${lash ? `<path d="M106 114 l-4 -3 M150 114 l4 -3" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : ""}
  <path d="M128 122 q-4 12 2 14" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
  <ellipse cx="104" cy="136" rx="8" ry="5" fill="${blush}" opacity=".45"/>
  <ellipse cx="152" cy="136" rx="8" ry="5" fill="${blush}" opacity=".45"/>
  ${smile ? `<path d="M117 146 q11 9 22 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>` : `<path d="M118 148 h20" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`}`;

const shoulders = (fill, extra = "") => `
  <path d="M40 256 C44 206 76 186 128 186 C180 186 212 206 216 256Z" fill="${fill}" stroke="${INK}" stroke-width="4"/>${extra}`;

const wrap = (id, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
<defs><clipPath id="c-${id}"><circle cx="128" cy="128" r="128"/></clipPath></defs>
<g clip-path="url(#c-${id})">${inner}</g></svg>`;

// characters ---------------------------------------------------------------
const SKIN = { morena: "#c98b5e", morenaShade: "#a66d45", fair: "#f2c9a4", fairShade: "#d9a582", rosy: "#efb79c", rosyShade: "#d39577" };

export const PORTRAITS = {
  rizal: wrap("rizal", `${rays("#6e1a2c", "#b8913a")}
    ${shoulders("#2b2430", `
      <path d="M104 188 L128 236 L152 188 Z" fill="#fbf4e4" stroke="${INK}" stroke-width="4"/>
      <path d="M112 200 l16 8 l16 -8 l0 16 l-16 -8 l-16 8z" fill="${INK}"/>
      <path d="M86 196 l26 40 M170 196 l-26 40" stroke="#4a3f52" stroke-width="5"/>`)}
    ${head(SKIN.morena, SKIN.morenaShade)}
    <path d="M86 112 C84 66 118 58 140 64 C160 68 176 84 170 112 C164 96 150 88 134 92 C116 82 100 90 92 112Z" fill="${INK}"/>
    <path d="M120 66 q-10 14 -8 26" stroke="#5a463c" stroke-width="3" fill="none"/>
    ${face()}
    <path d="M110 140 q18 -8 36 0 q-6 6 -18 3 q-12 3 -18 -3z" fill="${INK}"/>`),

  josephine: wrap("josephine", `${rays("#1e4d3a", "#b8913a")}
    ${shoulders("#3e2a3a", `<path d="M100 186 h56 v22 q-28 14 -56 0z" fill="#fbf4e4" stroke="${INK}" stroke-width="4"/>
      <circle cx="128" cy="214" r="6" fill="#b8913a" stroke="${INK}" stroke-width="3"/>`)}
    <circle cx="128" cy="58" r="24" fill="#8a3b1e" stroke="${INK}" stroke-width="4"/>
    ${head(SKIN.fair, SKIN.fairShade)}
    <path d="M86 118 C80 70 112 62 128 64 C150 62 178 72 170 118 C166 98 150 84 128 86 C108 84 92 96 86 118Z" fill="#9a4526" stroke="${INK}" stroke-width="4"/>
    <circle cx="88" cy="138" r="4" fill="#b8913a"/><circle cx="168" cy="138" r="4" fill="#b8913a"/>
    ${face({ brow: "#7a3018", lash: true, blush: "#ef8a8a" })}`),

  paciano: wrap("paciano", `${rays("#7a4a24", "#e0b35a")}
    ${shoulders("#f4ead2", `<path d="M112 190 L128 214 L144 190" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M78 214 q10 -10 20 0 M158 214 q10 -10 20 0" stroke="#c9b48a" stroke-width="4" fill="none"/>
      <path d="M128 214 v40" stroke="#c9b48a" stroke-width="3"/>`)}
    ${head(SKIN.morena, SKIN.morenaShade)}
    <path d="M88 108 C86 70 116 62 132 64 C156 64 172 78 168 108 C158 92 142 86 128 88 C110 84 96 92 88 108Z" fill="${INK}"/>
    ${face({ smile: false })}
    <path d="M112 142 q16 -7 32 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`),

  leonor: wrap("leonor", `${rays("#c2618e", "#f6d3e2")}
    ${shoulders("#f3a9c6", `<path d="M70 230 C96 196 160 196 186 230 L170 256 H86Z" fill="#fbf4e4" stroke="${INK}" stroke-width="4" opacity=".95"/>
      <path d="M100 210 l28 26 l28 -26" fill="none" stroke="#e78fb8" stroke-width="4"/>`)}
    <path d="M82 120 C76 160 84 196 96 200 L100 120Z M174 120 C180 160 172 196 160 200 L156 120Z" fill="${INK}"/>
    ${head(SKIN.morena, SKIN.morenaShade)}
    <path d="M86 120 C80 72 110 62 128 62 C146 62 176 72 170 120 C162 98 146 86 130 84 L128 74 L126 84 C110 86 94 98 86 120Z" fill="${INK}"/>
    <g transform="translate(160 84)"><circle r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle r="3.5" fill="#f1c232"/></g>
    ${face({ lash: true, blush: "#ef7a9a" })}`),

  ibarra: wrap("ibarra", `${rays("#1f3a7a", "#9fb7e6")}
    ${shoulders("#1c1f2e", `
      <path d="M106 188 L128 226 L150 188 Z" fill="#fbf4e4" stroke="${INK}" stroke-width="4"/>
      <path d="M118 196 h20 l-4 22 h-12z" fill="#b8913a" stroke="${INK}" stroke-width="3"/>
      <path d="M82 198 l30 42 M174 198 l-30 42" stroke="#3a3f5a" stroke-width="5"/>`)}
    ${head(SKIN.morena, SKIN.morenaShade)}
    <path d="M86 116 C82 68 114 60 132 62 C156 62 176 76 170 116 C164 98 150 90 140 90 C128 86 104 86 92 104 L90 128Z" fill="${INK}"/>
    <path d="M90 116 v22 M166 116 v22" stroke="${INK}" stroke-width="7"/>
    ${face()}`),

  mariaclara: wrap("mariaclara", `${rays("#b8913a", "#fff1c4")}
    <path d="M28 256 C26 214 52 190 92 188 L164 188 C204 190 230 214 228 256Z" fill="#fff8ee" stroke="${INK}" stroke-width="4"/>
    <path d="M40 214 C30 186 60 170 92 186 M216 214 C226 186 196 170 164 186" fill="#fff8ee" stroke="${INK}" stroke-width="4"/>
    <path d="M44 210 q20 -20 48 -20 M212 210 q-20 -20 -48 -20" stroke="#d9bf7a" stroke-width="3" fill="none"/>
    <path d="M96 188 L128 238 L160 188" fill="#f6e7c8" stroke="${INK}" stroke-width="4"/>
    <path d="M104 200 l24 30 l24 -30" fill="none" stroke="#d9bf7a" stroke-width="3" stroke-dasharray="4 4"/>
    <circle cx="128" cy="56" r="20" fill="${INK}"/>
    ${head(SKIN.morena, SKIN.morenaShade)}
    <path d="M86 118 C80 70 110 62 128 62 C146 62 176 70 170 118 C164 96 148 86 128 86 C108 86 92 96 86 118Z" fill="${INK}"/>
    <g transform="translate(150 66)"><circle r="7" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="-10" cy="4" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle r="2.5" fill="#f1c232"/></g>
    ${face({ lash: true, blush: "#ef7a9a" })}`),

  elias: wrap("elias", `${rays("#2a7a8a", "#a8dde6")}
    ${shoulders("#f2ecdf", `<path d="M108 188 q20 14 40 0" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M128 196 v40" stroke="#cfc6b0" stroke-width="3"/>`)}
    ${head(SKIN.morena, SKIN.morenaShade)}
    <path d="M90 108 C90 80 112 76 128 76 C150 76 168 84 166 108 C156 98 140 96 128 96 C114 96 100 98 90 108Z" fill="${INK}"/>
    ${face({ smile: false })}
    <path d="M30 92 L128 22 L226 92 Q128 108 30 92Z" fill="#d9b26a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 86 L128 34 M96 94 L128 34 M160 94 L128 34 M196 86 L128 34" stroke="#a9813f" stroke-width="3"/>
    <circle cx="128" cy="26" r="6" fill="#8a5a2b" stroke="${INK}" stroke-width="3"/>`),

  damaso: wrap("damaso", `${rays("#3d2a2a", "#b8913a")}
    <path d="M30 256 C30 196 70 176 128 176 C186 176 226 196 226 256Z" fill="#6b4a32" stroke="${INK}" stroke-width="4"/>
    <path d="M70 200 C84 168 108 160 128 172 C148 160 172 168 186 200 C160 190 96 190 70 200Z" fill="#5a3c28" stroke="${INK}" stroke-width="4"/>
    <path d="M128 200 v56" stroke="${INK}" stroke-width="3" opacity=".5"/>
    <path d="M110 168 h36 v28 h-36z" fill="${SKIN.rosyShade}"/>
    <ellipse cx="128" cy="120" rx="46" ry="50" fill="${SKIN.rosy}" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="82" cy="124" rx="7" ry="11" fill="${SKIN.rosy}" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="174" cy="124" rx="7" ry="11" fill="${SKIN.rosy}" stroke="${INK}" stroke-width="4"/>
    <path d="M84 110 C86 88 96 80 104 78 M172 110 C170 88 160 80 152 78" stroke="#8a8a8a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M104 106 q9 -4 18 2" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M134 108 q9 -6 18 -2" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="113" cy="120" rx="5" ry="4.5" fill="${INK}"/><ellipse cx="143" cy="120" rx="5" ry="4.5" fill="${INK}"/>
    <path d="M128 124 q-5 12 3 14" stroke="${INK}" stroke-width="3" fill="none" opacity=".7"/>
    <ellipse cx="100" cy="140" rx="10" ry="6" fill="#e0505a" opacity=".45"/>
    <ellipse cx="156" cy="140" rx="10" ry="6" fill="#e0505a" opacity=".45"/>
    <path d="M116 152 q12 -6 24 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M100 160 q28 22 56 0" stroke="${INK}" stroke-width="3" fill="none" opacity=".4"/>
    <g transform="translate(128 222)"><path d="M0 -14 v28 M-9 -4 h18" stroke="#b8913a" stroke-width="5" stroke-linecap="round"/></g>`),
};
