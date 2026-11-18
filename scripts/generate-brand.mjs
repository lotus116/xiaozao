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
// Approved C lettering, using the original pot mark.
const lettering = [
'M37 17 Q42 14 49 17 Q47 31 47 50 L47 61 Q47 71 37 72 Q33 66 24 62 Q37 65 38 59 L38 29 Q38 22 35 19Z',
'M21 34 Q25 36 26 39 Q17 51 3 55 Q12 46 16 37 Q17 33 21 34Z',
'M56 35 Q66 36 74 45 Q77 48 81 47 Q79 54 73 54 Q68 54 65 49 Q61 41 56 35Z',
'M101 20 Q107 17 112 20 Q112 38 107 51 Q101 65 82 72 Q96 59 100 43 Q103 31 101 20Z',
'M86 30 Q96 34 97 40 Q96 45 91 43 Q90 37 86 30Z',
'M115 26 Q120 26 124 29 Q119 36 110 40 Q115 31 115 26Z',
'M106 47 Q114 49 119 55 Q121 60 117 61 Q113 61 111 56Z',
'M135 17 Q141 15 146 18 Q144 29 144 38 L151 38 Q156 38 160 35 Q159 43 154 44 L143 44 L143 61 L153 61 Q163 61 167 55 Q167 65 160 68 Q151 70 139 67 Q126 65 116 69 Q112 70 110 67 Q116 60 125 61 L135 61 L136 44 L122 46 Q118 45 118 42 Q121 38 128 39 L136 39Z'];
const paths = (fill) => steamPot.map(d => `<path fill="${fill}" d="${d}"/>`).join('');
const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>\n`;
const write = (file, content) => {
  const path = resolve(root, file); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content);
};
write('public/brand/xiaozao-mark.svg', svg('0 0 100 100', paths(red)));
write('public/brand/xiaozao-logo.svg', svg('0 0 120 40',
  '<g transform="translate(0 1.4) scale(.372)">' + paths(red) + '</g>' +
  '<g transform="translate(42 0) scale(.4643)">' +
  lettering.map(d => `<path fill="${ink}" d="${d}"/>`).join('') + '</g>'));
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
