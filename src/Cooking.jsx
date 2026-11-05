import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Timer,
  CookingPot,
  ShoppingBasket,
} from "lucide-react";
import Ingredients from "./Ingredients";
import { nextMealRecipe } from "./meal";
import { dietaryWarnings } from "./preferences";
export default function Cooking({
  recipe: r,
  state,
  setState,
  recipes,
  go,
  start,
}) {
  const c = state.cooking,
    inMeal = state.meal?.ids.includes(r.id);
  const stepTo = (step) =>
    setState((s) => ({ ...s, cooking: { id: r.id, step } }));
  const finish = () =>
    setState((s) => ({
      ...s,
      cooking: { id: r.id, step: r.steps.length },
      timer: s.timer?.id === r.id ? null : s.timer,
      meal: inMeal
        ? { ...s.meal, done: [...new Set([...s.meal.done, r.id])] }
        : s.meal,
    }));
  const next = inMeal
    ? nextMealRecipe(state.meal, recipes, state.preferences)
    : null;
  const startTimer = (index) =>
    setState((s) =>
      s.timer
        ? s
        : {
            ...s,
            timerDock: { ...s.timerDock, hidden: false },
            timer: {
              id: r.id,
              step: index,
              deadline: Date.now() + r.steps[index].seconds * 1000,
            },
          },
    );
  const timerButton = (index) => {
    const st = r.steps[index];
    const caption = state.timer
      ? "已有计时进行中"
      : (st.seconds < 60
          ? st.seconds + " 秒"
          : +(st.seconds / 60).toFixed(1) + " 分钟") + "计时";
    return (
      st.seconds > 0 && (
        <button
          className="step-timer"
          disabled={!!state.timer}
          onClick={() => startTimer(index)}
          aria-label={"启动计时：" + st.title + "，" + caption}
        >
          <Timer size={18} />
          {caption}
        </button>
      )
    );
  };
  if (c?.id !== r.id)
    return (
      <section className="cook">
        <h1 tabIndex="-1">开始做 {r.name}</h1>
        <button className="primary" onClick={() => start(r)}>
          看看备料
        </button>
      </section>
    );
  if (c.step === -1)
    return (
      <section className="cook">
        <button className="text-button" onClick={() => go("recipe/" + r.id)}>
          <ArrowLeft size={18} />
          返回详情
        </button>
        <h1 tabIndex="-1">开火前，扫一眼</h1>
        <p>
          {r.name} · {r.servings} 人份
        </p>
        <p className="hint">主料、调料放手边就好，不用逐项打勾。</p>
        <Ingredients r={r} />
        <p>厨具：{r.tools}</p>
        <button className="primary wide" onClick={() => stepTo(0)}>
          开始做这道菜
          <ArrowRight size={18} />
        </button>
      </section>
    );
  if (c.step >= r.steps.length)
    return (
      <section className="cook finished">
        <CookingPot size={54} />
        <h1 tabIndex="-1">
          {inMeal && next ? "这道做好了。" : "辛苦啦，开饭吧。"}
        </h1>
        <p>{r.name} 已完成。上桌前确认熟透。</p>
        {inMeal && (
          <p>
            这餐已完成 {state.meal.done.length} / {state.meal.ids.length} 道
          </p>
        )}
        {inMeal && next && (
          <button
            className="primary wide"
            onClick={() => {
              setState((s) => ({ ...s, cooking: { id: next.id, step: 0 } }));
              go("cook/" + next.id);
            }}
          >
            下一道：{next.name}
            <ArrowRight size={18} />
          </button>
        )}
        {inMeal && !next && state.meal.done.length < state.meal.ids.length && (
          <p className="warning">余下菜谱被饮食设置排除，请回菜篮调整。</p>
        )}
        <button
          className={next ? "" : "primary"}
          onClick={() => {
            setState((s) => ({ ...s, cooking: null, meal: null }));
            go(inMeal ? "basket" : "pantry");
          }}
        >
          {inMeal ? "回到菜篮" : "回到我的厨房"}
        </button>
        {!inMeal && (
          <button className="text-button" onClick={() => stepTo(-1)}>
            再做一次
          </button>
        )}
      </section>
    );
  return (
    <section className="cook cooking-page">
      <button
        className="text-button"
        onClick={() => go(inMeal ? "basket" : "recipe/" + r.id)}
      >
        <ArrowLeft size={18} />
        {inMeal ? "返回菜篮（进度保留）" : "返回详情（进度保留）"}
      </button>
      {inMeal && (
        <p className="meal-position">
          <ShoppingBasket size={16} />
          这餐第 {state.meal.ids.indexOf(r.id) + 1} / {state.meal.ids.length} 道
          · 已完成 {state.meal.done.length} 道
        </p>
      )}
      <h1 tabIndex="-1">{r.name}</h1>
      <div className="cook-view">
        <button
          aria-pressed={state.cookView === "overview"}
          onClick={() => setState((s) => ({ ...s, cookView: "overview" }))}
        >
          整页看
        </button>
        <button
          aria-pressed={state.cookView === "step"}
          onClick={() => setState((s) => ({ ...s, cookView: "step" }))}
        >
          分步看
        </button>
      </div>
      {dietaryWarnings(r, state.preferences).length > 0 && (
        <p className="warning">
          {dietaryWarnings(r, state.preferences).join("；")}
        </p>
      )}
      <details className="cook-ingredients">
        <summary>用量放手边 · {r.servings} 人份</summary>
        <Ingredients r={r} />
      </details>
      <p className="hint">
        计时到点后看锅里的状态，不用盯着手机。可省调料没有就跳过。
      </p>
      {state.cookView === "overview" ? (
        <>
          <ol className="cooking-overview">
            {r.steps.map((st, index) => (
              <li key={index}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h2>{st.title}</h2>
                  <p>{st.text}</p>
                  {timerButton(index)}
                </div>
              </li>
            ))}
          </ol>
          <button className="primary wide" onClick={finish}>
            完成这道菜
          </button>
        </>
      ) : (
        <>
          <p className="eyebrow">
            第 {c.step + 1} / {r.steps.length} 步
          </p>
          <h2 className="focused-step">{r.steps[c.step].title}</h2>
          <p className="instruction">{r.steps[c.step].text}</p>
          {timerButton(c.step)}
          <div className="step-actions">
            <button onClick={() => stepTo(c.step - 1)}>
              <ArrowLeft size={18} />
              {c.step === 0 ? "查看备料" : "上一步"}
            </button>
            <button
              className="primary"
              onClick={() =>
                c.step === r.steps.length - 1 ? finish() : stepTo(c.step + 1)
              }
            >
              {c.step === r.steps.length - 1 ? "完成这道菜" : "下一步"}
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
