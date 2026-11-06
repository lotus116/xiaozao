import React, { useEffect, useRef, useState } from "react";
import {
  ShoppingBasket,
  ArrowUp,
  ArrowDown,
  X,
  Play,
  Check,
  Copy,
} from "lucide-react";
import {
  basketRecipes,
  canStartMeal,
  mealIngredients,
  mealShoppingText,
  nextMealRecipe,
} from "./meal";
import { allowedRecipe, dietaryWarnings } from "./preferences";
import { FoodIcon } from "./Ingredients";
import "./basket-prep.css";
import MealPlanner from "./MealPlanner";
export default function Basket({ state, setState, recipes, go, resetControls }) {
  const [prepView, setPrepView] = useState("all");
  const [copyResult, setCopyResult] = useState(null);
  const copyPending = useRef(false);
  const copyField = useRef(null);
  const startDialog = useRef(null);
  const rows = basketRecipes(state.basket, recipes);
  const ingredients = mealIngredients(rows, state.pantry);
  const needed = ingredients.filter((i) => i.missing && !i.water);
  const visibleIngredients = prepView === "missing" ? needed : ingredients;
  const canBegin = canStartMeal(state.basket, recipes, state.preferences);
  const shoppingText = mealShoppingText(rows, state.pantry, state.preferences);
  const copyStatus = copyResult?.text === shoppingText ? copyResult.status : null;
  const active = state.meal && state.cooking;
  const currentRecipe = active && recipes.find((r) => r.id === state.cooking.id);
  const currentBlocked = active &&
    (!currentRecipe || !allowedRecipe(currentRecipe, state.preferences));
  const resumeRecipe = active && (currentBlocked
    ? nextMealRecipe(state.meal, recipes, state.preferences)
    : currentRecipe);
  useEffect(() => {
    if (copyStatus === "fallback") {
      copyField.current?.focus();
      copyField.current?.select();
      copyField.current?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [copyStatus, shoppingText]);
  const copyShoppingList = async () => {
    if (!shoppingText || copyPending.current) return;
    copyPending.current = true;
    setCopyResult({ text: shoppingText, status: "pending" });
    try {
      if (typeof navigator.clipboard?.writeText !== "function")
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(shoppingText);
      setCopyResult({ text: shoppingText, status: "copied" });
    } catch {
      setCopyResult({ text: shoppingText, status: "fallback" });
    } finally {
      copyPending.current = false;
    }
  };
  const move = (index, delta) =>
    setState((s) => {
      const basket = [...s.basket];
      [basket[index], basket[index + delta]] = [
        basket[index + delta],
        basket[index],
      ];
      return { ...s, basket };
    });
  const beginNow = () => {
    if (!canStartMeal(state.basket, recipes, state.preferences)) return;
    const ids = rows.map((r) => r.id);
    setState((s) => ({
      ...s,
      meal: { ids, done: [] },
      cooking: { id: ids[0], step: 0 },
      timer: s.timer?.id ? null : s.timer,
    }));
    go("cook/" + ids[0]);
  };
  const begin = () => {
    const previous = recipes.find((r) => r.id === state.cooking?.id);
    if (!state.meal && previous && state.cooking.step < previous.steps.length) {
      startDialog.current.showModal();
      return;
    }
    beginNow();
  };
  return (
    <section className="browse basket-page">
      <dialog ref={startDialog} className="timer-dialog" aria-labelledby="basket-start-title">
        <h2 id="basket-start-title">从这份菜篮重新开始？</h2>
        <p>当前单道菜的跟做进度和步骤计时会结束。菜篮、收藏和独立厨房计时保留。</p>
        <div className="chips">
          <button autoFocus onClick={() => startDialog.current.close()}>保留当前跟做</button>
          <button className="primary" onClick={() => { startDialog.current.close(); beginNow(); }}>确认，开始这顿饭</button>
        </div>
      </dialog>
      <p className="eyebrow">选好菜，再一起开火</p>
      <h1 tabIndex="-1">今天的菜篮</h1>
      <p>放进今天想做的菜，备料集中看。按下面的顺序，一道接着一道做。</p>
      <section className="basket-pantry-reset" aria-labelledby="basket-reset-title">
        <h2 id="basket-reset-title">今天重新选食材</h2>
        <p className="hint">只清空本次食材，保留常备调料、已选菜和跟做进度；收藏、常用食材和偏好也不变。</p>
        {resetControls}
        <button className="text-button" onClick={() => go("pantry")}>去选今天的食材</button>
      </section>
      <details className="cooking-notes meal-order-notes">
        <summary>一锅做几道，先做哪道？</summary>
        <p>先看是否需要提前煮饭、泡发或腌制，再按自己的锅具安排顺序。一般先做等待较久的菜，临上桌再炒青菜；下面仍按你排好的顺序，一道接着一道。</p>
        <p>先把各道菜的材料分开放好，生肉鱼虾不要与凉拌菜、熟食共用未清洗的刀板。正在加热的锅不要无人照看。</p>
        <p className="hint">这里不自动安排多锅并行。顺序建议里的用时只是菜谱标注的合计，不是整餐上桌时间。</p>
      </details>
      {active && (
        <aside className="meal-progress">
          <p>
            这餐已完成 {state.meal.done.length} / {state.meal.ids.length}{" "}
            道。调整菜篮只影响下一餐，正在做的顺序保持不变。
          </p>
          {currentBlocked && (
            <p className="warning">
              {resumeRecipe
                ? "当前这道菜不符合厨房设置，可以先做下一道。跳过的菜不会计为完成。"
                : "这一餐暂无符合厨房设置的未完成菜谱，可查看设置或结束本次跟做。"}
            </p>
          )}
          {resumeRecipe && (
            <button
              className="primary"
              onClick={() => {
                if (!allowedRecipe(resumeRecipe, state.preferences)) return;
                if (currentBlocked)
                  setState((s) => ({
                    ...s,
                    cooking: { id: resumeRecipe.id, step: 0 },
                  }));
                go("cook/" + resumeRecipe.id);
              }}
            >
              {currentBlocked
                ? `继续可做的下一道：${resumeRecipe.name}`
                : "继续这顿饭"}
            </button>
          )}
          {currentBlocked && (
            <button onClick={() => go("settings")}>查看厨房设置</button>
          )}
          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                meal: null,
                cooking: null,
                timer:
                  s.timer?.id && s.meal.ids.includes(s.timer.id)
                    ? null
                    : s.timer,
              }))
            }
          >
            结束本次跟做
          </button>
        </aside>
      )}
      {!rows.length ? (
        <div className="empty">
          <ShoppingBasket size={36} />
          <h2>今天想吃点什么？</h2>
          <p>在菜谱旁点菜篮，喜欢的几道菜就能凑成一餐。</p>
          <button className="primary" onClick={() => go("search")}>
            去挑菜
          </button>
        </div>
      ) : (
        <>
          <MealPlanner rows={rows} state={state} setState={setState} go={go} canBegin={canBegin} />
          <section
            className="basket-prep-summary"
            aria-labelledby="basket-prep-title"
          >
            <p className="eyebrow">备料速览</p>
            <h2 id="basket-prep-title">
              {needed.length
                ? `清单未记 ${needed.length} 样`
                : "必需食材都已记录"}
            </h2>
            {needed.length > 0 && (
              <p className="basket-prep-names">
                {needed.map((i) => i.name).join("、")}
              </p>
            )}
            <p className="hint">按食材种类比对，开做前再看一眼用量。</p>
            {needed.length > 0 && (
              <button
                className="basket-copy-button"
                disabled={!canBegin || copyResult?.status === "pending"}
                aria-describedby={!canBegin ? "basket-copy-blocked" : undefined}
                onClick={copyShoppingList}
              >
                <Copy size={17} aria-hidden="true" />
                {copyStatus === "pending" ? "正在复制…" : "复制采购清单"}
              </button>
            )}
            {!canBegin && (
              <p className="hint" id="basket-copy-blocked">
                有菜不符合厨房设置，请先移出再复制或开做。
              </p>
            )}
            <p
              className="basket-copy-status"
              id="basket-copy-status"
              role="status"
              aria-live="polite"
            >
              {copyStatus === "copied" && "已复制，买菜时可以直接粘贴。"}
              {copyStatus === "fallback" &&
                "未能自动复制，请长按或全选下方文字后复制。"}
            </p>
            {copyStatus === "fallback" && (
              <div className="basket-copy-fallback">
                <label htmlFor="basket-shopping-text">采购清单文本</label>
                <textarea
                  id="basket-shopping-text"
                  ref={copyField}
                  readOnly
                  rows={8}
                  value={shoppingText}
                  spellCheck={false}
                  aria-describedby="basket-copy-status"
                />
              </div>
            )}
          </section>
          <ol className="basket-dishes">
            {rows.map((r, index) => (
              <li key={r.id}>
                <div className="basket-dish-heading">
                  <button
                    className="text-button"
                    onClick={() => go("recipe/" + r.id)}
                  >
                    {r.name}
                  </button>
                  {state.meal?.done.includes(r.id) && (
                    <span className="ready">
                      <Check size={16} />
                      已做完
                    </span>
                  )}
                  <button
                    aria-label={"移出菜篮" + r.name}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        basket: s.basket.filter((id) => id !== r.id),
                      }))
                    }
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="hint">
                  {r.servings} 人份 · 约 {r.minutes} 分钟 · {r.tools}
                </p>
                {dietaryWarnings(r, state.preferences).length > 0 && (
                  <p className="warning">
                    {dietaryWarnings(r, state.preferences).join("；")}
                    {!allowedRecipe(r, state.preferences) &&
                      "。请移出这道菜后再开始。"}
                  </p>
                )}
                <div className="basket-order">
                  <span>第 {index + 1} 道</span>
                  <button
                    disabled={index === 0}
                    aria-label={"提前做" + r.name}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={16} />
                    提前
                  </button>
                  <button
                    disabled={index === rows.length - 1}
                    aria-label={"延后做" + r.name}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={16} />
                    延后
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <h2>这一餐，一起备好</h2>
          <p className="hint">
            只是提醒，不用逐项打勾。每道菜的用量分别列出，按实际吃饭人数核对。
          </p>
          <div
            className="basket-prep-switch"
            role="group"
            aria-label="备料显示范围"
          >
            <button
              aria-pressed={prepView === "all"}
              aria-controls="basket-prep-list"
              onClick={() => setPrepView("all")}
            >
              全部备料
            </button>
            <button
              aria-pressed={prepView === "missing"}
              aria-controls="basket-prep-list"
              onClick={() => setPrepView("missing")}
            >
              只看缺料 · {needed.length}
            </button>
          </div>
          {prepView === "missing" && needed.length === 0 && (
            <p className="basket-prep-empty">
              清单里已记全必需食材，可切回全部备料核对用量。
            </p>
          )}
          <ul className="meal-ingredients" id="basket-prep-list">
            {visibleIngredients.map((i) => (
              <li key={i.name}>
                <div>
                  <FoodIcon name={i.name} />
                  <strong>{i.name}</strong>
                  {i.missing && <small className="missing">清单未记</small>}
                </div>
                <ul>
                  {i.uses.map((u) => (
                    <li key={u.recipe}>
                      <span>{u.recipe}</span>
                      <b>{u.amount}</b>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="hint">
            可省配料在各道菜中查看。清单未记也可以开做，请先确认手边用量足够。
          </p>
          {!active && (
            <button
              className="primary wide meal-start"
              disabled={!canBegin}
              onClick={begin}
            >
              <Play size={20} />
              一键开始做饭 · {rows.length} 道
            </button>
          )}
          <button className="text-button" onClick={() => go("search")}>
            再挑一道菜
          </button>
        </>
      )}
    </section>
  );
}
