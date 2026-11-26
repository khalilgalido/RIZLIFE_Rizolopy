/* Original place, corner and card emblems for Rizalopoly: bold outlined shapes in the game palette.
   Each one is keyed by the file name it is written to (src/assets/svg/<key>.svg). */

const I = "#2b1611"; // ink
const P = {
  maroon: "#8a2338", maroonD: "#6e1a2c", gold: "#d4a23c", goldL: "#f1d58a", cream: "#fbefd5", paper: "#f6e6c4",
  green: "#2e7d4f", greenD: "#1e4d3a", blue: "#2c4f8a", sky: "#7fc3e3", brown: "#8a5a2b", brownL: "#c08a52",
  red: "#c0392b", white: "#fffaf0", capiz: "#ece6ef", stone: "#cdb892", stoneD: "#a8916a", leaf: "#4f9a5a",
};
const S = `stroke="${I}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const s3 = `stroke="${I}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${body}</svg>`;
const shadow = `<ellipse cx="64" cy="116" rx="44" ry="6" fill="${I}" opacity=".18"/>`;
const capizGrid = (x, y, w, h, cols, rows) => {
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.capiz}" ${s3}/>`;
  for (let c = 1; c < cols; c++) g += `<path d="M${x + (w * c) / cols} ${y} v${h}" stroke="${P.brown}" stroke-width="2"/>`;
  for (let r = 1; r < rows; r++) g += `<path d="M${x} ${y + (h * r) / rows} h${w}" stroke="${P.brown}" stroke-width="2"/>`;
  return g;
};

