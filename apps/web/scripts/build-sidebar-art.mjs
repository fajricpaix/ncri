// Membuat landmark sidebar (ilustrasi vektor -> WebP transparan 816x700) dengan sharp.
// Jalankan dari apps/web: node scripts/build-sidebar-art.mjs [nama ...]  -> public/brand/sidebar/landmark/<nama>.webp
// Dasar objek menempel di tepi bawah (y=700), disembunyikan gelombang batik depan. Ganti isi fungsi untuk mengubah gambar.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "public/brand/sidebar/landmark";
const DEFS = `<defs>
  <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d97c6"/><stop offset=".5" stop-color="#34527f"/><stop offset="1" stop-color="#16294d"/></linearGradient>
  <linearGradient id="rim" x1=".35" y1="0" x2="1" y2=".2"><stop offset="0" stop-color="#ffd98a" stop-opacity="0"/><stop offset=".65" stop-color="#e8b455" stop-opacity=".35"/><stop offset="1" stop-color="#ffd98a" stop-opacity=".95"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa8"/><stop offset=".5" stop-color="#e6b24a"/><stop offset="1" stop-color="#a8761f"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset=".6" stop-color="#3f2a22"/><stop offset="1" stop-color="#1d1722"/></linearGradient>
  <linearGradient id="sail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fb6dc"/><stop offset=".6" stop-color="#e9d9b0"/><stop offset="1" stop-color="#ffd98a"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#ffd98a" stop-opacity=".26"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
  <filter id="halo" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/><feGaussianBlur in="d" stdDeviation="7" result="b"/><feFlood flood-color="#0a1830" flood-opacity=".9"/><feComposite in2="b" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
// bentuk berbatu: isi + cahaya emas di sisi kanan
const S = (d, extra = "") => `<path d="${d}" fill="url(#stone)" ${extra}/><path d="${d}" fill="url(#rim)"/>`;
const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;
const D = "#0c1a33";
const glow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#glow)"/>`;

