// Genera dos páginas HTML de referencia para adjuntar al prompt de ChatGPT.
// Uso: node ref-gen.js <carpeta de salida>
const fs = require('fs');
const path = require('path');
const g = require('./gen.js');
const { A, blocks, mazeSvg, pieceSvg, robotA, arrowBig, css, div, span, esc, SHOW_MAP } = g;

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const FONT = "'Fredoka', system-ui, sans-serif";
const INK = '#1F2B45', INK2 = '#5B6477';
const shell = (title, bg, body) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&amp;display=swap">
<style>html,body{margin:0;background:${bg};font-family:${FONT};color:${INK}}</style>
</head>
<body>
${body}
</body>
</html>
`;
const cardStyle = { boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', background: '#FFFFFF', border: '2px solid #EDE3CC', borderRadius: '24px' };
const h2 = (s) => `<h2 style="${css({ margin: '0', fontSize: '22px', fontWeight: '700', color: INK })}">${esc(s)}</h2>`;
const titleBlock = (t, sub) =>
  div({ display: 'flex', flexDirection: 'column', gap: '6px' }, `<h1 style="${css({ margin: '0', fontSize: '34px', fontWeight: '700', color: INK, lineHeight: '1.1' })}">${esc(t)}</h1>` + `<p style="${css({ margin: '0', fontSize: '19px', color: INK2 })}">${esc(sub)}</p>`);

// ───────── 1. Mundo de la opción A (sin bloques) ─────────
{
  const poses = [['normal', 'Listo'], ['happy', '¡Llegó!'], ['crash', '¡Choque!'], ['paint', 'Pintando']];
  const robots = div(
    { ...cardStyle, flexShrink: '0' },
    h2('Robot') +
      div(
        { display: 'flex', gap: '16px', alignItems: 'center', flexGrow: '1' },
        poses
          .map(([st, label]) =>
            div(
              { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '128px', padding: '10px 0', background: '#F3F7FF', borderRadius: '18px' },
              `<svg width="112" height="131" viewBox="0 0 120 140" style="display: block; overflow: visible">${robotA(st)}</svg>` + span({ fontSize: '16px', fontWeight: '600' }, esc(label)),
            ),
          )
          .join(''),
      ),
  );
  const map = div(
    { ...cardStyle, flexShrink: '0' },
    h2('Escenario: islas unidas por puentes') + mazeSvg(A, SHOW_MAP, { S: 64, G: 24, P: 24, uid: 'refmap', label: 'Laberinto' }),
  );
  const piecesList = [['casilla', 'Casilla'], ['camino', 'Camino'], ['base', 'Base'], ['roca', 'Roca'], ['gema', 'Gema'], ['sin', 'Sin camino']];
  const pieces = div(
    { ...cardStyle, flexShrink: '0' },
    h2('Piezas') +
      div(
        { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 14px' },
        piecesList.map(([k, l], i) => div({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }, pieceSvg(A, k, `refp${i}`) + span({ fontSize: '15px', fontWeight: '600' }, esc(l)))).join(''),
      ),
  );
  const fams = [['Movimiento', A.fam.move.F], ['Repetición', A.fam.loop.F], ['Condición', A.fam.cond.F], ['Función', A.fam.func.F], ['Texto', '#1F2B45'], ['Fondo', '#FBF7EE']];
  const colors = div(
    { ...cardStyle, flexGrow: '1' },
    h2('Colores') +
      div(
        { display: 'flex', gap: '14px' },
        fams
          .map(([name, hex]) =>
            div(
              { display: 'flex', flexDirection: 'column', gap: '8px', width: '118px' },
              div({ height: '74px', borderRadius: '14px', background: hex, border: hex === '#FBF7EE' ? '2px solid #EDE3CC' : 'none', boxSizing: 'border-box' }) +
                span({ fontSize: '16px', fontWeight: '600' }, esc(name)) +
                span({ fontSize: '15px', color: INK2 }, esc(hex)),
            ),
          )
          .join(''),
      ),
  );
  const type = div(
    { ...cardStyle, flexShrink: '0', width: '520px' },
    h2('Tipografía: Fredoka') +
      div({ fontSize: '30px', fontWeight: '600', lineHeight: '1.25' }, 'repetir hasta llegar a la base') +
      div({ fontSize: '30px', fontWeight: '600', lineHeight: '1.25' }, 'si hay roca → · definir Paso') +
      div({ fontSize: '18px', color: INK2 }, 'Redondeada, gruesa y muy legible'),
  );
  const body = div(
    { width: '1600px', height: '1000px', boxSizing: 'border-box', padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#FBF7EE' },
    titleBlock('Referencia de estilo · Misión Robot', 'Mundo del juego: los bloques nuevos tienen que combinar con este robot, estos colores y este escenario') +
      div({ display: 'flex', gap: '24px', alignItems: 'stretch' }, robots + map + pieces) +
      div({ display: 'flex', gap: '24px', alignItems: 'stretch', flexGrow: '1' }, colors + type),
  );
  fs.writeFileSync(path.join(OUT, 'ref-mundo.html'), shell('Referencia de estilo', '#FBF7EE', body));
}

// ───────── 2. Estructura de los bloques (esquema en gris) ─────────
{
  const gray = { F: '#C3CAD6', D: '#97A1B2', T: '#1F2B45' };
  const W = { ...A, fam: { move: gray, loop: gray, cond: gray, func: gray } };
  const K = blocks(W);
  const mv = (dir) => ({ t: 'move', dir });
  const top = (b) => K.node(b, { first: true, topLevel: true });
  const badge = (num) => div({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '999px', background: INK, color: '#FFFFFF', fontSize: '17px', fontWeight: '700', flexShrink: '0' }, String(num));
  const item = (num, label, html) =>
    div(
      { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' },
      div({ display: 'flex', alignItems: 'center', gap: '10px' }, badge(num) + span({ fontSize: '18px', fontWeight: '600', color: INK }, esc(label))) + div({ paddingTop: '4px' }, html),
    );
  const row = (inner) => div({ display: 'flex', gap: '64px', alignItems: 'flex-start' }, inner);
  const running = K.stackBlock('move', arrowBig('R', 26, gray.T), { first: true, topLevel: true, state: 'running' });
  const body = div(
    { width: '1600px', height: '1000px', boxSizing: 'border-box', padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: '40px', background: '#FFFFFF' },
    titleBlock('Referencia de estructura · Forma y orden de los bloques', 'Esquema en gris: respetar formas, encastres, textos y numeración. El estilo y los colores los define el prompt') +
      row(
        item(1, 'Movimiento', div({ display: 'flex', gap: '10px' }, ['U', 'D', 'L', 'R'].map((d) => top(mv(d))).join(''))) +
          item(10, 'Pila encastrada', K.stack([mv('R'), mv('R'), mv('D')], true)) +
          item(9, 'Hueco vacío', top({ t: 'hole' })) +
          item(11, 'Ejecutando', running) +
          item(8, 'Usar función', top({ t: 'call', name: 'Paso' })),
      ) +
      row(
        item(2, 'Repetir N veces', top({ t: 'repeat', n: 3, body: [mv('R')] })) +
          item(3, 'Repetir hasta la base', top({ t: 'until', body: [mv('R'), mv('D')] })) +
          item(4, 'Mientras', top({ t: 'while', cond: { kind: 'path', dir: 'R' }, body: [mv('R')] })),
      ) +
      row(
        item(5, 'Si', top({ t: 'if', cond: { kind: 'rock', dir: 'R' }, then: [mv('D')] })) +
          item(6, 'Si / si no', top({ t: 'if', cond: { kind: 'path', dir: 'R' }, then: [mv('R')], else: [mv('D')] })) +
          item(7, 'Definir función', top({ t: 'def', name: 'Paso', body: [mv('R'), mv('U')] })),
      ),
  );
  fs.writeFileSync(path.join(OUT, 'ref-estructura.html'), shell('Referencia de estructura', '#FFFFFF', body));
}
console.log('ok');
