import React, { useState } from "react";
import { isHK } from "./language";
import { original } from "./localized-element";
import { normalize } from "./logic";
import { allergenOptions } from "./preferences";
export default function Settings({ state, setState, seasonings, sound }) {
  const [input, setInput] = useState("");
  const [audioMessage, setAudioMessage] = useState("");
  const p = state.preferences;
  const update = (patch) =>
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
  return (
    <section className="browse settings">
      <h1 tabIndex="-1">厨房设置</h1>

      <label className="setting-row">界面语言
        <select value={isHK() ? "zh-HK" : "zh-CN"} onChange={event => {
          localStorage.setItem("xiaozao-language", event.target.value);
          window.location.reload();
        }}>
          <option value="zh-CN">{original("简体中文")}</option>
          <option value="zh-HK">{original("繁體中文（香港）")}</option>
        </select>
      </label>
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
      <details className="settings-seasonings"><summary>常备调料 · 已选 {state.pantry.filter((n) => seasonings.includes(n)).length} 样</summary>
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
      </details>
      <h2>计时提醒</h2>
      <div className="chips">
        <button role="switch" aria-checked={state.timerSound} aria-label="前台到时响铃"
          onClick={() => {
            if (!state.timerSound) sound.activate();
            setState((s) => ({ ...s, timerSound: !s.timerSound }));
            setAudioMessage("");
          }}>前台到时响铃 · {state.timerSound ? "已开启" : "已关闭"}</button>
        <button disabled={!state.timerSound} onClick={async () => {
          const ok = await sound.preview();
          setAudioMessage(ok ? "已播放试听，请确认手机媒体音量。" : "声音未能播放，请再点试听，或使用手机系统计时器。");
        }}>试听提示音</button>
      </div>
      <p className="hint">只在 App 前台播放，受手机媒体音量影响。后台和锁屏暂不支持响铃，请使用手机系统计时器。</p>
      <p className="hint" role="status">{audioMessage || (state.timerSound && sound.status === "blocked" ? "声音尚未就绪，请点试听重试；到时文字提醒仍会显示。" : "")}</p>
      <h2>计时器图标</h2>
      <p className="hint">图标可拖动、长按隐藏。隐藏不会停止正在运行的计时。</p>
      <div className="chips">
        <button
          aria-pressed={!state.timerDock.hidden}
          onClick={() =>
            setState((s) => ({
              ...s,
              timerDock: { ...s.timerDock, hidden: !s.timerDock.hidden },
            }))
          }
        >
          {state.timerDock.hidden ? "显示计时器图标" : "隐藏计时器图标"}
        </button>
        <button
          onClick={() =>
            setState((s) => ({
              ...s,
              timerDock: { hidden: false, position: null },
            }))
          }
        >
          恢复图标默认位置
        </button>
      </div>
      <p role="status" className="hint">
        设置已应用。{p.allergens.length} 项过敏筛选，{p.avoid.length}{" "}
        项普通忌口。保存状态以页面顶部提示为准。
      </p>
    </section>
  );
}
