// Approved A identity, rebuilt as editable geometry for web and Android.
// Keep every surface derived from these paths so its silhouette stays consistent.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const red = '#b83225', paper = '#fffdf8', ink = '#38251d';
const steamPot = [
  'M48 7C57 4 63 13 62 22C61 32 55 41 48 44C42 47 39 43 42 37C47 27 47 23 45 16C44 12 44 9 48 7Z',
  'M24 24C30 24 36 32 37 39C39 46 34 46 30 43L20 36C14 31 17 24 24 24Z',
  'M77 24C84 23 89 30 84 36L72 44C67 47 64 45 66 39C68 32 72 26 77 24Z',
  'M13 49C35 51 65 51 86 49C92 49 96 53 96 57C96 62 92 65 87 65H83L80 79C78 88 70 91 50 91C30 91 23 88 21 79L18 65H13C8 65 4 62 4 57C4 52 8 49 13 49Z',
];
const lettering = [
  // 小: an open central hook and two compact outward strokes.
  ['M150 22V73Q150 83 138 81', 18],
  ['M123 44L115 67', 16],
  ['M175 44L183 67', 16],
  // 灶: 火 radical, with open space between it and 土.
  ['M204 34L209 49', 13],
  ['M234 34L227 46', 13],
  ['M219 24C222 48 217 65 203 79', 15],
  ['M219 59L232 77', 14],
  ['M264 22V81', 17],
  ['M246 48H282', 17],
  ['M242 82H287', 18],
];
const paths = (fill) => steamPot.map(d => `<path fill="${fill}" d="${d}"/>`).join('');
const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>\n`;
const write = (file, content) => {
  const path = resolve(root, file); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content);
};
write('public/brand/xiaozao-mark.svg', svg('0 0 100 100', paths(red)));
write('public/brand/xiaozao-logo.svg', svg('0 0 300 100', paths(red) +
  `<g fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round">` +
  lettering.map(([d,width]) => `<path stroke-width="${width}" d="${d}"/>`).join('') + '</g>'));
// The SVG rounded background is a web/preview mask only, not an adaptive layer.
write('public/brand/xiaozao-app-icon.svg', svg('0 0 108 108',
  `<rect width="108" height="108" rx="24" fill="${red}"/><g transform="translate(21.5 21.5) scale(.65)">${paths(paper)}</g>`));

const vector = (color, background = '') => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
${background}    <group android:translateX="21.5" android:translateY="21.5" android:scaleX="0.65" android:scaleY="0.65">
${steamPot.map(d => `        <path android:fillColor="${color}" android:pathData="${d}" />`).join('\n')}
    </group>
</vector>
`;
const res = 'android/app/src/main/res/';
write(res + 'drawable/kitchen_mark.xml', vector(paper));
write(res + 'drawable/kitchen_monochrome.xml', vector('#ffffff'));
write(res + 'drawable/kitchen_splash.xml', vector(red));
write(res + 'mipmap-anydpi/ic_launcher.xml', vector(paper,
  `    <path android:fillColor="${red}" android:pathData="M0,0h108v108H0z" />\n`));
write(res + 'mipmap-anydpi/ic_launcher_round.xml', vector(paper,
  `    <path android:fillColor="${red}" android:pathData="M54,0A54,54 0,1 1,54,108A54,54 0,1 1,54,0Z" />\n`));