const art = {
  borobudur() {
    let holes = "";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const y = 430 + r * 24, x = 238 + c * 31 + (r % 2) * 15; const dx = Math.abs(x - 330) / 140;
      if (dx < 0.92 - r * 0.04) holes += `<path d="M${x} ${y - 9}l7 9l-7 9l-7 -9z" fill="${D}"/>`;
    }
    let holes2 = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) holes2 += `<path d="M${548 + c * 28 + (r % 2) * 14} ${478 + r * 24}l6 8l-6 8l-6 -8z" fill="${D}"/>`;
    return `${glow(408, 380, 400, 320)}
      ${S(rect(40, 650, 736, 50))}${S(rect(100, 606, 616, 46))}${S(rect(150, 566, 516, 42))}
      ${S("M470 570C470 450 400 386 330 386S190 450 190 570z")}${holes}
      ${S(rect(292, 336, 76, 52))}${S("M312 336L324 232h12l12 104z")}<path d="M330 232v-30" stroke="url(#gold)" stroke-width="5"/>
      ${S("M690 570C690 500 650 456 604 456S518 500 518 570z")}${holes2}
      ${S(rect(574, 418, 60, 40))}${S("M588 418L600 346h8l12 72z")}
      ${S("M120 580C120 530 90 500 62 500S20 530 20 580z")}${S("M54 500L58 450h6l4 50z")}`;
  },
  tongkonan() {
    const slats = Array.from({ length: 9 }, (_, i) => `<path d="M${260 + i * 36} 360v160" stroke="${D}" stroke-opacity=".35" stroke-width="3"/>`).join("");
    const zig = Array.from({ length: 10 }, (_, i) => `<path d="M${262 + i * 32} 470l16 -22l16 22" fill="none" stroke="url(#gold)" stroke-width="4"/>`).join("");
    return `${glow(408, 360, 380, 300)}
      <path d="M96 96Q408 430 720 96L700 168Q408 500 116 168z" fill="url(#wood)"/><path d="M96 96Q408 430 720 96L700 168Q408 500 116 168z" fill="url(#rim)"/>
      <path d="M96 96Q408 430 720 96" fill="none" stroke="url(#gold)" stroke-width="6"/><path d="M116 168Q408 500 700 168" fill="none" stroke="url(#gold)" stroke-width="3" opacity=".7"/>
      ${S("M250 350h316l32 170H218z")}${slats}${zig}
      <path d="M218 520h380" stroke="url(#gold)" stroke-width="6"/>
      ${[250, 330, 408, 486, 566].map((x) => `<path d="M${x - 9} 520h18v180h-18z" fill="url(#wood)"/>`).join("")}
      
      <path d="M640 470C640 560 700 590 760 590v-40C716 550 690 520 690 470z" fill="url(#wood)" opacity=".9"/>
      <path d="M612 560C640 590 780 590 806 560" stroke="url(#gold)" stroke-width="5" fill="none"/>`;
  },
  pinisi() {
    const waves = [610, 640, 670].map((y, i) => `<path d="M0 ${y}q51 -24 102 0t102 0t102 0t102 0t102 0t102 0t102 0t102 0" fill="none" stroke="url(#stone)" stroke-width="${5 - i}" opacity="${0.9 - i * 0.2}"/>`).join("");
    return `${glow(408, 380, 400, 300)}${waves}
      <path d="M120 520h560q-30 100 -140 112H250Q150 610 120 520z" fill="url(#wood)"/><path d="M120 520h560q-30 100 -140 112H250Q150 610 120 520z" fill="url(#rim)"/>
      <path d="M120 520h560" stroke="url(#gold)" stroke-width="6"/>
      ${S(rect(300, 470, 160, 52))}<path d="M320 490h24v20h-24zM362 490h24v20h-24zM404 490h24v20h-24z" fill="#ffd98a" opacity=".85"/>
      <path d="M270 520V80M540 520V150M650 520l130 -50" stroke="url(#wood)" stroke-width="9"/>
      <path d="M276 100L276 440L450 440z" fill="url(#sail)"/><path d="M276 100L276 440L450 440z" fill="url(#rim)"/>
      <path d="M546 170L546 450L690 450z" fill="url(#sail)"/><path d="M546 170L546 450L690 450z" fill="url(#rim)"/>
      <path d="M270 90L110 500L270 500z" fill="url(#sail)" opacity=".95"/><path d="M270 90L110 500L270 500z" fill="url(#rim)"/>
      <path d="M270 80l56 14l-56 14z" fill="#e8b455"/><path d="M540 150l44 12l-44 12z" fill="#e8b455"/>`;
  },
  bratan() {
    const meru = (cx, base, n, w0, dw, th) => {
      let s = "";
      for (let i = 0; i < n; i++) {
        const w = w0 - i * dw, y = base - i * th;
        const rf = `M${cx - w / 2 - 10} ${y}q${w / 2 + 10} -${th * 0.9} ${w + 20} 0v-${th * 0.25}q-${w / 2 + 10} -${th * 0.9} -${w + 20} 0z`;
        s += `<path d="${rf}" fill="url(#wood)"/><path d="${rf}" fill="url(#rim)"/><path d="${rf}" fill="none" stroke="url(#gold)" stroke-width="2.5"/>`;
        s += `<path d="M${cx - w / 2} ${y - th * 0.15}h${w}" stroke="url(#gold)" stroke-width="2.5"/>`;
      }
      return s + `<path d="M${cx} ${base - n * th}v-34" stroke="url(#gold)" stroke-width="5"/>`;
    };
    return `${glow(408, 340, 400, 300)}
      <path d="M0 330l90 -80l80 60l120 -110l110 100l100 -70l110 120l110 -90l96 80v200H0z" fill="url(#stone)" opacity=".5"/>
      ${S(rect(230, 540, 360, 40))}${S(rect(210, 580, 400, 120))}<path d="M210 580h400" stroke="url(#gold)" stroke-width="5"/>
      ${S(rect(262, 480, 296, 60))}${[290, 340, 408, 476, 526].map((x) => `<path d="M${x - 10} 500h20v40h-20z" fill="${D}" opacity=".7"/>`).join("")}
      ${meru(408, 478, 9, 250, 20, 38)}
      ${meru(650, 580, 5, 120, 16, 30)}${S(rect(600, 580, 100, 60))}
      <path d="M0 640q100 -16 200 0t200 0t200 0t216 0" fill="none" stroke="url(#stone)" stroke-width="4" opacity=".7"/>`;
  },
  tenun() {
    const warp = Array.from({ length: 22 }, (_, i) => `<path d="M${230 + i * 18} 190v330" stroke="#ffd98a" stroke-opacity=".5" stroke-width="1.5"/>`).join("");
    const motif = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => `<path d="M${250 + c * 46} ${400 + r * 14}l12 -8l12 8l-12 8z" fill="url(#gold)" opacity="${0.95 - r * 0.07}"/>`).join("")).join("");
    return `${glow(408, 360, 380, 300)}
      <path d="M210 140h24v560h-24zM582 140h24v560h-24z" fill="url(#wood)"/><path d="M200 140h420v26H200zM200 520h420v26H200z" fill="url(#wood)"/><path d="M200 140h420v26H200z" fill="url(#rim)"/>
      ${warp}
      <path d="M232 396h356v124H232z" fill="url(#stone)"/><path d="M232 396h356v124H232z" fill="url(#rim)"/>
      <path d="M232 396h356" stroke="url(#gold)" stroke-width="4"/>${motif}
      <path d="M232 396l8 -26h340l8 26z" fill="url(#gold)" opacity=".8"/>
      <path d="M200 340h420" stroke="url(#gold)" stroke-width="7"/><path d="M180 345l-24 -10v20z" fill="url(#gold)"/>
      <path d="M262 560h300v28H262z" fill="url(#wood)"/>
      <ellipse cx="410" cy="580" rx="196" ry="14" fill="${D}" opacity=".35"/>`;
  },
  lontar() {
    let lines = "";
    for (let l = 0; l < 3; l++) for (let i = 0; i < 28; i++) {
      const x = 170 + i * 17 + l * 3, y = 260 + l * 110;
      lines += `<path d="M${x} ${y + 40}q${i % 2 ? 6 : -6} -14 0 -24" stroke="${D}" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    const leaf = (y, r) => `<g transform="rotate(${r} 408 ${y})">${S(`M110 ${y}q298 -40 596 0v90q-298 40 -596 0z`)}<path d="M110 ${y}q298 -40 596 0" stroke="url(#gold)" stroke-width="3" fill="none"/></g>`;
    return `${glow(408, 400, 400, 300)}
      <g transform="rotate(-2 408 400)">${leaf(250, 0)}${leaf(360, 1)}${leaf(470, -1)}</g>
      ${lines}
      <path d="M150 230v330M666 230v330" stroke="url(#gold)" stroke-width="6"/>
      <circle cx="150" cy="395" r="14" fill="url(#gold)"/><circle cx="666" cy="395" r="14" fill="url(#gold)"/>
      <path d="M150 395Q408 470 666 395" stroke="url(#gold)" stroke-width="3" fill="none"/>
      <path d="M110 570h596q20 14 0 28H110q-20 -14 0 -28z" fill="url(#wood)"/>`;
  },
  garuda() {
    const petal = (len, w) => `M0 0C${w} ${-len * 0.25} ${w} ${-len * 0.7} 0 ${-len}C${-w} ${-len * 0.7} ${-w} ${-len * 0.25} 0 0z`;
    const wing = (k) => Array.from({ length: 9 }, (_, i) => {
      const ang = k * (62 - i * 8), len = 300 - i * 18;
      return `<g transform="translate(${408 + k * 54} ${300 + i * 16}) rotate(${ang})"><path d="${petal(len, 26)}" fill="url(#gold)"/><path d="${petal(len, 26)}" fill="url(#rim)" opacity=".5"/><path d="M0 -10V${-len * 0.8}" stroke="#a8761f" stroke-width="3" opacity=".6"/></g>`;
    }).join("");
    return `${glow(408, 330, 380, 300)}${wing(-1)}${wing(1)}
      <path d="M408 96c38 2 62 34 52 70c-4 16 4 28 14 42h-132c10 -14 18 -26 14 -42c-10 -36 14 -68 52 -70z" fill="url(#gold)"/><path d="M452 150l50 18l-44 10z" fill="#c78a2a"/>
      <circle cx="430" cy="146" r="5" fill="${D}"/><path d="M360 110l-26 -34l36 14zM456 100l34 -40l-6 46z" fill="url(#gold)"/>
      <path d="M338 208h140l30 120c0 90 -40 150 -100 190c-60 -40 -100 -100 -100 -190z" fill="url(#gold)"/><path d="M338 208h140l30 120c0 90 -40 150 -100 190c-60 -40 -100 -100 -100 -190z" fill="url(#rim)" opacity=".6"/>
      <path d="M368 262h80v70c0 38 -18 58 -40 70c-22 -12 -40 -32 -40 -70z" fill="${D}" stroke="url(#gold)" stroke-width="5"/>
      <path d="M408 296l8 18l20 2l-15 13l5 19l-18 -10l-18 10l5 -19l-15 -13l20 -2z" fill="url(#gold)"/>
      <path d="M340 540l-34 90M386 556l-12 92M430 556l12 92M476 540l34 90" stroke="url(#gold)" stroke-width="14" stroke-linecap="round"/>`;
  },
  monas() {
    return `${glow(408, 340, 360, 340)}
      <path d="M408 30c-30 40 -34 70 -14 96c10 -10 14 -24 14 -34c0 10 4 24 14 34c20 -26 16 -56 -14 -96z" fill="url(#gold)"/>
      ${S(rect(374, 124, 68, 24))}<path d="M366 124h84l-8 -14h-68z" fill="url(#gold)"/>
      ${S("M382 148h52l22 296h-96z")}
      ${S(rect(330, 440, 156, 22))}${S("M300 462h216l-26 40h-164z")}
      ${S(rect(272, 502, 272, 26))}${S(rect(228, 528, 360, 40))}${S(rect(150, 568, 516, 132))}
      <path d="M228 528h360" stroke="url(#gold)" stroke-width="4"/>
      ${[210, 270, 330, 390, 450, 510, 570].map((x) => `<path d="M${x} 585h28v110h-28z" fill="${D}" opacity=".45"/>`).join("")}
      <path d="M150 568h516" stroke="url(#gold)" stroke-width="4"/>
      <path d="M62 700q24 -80 60 -80q36 0 60 80zM636 700q24 -80 60 -80q36 0 60 80z" fill="url(#stone)" opacity=".8"/>`;
  },
  gapura() {
    const left = [], right = [];
    [[700, 250, 90], [610, 220, 70], [540, 190, 60], [480, 160, 56], [424, 130, 50], [374, 100, 46], [328, 70, 44]].forEach(([y, w, h]) => {
      const lx = 408 - 36 - w, rx = 408 + 36;
      left.push(`${S(rect(lx, y - h, w, h))}<path d="M${lx - 6} ${y - h}h${w + 12}" stroke="url(#gold)" stroke-width="4"/>`);
      right.push(`${S(rect(rx, y - h, w, h))}<path d="M${rx - 6} ${y - h}h${w + 12}" stroke="url(#gold)" stroke-width="4"/>`);
    });
    const flame = (x) => `<path d="M${x} 290c-14 18 -14 30 0 42c14 -12 14 -24 0 -42z" fill="url(#gold)"/>`;
    return `${glow(408, 380, 400, 320)}${left.join("")}${right.join("")}${flame(408 - 36 - 35)}${flame(408 + 36 + 35)}
      ${[0, 1, 2, 3, 4].map((i) => `<path d="M${392 - i * 4} ${700 - i * 6}h${32 + i * 8}" stroke="url(#gold)" stroke-width="5" opacity=".7"/>`).join("")}
      <path d="M200 560l10 -30l10 30zM596 560l10 -30l10 30z" fill="url(#gold)" opacity=".9"/>`;
  },
};

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [name, fn] of Object.entries(art)) {
  if (only.length && !only.includes(name)) continue;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 816 700" width="1632" height="1400">${DEFS}<g filter="url(#halo)">${fn()}</g></svg>`;
  await sharp(Buffer.from(svg)).resize(816, 700).webp({ quality: 92, alphaQuality: 100 }).toFile(`${OUT}/${name}.webp`);
  console.log("ok", name);
}
