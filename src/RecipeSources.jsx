import photoPages from "./domestic-photo-pages.json";
import React from "react";
import { ExternalLink } from "lucide-react";

export default function Source({ r }) {
  if (r.community) return <aside className="source"><h2>用户分享，未经项目核对</h2><p>作者：{r.community.author} · 第 {r.community.version} 版</p><p>{r.community.attribution}</p></aside>;
  return (
    <details key={r.id} className="source">
      <summary>菜谱来源与验证说明</summary>
      {r.methodReviews?.length > 0 && (
        <section className="domestic-sources" aria-label="做法核对与取舍">
          <h2>做法核对与取舍</h2>
          <ul>{r.methodReviews.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.site} · {source.title} <ExternalLink size={14} aria-hidden="true" /></a>
              <p className="hint">{source.author} · {source.checked}</p>
              <p><strong>参考了什么：</strong>{source.supports}</p>
              <p><strong>小灶怎么取舍：</strong>{source.adaptation}</p>
            </li>
          ))}</ul>
        </section>
      )}
      {r.domesticSources?.length > 0 && (
        <section className="domestic-sources" aria-label="国内教程与取舍">
          <h2>国内教程与取舍</h2>
          <p className="hint">优先看国内作者怎么做，再结合新手操作取舍。以下是网页资料复核，不是本项目下厨试做或热门排名。</p>
          <ul>
            {r.domesticSources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.site} · {source.title} <ExternalLink size={14} aria-hidden="true" />
                </a>
                <p className="hint">{source.author} · {source.checked}
                  {Number.isInteger(source.step) && ` · 对应第 ${source.step + 1} 步「${r.steps[source.step].title}」`}
                </p>
                <p><strong>参考了什么：</strong>{source.supports}</p>
                <p><strong>小灶怎么取舍：</strong>{source.adaptation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {photoPages[r.id] && !r.domesticSources?.some((s) => s.url === photoPages[r.id].url) && <p><strong>国内图文参考</strong><br/>
        <a href={photoPages[r.id].url} target="_blank" rel="noreferrer">
          下厨房 · {photoPages[r.id].title}（{photoPages[r.id].author}）<ExternalLink size={14} />
        </a>
      </p>}
      <p><strong>主要资料来源</strong></p>
      <p>
        {r.source.site} · {r.source.author}
      </p>
      <a href={r.source.url} target="_blank" rel="noreferrer">
        查看原作者菜谱 <ExternalLink size={14} />
      </a>
      {r.additionalSources?.filter((s) => !r.methodReviews?.some((m) => m.url === s.url) && !r.domesticSources?.some((m) => m.url === s.url)).map((source) => (
        <p key={source.url}>
          <a href={source.url} target="_blank" rel="noreferrer">
            补充资料：{source.site}{source.title && ` · ${source.title}`}
          </a>
          {source.supports && <small className="hint"> · {source.supports}</small>}
        </p>
      ))}
      {r.safetySources?.map((source) => (
        <p key={source.url}>
          <a href={source.url} target="_blank" rel="noreferrer">食品安全依据：{source.site}</a>
        </p>
      ))}
      {r.timeNote && (
        <p className="hint">
          {r.timeNote} {r.servingsNote}
        </p>
      )}
      <p className="hint">
        原有资料记录日期：{r.source.checked}。中文步骤为资料整理与编辑建议，不是对原作者配方的完整复刻。各来源的核对范围不同，见下方说明。网页核对不等于项目试做，本项目尚未实际试做。不以评分或评论数量作为本项目试做证据。
      </p>
      {r.editorNote && <p className="hint">{r.editorNote}</p>}
      {r.source.site === "The Woks of Life" &&
        ["tomato-eggs", "bok-choy", "tomato-soup", "scallion-noodles"].includes(
          r.id,
        ) && (
          <p className="hint">
            原文明确提及重新测试；这是作者陈述，不是本项目验证。
          </p>
        )}
      {[
        "honey-chicken",
        "beef-noodles",
        "shrimp-eggs",
        "ginger-shrimp",
        "soy-eggs",
      ].includes(r.id) && (
        <a
          href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures"
          target="_blank"
          rel="noreferrer"
        >
          食物熟度依据：FoodSafety.gov
        </a>
      )}
    </details>
  );
}
