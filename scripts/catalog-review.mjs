import { writeFileSync } from "node:fs";
import { recipes } from "../src/recipes.js";
import photos from "../src/dish-photos.json" with { type: "json" };

const escape = (value) => String(value).replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
const link = (url, label) => `<a target="_blank" rel="noreferrer" href="${escape(url)}">${escape(label)}</a>`;
const cards = recipes.map((r) => {
  const src = r.domesticSources[0], photo = photos[r.id];
  const img = photo.asset || `/dishes/${r.id}-view.webp`;
  const step = r.steps[src.step];
  return `<article><img loading="lazy" src="../public${escape(img)}" alt="${escape(r.name)}成品参考"><h2>${escape(r.name)}</h2>
  <p class="credit">${link(photo.source, (photo.publisher ? "来源于" + photo.publisher + " · " : "") + photo.credit + " · " + photo.title)} · ${link(photo.licenseUrl,photo.license)}</p>
${photo.note ? "<p>" + escape(photo.note) + "</p>" : ""}
  <p>第 ${src.step + 1} 步 · ${escape(step.title)}</p><p>${escape(src.adaptation)}</p>
  <details><summary>核对原页与实际步骤</summary><p>${link(src.url,src.site + " · " + src.author + " · " + src.title)}</p><p>${escape(src.supports)}</p><p><b>App 步骤</b>　${escape(step.text)}</p></details></article>`;
}).join("\n");
writeFileSync(new URL("../docs/CATALOG_REVIEW.html", import.meta.url), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小灶 · 99 道验收</title><style>
*{box-sizing:border-box}body{margin:0 auto;max-width:76rem;padding:24px;font:16px/1.6 system-ui,sans-serif;color:#173528;background:#faf9f5}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:1.4rem}article{min-width:0;padding:16px;background:white;border:1px solid #d6e0d7;border-radius:12px}article img{width:100%;height:170px;object-fit:contain}h2{font-size:1.14rem;margin:8px 0}p{margin:.45em 0}.credit,details{font-size:.86rem}a{color:#305e45;overflow-wrap:anywhere}input{font:inherit;padding:8px 12px;border:1px solid #607a6c;border-radius:6px;margin:12px 0 20px;width:min(100%,25rem)}summary{cursor:pointer}header p{max-width:56em}</style>
<header><h1>小灶 · 逐菜验收</h1><p>每道菜可对照成品实拍、国内作者的做法及 App 中实际使用的步骤。这里记录资料核对与操作验证，口味和成品仍待下厨试做。</p>
<label>筛选菜名 <input type="search" id="search" placeholder="例如：豆腐"></label> <output aria-live="polite" id="count">${recipes.length} 道</output></header>
<main>${cards}</main><script>
const cards=[...document.querySelectorAll('article')];document.querySelector('input').addEventListener('input',event=>{let shown=0;for(const card of cards){card.hidden=!card.querySelector('h2').textContent.includes(event.target.value.trim());if(!card.hidden)shown++}document.querySelector('output').textContent=shown+' 道';});
</script></html>`);
