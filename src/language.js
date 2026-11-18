import { ConverterFactory } from 'opencc-js/core';
import fromHK from 'opencc-js/from/hk';
import toCN from 'opencc-js/to/cn';

const terms = [
  ['牛肉卷', '牛肉捲'], ['肥牛卷', '肥牛卷'], ['牛肉末', '免治牛肉'], ['猪肉末', '免治豬肉'],
  ['西兰花', '西蘭花'], ['土豆', '薯仔'], ['胡萝卜', '甘筍'], ['西葫芦', '翠玉瓜'],
  ['炒锅', '炒鑊'], ['锅底', '鑊底'], ['平底锅', '平底鑊'], ['电饭锅', '電飯煲'],
  ['电饭煲', '電飯煲'], ['冰箱', '雪櫃'], ['牛油果', '牛油果'], ['黄油', '牛油'], ['芝士', '芝士'], ['奶酪', '芝士'],
  ['菜谱', '食譜'], ['设置', '設定'], ['账号', '帳戶'], ['登录', '登入'], ['分钟', '分鐘'],
  ['小灶', '小灶'],
];
const displayTerms = new Map(terms);
const inputTerms = new Map(terms.map(([cn, hk]) => [hk, cn]));
const pattern = keys => new RegExp([...keys].sort((a,b) => b.length-a.length).join('|'), 'gu');
const displayPattern = pattern(displayTerms.keys());
const inputPattern = pattern(inputTerms.keys());
let toTraditional, toSimplified;
const cache = new Map();
export function searchSpelling(value) {
  const text = String(value);
  if (!/[\u3400-\u9fff]/u.test(text)) return text;
  if (cache.has(text)) return cache.get(text);
  toSimplified ??= ConverterFactory(fromHK, toCN);
  const result = toSimplified(text.replace(inputPattern, word => inputTerms.get(word)));
  if (cache.size < 3500) cache.set(text, result);
  return result;
}
let activeHK;
export function isHK() {
  try { return activeHK ??= globalThis.localStorage?.getItem('xiaozao-language') === 'zh-HK'; }
  catch { return false; }
}
// The large phrase dictionary is an offline APK asset loaded only in HK mode.
export async function prepareLanguage() {
  if (!isHK()) return;
  const [{default: fromCN}, {default: toHK}] = await Promise.all([
    import('opencc-js/from/cn'), import('opencc-js/to/hk'),
  ]);
  toTraditional = ConverterFactory(fromCN, toHK);
}
export function localize(text) {
  if (typeof text !== 'string' || !isHK() || !/[\u3400-\u9fff]/u.test(text)) return text;
  if (!toTraditional) return text;
  // Convert the surrounding phrases independently so brand and HK terms stay exact.
  let start = 0, result = '';
  for (const match of text.matchAll(displayPattern)) {
    result += toTraditional(text.slice(start, match.index)) + displayTerms.get(match[0]);
    start = match.index + match[0].length;
  }
  return result + toTraditional(text.slice(start));
}