export const EMBLEMS = {
  // Calamba: bahay na bato (stone base, wooden upper floor with capiz windows)
  house: svg(`${shadow}
    <path d="M14 56 L64 22 L114 56 Z" fill="${P.red}" ${S}/>
    <path d="M30 46 h68" stroke="${I}" stroke-width="2" opacity=".4"/>
    <rect x="20" y="56" width="88" height="26" fill="${P.brownL}" ${S}/>
    ${capizGrid(28, 60, 18, 18, 2, 3)}${capizGrid(55, 60, 18, 18, 2, 3)}${capizGrid(82, 60, 18, 18, 2, 3)}
    <rect x="24" y="82" width="80" height="30" fill="${P.stone}" ${S}/>
    <path d="M24 92 h80 M24 102 h80 M44 82 v10 M74 82 v10 M58 92 v10 M90 92 v10" stroke="${P.stoneD}" stroke-width="2"/>
    <path d="M54 112 v-16 a10 10 0 0 1 20 0 v16" fill="${P.brown}" ${S}/>`),

  // Biñan: quill and inkwell
  quill: svg(`${shadow}
    <path d="M40 112 h48 l-6 -26 h-36 z" fill="${P.greenD}" ${S}/>
    <ellipse cx="64" cy="86" rx="18" ry="5" fill="${I}"/>
    <path d="M64 88 C70 60 86 30 110 14 C104 40 92 62 70 84 Z" fill="${P.cream}" ${S}/>
    <path d="M66 84 L100 26" stroke="${I}" stroke-width="2"/>
    <path d="M80 60 l10 2 M86 48 l10 2 M92 38 l9 1" stroke="${I}" stroke-width="2" opacity=".5"/>`),

  // Ateneo: mortarboard
  cap: svg(`${shadow}
    <path d="M36 62 v26 c0 12 56 12 56 0 v-26" fill="${P.maroonD}" ${S}/>
    <path d="M8 52 L64 30 L120 52 L64 74 Z" fill="${P.maroon}" ${S}/>
    <circle cx="64" cy="52" r="5" fill="${P.gold}" ${s3}/>
    <path d="M64 52 L100 62 v26" stroke="${P.gold}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M94 88 h12 l-2 14 h-8 z" fill="${P.gold}" ${s3}/>`),

  // UST and landmarks: classical facade
  facade: svg(`${shadow}
    <path d="M14 44 L64 16 L114 44 Z" fill="${P.goldL}" ${S}/>
    <circle cx="64" cy="34" r="6" fill="${P.gold}" ${s3}/>
    <rect x="16" y="44" width="96" height="10" fill="${P.cream}" ${S}/>
    ${[26, 46, 66, 86].map(x => `<rect x="${x}" y="54" width="14" height="46" fill="${P.white}" ${s3}/><path d="M${x + 5} 58 v38 M${x + 9} 58 v38" stroke="${P.stoneD}" stroke-width="1.5"/>`).join("")}
    <rect x="12" y="100" width="104" height="12" fill="${P.stone}" ${S}/>`),

  // Intramuros: walled gate
  walls: svg(`${shadow}
    <path d="M12 112 V48 h10 v-8 h10 v8 h10 v-8 h10 v8 h24 v-8 h10 v8 h10 v-8 h10 v8 h10 v64 Z" fill="${P.stone}" ${S}/>
    <path d="M12 66 h104 M12 84 h104 M30 48 v18 M98 48 v18 M24 66 v18 M104 66 v18 M36 84 v28 M92 84 v28" stroke="${P.stoneD}" stroke-width="2"/>
    <path d="M46 112 V78 a18 18 0 0 1 36 0 V112 Z" fill="${P.brown}" ${S}/>
    <path d="M52 112 V80 M58 112 V76 M64 112 V74 M70 112 V76 M76 112 V80" stroke="${I}" stroke-width="2" opacity=".5"/>
    <path d="M64 22 v18" stroke="${I}" stroke-width="3"/><path d="M64 22 l18 6 l-18 6z" fill="${P.red}" ${s3}/>`),

  // Madrid: domed university building
  madrid: svg(`${shadow}
    <path d="M40 54 a24 24 0 0 1 48 0 z" fill="${P.sky}" ${S}/>
    <path d="M64 30 v-12" stroke="${I}" stroke-width="3"/><circle cx="64" cy="16" r="4" fill="${P.gold}" ${s3}/>
    <rect x="34" y="54" width="60" height="8" fill="${P.cream}" ${S}/>
    <rect x="14" y="62" width="100" height="48" fill="${P.paper}" ${S}/>
    ${[22, 40, 58, 76, 94].map(x => `<path d="M${x} 108 v-22 a6 6 0 0 1 12 0 v22" fill="${P.blue}" ${s3}/>`).join("")}
    <path d="M14 74 h100" stroke="${P.stoneD}" stroke-width="2"/>`),

  // Barcelona: 1880s steamship
  ship: svg(`
    <path d="M6 104 q14 -8 28 0 t28 0 t28 0 t30 0" stroke="${P.blue}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M14 78 h100 l-14 22 h-74 z" fill="${P.maroon}" ${S}/>
    <path d="M18 86 h92" stroke="${P.gold}" stroke-width="3"/>
    <rect x="34" y="62" width="56" height="16" fill="${P.white}" ${S}/>
    ${[42, 54, 66, 78].map(x => `<circle cx="${x}" cy="70" r="3" fill="${P.sky}" stroke="${I}" stroke-width="2"/>`).join("")}
    <rect x="52" y="34" width="14" height="28" fill="${I}" stroke="${I}" stroke-width="2"/><rect x="52" y="40" width="14" height="5" fill="${P.red}"/>
    <path d="M60 30 c-4 -10 8 -12 4 -22 M70 28 c-4 -8 6 -10 4 -18" stroke="#9a9a9a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M96 78 V30 M84 40 h24" stroke="${I}" stroke-width="3"/>`),

  // Paris: Eiffel tower
  eiffel: svg(`${shadow}
    <path d="M64 8 L58 40 L48 70 L30 112 H50 C52 98 76 98 78 112 H98 L80 70 L70 40 Z" fill="${P.brownL}" ${S}/>
    <path d="M58 40 h12 M48 70 h32 M54 54 l20 0 M42 86 l44 0" stroke="${I}" stroke-width="3"/>
    <path d="M52 56 l18 14 M76 56 l-18 14 M44 86 l40 18 M84 86 l-40 18" stroke="${I}" stroke-width="1.5" opacity=".5"/>
    <path d="M64 8 v-4" stroke="${I}" stroke-width="3"/>`),

  // Heidelberg: forget-me-nots ("A las flores de Heidelberg")
  flower: svg(`${shadow}
    <path d="M64 70 C60 90 56 100 50 112 M64 80 c10 -6 22 -4 28 4 c-10 6 -22 4 -28 -4" stroke="${P.greenD}" stroke-width="4" fill="${P.leaf}" stroke-linecap="round"/>
    <g transform="translate(64 50)">
      ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-20" rx="13" ry="17" fill="${P.sky}" ${S} transform="rotate(${a})"/>`).join("")}
      <circle r="11" fill="${P.goldL}" ${S}/><circle r="4" fill="${P.gold}"/>
    </g>
    <g transform="translate(28 84) scale(.45)">
      ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-20" rx="13" ry="17" fill="${P.sky}" stroke="${I}" stroke-width="7" transform="rotate(${a})"/>`).join("")}
      <circle r="10" fill="${P.goldL}" stroke="${I}" stroke-width="7"/>
    </g>`),

  // Berlin: printing press (the Noli was printed here)
  press: svg(`${shadow}
    <rect x="22" y="30" width="12" height="80" fill="${P.brown}" ${S}/><rect x="94" y="30" width="12" height="80" fill="${P.brown}" ${S}/>
    <rect x="16" y="20" width="96" height="14" fill="${P.brownL}" ${S}/>
    <path d="M64 34 v18" stroke="${I}" stroke-width="6"/>
    <path d="M64 42 h30" stroke="${I}" stroke-width="4" stroke-linecap="round"/><circle cx="96" cy="42" r="5" fill="${P.gold}" ${s3}/>
    <rect x="38" y="52" width="52" height="10" fill="${P.stoneD}" ${S}/>
    <rect x="34" y="78" width="60" height="10" fill="${P.stoneD}" ${S}/>
    <path d="M40 78 l6 -12 h40 l-4 12" fill="${P.white}" ${s3}/>
    <path d="M52 70 h26" stroke="${I}" stroke-width="2"/>`),

  // Leitmeritz: letters from Blumentritt
  letters: svg(`${shadow}
    <g transform="rotate(-10 64 64)"><rect x="14" y="34" width="80" height="54" rx="4" fill="${P.paper}" ${S}/><path d="M14 38 L54 66 L94 38" fill="none" ${S}/></g>
    <g transform="rotate(8 64 64)"><rect x="34" y="50" width="80" height="54" rx="4" fill="${P.cream}" ${S}/><path d="M34 54 L74 82 L114 54" fill="none" ${S}/>
    <circle cx="74" cy="82" r="10" fill="${P.maroon}" ${s3}/><path d="M70 82 h8 M74 78 v8" stroke="${P.goldL}" stroke-width="2"/></g>`),

  // London: Morga's book, annotated
  annotated: svg(`${shadow}
    <path d="M10 40 q28 -10 54 4 q26 -14 54 -4 v64 q-28 -10 -54 4 q-26 -14 -54 -4 z" fill="${P.paper}" ${S}/>
    <path d="M64 44 v64" stroke="${I}" stroke-width="3"/>
    <path d="M20 54 h34 M20 64 h34 M20 74 h28 M74 54 h34 M74 64 h30 M74 74 h34" stroke="${I}" stroke-width="2" opacity=".5"/>
    <path d="M74 84 h26 M74 92 h20" stroke="${P.red}" stroke-width="3" stroke-linecap="round"/>
    <path d="M96 100 L120 24" stroke="${I}" stroke-width="3"/><path d="M120 24 c-10 4 -18 20 -20 34 c8 -6 18 -20 20 -34" fill="${P.white}" ${s3}/>`),

  // Ghent: the Fili, freshly printed
  fili_book: svg(`${shadow}
    <path d="M30 22 h66 v86 h-66 a8 8 0 0 1 -8 -8 v-70 a8 8 0 0 1 8 -8z" fill="${P.maroonD}" ${S}/>
    <path d="M30 22 v86" stroke="${I}" stroke-width="3"/>
    <rect x="40" y="38" width="46" height="30" fill="none" stroke="${P.gold}" stroke-width="3"/>
    <path d="M52 52 h22" stroke="${P.goldL}" stroke-width="4"/>
    <path d="M50 84 l13 10 l13 -10" fill="none" stroke="${P.gold}" stroke-width="3"/>
    <path d="M96 30 h8 v84 h-74" fill="none" stroke="${I}" stroke-width="3" opacity=".6"/>`),

  // Hong Kong: eye doctor (Rizal's ophthalmology practice)
  eye: svg(`${shadow}
    <path d="M8 64 C30 30 98 30 120 64 C98 98 30 98 8 64 Z" fill="${P.white}" ${S}/>
    <circle cx="64" cy="64" r="22" fill="${P.brownL}" ${S}/>
    <circle cx="64" cy="64" r="10" fill="${I}"/><circle cx="58" cy="58" r="5" fill="${P.white}"/>
    <path d="M20 40 l-8 -10 M40 30 l-4 -12 M64 26 v-14 M88 30 l4 -12 M108 40 l8 -10" stroke="${I}" stroke-width="3" stroke-linecap="round"/>`),

  // Relief Map of Mindanao in the Dapitan plaza
  map: svg(`${shadow}
    <path d="M12 28 l34 -10 l36 10 l34 -10 v82 l-34 10 l-36 -10 l-34 10 z" fill="${P.paper}" ${S}/>
    <path d="M46 18 v82 M82 28 v82" stroke="${I}" stroke-width="2" opacity=".35"/>
    <path d="M30 52 c6 -14 26 -16 34 -8 c10 -10 26 -6 30 6 c8 4 6 18 -4 22 c-2 12 -16 18 -24 10 c-8 8 -22 6 -24 -4 c-12 0 -18 -14 -12 -26z" fill="${P.green}" ${S}/>
    <path d="M48 58 l6 -8 l6 8 M64 66 l6 -8 l6 8" stroke="${P.greenD}" stroke-width="3" fill="${P.leaf}"/>
    <circle cx="44" cy="54" r="4" fill="${P.red}" ${s3}/>`),

  // Talisay Home: bahay kubo on stilts
  hut: svg(`${shadow}
    <path d="M10 60 L64 18 L118 60 Z" fill="${P.goldL}" ${S}/>
    <path d="M24 50 l-6 10 M36 40 l-8 20 M50 30 l-8 30 M78 30 l8 30 M92 40 l8 20 M104 50 l6 10" stroke="${P.gold}" stroke-width="2"/>
    <rect x="24" y="60" width="80" height="32" fill="${P.brownL}" ${S}/>
    <path d="M24 70 h80 M24 80 h80" stroke="${P.brown}" stroke-width="2"/>
    <rect x="34" y="66" width="20" height="16" fill="${P.brown}" ${s3}/><rect x="74" y="64" width="18" height="28" fill="${P.brown}" ${s3}/>
    <path d="M30 92 v20 M50 92 v20 M80 92 v20 M98 92 v20" stroke="${I}" stroke-width="4"/>
    <path d="M60 112 l14 -20 M64 104 h8 M68 98 h7" stroke="${I}" stroke-width="3"/>`),

  // Dapitan School: slate with letters
  slate: svg(`${shadow}
    <rect x="14" y="26" width="100" height="78" rx="6" fill="${P.brownL}" ${S}/>
    <rect x="24" y="36" width="80" height="58" rx="2" fill="#2f3b36" ${S}/>
    <path d="M36 74 l8 -22 l8 22 M39 66 h10" stroke="${P.white}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M60 52 v22 h8 a6 6 0 0 0 0 -12 h-8 h7 a5 5 0 0 0 0 -10 h-7" stroke="${P.white}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M90 56 a8 10 0 1 0 0 16" stroke="${P.white}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M86 98 L112 112" stroke="${P.white}" stroke-width="5" stroke-linecap="round"/>`),

  // Noli: San Diego church
  church: svg(`${shadow}
    <rect x="76" y="30" width="30" height="82" fill="${P.stone}" ${S}/>
    <path d="M76 30 l15 -16 l15 16" fill="${P.red}" ${S}/>
    <path d="M85 54 v-6 a6 6 0 0 1 12 0 v6 z" fill="${I}"/>
    <path d="M91 8 v10 M87 12 h8" stroke="${P.gold}" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 112 V56 L46 34 L76 56 V112 Z" fill="${P.paper}" ${S}/>
    <path d="M36 112 V86 a10 10 0 0 1 20 0 V112" fill="${P.brown}" ${S}/>
    <circle cx="46" cy="62" r="7" fill="${P.capiz}" ${s3}/>
    <path d="M18 74 h58" stroke="${P.stoneD}" stroke-width="2"/>`),

  // Fili: Binondo - Simoun's jewels
  jewel: svg(`${shadow}
    <path d="M30 44 L44 24 H84 L98 44 L64 104 Z" fill="${P.sky}" ${S}/>
    <path d="M30 44 H98 M44 24 L54 44 L64 24 L74 44 L84 24 M54 44 L64 104 L74 44" stroke="${I}" stroke-width="3" fill="none"/>
    <path d="M46 32 l6 8" stroke="${P.white}" stroke-width="4" stroke-linecap="round"/>
    <path d="M106 18 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" fill="${P.goldL}" ${s3}/>
    <path d="M18 76 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="${P.goldL}" ${s3}/>`),

  // Ibarra's School: schoolhouse with its cornerstone
  school: svg(`${shadow}
    <path d="M10 56 L64 22 L118 56 Z" fill="${P.maroon}" ${S}/>
    <rect x="18" y="56" width="92" height="56" fill="${P.paper}" ${S}/>
    <rect x="54" y="74" width="20" height="38" fill="${P.brown}" ${S}/>
    ${capizGrid(26, 66, 20, 20, 2, 2)}${capizGrid(82, 66, 20, 20, 2, 2)}
    <rect x="58" y="10" width="12" height="16" fill="${P.goldL}" ${s3}/><path d="M64 4 v6" stroke="${I}" stroke-width="3"/>
    <rect x="20" y="98" width="26" height="14" fill="${P.stone}" ${S}/><path d="M26 105 h14" stroke="${I}" stroke-width="2"/>`),

  // Fort Santiago gate
  fort: svg(`${shadow}
    <rect x="12" y="44" width="22" height="68" fill="${P.stone}" ${S}/><rect x="94" y="44" width="22" height="68" fill="${P.stone}" ${S}/>
    <path d="M10 44 h26 v-10 h-6 v6 h-6 v-6 h-2 v6 h-6 v-6 h-6z M92 44 h26 v-10 h-6 v6 h-6 v-6 h-2 v6 h-6 v-6 h-6z" fill="${P.stone}" ${s3}/>
    <path d="M34 112 V52 H94 V112 Z" fill="${P.paper}" ${S}/>
    <path d="M34 52 C40 30 88 30 94 52" fill="${P.stone}" ${S}/>
    <circle cx="64" cy="42" r="7" fill="${P.gold}" ${s3}/>
    <path d="M48 112 V82 a16 16 0 0 1 32 0 V112" fill="${I}" ${S}/>
    <path d="M54 112 V80 M64 112 V76 M74 112 V80" stroke="${P.stoneD}" stroke-width="3"/>`),

  // Bagumbayan: the dawn over Luneta
  sun: svg(`
    <path d="M8 96 h112" stroke="${I}" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 96 a50 50 0 0 1 100 0 z" fill="${P.goldL}" opacity=".35"/>
    <g transform="translate(64 96)">
      ${[-80, -55, -30, -5, 20, 45, 70].map(a => `<path d="M0 -30 L-6 -52 L0 -62 L6 -52 Z" fill="${P.gold}" ${s3} transform="rotate(${a + 10})"/>`).join("")}
      <path d="M-28 0 a28 28 0 0 1 56 0 z" fill="${P.gold}" ${S}/>
    </g>
    <path d="M20 108 h88 M36 118 h56" stroke="${P.blue}" stroke-width="4" stroke-linecap="round"/>`),

  // START pennant
  start: svg(`${shadow}
    <path d="M30 112 V14" stroke="${I}" stroke-width="6" stroke-linecap="round"/>
    <path d="M32 18 L108 38 L32 60 Z" fill="${P.red}" ${S}/>
    <path d="M44 34 l20 4 l-20 6" fill="${P.goldL}" ${s3}/>
    <circle cx="30" cy="12" r="6" fill="${P.gold}" ${s3}/>
    <path d="M50 92 h44 l-10 -10 M94 92 l-10 10" stroke="${P.greenD}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),

  // Dapitan Exile: coconut palm on the shore
  palm: svg(`
    <path d="M6 104 q14 -8 28 0 t28 0 t28 0 t30 0" stroke="${P.blue}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M24 100 q40 -16 84 0 z" fill="${P.goldL}" ${S}/>
    <path d="M62 98 C66 74 62 54 70 34" stroke="${P.brown}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M62 98 C66 74 62 54 70 34" stroke="${I}" stroke-width="2" fill="none" stroke-dasharray="3 6"/>
    <path d="M70 34 C56 20 36 22 20 34 C38 30 54 32 70 34 Z" fill="${P.leaf}" ${S}/>
    <path d="M70 34 C84 18 104 18 118 30 C100 28 86 30 70 34 Z" fill="${P.leaf}" ${S}/>
    <path d="M70 34 C58 40 46 54 44 66 C54 52 62 44 70 34 Z" fill="${P.green}" ${S}/>
    <path d="M70 34 C84 40 96 52 98 66 C88 52 80 44 70 34 Z" fill="${P.green}" ${S}/>
    <path d="M70 34 C68 22 72 10 80 4 C78 16 74 26 70 34 Z" fill="${P.leaf}" ${S}/>
    <circle cx="66" cy="40" r="5" fill="${P.brown}" ${s3}/><circle cx="75" cy="40" r="5" fill="${P.brown}" ${s3}/>`),

  // Cafe Rest: tsokolate with a batirol
  cup: svg(`${shadow}
    <path d="M24 56 h70 v18 a30 30 0 0 1 -30 30 h-10 a30 30 0 0 1 -30 -30 z" fill="${P.white}" ${S}/>
    <path d="M94 62 h6 a12 12 0 0 1 0 24 h-8" fill="none" ${S}/>
    <ellipse cx="59" cy="56" rx="35" ry="8" fill="${P.brown}" ${S}/>
    <path d="M30 78 h58" stroke="${P.maroon}" stroke-width="4"/>
    <path d="M74 54 L100 8" stroke="${P.brownL}" stroke-width="6" stroke-linecap="round"/>
    <path d="M70 60 L80 44" stroke="${P.brownL}" stroke-width="10" stroke-linecap="round"/>
    <path d="M42 44 c-4 -8 6 -10 2 -18 M54 42 c-4 -8 6 -10 2 -18" stroke="#9a9a9a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>
    <ellipse cx="59" cy="110" rx="40" ry="6" fill="${P.paper}" ${S}/>`),

  // Quiz Corner: scroll with a question mark
  quiz: svg(`${shadow}
    <path d="M28 20 h66 a10 10 0 0 1 10 10 v70 h-66 a10 10 0 0 1 -10 -10 z" fill="${P.paper}" ${S}/>
    <path d="M28 20 a10 10 0 0 0 0 20 h10" fill="${P.cream}" ${S}/>
    <path d="M104 100 a10 10 0 0 1 -20 0 v-8 h20" fill="${P.cream}" ${S}/>
    <path d="M54 52 a12 12 0 1 1 18 10 c-6 4 -8 6 -8 12" stroke="${P.maroon}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="64" cy="86" r="5" fill="${P.maroon}"/>`),

  // NOLI card: open novel
  noli: svg(`${shadow}
    <path d="M8 36 q28 -12 56 4 q28 -16 56 -4 v68 q-28 -12 -56 4 q-28 -16 -56 -4 z" fill="${P.cream}" ${S}/>
    <path d="M64 40 v68" stroke="${I}" stroke-width="3"/>
    <path d="M18 50 h36 M18 60 h36 M18 70 h30 M74 50 h36 M74 60 h36 M74 70 h30 M18 80 h36 M74 80 h36" stroke="${I}" stroke-width="2" opacity=".45"/>
    <path d="M86 26 v30 l6 -6 l6 6 v-30" fill="${P.maroon}" ${s3}/>`),

  // FILI card: Simoun's pomegranate lamp
  fili: svg(`${shadow}
    <path d="M58 16 h12 v10 h-12z" fill="${P.gold}" ${s3}/>
    <path d="M64 6 v10" stroke="${I}" stroke-width="3"/>
    <path d="M64 26 C30 26 22 60 34 82 C44 100 84 100 94 82 C106 60 98 26 64 26 Z" fill="${P.red}" ${S}/>
    <path d="M44 46 c-4 10 -4 22 2 30" stroke="${P.white}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M52 96 h24 l-4 12 h-16z" fill="${P.gold}" ${S}/>
    <path d="M64 34 c-8 8 -8 18 0 22 c8 -4 8 -14 0 -22z" fill="${P.goldL}" ${s3}/>
    <path d="M40 112 h48" stroke="${I}" stroke-width="5" stroke-linecap="round"/>`),

  // UI: trophy and scroll
  trophy: svg(`${shadow}
    <path d="M38 20 h52 v24 a26 26 0 0 1 -52 0 z" fill="${P.gold}" ${S}/>
    <path d="M38 28 h-12 a12 12 0 0 0 14 22 M90 28 h12 a12 12 0 0 1 -14 22" fill="none" ${S}/>
    <path d="M58 70 h12 v16 h-12z" fill="${P.gold}" ${S}/>
    <rect x="42" y="86" width="44" height="12" fill="${P.brown}" ${S}/><rect x="36" y="98" width="56" height="12" fill="${P.brownL}" ${S}/>
    <path d="M52 30 v14" stroke="${P.goldL}" stroke-width="5" stroke-linecap="round"/>`),
  scroll: svg(`${shadow}
    <path d="M28 24 h66 a10 10 0 0 1 10 10 v66 h-66 a10 10 0 0 1 -10 -10 z" fill="${P.paper}" ${S}/>
    <path d="M28 24 a10 10 0 0 0 0 20 h10" fill="${P.cream}" ${S}/>
    <path d="M104 100 a10 10 0 0 1 -20 0 v-8 h20" fill="${P.cream}" ${S}/>
    <path d="M48 52 h40 M48 62 h40 M48 72 h32" stroke="${I}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`),
};

/* Which emoji in the game data each emblem replaces. */
export const EMOJI_MAP = {
  "🏠": "house", "✏️": "quill", "🎓": "cap", "🏛️": "facade", "🏰": "walls", "🌆": "madrid", "⛵": "ship", "🗼": "eiffel",
  "🌸": "flower", "🖋️": "press", "🤝": "letters", "🏵️": "annotated", "📕": "fili_book", "⚓": "eye", "🗺️": "map",
  "🏡": "hut", "🍎": "slate", "⛪": "church", "💎": "jewel", "🏫": "school", "🏯": "fort", "🌅": "sun",
  "🚩": "start", "🌴": "palm", "☕": "cup", "❓": "quiz", "📖": "noli", "🗡️": "fili", "🏆": "trophy", "📜": "scroll", "✉️": "letters",
};
