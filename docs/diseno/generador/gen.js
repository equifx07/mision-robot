// Generador de las tres láminas de assets de Misión Robot (canvas de diseño).
// Uso: node gen.js <carpeta raíz>
const fs = require('fs');
const path = require('path');
const MAIN = require.main === module;
const ROOT = MAIN ? process.argv[2] : null;
const OUT = MAIN ? path.join(ROOT, 'project') : null;
if (MAIN) fs.mkdirSync(OUT, { recursive: true });

// ───────── utilidades ─────────
const n = (x) => Math.round(x * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const css = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '')
    .map(([k, v]) => `${kebab(k)}: ${v}`)
    .join('; ');
const div = (style, inner = '') => `<div style="${css(style)}">${inner}</div>`;
const span = (style, inner = '') => `<span style="${css(style)}">${inner}</span>`;
const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
};
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ───────── íconos ─────────
const ROT = { R: 0, D: 90, L: 180, U: 270 };
const arrowBig = (dir, size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display: block" aria-hidden="true"><g transform="rotate(${ROT[dir]} 12 12)"><path d="M3.5 9.3 H12 V4.8 L20.6 12 L12 19.2 V14.7 H3.5 Z" fill="${color}" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/></g></svg>`;
const arrowSmall = (dir, size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display: block" aria-hidden="true"><g transform="rotate(${ROT[dir]} 12 12)"><path d="M4.5 12 H18.5 M13 6.5 L18.5 12 L13 17.5" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
const loopIcon = (size, color, sw = 2.6) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display: block" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3v5h-5" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const flagIcon = (size, pole, fill) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display: block" aria-hidden="true"><path d="M6 21.5 V3" stroke="${pole}" stroke-width="2.6" stroke-linecap="round"/><path d="M6.5 3.8 H19 L15.2 8.6 L19 13.4 H6.5 Z" fill="${fill}" stroke="${pole}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const rockIcon = (size, fill, stroke) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display: block" aria-hidden="true"><path d="M2.5 18.5 L4.2 10.8 L9.3 6.2 L15.6 6.6 L21 11.4 L21.5 18.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 10.5 L12 8.8 L15 10.2" fill="none" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const pathIcon = (size, cellFill, cellStroke, bridge) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display: block" aria-hidden="true"><rect x="8" y="9.5" width="8" height="5" fill="${bridge}"/><rect x="1.5" y="6.5" width="8" height="11" rx="2.5" fill="${cellFill}" stroke="${cellStroke}" stroke-width="1.6"/><rect x="14.5" y="6.5" width="8" height="11" rx="2.5" fill="${cellFill}" stroke="${cellStroke}" stroke-width="1.6"/></svg>`;
const sparkle = (cx, cy, r, fill) => {
  const k = r * 0.18;
  return `<path d="M${n(cx)} ${n(cy - r)} Q${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${n(cy)} Q${n(cx + k)} ${n(cy + k)} ${n(cx)} ${n(cy + r)} Q${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${n(cy)} Q${n(cx - k)} ${n(cy - k)} ${n(cx)} ${n(cy - r)} Z" fill="${fill}"/>`;
};

// ───────── robots (caja 120 × 140) ─────────
function robotA(state) {
  const O = '#1F2B45', W = '#F4F7FC', B = '#2E6FD8', Y = '#F59E0B', S = '#1F2B45', E = '#7BE6FF', G = '#A9B4C8', T = '#3A4660';
  const out = [];
  if (state === 'paint') out.push(`<path d="M6 133 C 34 123, 70 139, 114 127" fill="none" stroke="#F26B1D" stroke-width="7" stroke-linecap="round"/>`);
  if (state === 'happy') out.push(sparkle(13, 40, 8, Y), sparkle(107, 30, 9, Y), sparkle(97, 7, 5.5, Y));
  if (state === 'crash') out.push(sparkle(17, 15, 7, Y), sparkle(101, 12, 5.5, Y), `<path d="M104 56 L114 50 M107 69 L118 69 M104 82 L114 88" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`);
  const g = [];
  if (state === 'crash') g.push(`<path d="M60 26 V18 L68 12" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="10" r="6" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`);
  else g.push(`<line x1="60" y1="12" x2="60" y2="26" stroke="${O}" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="10" r="6" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`);
  const armDown = (x) => `<rect x="${x}" y="84" width="13" height="24" rx="6.5" fill="${W}" stroke="${O}" stroke-width="2.5"/>`;
  const armLine = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${O}" stroke-width="15" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${W}" stroke-width="9" stroke-linecap="round"/>`;
  if (state === 'happy') g.push(armLine(36, 90, 17, 64), armLine(84, 90, 103, 64));
  else if (state === 'crash') g.push(armLine(36, 90, 15, 72), armLine(84, 92, 104, 108));
  else if (state === 'paint')
    g.push(
      armDown(20),
      armLine(84, 92, 104, 104),
      `<g transform="rotate(-25 108 104)"><rect x="103.5" y="100" width="9" height="18" rx="2.5" fill="#FFFFFF" stroke="${O}" stroke-width="2"/><path d="M104 117.5 L108 126 L112 117.5 Z" fill="#F26B1D" stroke="${O}" stroke-width="2" stroke-linejoin="round"/></g>`,
    );
  else g.push(armDown(20), armDown(87));
  g.push(`<rect x="52" y="72" width="16" height="10" rx="2" fill="${G}" stroke="${O}" stroke-width="2.5"/>`);
  g.push(
    `<rect x="32" y="80" width="56" height="36" rx="13" fill="${B}" stroke="${O}" stroke-width="3"/>`,
    `<path d="M40 88.5 H47" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>`,
    `<circle cx="60" cy="97" r="7.5" fill="#FFD166" stroke="${O}" stroke-width="2.5"/>`,
  );
  g.push(
    `<rect x="28" y="114" width="64" height="20" rx="10" fill="${T}" stroke="${O}" stroke-width="3"/>`,
    `<circle cx="41" cy="124" r="4.8" fill="${G}"/><circle cx="60" cy="124" r="4.8" fill="${G}"/><circle cx="79" cy="124" r="4.8" fill="${G}"/>`,
  );
  g.push(
    `<rect x="17" y="41" width="12" height="20" rx="5" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`,
    `<rect x="91" y="41" width="12" height="20" rx="5" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`,
    `<rect x="26" y="25" width="68" height="50" rx="18" fill="${W}" stroke="${O}" stroke-width="3"/>`,
    `<rect x="34" y="33" width="52" height="34" rx="12" fill="${S}"/>`,
  );
  if (state === 'happy')
    g.push(`<path d="M43.5 51 Q49 42.5 54.5 51" fill="none" stroke="${E}" stroke-width="3.6" stroke-linecap="round"/><path d="M65.5 51 Q71 42.5 76.5 51" fill="none" stroke="${E}" stroke-width="3.6" stroke-linecap="round"/><path d="M52.5 56.5 Q60 66.5 67.5 56.5 Z" fill="${E}"/>`);
  else if (state === 'crash')
    g.push(`<path d="M45 44 L53 52 M53 44 L45 52" stroke="#FF7B7B" stroke-width="3.2" stroke-linecap="round"/><path d="M67 44 L75 52 M75 44 L67 52" stroke="#FF7B7B" stroke-width="3.2" stroke-linecap="round"/><path d="M50 60.5 q2.5 -3 5 0 t5 0 t5 0 t5 0" fill="none" stroke="${E}" stroke-width="2.4" stroke-linecap="round"/>`);
  else {
    const dx = state === 'paint' ? 2.5 : 0, dy = state === 'paint' ? 2 : 0;
    g.push(`<ellipse cx="${49 + dx}" cy="${48 + dy}" rx="5.5" ry="7" fill="${E}"/><ellipse cx="${71 + dx}" cy="${48 + dy}" rx="5.5" ry="7" fill="${E}"/><circle cx="${51 + dx}" cy="${45.5 + dy}" r="1.8" fill="#FFFFFF"/><circle cx="${73 + dx}" cy="${45.5 + dy}" r="1.8" fill="#FFFFFF"/><path d="M54 59.5 Q60 64 66 59.5" fill="none" stroke="${E}" stroke-width="2.5" stroke-linecap="round"/>`);
  }
  const body = g.join('');
  return out.join('') + (state === 'crash' ? `<g transform="rotate(-9 60 128)">${body}</g>` : body);
}

function robotB(state) {
  const O = '#1B2438', H = '#E3E7ED', H2 = '#C5CCD6', B = '#1F63C8', BD = '#144A99', Y = '#FFC21A', T = '#3B4356', G = '#9AA3B2';
  const out = [];
  const brick = (x, y, rot, fill) => `<g transform="rotate(${rot} ${x + 6} ${y + 4})"><rect x="${x}" y="${y}" width="12" height="8" rx="1.5" fill="${fill}" stroke="${O}" stroke-width="1.6"/><rect x="${x + 2}" y="${y - 2.5}" width="3.5" height="2.5" fill="${fill}" stroke="${O}" stroke-width="1.2"/><rect x="${x + 6.5}" y="${y - 2.5}" width="3.5" height="2.5" fill="${fill}" stroke="${O}" stroke-width="1.2"/></g>`;
  if (state === 'paint')
    for (let i = 0; i < 8; i++) out.push(`<circle cx="${8 + i * 14.5}" cy="134" r="5.5" fill="#FF7A1A" stroke="${O}" stroke-width="1.6"/><circle cx="${6.8 + i * 14.5}" cy="132.8" r="1.8" fill="#FFB27A"/>`);
  if (state === 'happy') out.push(brick(4, 34, -20, '#FF5A5F'), brick(104, 26, 25, '#2BD46A'), brick(94, 6, -12, Y), brick(12, 8, 15, '#38BDF8'));
  if (state === 'crash')
    out.push(
      sparkle(18, 30, 6, Y),
      sparkle(106, 46, 5, Y),
      `<g transform="rotate(28 92 10)"><rect x="85" y="8" width="14" height="8" rx="1.5" fill="${H2}" stroke="${O}" stroke-width="2.2"/><ellipse cx="92" cy="8" rx="7" ry="2.6" fill="${H}" stroke="${O}" stroke-width="2"/></g>`,
      `<path d="M76 20 L82 16 M78 26 L85 25" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>`,
    );
  const g = [];
  const arm = (sx, sy, angle, clawOpen) => {
    const claw = clawOpen === 'R'
      ? `<path d="M${sx + 4.6} ${sy + 27.4} A6.5 6.5 0 1 0 ${sx + 4.6} ${sy + 36.6}" fill="none" stroke="${O}" stroke-width="7.5" stroke-linecap="round"/><path d="M${sx + 4.6} ${sy + 27.4} A6.5 6.5 0 1 0 ${sx + 4.6} ${sy + 36.6}" fill="none" stroke="${Y}" stroke-width="3.8" stroke-linecap="round"/>`
      : `<path d="M${sx - 4.6} ${sy + 27.4} A6.5 6.5 0 1 1 ${sx - 4.6} ${sy + 36.6}" fill="none" stroke="${O}" stroke-width="7.5" stroke-linecap="round"/><path d="M${sx - 4.6} ${sy + 27.4} A6.5 6.5 0 1 1 ${sx - 4.6} ${sy + 36.6}" fill="none" stroke="${Y}" stroke-width="3.8" stroke-linecap="round"/>`;
    return `<g transform="rotate(${angle} ${sx} ${sy})"><rect x="${sx - 8}" y="${sy - 2}" width="16" height="26" rx="4" fill="${H}" stroke="${O}" stroke-width="2.5"/>${claw}</g>`;
  };
  const angles = { normal: [0, 0], happy: [150, -150], crash: [115, -35], paint: [0, -35] }[state];
  g.push(arm(22, 78, angles[0], 'R'), arm(98, 78, angles[1], 'L'));
  if (state === 'paint')
    g.push(`<rect x="112.5" y="106" width="7" height="16" rx="2" fill="#FFFFFF" stroke="${O}" stroke-width="2"/><rect x="111" y="121" width="10" height="7" rx="2" fill="#FF7A1A" stroke="${O}" stroke-width="2"/>`);
  g.push(`<rect x="57" y="9" width="6" height="12" fill="${G}" stroke="${O}" stroke-width="2"/><ellipse cx="60" cy="9" rx="8" ry="4.5" fill="${Y}" stroke="${O}" stroke-width="2.2"/>`);
  const stud = (x) => `<rect x="${x}" y="15" width="14" height="8" rx="1.5" fill="${H2}" stroke="${O}" stroke-width="2.2"/><ellipse cx="${x + 7}" cy="15" rx="7" ry="2.6" fill="${H}" stroke="${O}" stroke-width="2"/>`;
  g.push(stud(36));
  if (state !== 'crash') g.push(stud(70));
  g.push(`<rect x="50" y="68" width="20" height="7" fill="${G}" stroke="${O}" stroke-width="2.2"/>`);
  g.push(`<rect x="30" y="72" width="60" height="40" rx="5" fill="${B}"/><rect x="30" y="103" width="60" height="9" rx="3" fill="${BD}"/><rect x="30" y="72" width="60" height="40" rx="5" fill="none" stroke="${O}" stroke-width="3"/>`);
  g.push(`<rect x="40" y="80" width="40" height="16" rx="3" fill="#0F2A5C"/><circle cx="49" cy="88" r="3.6" fill="${Y}"/><circle cx="60" cy="88" r="3.6" fill="#2BD46A"/><circle cx="71" cy="88" r="3.6" fill="#FF5A5F"/>`);
  g.push(`<rect x="22" y="112" width="76" height="22" rx="11" fill="${T}" stroke="${O}" stroke-width="3"/><path d="M42 114.5 V131.5 M54 114.5 V131.5 M66 114.5 V131.5 M78 114.5 V131.5" stroke="#56607A" stroke-width="2.2"/><circle cx="33" cy="123" r="5.5" fill="${G}" stroke="${O}" stroke-width="2"/><circle cx="87" cy="123" r="5.5" fill="${G}" stroke="${O}" stroke-width="2"/>`);
  g.push(`<rect x="26" y="22" width="68" height="48" rx="6" fill="${H}"/><rect x="26" y="61" width="68" height="9" rx="3" fill="${H2}"/><rect x="26" y="22" width="68" height="48" rx="6" fill="none" stroke="${O}" stroke-width="3"/>`);
  if (state === 'happy')
    g.push(`<path d="M38.5 44 Q46 34 53.5 44" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><path d="M66.5 44 Q74 34 81.5 44" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><path d="M47 52 Q60 63 73 52" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`);
  else if (state === 'crash')
    g.push(`<path d="M40 35 L52 47 M52 35 L40 47" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M68 35 L80 47 M80 35 L68 47" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M46 56 l4.7 -3 l4.7 3 l4.7 -3 l4.7 3 l4.7 -3 l4.7 3" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
  else {
    const dx = state === 'paint' ? 3 : 0, dy = state === 'paint' ? 2 : 0;
    g.push(`<circle cx="${46 + dx}" cy="${41 + dy}" r="8" fill="${O}"/><circle cx="${74 + dx}" cy="${41 + dy}" r="8" fill="${O}"/><circle cx="${43.5 + dx}" cy="${38.5 + dy}" r="2.6" fill="#FFFFFF"/><circle cx="${71.5 + dx}" cy="${38.5 + dy}" r="2.6" fill="#FFFFFF"/><rect x="46" y="52" width="28" height="7" rx="2" fill="${O}"/><path d="M53 52.5 V58.5 M60 52.5 V58.5 M67 52.5 V58.5" stroke="${H}" stroke-width="1.6"/>`);
  }
  const body = g.join('');
  return out.join('') + (state === 'crash' ? `<g transform="rotate(8 60 128)">${body}</g>` : body);
}

function robotC(state) {
  const O = '#0B1130', Wb = '#E8EEFF', V = '#0B1130', CY = '#38BDF8', PK = '#FF7AD9', MT = '#34E3A0', AM = '#FFB547', G = '#9AA8DB', L = '#C9D4FF';
  const out = [];
  if (state === 'paint')
    out.push(`<path d="M4 135 H116" stroke="#FF8A3D" stroke-opacity="0.25" stroke-width="12" stroke-linecap="round"/><path d="M4 135 H116" stroke="#FF8A3D" stroke-width="4.5" stroke-linecap="round"/><path d="M4 135 H116" stroke="#FFE3CF" stroke-width="1.4" stroke-linecap="round"/>`);
  if (state === 'happy') out.push(sparkle(13, 36, 8, PK), sparkle(107, 28, 9, AM), sparkle(97, 6, 5.5, MT), sparkle(22, 8, 4.5, AM));
  if (state === 'crash')
    out.push(
      `<path d="M100 30 L108 36 L102 40 L111 47" fill="none" stroke="${AM}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<path d="M14 40 L8 46 L14 49 L7 56" fill="none" stroke="${AM}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<circle cx="20" cy="124" r="7" fill="#9AA8DB" fill-opacity="0.35"/><circle cx="30" cy="130" r="5" fill="#9AA8DB" fill-opacity="0.3"/><circle cx="100" cy="128" r="6" fill="#9AA8DB" fill-opacity="0.3"/>`,
    );
  const g = [];
  if (state !== 'crash')
    g.push(`<ellipse cx="47" cy="127" rx="7" ry="9" fill="${CY}" fill-opacity="0.22"/><ellipse cx="73" cy="127" rx="7" ry="9" fill="${CY}" fill-opacity="0.22"/><ellipse cx="47" cy="124" rx="3.4" ry="5.5" fill="${CY}" fill-opacity="0.85"/><ellipse cx="73" cy="124" rx="3.4" ry="5.5" fill="${CY}" fill-opacity="0.85"/>`);
  g.push(`<ellipse cx="60" cy="113" rx="29" ry="8.5" fill="#2A3572" stroke="${O}" stroke-width="3"/><ellipse cx="60" cy="110.5" rx="18" ry="3.5" fill="#3E4C9A"/>`);
  const arm = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${L}" stroke-width="5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="4.8" fill="${Wb}" stroke="${O}" stroke-width="2.5"/>`;
  if (state === 'happy') g.push(arm(38, 84, 18, 60), arm(82, 84, 102, 60));
  else if (state === 'crash') g.push(arm(38, 84, 16, 70), arm(82, 86, 104, 104));
  else if (state === 'paint')
    g.push(
      arm(38, 82, 22, 99),
      `<path d="M109 116 L114 133" stroke="#FF8A3D" stroke-opacity="0.35" stroke-width="7" stroke-linecap="round"/><path d="M109 116 L114 133" stroke="#FF8A3D" stroke-width="2.5" stroke-linecap="round"/>`,
      arm(82, 86, 104, 106),
      `<g transform="rotate(-30 104 106)"><rect x="100" y="101" width="8" height="15" rx="3" fill="${Wb}" stroke="${O}" stroke-width="2"/><rect x="101.5" y="115" width="5" height="4" fill="#FF8A3D"/></g>`,
    );
  else g.push(arm(38, 82, 22, 99), arm(82, 82, 98, 99));
  g.push(`<rect x="54" y="66" width="12" height="9" rx="2" fill="${G}" stroke="${O}" stroke-width="2.4"/>`);
  g.push(`<rect x="36" y="72" width="48" height="36" rx="16" fill="${Wb}" stroke="${O}" stroke-width="3"/><circle cx="60" cy="90" r="8.5" fill="none" stroke="${CY}" stroke-width="3"/><circle cx="60" cy="90" r="3" fill="${CY}"/>`);
  const beacon = state === 'crash' ? '#FF5A5F' : PK;
  g.push(`<line x1="60" y1="11" x2="60" y2="24" stroke="${L}" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="9" r="7.5" fill="${beacon}" fill-opacity="0.3"/><circle cx="60" cy="9" r="3.8" fill="${beacon}"/>`);
  g.push(`<circle cx="25" cy="46" r="4.5" fill="${CY}" stroke="${O}" stroke-width="2.2"/><circle cx="95" cy="46" r="4.5" fill="${CY}" stroke="${O}" stroke-width="2.2"/>`);
  g.push(`<rect x="26" y="22" width="68" height="48" rx="24" fill="${Wb}" stroke="${O}" stroke-width="3"/><rect x="33" y="31" width="54" height="27" rx="13.5" fill="${V}"/><path d="M40 35.5 H50" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2.6" stroke-linecap="round"/>`);
  if (state === 'happy')
    g.push(`<path d="M41 48 Q47.5 38.5 54 48" fill="none" stroke="${MT}" stroke-width="3.4" stroke-linecap="round"/><path d="M66 48 Q72.5 38.5 79 48" fill="none" stroke="${MT}" stroke-width="3.4" stroke-linecap="round"/><path d="M55 52.5 Q60 56 65 52.5" fill="none" stroke="${MT}" stroke-width="2.2" stroke-linecap="round"/>`);
  else if (state === 'crash')
    g.push(`<path d="M42 39 L52 49 M52 39 L42 49" stroke="#FF5A5F" stroke-width="3" stroke-linecap="round"/><path d="M68 39 L78 49 M78 39 L68 49" stroke="#FF5A5F" stroke-width="3" stroke-linecap="round"/>`);
  else {
    const dx = state === 'paint' ? 2 : 0, dy = state === 'paint' ? 2 : 0;
    g.push(`<rect x="${39 + dx}" y="${39 + dy}" width="17" height="10" rx="5" fill="${CY}" fill-opacity="0.25"/><rect x="${41 + dx}" y="${41.5 + dy}" width="13" height="5" rx="2.5" fill="${CY}"/><rect x="${64 + dx}" y="${39 + dy}" width="17" height="10" rx="5" fill="${CY}" fill-opacity="0.25"/><rect x="${66 + dx}" y="${41.5 + dy}" width="13" height="5" rx="2.5" fill="${CY}"/>`);
  }
  const body = g.join('');
  return out.join('') + (state === 'crash' ? `<g transform="rotate(10 60 128)">${body}</g>` : body);
}

// ───────── piezas de mapa por tema ─────────
const mapA = {
  board(W, H, uid) {
    const r = rng(uid.length * 97 + W + H);
    let s = `<rect width="${W}" height="${H}" rx="22" fill="#8FD0EE"/>`;
    const count = Math.round((W * H) / 2600);
    for (let i = 0; i < count; i++) {
      const x = n(8 + r() * (W - 28)), y = n(8 + r() * (H - 16));
      s += `<path d="M${x} ${y} q4 -4 8 0 t8 0" fill="none" stroke="#C4E9F8" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    return s;
  },
  bridgeH(x1, x2, y, S) {
    const a = n(x1 + S / 2 - 6), b = n(x2 - S / 2 + 6), h = 18;
    let s = `<rect x="${a}" y="${n(y - h / 2)}" width="${n(b - a)}" height="${h}" fill="#C98A4B"/>`;
    for (let px = a + 4; px < b - 1; px += 6) s += `<line x1="${n(px)}" y1="${n(y - h / 2)}" x2="${n(px)}" y2="${n(y + h / 2)}" stroke="#9C6532" stroke-width="1.5"/>`;
    return s + `<line x1="${a}" y1="${n(y - h / 2)}" x2="${b}" y2="${n(y - h / 2)}" stroke="#7A4E27" stroke-width="2.6"/><line x1="${a}" y1="${n(y + h / 2)}" x2="${b}" y2="${n(y + h / 2)}" stroke="#7A4E27" stroke-width="2.6"/>`;
  },
  bridgeV(x, y1, y2, S) {
    const a = n(y1 + S / 2 - 6), b = n(y2 - S / 2 + 6), w = 18;
    let s = `<rect x="${n(x - w / 2)}" y="${a}" width="${w}" height="${n(b - a)}" fill="#C98A4B"/>`;
    for (let py = a + 4; py < b - 1; py += 6) s += `<line x1="${n(x - w / 2)}" y1="${n(py)}" x2="${n(x + w / 2)}" y2="${n(py)}" stroke="#9C6532" stroke-width="1.5"/>`;
    return s + `<line x1="${n(x - w / 2)}" y1="${a}" x2="${n(x - w / 2)}" y2="${b}" stroke="#7A4E27" stroke-width="2.6"/><line x1="${n(x + w / 2)}" y1="${a}" x2="${n(x + w / 2)}" y2="${b}" stroke="#7A4E27" stroke-width="2.6"/>`;
  },
  cell(x, y, S, isBase) {
    let s = `<rect x="${n(x)}" y="${n(y + 4)}" width="${S}" height="${S}" rx="15" fill="#D5AE69"/><rect x="${n(x)}" y="${n(y)}" width="${S}" height="${S}" rx="15" fill="#F1D79C"/><rect x="${n(x + 5)}" y="${n(y + 4)}" width="${n(S - 10)}" height="${n(S - 12)}" rx="11" fill="${isBase ? '#B6E48A' : '#9CD66B'}"/>`;
    if (!isBase) s += `<path d="M${n(x + 11)} ${n(y + 15)} l2.5 -4.5 l2.5 4.5 M${n(x + S - 17)} ${n(y + S - 15)} l2.5 -4.5 l2.5 4.5" fill="none" stroke="#78B84A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  },
  base(cx, cy, S) {
    const r = S * 0.3;
    return `<ellipse cx="${n(cx)}" cy="${n(cy + S * 0.14)}" rx="${n(r)}" ry="${n(r * 0.6)}" fill="#EEF0F4" stroke="#C3CAD6" stroke-width="2"/><path d="M${n(cx - 4)} ${n(cy + S * 0.16)} V${n(cy - S * 0.32)}" stroke="#3A4660" stroke-width="3" stroke-linecap="round"/><path d="M${n(cx - 3)} ${n(cy - S * 0.32)} H${n(cx + S * 0.25)} L${n(cx + S * 0.16)} ${n(cy - S * 0.22)} L${n(cx + S * 0.25)} ${n(cy - S * 0.12)} H${n(cx - 3)} Z" fill="#22A94F" stroke="#14532D" stroke-width="1.8" stroke-linejoin="round"/>`;
  },
  rock(cx, cy, S) {
    const p = (dx, dy) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
    return `<path d="M${p(-0.3, 0.22)} L${p(-0.26, -0.04)} L${p(-0.12, -0.22)} L${p(0.1, -0.24)} L${p(0.28, -0.06)} L${p(0.31, 0.22)} Z" fill="#9AA3AE" stroke="#5D6673" stroke-width="2.5" stroke-linejoin="round"/><path d="M${p(-0.12, -0.1)} L${p(0.02, -0.16)} L${p(0.14, -0.08)}" fill="none" stroke="#D3D9E0" stroke-width="2.5" stroke-linecap="round"/>`;
  },
  gem(cx, cy, S) {
    const p = (dx, dy) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
    return `<path d="M${p(0, -0.26)} L${p(0.2, -0.06)} L${p(0, 0.26)} L${p(-0.2, -0.06)} Z" fill="#E4458F" stroke="#9C1F5C" stroke-width="2.2" stroke-linejoin="round"/><path d="M${p(-0.2, -0.06)} L${p(0.2, -0.06)}" stroke="#9C1F5C" stroke-width="1.5"/><path d="M${p(-0.08, -0.06)} L${p(0, 0.26)} L${p(0.08, -0.06)}" fill="none" stroke="#FF9CCB" stroke-width="1.4"/><path d="M${p(-0.06, -0.17)} L${p(-0.12, -0.08)}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>`;
  },
  trail(pts) {
    const d = 'M' + pts.map((q) => `${n(q[0])} ${n(q[1])}`).join(' L');
    return `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#F26B1D" stroke-width="4.5" stroke-dasharray="7 8" stroke-linecap="round" stroke-linejoin="round"/>`;
  },
};

const mapB = {
  board(W, H, uid) {
    return `<defs><pattern id="st-${uid}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="5" fill="#4DB368"/><circle cx="7.8" cy="7.8" r="2" fill="#74CD8B"/></pattern></defs><rect width="${W}" height="${H}" rx="14" fill="#3E9E57"/><rect width="${W}" height="${H}" rx="14" fill="url(#st-${uid})"/>`;
  },
  bridgeH(x1, x2, y, S) {
    const a = n(x1 + S / 2 - 6), b = n(x2 - S / 2 + 6), h = 20, mid = n((x1 + x2) / 2);
    return `<rect x="${a}" y="${n(y - h / 2 + 4)}" width="${n(b - a)}" height="${h}" fill="#D99A00"/><rect x="${a}" y="${n(y - h / 2)}" width="${n(b - a)}" height="${h}" fill="#FFC21A"/><circle cx="${mid}" cy="${n(y)}" r="4.8" fill="#FFD454" stroke="#D99A00" stroke-width="1.4"/><circle cx="${n(mid - 1.4)}" cy="${n(y - 1.4)}" r="1.7" fill="#FFF1B8"/>`;
  },
  bridgeV(x, y1, y2, S) {
    const a = n(y1 + S / 2 - 6), b = n(y2 - S / 2 + 6), w = 20, mid = n((y1 + y2) / 2);
    return `<rect x="${n(x - w / 2)}" y="${n(a + 4)}" width="${w}" height="${n(b - a)}" fill="#D99A00"/><rect x="${n(x - w / 2)}" y="${a}" width="${w}" height="${n(b - a)}" fill="#FFC21A"/><circle cx="${n(x)}" cy="${mid}" r="4.8" fill="#FFD454" stroke="#D99A00" stroke-width="1.4"/><circle cx="${n(x - 1.4)}" cy="${n(mid - 1.4)}" r="1.7" fill="#FFF1B8"/>`;
  },
  cell(x, y, S, isBase) {
    let s = `<rect x="${n(x)}" y="${n(y + 5)}" width="${S}" height="${S}" rx="6" fill="#A3ACBA"/><rect x="${n(x)}" y="${n(y)}" width="${S}" height="${S}" rx="6" fill="#E9ECF1"/><rect x="${n(x + 5)}" y="${n(y + 4)}" width="${n(S - 10)}" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.85"/>`;
    if (isBase) s += `<rect x="${n(x + 2.5)}" y="${n(y + 2.5)}" width="${n(S - 5)}" height="${n(S - 5)}" rx="4.5" fill="none" stroke="#1FA35C" stroke-width="3"/>`;
    return s;
  },
  base(cx, cy, S) {
    return `<ellipse cx="${n(cx)}" cy="${n(cy + S * 0.18)}" rx="${n(S * 0.26)}" ry="${n(S * 0.13)}" fill="#FFFFFF" stroke="#A3ACBA" stroke-width="2"/><path d="M${n(cx - 4)} ${n(cy + S * 0.18)} V${n(cy - S * 0.32)}" stroke="#1B2438" stroke-width="3" stroke-linecap="round"/><path d="M${n(cx - 3)} ${n(cy - S * 0.32)} H${n(cx + S * 0.25)} L${n(cx + S * 0.16)} ${n(cy - S * 0.22)} L${n(cx + S * 0.25)} ${n(cy - S * 0.12)} H${n(cx - 3)} Z" fill="#1FA35C" stroke="#0B5D2E" stroke-width="1.8" stroke-linejoin="round"/>`;
  },
  rock(cx, cy, S) {
    const p = (dx, dy) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
    return `<path d="M${p(-0.3, 0.24)} L${p(-0.3, 0)} Q${p(-0.28, -0.2)} ${p(-0.08, -0.2)} L${p(0.12, -0.22)} Q${p(0.3, -0.18)} ${p(0.3, 0.02)} L${p(0.31, 0.24)} Z" fill="#8C95A3" stroke="#4E5664" stroke-width="2.5" stroke-linejoin="round"/><rect x="${n(cx - S * 0.07)}" y="${n(cy - S * 0.3)}" width="${n(S * 0.14)}" height="${n(S * 0.1)}" rx="1.5" fill="#8C95A3" stroke="#4E5664" stroke-width="2"/><path d="M${p(-0.16, -0.04)} L${p(0.04, -0.1)}" stroke="#C4CAD3" stroke-width="2.4" stroke-linecap="round"/>`;
  },
  gem(cx, cy, S) {
    const p = (dx, dy) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
    return `<path d="M${p(-0.12, -0.24)} L${p(0.12, -0.24)} L${p(0.24, -0.06)} L${p(0, 0.26)} L${p(-0.24, -0.06)} Z" fill="#FF6FB5" fill-opacity="0.92" stroke="#B8327D" stroke-width="2.2" stroke-linejoin="round"/><path d="M${p(-0.24, -0.06)} L${p(0.24, -0.06)} M${p(-0.12, -0.24)} L${p(-0.06, -0.06)} L${p(0, 0.26)} L${p(0.06, -0.06)} L${p(0.12, -0.24)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.4" stroke-linejoin="round"/>`;
  },
  trail(pts) {
    const d = 'M' + pts.map((q) => `${n(q[0])} ${n(q[1])}`).join(' L');
    return `<path d="${d}" fill="none" stroke="#9A3412" stroke-width="11" stroke-dasharray="0.1 15" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FF7A1A" stroke-width="7.5" stroke-dasharray="0.1 15" stroke-linecap="round" stroke-linejoin="round"/>`;
  },
};

const mapC = {
  board(W, H, uid) {
    const r = rng(uid.length * 131 + W * 7 + H);
    let s = `<rect width="${W}" height="${H}" rx="18" fill="#0A1030"/>`;
    const count = Math.round((W * H) / 1800);
    for (let i = 0; i < count; i++) s += `<circle cx="${n(4 + r() * (W - 8))}" cy="${n(4 + r() * (H - 8))}" r="${n(0.6 + r() * 1.1)}" fill="#FFFFFF" fill-opacity="${n(0.25 + r() * 0.65)}"/>`;
    return s;
  },
  beam(x1, y1, x2, y2) {
    return `<path d="M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}" stroke="#38BDF8" stroke-opacity="0.22" stroke-width="16" stroke-linecap="round"/><path d="M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/><path d="M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}" stroke="#E6F8FF" stroke-width="2" stroke-linecap="round"/>`;
  },
  bridgeH(x1, x2, y) {
    return mapC.beam(x1, y, x2, y);
  },
  bridgeV(x, y1, y2) {
    return mapC.beam(x, y1, x, y2);
  },
  cell(x, y, S, isBase) {
    const k = 6;
    return `<rect x="${n(x)}" y="${n(y)}" width="${S}" height="${S}" rx="10" fill="#1C2757" stroke="${isBase ? '#34E3A0' : '#3B4C96'}" stroke-width="2"/><rect x="${n(x + k)}" y="${n(y + k)}" width="${n(S - 2 * k)}" height="${n(S - 2 * k)}" rx="6" fill="none" stroke="#2B3A7C" stroke-width="1.5"/>` +
      [[x + 5, y + 5], [x + S - 5, y + 5], [x + 5, y + S - 5], [x + S - 5, y + S - 5]].map(([a, b]) => `<circle cx="${n(a)}" cy="${n(b)}" r="1.7" fill="#5566B0"/>`).join('');
  },
  base(cx, cy, S) {
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(S * 0.33)}" fill="#34E3A0" fill-opacity="0.12"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(S * 0.3)}" fill="none" stroke="#34E3A0" stroke-width="2.5"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(S * 0.18)}" fill="none" stroke="#34E3A0" stroke-opacity="0.7" stroke-width="2"/><path d="M${n(cx - 3)} ${n(cy + S * 0.14)} V${n(cy - S * 0.3)}" stroke="#E8EEFF" stroke-width="2.6" stroke-linecap="round"/><path d="M${n(cx - 2)} ${n(cy - S * 0.3)} H${n(cx + S * 0.22)} L${n(cx + S * 0.14)} ${n(cy - S * 0.21)} L${n(cx + S * 0.22)} ${n(cy - S * 0.12)} H${n(cx - 2)} Z" fill="#34E3A0"/>`;
  },
  rock(cx, cy, S) {
    const p = (dx, dy) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
    return `<path d="M${p(-0.28, 0.02)} Q${p(-0.26, -0.24)} ${p(-0.02, -0.27)} Q${p(0.26, -0.26)} ${p(0.29, -0.02)} Q${p(0.3, 0.24)} ${p(0.04, 0.27)} Q${p(-0.26, 0.26)} ${p(-0.28, 0.02)} Z" fill="#6F5F95" stroke="#3F3560" stroke-width="2"/><circle cx="${n(cx - S * 0.08)}" cy="${n(cy - S * 0.07)}" r="${n(S * 0.07)}" fill="#57497A"/><circle cx="${n(cx + S * 0.12)}" cy="${n(cy + S * 0.1)}" r="${n(S * 0.05)}" fill="#57497A"/><circle cx="${n(cx + S * 0.1)}" cy="${n(cy - S * 0.14)}" r="${n(S * 0.03)}" fill="#57497A"/>`;
  },
  gem(cx, cy, S) {
    const p = (dx, dy) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(S * 0.3)}" fill="#FF7AD9" fill-opacity="0.16"/><path d="M${p(0, -0.27)} L${p(0.16, -0.12)} L${p(0.16, 0.12)} L${p(0, 0.27)} L${p(-0.16, 0.12)} L${p(-0.16, -0.12)} Z" fill="#FF7AD9" stroke="#C0409E" stroke-width="1.8" stroke-linejoin="round"/><path d="M${p(0, -0.27)} L${p(0, 0.27)} M${p(-0.16, -0.12)} L${p(0, -0.02)} L${p(0.16, -0.12)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="1.3"/>`;
  },
  trail(pts) {
    const d = 'M' + pts.map((q) => `${n(q[0])} ${n(q[1])}`).join(' L');
    return `<path d="${d}" fill="none" stroke="#FFB547" stroke-opacity="0.22" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFB547" stroke-width="3.2" stroke-dasharray="7 6" stroke-linecap="round" stroke-linejoin="round"/>`;
  },
};

// ───────── lienzos por tema ─────────
const canvasA = {
  bg: (w, h) => `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="14" fill="#FFFDF6" stroke="#EADFC8" stroke-width="2"/>`,
  dot: (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="3" fill="#D4CBB6"/>`,
  paint: (d) => `<path d="${d}" fill="none" stroke="#F26B1D" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
};
const canvasB = {
  bg: (w, h, uid) => `<defs><pattern id="sw-${uid}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="4.2" fill="#E3E8EF"/></pattern></defs><rect width="${w}" height="${h}" rx="12" fill="#F6F8FB"/><rect width="${w}" height="${h}" rx="12" fill="url(#sw-${uid})"/><rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="11" fill="none" stroke="#D5DDEA" stroke-width="3"/>`,
  dot: (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="3.4" fill="#B8C1CF"/>`,
  paint: (d) => `<path d="${d}" fill="none" stroke="#C2410C" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FF7A1A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFB27A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(-1 -1.5)"/>`,
};
const canvasC = {
  bg: (w, h) => `<rect width="${w}" height="${h}" rx="16" fill="#0E1640"/><rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="15.5" fill="none" stroke="#26306A" stroke-width="1.5"/>`,
  dot: (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="2.6" fill="#3A4A8E"/>`,
  paint: (d) => `<path d="${d}" fill="none" stroke="#FF8A3D" stroke-opacity="0.25" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FF8A3D" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFE3CF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// ───────── temas ─────────
const hatArch = (f) =>
  `<svg width="112" height="20" viewBox="0 0 112 20" style="display: block; margin-bottom: -1px" aria-hidden="true"><path d="M0 20.5 C 12 1.5, 100 1.5, 112 20.5 Z" fill="${f.F}"/><path d="M9 15.5 C 22 5, 90 5, 103 15.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="2" stroke-linecap="round"/></svg>`;
const fillets = (f) =>
  `<svg width="8" height="8" viewBox="0 0 8 8" style="position: absolute; left: 0; top: 0; display: block" aria-hidden="true"><path d="M0 0 H8 A8 8 0 0 0 0 8 Z" fill="${f.F}"/></svg><svg width="8" height="8" viewBox="0 0 8 8" style="position: absolute; left: 0; bottom: 0; display: block" aria-hidden="true"><path d="M0 8 V0 A8 8 0 0 0 8 8 Z" fill="${f.F}"/></svg>`;
const TAB = 'M0 0 H24 L20 5.2 Q19 6.5 17.4 6.5 H6.6 Q5 6.5 4 5.2 Z';

const NOTCH_A = 'M0 0 H18 L15 4 Q14.3 5 13 5 H5 Q3.7 5 3 4 Z';
const TAB_A = 'M0 0 H18 L15 5.6 Q14.2 7 12.6 7 H5.4 Q3.8 7 3 5.6 Z';
const A = {
  key: 'A', file: 'Main.dc.html', title: 'Opción A · Encastre', overline: 'Opción A', name: 'Encastre',
  tagline: 'Bloques con volumen que encastran como piezas · islas unidas por puentes',
  fontLink: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&amp;display=swap',
  bodyFont: "'Fredoka', system-ui, sans-serif", headFont: "'Fredoka', system-ui, sans-serif", headWeight: '700',
  page: '#FBF7EE', card: '#FFFFFF', cardBorder: '2px solid #EDE3CC', cardRadius: '24px', cardShadow: 'none', ink: '#1F2B45', ink2: '#5B6477',
  stage: { background: '#F3F7FF', borderRadius: '20px' },
  m: { h: 44, moveW: 50, headerH: 48, elseH: 38, armW: 22, footerH: 20, footerW: 98, r: 10, padH: 14, mouthTop: 0, mouthBottom: 5, gap: 0, fs: 17, fw: 700, shift: 4 },
  fam: {
    move: { L: '#3F8EF2', F: '#176CE0', D: '#0D55BF', T: '#FFFFFF' },
    loop: { L: '#FFC04A', F: '#FEA814', D: '#C67505', T: '#2D1700' },
    cond: { L: '#1E9A52', F: '#0F8743', D: '#0A6231', T: '#FFFFFF' },
    func: { L: '#D2509A', F: '#C33582', D: '#96205D', T: '#FFFFFF' },
  },
  arrowSize: 24, loopSize: 22, loopStroke: 3.2, flagSize: 22, flagFill: '#10B955', pillArrow: '#1B2338', verbOutside: true, tabOnlyLast: true,
  iconRock: () =>
    `<svg width="24" height="18" viewBox="0 0 24 18" style="display: block" aria-hidden="true"><path d="M2 16.5 L3.6 8.6 L8.4 3.6 L15 3.4 L20.6 8 L22 16.5 Z" fill="#8D8F93" stroke="#5D6168" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.6 8.6 L11.4 6.4 L15 7.8" fill="none" stroke="#D4D6DA" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  iconPath: () =>
    `<svg width="40" height="18" viewBox="0 0 40 18" style="display: block" aria-hidden="true"><rect x="13" y="5.5" width="14" height="7" fill="#AD6F2F"/><path d="M16.5 5.5 V12.5 M20 5.5 V12.5 M23.5 5.5 V12.5" stroke="#7A4A1C" stroke-width="1.1"/><rect x="1" y="1.5" width="14" height="15" rx="4" fill="#5CC84A" stroke="#3B8F2E" stroke-width="1.5"/><rect x="25" y="1.5" width="14" height="15" rx="4" fill="#5CC84A" stroke="#3B8F2E" stroke-width="1.5"/></svg>`,
  faceStack: (f) => ({ background: `linear-gradient(180deg, ${f.L} 0%, ${f.F} 42%)`, borderRadius: '10px', boxShadow: `inset 0 -5px 0 ${f.D}, inset 0 1.5px 0 rgba(255, 255, 255, 0.45), 0 2px 4px rgba(20, 32, 64, 0.18)` }),
  faceHeader: (f) => ({ background: `linear-gradient(180deg, ${f.L} 0%, ${f.F} 45%)`, boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.45), 0 2px 4px rgba(20, 32, 64, 0.16)' }),
  hatFace: () => ({ boxShadow: '0 2px 4px rgba(20, 32, 64, 0.16)' }),
  faceArm: (f) => ({ background: f.F, boxShadow: 'inset -3px 0 0 rgba(0, 0, 0, 0.07)' }),
  faceFooter: (f) => ({ background: f.F, boxShadow: `inset 0 -5px 0 ${f.D}, inset 0 1.5px 0 rgba(255, 255, 255, 0.35), 0 2px 4px rgba(20, 32, 64, 0.18)` }),
  faceElse: (f) => ({ background: f.F, boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.35)' }),
  top: () => `<svg width="18" height="5" viewBox="0 0 18 5" style="position: absolute; left: 10px; top: 0; display: block" aria-hidden="true"><path d="${NOTCH_A}" fill="rgba(6, 18, 48, 0.3)"/></svg>`,
  bottom: (f) => `<svg width="18" height="7" viewBox="0 0 18 7" style="position: absolute; left: 10px; bottom: -6px; z-index: 2; display: block" aria-hidden="true"><path d="${TAB_A}" fill="${f.D}"/></svg>`,
  inner: () => '',
  under: (f, armW, r) => `<div style="position: absolute; left: ${armW}px; right: 0; bottom: 0; height: 3px; background: rgba(0, 0, 0, 0.13); border-radius: 0 0 ${r}px 0"></div>`,
  fillets,
  cap: (f) =>
    `<svg width="96" height="22" viewBox="0 0 96 22" style="display: block; margin-bottom: -1px" aria-hidden="true"><path d="M0 22.5 L0 14 Q0 0 14 0 L52 0 C64 0 70 5 76 11 C82 17 87 20.5 96 21 L96 22.5 Z" fill="${f.L}"/><path d="M3.5 12.5 Q4.5 3.5 14 3.5 L50 3.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round"/></svg>`,
  pill: (inner) => span({ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 17px', background: '#FFFFFF', clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)', color: '#1B2338', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', lineHeight: '1' }, inner),
  num: (s) => span({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', minWidth: '38px', height: '30px', padding: '0 11px', background: '#FFFFFF', borderRadius: '999px', color: '#1B2338', fontSize: '17px', fontWeight: '700', lineHeight: '1' }, esc(s)),
  hole: () => div({ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', width: '50px', height: '44px', border: '2.5px dashed #8E8C92', borderRadius: '10px', background: '#F4F5F7', color: '#858489', fontSize: '24px', fontWeight: '700' }, '?'),
  runGlow: '0 0 0 4px #F9E45A, 0 0 22px rgba(254, 222, 110, 0.95)',
  changed: { outline: '3px dashed #1F2B45', outlineOffset: '4px' },
  mark: { bg: '#1F2B45', fg: '#FFFFFF' },
  robot: robotA, map: mapA, canvas: canvasA,
};

const B = {
  key: 'B', file: 'OpcionB.dc.html', title: 'Opción B · Ladrillos', overline: 'Opción B', name: 'Ladrillos',
  tagline: 'Bloques de juguete con relieve · tablero de encastre con placas',
  fontLink: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&amp;family=Lilita+One&amp;display=swap',
  bodyFont: "'Baloo 2', system-ui, sans-serif", headFont: "'Lilita One', 'Baloo 2', system-ui, sans-serif", headWeight: '400',
  page: '#EEF2F7', card: '#FFFFFF', cardBorder: '3px solid #D5DDEA', cardRadius: '18px', cardShadow: '0 6px 0 #D5DDEA', ink: '#1B2438', ink2: '#56627A',
  stage: { background: '#EEF2F7', borderRadius: '14px', border: '2px solid #D5DDEA' },
  m: { h: 44, moveW: 52, headerH: 48, elseH: 38, armW: 20, footerH: 20, footerW: 96, r: 5, padH: 14, mouthTop: 0, mouthBottom: 6, gap: 0, fs: 16, fw: 700, shift: 5 },
  fam: {
    move: { F: '#1F63C8', D: '#144A99', T: '#FFFFFF' },
    loop: { F: '#FFC21A', D: '#D99A00', T: '#3A2600' },
    cond: { F: '#0B7F3F', D: '#075A2C', T: '#FFFFFF' },
    func: { F: '#D6246E', D: '#9E1450', T: '#FFFFFF' },
  },
  flagFill: '#22C55E', pillArrow: '#1B2438',
  iconRock: (s) => rockIcon(s, '#8C95A3', '#4E5664'),
  iconPath: (s) => pathIcon(s, '#E9ECF1', '#7D8797', '#FFC21A'),
  faceStack: (f) => ({ background: f.F, borderRadius: '5px', boxShadow: `inset 0 -6px 0 ${f.D}, inset 0 2px 0 rgba(255, 255, 255, 0.4)` }),
  faceHeader: (f) => ({ background: f.F, boxShadow: 'inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -3px 0 rgba(0, 0, 0, 0.12)' }),
  faceArm: (f) => ({ background: f.F, boxShadow: 'inset -4px 0 0 rgba(0, 0, 0, 0.14)' }),
  faceFooter: (f) => ({ background: f.F, boxShadow: `inset 0 -6px 0 ${f.D}, inset 0 2px 0 rgba(255, 255, 255, 0.25)` }),
  faceElse: (f) => ({ background: f.F, boxShadow: 'inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -3px 0 rgba(0, 0, 0, 0.12)' }),
  top: (f, o) => {
    if (!o.first || !o.topLevel) return '';
    const xs = o.wide ? [8, 30, 52] : [8, 30];
    const w = o.wide ? 74 : 52;
    return `<svg width="${w}" height="9" viewBox="0 0 ${w} 9" style="position: absolute; left: 6px; top: -8px; display: block" aria-hidden="true">${xs.map((x) => `<rect x="${x}" y="2.5" width="14" height="7" rx="1.5" fill="${f.D}"/><ellipse cx="${x + 7}" cy="2.8" rx="7" ry="2.6" fill="${f.F}"/><ellipse cx="${x + 5}" cy="2.3" rx="2.6" ry="0.9" fill="#FFFFFF" fill-opacity="0.6"/>`).join('')}</svg>`;
  },
  bottom: null,
  inner: () => '',
  fillets: null,
  cap: hatArch,
  pill: (inner) => span({ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', background: '#FFFFFF', borderRadius: '6px', boxShadow: 'inset 0 -3px 0 rgba(27, 36, 56, 0.14)', color: '#1B2438', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', lineHeight: '1' }, inner),
  num: (s) => span({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', minWidth: '34px', height: '30px', padding: '0 9px', background: '#FFFFFF', borderRadius: '6px', boxShadow: 'inset 0 -3px 0 rgba(27, 36, 56, 0.14)', color: '#1B2438', fontSize: '17px', fontWeight: '800', lineHeight: '1' }, esc(s)),
  hole: (o) => div({ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', width: '52px', height: '44px', border: '2.5px dashed #8A96AA', borderRadius: '5px', background: '#FFFFFF', color: '#56627A', fontSize: '22px', fontWeight: '800' }, (o.first && o.topLevel ? B.top({ F: '#FFFFFF', D: '#C9D1DE' }, o) : '') + '?'),
  runGlow: '0 0 0 4px #FFD23F, 0 0 22px rgba(255, 210, 63, 0.9)',
  changed: { outline: '3px dashed #1B2438', outlineOffset: '4px' },
  mark: { bg: '#1B2438', fg: '#FFFFFF' },
  robot: robotB, map: mapB, canvas: canvasB,
};

const C = {
  key: 'C', file: 'OpcionC.dc.html', title: 'Opción C · Galaxia', overline: 'Opción C', name: 'Galaxia',
  tagline: 'Módulos luminosos con conectores · estación espacial con puentes de energía',
  fontLink: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&amp;display=swap',
  bodyFont: "'Chakra Petch', system-ui, sans-serif", headFont: "'Chakra Petch', system-ui, sans-serif", headWeight: '700',
  page: '#0A0F2C', card: '#121A42', cardBorder: '1.5px solid #26306A', cardRadius: '20px', cardShadow: 'none', ink: '#EEF2FF', ink2: '#A7B2E6',
  stage: { background: '#0D1438', borderRadius: '18px', border: '1px solid #26306A' },
  m: { h: 42, moveW: 52, headerH: 46, elseH: 36, armW: 16, footerH: 16, footerW: 88, r: 12, padH: 14, mouthTop: 0, mouthBottom: 10, gap: 0, fs: 15, fw: 600, shift: 2 },
  fam: {
    move: { F: '#38BDF8', D: '#0B7DB5', T: '#07122E' },
    loop: { F: '#FFB547', D: '#C27A12', T: '#1E1300' },
    cond: { F: '#34E3A0', D: '#12A36B', T: '#03261A' },
    func: { F: '#FF7AD9', D: '#C0409E', T: '#2A0620' },
  },
  flagFill: '#34E3A0', pillArrow: '#07122E',
  iconRock: (s) => rockIcon(s, '#6F5F95', '#2A2244'),
  iconPath: (s) => pathIcon(s, '#1C2757', '#07122E', '#0B7DB5'),
  faceStack: (f) => ({ background: f.F, borderRadius: '12px', boxShadow: `inset 0 -3px 0 ${f.D}, inset 0 1.5px 0 rgba(255, 255, 255, 0.55), 0 0 18px ${rgba(f.F, 0.4)}` }),
  faceHeader: (f) => ({ background: f.F, boxShadow: `inset 0 1.5px 0 rgba(255, 255, 255, 0.55), 0 0 18px ${rgba(f.F, 0.3)}` }),
  faceArm: (f) => ({ background: f.F }),
  faceFooter: (f) => ({ background: f.F, boxShadow: `inset 0 -3px 0 ${f.D}, 0 0 18px ${rgba(f.F, 0.3)}` }),
  faceElse: (f) => ({ background: f.F, boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.45)' }),
  top: () => `<svg width="22" height="5" viewBox="0 0 22 5" style="position: absolute; left: 13px; top: 3px; display: block" aria-hidden="true"><rect x="0" y="0" width="22" height="4" rx="2" fill="rgba(7, 18, 46, 0.32)"/></svg>`,
  bottom: (f) => `<svg width="22" height="7" viewBox="0 0 22 7" style="position: absolute; left: 13px; bottom: -6px; z-index: 2; display: block" aria-hidden="true"><rect x="1" y="0" width="4" height="7" rx="1.2" fill="${f.D}"/><rect x="9" y="0" width="4" height="7" rx="1.2" fill="${f.D}"/><rect x="17" y="0" width="4" height="7" rx="1.2" fill="${f.D}"/></svg>`,
  inner: (f, armW) => `<svg width="22" height="7" viewBox="0 0 22 7" style="position: absolute; left: ${armW + 13}px; bottom: -6px; z-index: 2; display: block" aria-hidden="true"><rect x="1" y="0" width="4" height="7" rx="1.2" fill="${f.D}"/><rect x="9" y="0" width="4" height="7" rx="1.2" fill="${f.D}"/><rect x="17" y="0" width="4" height="7" rx="1.2" fill="${f.D}"/></svg>`,
  fillets,
  cap: (f) => `<svg width="104" height="16" viewBox="0 0 104 16" style="display: block; margin-bottom: -1px" aria-hidden="true"><path d="M0 16.5 L13 2.5 Q15 0.5 18 0.5 H86 Q89 0.5 91 2.5 L104 16.5 Z" fill="${f.F}"/><path d="M16 5 H88" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  pill: (inner) => span({ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '30px', padding: '0 12px', background: 'rgba(255, 255, 255, 0.62)', clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)', color: '#07122E', fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', lineHeight: '1' }, inner),
  num: (s) => span({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', minWidth: '32px', height: '28px', padding: '0 8px', background: '#FFFFFF', clipPath: 'polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px)', color: '#07122E', fontSize: '16px', fontWeight: '700', lineHeight: '1' }, esc(s)),
  hole: () => div({ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', width: '52px', height: '42px', border: '2px dashed #38BDF8', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.08)', color: '#7DD3FC', fontSize: '22px', fontWeight: '700', boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)' }, '?'),
  runGlow: '0 0 0 3px #FFFFFF, 0 0 26px rgba(255, 255, 255, 0.75)',
  changed: { outline: '2.5px dashed #FFFFFF', outlineOffset: '4px' },
  mark: { bg: '#FFFFFF', fg: '#0B1130' },
  robot: robotC, map: mapC, canvas: canvasC,
};

// ───────── motor de bloques (HTML + CSS) ─────────
function blocks(t) {
  const m = t.m;
  const F = (fam) => t.fam[fam];
  const txt = (fam, s) => span({ color: F(fam).T, fontSize: `${m.fs}px`, fontWeight: String(m.fw), whiteSpace: 'nowrap', lineHeight: '1' }, esc(s));

  function stackBlock(fam, content, o = {}) {
    const f = F(fam);
    const face = t.faceStack(f);
    const extra = {};
    if (o.state === 'running') face.boxShadow = `${face.boxShadow}, ${t.runGlow}`;
    if (o.state === 'changed') Object.assign(extra, t.changed);
    const badge = o.state === 'changed'
      ? div({ position: 'absolute', right: '-13px', top: '-13px', zIndex: '3', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '999px', background: t.mark.bg, color: t.mark.fg, fontSize: '14px', fontWeight: '700', lineHeight: '1' }, '!')
      : '';
    return div(
      { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box', minWidth: `${o.w ?? m.moveW}px`, height: `${m.h}px`, padding: `0 ${o.padX ?? 0}px ${m.shift}px`, whiteSpace: 'nowrap', ...face, ...extra },
      t.top(f, { ...o, wide: false }) + content + (t.bottom && (!t.tabOnlyLast || o.last) ? t.bottom(f) : '') + badge,
    );
  }

  function header(fam, content, o, radius) {
    const f = F(fam);
    const face = { ...t.faceHeader(f), ...(o.hat && t.hatFace ? t.hatFace(f) : {}) };
    return div(
      { position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box', minHeight: `${m.headerH}px`, padding: `0 ${m.padH}px`, whiteSpace: 'nowrap', borderRadius: radius, ...face },
      (o.hat ? '' : t.top(f, { ...o, wide: true })) + content + t.inner(f, m.armW) + (t.under ? t.under(f, m.armW, m.r) : ''),
    );
  }

  function mouth(fam, body) {
    const f = F(fam);
    return div(
      { display: 'flex', alignItems: 'stretch' },
      div({ width: `${m.armW}px`, flexShrink: '0', ...t.faceArm(f) }) +
        div({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: `${m.mouthTop}px 0 ${m.mouthBottom}px 0` }, (t.fillets ? t.fillets(f) : '') + stack(body, false)),
    );
  }

  function footer(fam, o = {}) {
    const f = F(fam);
    return div({ position: 'relative', boxSizing: 'border-box', width: `${m.footerW}px`, height: `${m.footerH}px`, borderRadius: `0 ${m.r}px ${m.r}px ${m.r}px`, ...t.faceFooter(f) }, t.bottom && (!t.tabOnlyLast || o.last) ? t.bottom(f) : '');
  }

  function cBlock(fam, content, body, o = {}) {
    const f = F(fam);
    const r = `${m.r}px`;
    const head = header(fam, content, o, o.hat ? `0 ${r} ${r} 0` : `${r} ${r} ${r} 0`);
    return div({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, (o.hat ? t.cap(f) : '') + head + mouth(fam, body) + footer(fam, o));
  }

  function ifElse(fam, content, thenB, elseB, o = {}) {
    const f = F(fam);
    const r = `${m.r}px`;
    const head = header(fam, content, o, `${r} ${r} ${r} 0`);
    const bar = div(
      { position: 'relative', display: 'flex', alignItems: 'center', boxSizing: 'border-box', minHeight: `${m.elseH}px`, padding: `0 ${m.padH + 4}px 0 ${m.padH}px`, whiteSpace: 'nowrap', borderRadius: `0 ${r} ${r} 0`, ...t.faceElse(f) },
      txt(fam, 'si no') + t.inner(f, m.armW) + (t.under ? t.under(f, m.armW, m.r) : ''),
    );
    return div({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, head + mouth(fam, thenB) + bar + mouth(fam, elseB) + footer(fam, o));
  }

  function condPill(cond) {
    const icon = cond.kind === 'rock' ? t.iconRock(18) : t.iconPath(18);
    return t.pill(`<span>hay</span>${icon}<span>${cond.kind === 'rock' ? 'roca' : 'camino'}</span>${arrowSmall(cond.dir, 16, t.pillArrow)}`);
  }

  const loop = () => loopIcon(t.loopSize || 20, F('loop').T, t.loopStroke || 2.6);
  function condHead(fam, word, verb, cond) {
    if (!t.verbOutside) return txt(fam, word) + condPill(cond);
    const icon = cond.kind === 'rock' ? t.iconRock(18) : t.iconPath(18);
    return txt(fam, `${word} ${verb}`) + t.pill(`${icon}<span>${cond.kind === 'rock' ? 'roca' : 'camino'}</span>${arrowSmall(cond.dir, 16, t.pillArrow)}`);
  }

  function node(b, o) {
    const T = (fam) => F(fam).T;
    switch (b.t) {
      case 'move':
        return stackBlock('move', arrowBig(b.dir, t.arrowSize || 26, T('move')), { ...o, w: m.moveW });
      case 'call':
        return stackBlock('func', txt('func', b.name), { ...o, padX: 20, w: 0 });
      case 'hole':
        return t.hole(o);
      case 'repeat':
        return cBlock('loop', loop() + txt('loop', 'repetir') + t.num(String(b.n)) + txt('loop', 'veces'), b.body, o);
      case 'until':
        return cBlock('loop', loop() + txt('loop', 'repetir hasta llegar a la base') + flagIcon(t.flagSize || 20, T('loop'), t.flagFill), b.body, o);
      case 'while':
        return cBlock('loop', loop() + condHead('loop', 'mientras', 'haya', b.cond), b.body, o);
      case 'if':
        return b.else ? ifElse('cond', condHead('cond', 'si', 'hay', b.cond), b.then, b.else, o) : cBlock('cond', condHead('cond', 'si', 'hay', b.cond), b.then, o);
      case 'def':
        return cBlock('func', txt('func', 'definir') + t.num(b.name), b.body, { ...o, hat: true });
      default:
        return '';
    }
  }

  function stack(list, topLevel) {
    return div({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: `${m.gap}px` }, list.map((b, i) => node(b, { first: i === 0, last: i === list.length - 1, topLevel })).join(''));
  }

  return { node, stack, stackBlock, txt };
}

// ───────── mapas y lienzo ─────────
const ek = (a, b) => {
  const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a];
  return `${p[0]},${p[1]}-${q[0]},${q[1]}`;
};
function placeRobot(t, x, y, S, state) {
  const k = (S * 0.98) / 140;
  return `<g transform="translate(${n(x - 60 * k)} ${n(y - 72 * k)}) scale(${n(k)})">${t.robot(state)}</g>`;
}
function mazeSvg(t, mp, o) {
  const { S, G, P, uid } = o;
  const W = P * 2 + mp.cols * S + (mp.cols - 1) * G, H = P * 2 + mp.rows * S + (mp.rows - 1) * G;
  const cx = (c) => P + (c - 1) * (S + G) + S / 2, cy = (r) => P + (r - 1) * (S + G) + S / 2;
  const walls = new Set((mp.walls || []).map(([a, b]) => ek(a, b)));
  let s = t.map.board(W, H, uid);
  for (let r = 1; r <= mp.rows; r++)
    for (let c = 1; c <= mp.cols; c++) {
      if (c < mp.cols && !walls.has(ek([c, r], [c + 1, r]))) s += t.map.bridgeH(cx(c), cx(c + 1), cy(r), S);
      if (r < mp.rows && !walls.has(ek([c, r], [c, r + 1]))) s += t.map.bridgeV(cx(c), cy(r), cy(r + 1), S);
    }
  const isBase = (c, r) => mp.base && mp.base[0] === c && mp.base[1] === r;
  for (let r = 1; r <= mp.rows; r++) for (let c = 1; c <= mp.cols; c++) s += t.map.cell(cx(c) - S / 2, cy(r) - S / 2, S, isBase(c, r));
  if (mp.base) s += t.map.base(cx(mp.base[0]), cy(mp.base[1]), S);
  if (o.trail) s += t.map.trail(o.trail.map(([c, r]) => [cx(c), cy(r)]));
  for (const [c, r] of mp.rocks || []) s += t.map.rock(cx(c), cy(r), S);
  for (const [c, r] of mp.gems || []) s += t.map.gem(cx(c), cy(r), S);
  const at = o.robotAt || mp.start;
  if (at) s += placeRobot(t, cx(at[0]), cy(at[1]), S, o.robotState || 'normal');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display: block; flex-shrink: 0" role="img" aria-label="${esc(o.label)}">${s}</svg>`;
}
function lienzoSvg(t, w, h, uid) {
  const cols = 5, rows = 3, D = 44, V = 34;
  const x0 = (w - (cols - 1) * D) / 2, y0 = (h - (rows - 1) * V) / 2 + 4;
  const px = (c) => x0 + (c - 1) * D, py = (r) => y0 + (r - 1) * V;
  const steps = [[1, 3], [2, 3], [2, 2], [3, 2], [3, 1], [4, 1], [5, 1]];
  let s = t.canvas.bg(w, h, uid);
  for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) s += t.canvas.dot(px(c), py(r));
  s += t.canvas.paint('M' + steps.map(([c, r]) => `${n(px(c))} ${n(py(r))}`).join(' L'));
  s += placeRobot(t, px(5), py(1) - 2, 34, 'normal');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display: block" role="img" aria-label="Lienzo con una escalera pintada">${s}</svg>`;
}
function pieceSvg(t, kind, uid) {
  const w = 110, h = 110;
  let s = t.map.board(w, h, uid);
  const two = (bridge) => {
    const S = 38, G = 18, x0 = (w - (2 * S + G)) / 2, y0 = 34;
    const c1 = x0 + S / 2, c2 = x0 + S + G + S / 2, cy = y0 + S / 2;
    return (bridge ? t.map.bridgeH(c1, c2, cy, S) : '') + t.map.cell(x0, y0, S, false) + t.map.cell(x0 + S + G, y0, S, false);
  };
  if (kind === 'casilla') s += t.map.cell(27, 25, 56, false);
  if (kind === 'camino') s += two(true);
  if (kind === 'sin') s += two(false);
  if (kind === 'base') s += t.map.cell(27, 25, 56, true) + t.map.base(55, 53, 56);
  if (kind === 'roca') s += t.map.cell(27, 25, 56, false) + t.map.rock(55, 53, 56);
  if (kind === 'gema') s += t.map.cell(27, 25, 56, false) + t.map.gem(55, 53, 56);
  if (kind === 'recorrido')
    return mazeSvg(t, { cols: 2, rows: 2, walls: [[[1, 1], [1, 2]], [[1, 2], [2, 2]]], rocks: [], gems: [] }, { S: 36, G: 18, P: 10, uid, trail: [[1, 1], [2, 1], [2, 2]], robotAt: [2, 2], label: 'Recorrido del robot' });
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display: block" role="img" aria-label="${esc(kind)}">${s}</svg>`;
}

// ───────── contenido compartido ─────────
const mv = (dir) => ({ t: 'move', dir });
const SHOW_MAP = {
  cols: 5, rows: 4, start: [1, 1], base: [5, 3],
  rocks: [[3, 1], [5, 2], [2, 4]], gems: [[3, 2], [4, 3]],
  walls: [[[1, 2], [1, 3]], [[3, 3], [3, 4]], [[4, 4], [5, 4]], [[2, 4], [3, 4]], [[3, 1], [4, 1]], [[5, 1], [5, 2]], [[1, 3], [2, 3]]],
};
const SHOW_STEPS = [[1, 1], [2, 1], [2, 2], [3, 2], [4, 2], [4, 3], [5, 3]];
const SHOW_PROGRAM = [{ t: 'until', body: [{ t: 'if', cond: { kind: 'rock', dir: 'R' }, then: [mv('D')], else: [mv('R')] }] }];

// ───────── lámina ─────────
function page(t) {
  const K = blocks(t);
  const sub = (s) => `<h3 style="${css({ margin: '0', fontSize: '14px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ink2, lineHeight: '1.2' })}">${esc(s)}</h3>`;
  const caption = (s) => span({ fontSize: '14px', fontWeight: '500', color: t.ink2, lineHeight: '1.2' }, esc(s));
  const group = (title, inner, gap = 14) => div({ display: 'flex', flexDirection: 'column', gap: `${gap}px` }, sub(title) + inner);
  const card = (o, inner) =>
    `<section style="${css({ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px', width: `${o.w}px`, height: `${o.h}px`, padding: '28px', background: t.card, border: t.cardBorder, borderRadius: t.cardRadius, boxShadow: t.cardShadow, flexShrink: '0' })}">` +
    div({ display: 'flex', alignItems: 'baseline', gap: '14px' }, `<h2 style="${css({ margin: '0', fontFamily: t.headFont, fontSize: '26px', fontWeight: t.headWeight, color: t.ink, lineHeight: '1.1' })}">${esc(o.title)}</h2>` + span({ fontSize: '16px', color: t.ink2 }, esc(o.caption))) +
    inner +
    `</section>`;

  // cabecera
  const chips = [['move', 'Movimiento'], ['loop', 'Repetición'], ['cond', 'Condición'], ['func', 'Función']]
    .map(([fam, label]) => K.stackBlock(fam, K.txt(fam, label), { padX: 18, w: 0, first: true, last: true, topLevel: true }))
    .join('');
  const head = div(
    { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '32px', height: '120px', flexShrink: '0' },
    div(
      { display: 'flex', flexDirection: 'column', gap: '8px' },
      div({ fontSize: '15px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.ink2 }, `${esc(t.overline)} · Misión Robot`) +
        `<h1 style="${css({ margin: '0', fontFamily: t.headFont, fontSize: '64px', lineHeight: '1', fontWeight: t.headWeight, color: t.ink })}">${esc(t.name)}</h1>` +
        `<p style="${css({ margin: '0', fontSize: '19px', color: t.ink2 })}">${esc(t.tagline)}</p>`,
    ) + div({ display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '10px' }, chips),
  );

  // fila 1: robot + escenario
  const poses = [['normal', 'Listo'], ['happy', '¡Llegó!'], ['crash', '¡Choque!'], ['paint', 'Pintando']];
  const robotCard = card(
    { w: 440, h: 520, title: 'Robot', caption: 'Estados del personaje' },
    div(
      { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', flexGrow: '1' },
      poses
        .map(([st, label]) =>
          div(
            { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', ...t.stage },
            `<svg width="128" height="149" viewBox="0 0 120 140" style="display: block; overflow: visible" role="img" aria-label="Robot: ${esc(label)}">${t.robot(st)}</svg>` +
              span({ fontSize: '17px', fontWeight: '600', color: t.ink }, esc(label)),
          ),
        )
        .join(''),
    ),
  );
  const scenarioCard = card(
    { w: 856, h: 520, title: 'Escenario', caption: 'Laberinto de ejemplo con el programa que lo resuelve' },
    div(
      { display: 'flex', alignItems: 'center', gap: '32px', flexGrow: '1' },
      mazeSvg(t, SHOW_MAP, { S: 54, G: 20, P: 20, uid: `${t.key}show`, trail: SHOW_STEPS, label: 'Laberinto de ejemplo con robot, base, rocas y gemas' }) +
        group('Programa', K.stack(SHOW_PROGRAM, true)),
    ),
  );
  const row1 = div({ display: 'flex', gap: '32px', flexShrink: '0' }, robotCard + scenarioCard);

  // fila 2: bloques
  const labeled = (html, label) => div({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }, html + caption(label));
  const top = (b) => K.node(b, { first: true, last: true, topLevel: true });
  const col = (w, inner) => div({ display: 'flex', flexDirection: 'column', gap: '26px', width: `${w}px`, flexShrink: '0' }, inner);
  const colMove = col(
    240,
    group('Movimiento', div({ display: 'flex', gap: '10px', paddingTop: '8px' }, ['U', 'D', 'L', 'R'].map((d) => top(mv(d))).join(''))) +
      group('Secuencia', div({ paddingTop: '8px' }, K.stack([mv('R'), mv('R'), mv('D')], true))) +
      group(
        'Estados',
        div(
          { display: 'flex', gap: '22px', paddingTop: '8px' },
          labeled(K.stackBlock('move', arrowBig('R', 26, t.fam.move.T), { first: true, last: true, topLevel: true, state: 'running' }), 'Ejecutando') +
            labeled(K.stackBlock('move', arrowBig('D', 26, t.fam.move.T), { first: true, last: true, topLevel: true, state: 'changed' }), 'Cambio') +
            labeled(top({ t: 'hole' }), 'Hueco'),
        ),
      ),
  );
  const colLoop = col(
    380,
    group(
      'Repetición',
      div(
        { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '26px', paddingTop: '8px' },
        top({ t: 'repeat', n: 3, body: [mv('R')] }) + top({ t: 'until', body: [mv('R'), mv('D')] }) + top({ t: 'while', cond: { kind: 'path', dir: 'R' }, body: [mv('R')] }),
      ),
    ),
  );
  const colCond = col(
    330,
    group(
      'Condición',
      div(
        { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '26px', paddingTop: '8px' },
        top({ t: 'if', cond: { kind: 'rock', dir: 'R' }, then: [mv('D')] }) + top({ t: 'if', cond: { kind: 'path', dir: 'R' }, then: [mv('R')], else: [mv('D')] }),
      ),
    ),
  );
  const colFunc = col(
    250,
    group(
      'Función',
      div(
        { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '26px', paddingTop: '8px' },
        labeled(top({ t: 'def', name: 'Paso', body: [mv('R'), mv('U')] }), 'Definición') + labeled(top({ t: 'call', name: 'Paso' }), 'Uso en el programa'),
      ),
    ),
  );
  const blocksCard = card({ w: 1328, h: 640, title: 'Bloques', caption: 'Todas las piezas con las que se arman los programas' }, div({ display: 'flex', justifyContent: 'space-between', gap: '24px', flexGrow: '1' }, colMove + colLoop + colCond + colFunc));

  // fila 3: piezas del escenario
  const pieces = [['casilla', 'Casilla'], ['camino', 'Camino'], ['sin', 'Sin camino'], ['base', 'Base'], ['roca', 'Roca'], ['gema', 'Gema'], ['recorrido', 'Recorrido']];
  const tile = (svg, label) => div({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }, svg + span({ fontSize: '16px', fontWeight: '600', color: t.ink }, esc(label)));
  const piecesCard = card(
    { w: 1328, h: 280, title: 'Piezas del escenario', caption: 'Elementos del laberinto y del lienzo' },
    div(
      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', flexGrow: '1' },
      pieces.map(([k, label], i) => tile(pieceSvg(t, k, `${t.key}p${i}`), label)).join('') + tile(lienzoSvg(t, 300, 110, `${t.key}lz`), 'Lienzo'),
    ),
  );

  const W = 1440, H = 1768;
  const root = div(
    { width: `${W}px`, height: `${H}px`, boxSizing: 'border-box', padding: '56px', display: 'flex', flexDirection: 'column', gap: '32px', background: t.page, fontFamily: t.bodyFont, color: t.ink, overflow: 'hidden' },
    head + row1 + blocksCard + piecesCard,
  );

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(t.title)}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="${t.fontLink}">
<style>
body{margin:0;background:${t.page};font-family:${t.bodyFont};color:${t.ink}}
</style>
</helmet>
${root}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":${H}}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
}

module.exports = { A, B, C, blocks, mazeSvg, pieceSvg, lienzoSvg, robotA, arrowBig, css, div, span, esc, SHOW_MAP, SHOW_STEPS };
if (MAIN) {
for (const t of [A, B, C]) fs.writeFileSync(path.join(OUT, t.file), page(t));

const canvas = {
  v: 3,
  createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') },
  title: 'Misión Robot · Paquetes visuales',
  launch: { view: 'canvas' },
  pages: [],
  boards: {
    'Main.dc.html': { x: 0, y: 0, w: 1440, h: 1768, title: 'Opción A · Encastre' },
    'OpcionB.dc.html': { x: 1520, y: 0, w: 1440, h: 1768, title: 'Opción B · Ladrillos' },
    'OpcionC.dc.html': { x: 3040, y: 0, w: 1440, h: 1768, title: 'Opción C · Galaxia' },
  },
  order: ['Main.dc.html', 'OpcionB.dc.html', 'OpcionC.dc.html'],
  notes: { titulo: { x: 0, y: -300, text: 'Misión Robot · tres paquetes visuales', kind: 'title1', maxW: 4480 } },
  designSystems: [],
};
fs.writeFileSync(path.join(OUT, 'canvas.json'), JSON.stringify(canvas, null, 2));
for (const f of fs.readdirSync(OUT)) console.log(f, fs.statSync(path.join(OUT, f)).size, 'bytes');
}
