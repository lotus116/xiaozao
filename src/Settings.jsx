import React, { useState } from "react";
import { normalize } from "./logic";
import { allergenOptions } from "./preferences";
export default function Settings({ state, setState, seasonings }) {
  const [input, setInput] = useState("");
  const p = state.preferences;
  const update = (patch) =>
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
  return (
    <section className="browse settings">
      <p className="eyebrow">把习惯留在自己的厨房</p>
      <h1 tabIndex="-1">厨房设置</h1>
      <p>自动保存在当前浏览器，下次打开继续使用。</p>
      <h2>常备调料</h2>
      <p className="hint">
        选一次就记住。清空本次食材、完成做菜，都不会清掉调料。
      </p>
      <div className="chips">
        {seasonings.map((n) => (
          <button
            className={"chip " + (state.pantry.includes(n) ? "selected" : "")}
            key={n}
            aria-pressed={state.pantry.includes(n)}
            onClick={() =>
              setState((s) => ({
                ...s,
                pantry: s.pantry.includes(n)
                  ? s.pantry.filter((x) => x !== n)
                  : [...s.pantry, n],
              }))
            }
          >
            {state.pantry.includes(n) ? "✓ " : ""}
            {n}
          </button>
        ))}
      </div>
      <h2>过敏食材</h2>
      <p className="hint">
        从推荐、搜索和收藏中排除相关菜谱，包括可选配料。复合调味品按可能含有相关成分处理。
      </p>
      <div className="chips">
        {allergenOptions.map((a) => (
          <button
            key={a}
            className={"chip " + (p.allergens.includes(a) ? "selected" : "")}
            aria-pressed={p.allergens.includes(a)}
            onClick={() =>
              update({
                allergens: p.allergens.includes(a)
                  ? p.allergens.filter((x) => x !== a)
                  : [...p.allergens, a],
              })
            }
          >
            {p.allergens.includes(a) ? "✓ " : ""}
            {a}
          </button>
        ))}
      </div>
      <p className="warning">
        筛选依据菜谱列出的配料，无法确认品牌配方、加工环境或交叉接触。仍请检查实际包装的致敏物提示；“未被排除”不代表无过敏风险。
        <a
          href="https://www.cfs.gov.hk/sc_chi/multimedia/multimedia_pub/multimedia_pub_fsf_123_02.html"
          target="_blank"
          rel="noreferrer"
        >
          食安中心说明
        </a>
      </p>
      <h2>不想吃的食材</h2>
      <p className="hint">普通忌口与过敏分开，例如香菜、葱、蒜或辣椒。</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = normalize(input);
          if (n) update({ avoid: [...new Set([...p.avoid, n])] });
          setInput("");
        }}
      >
        <label htmlFor="avoid-food">添加忌口食材</label>
        <div className="input-row">
          <input
            id="avoid-food"
            maxLength={30}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：香菜"
          />
          <button disabled={!input.trim()}>添加忌口</button>
        </div>
      </form>
      <div className="chips">
        {p.avoid.map((n) => (
          <button
            key={n}
            onClick={() => update({ avoid: p.avoid.filter((x) => x !== n) })}
            aria-label={"移除忌口" + n}
          >
            {n} ×
          </button>
        ))}
      </div>
      <label className="setting-row">
        忌口菜谱的处理
        <select
          value={p.avoidMode}
          onChange={(e) => update({ avoidMode: e.target.value })}
        >
          <option value="hide">隐藏相关菜谱</option>
          <option value="warn">显示并提醒</option>
        </select>
      </label>
      <p role="status" className="hint">
        设置已应用。{p.allergens.length} 项过敏筛选，{p.avoid.length}{" "}
        项普通忌口。保存状态以页面顶部提示为准。
      </p>
      <h2>今天重新选食材</h2>
      <p className="hint">只清除本次食材；常备调料、收藏和偏好继续保留。</p>
      <button
        onClick={() =>
          setState((s) => ({
            ...s,
            pantry: s.pantry.filter((n) => seasonings.includes(n)),
          }))
        }
      >
        清空本次食材，保留调料
      </button>
    </section>
  );
}
