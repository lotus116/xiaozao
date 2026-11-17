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
  resumeMealRecipe,
  restoreMealRecipe,
} from "./meal";
import { allowedRecipe, dietaryWarnings } from "./preferences";
import { FoodIcon } from "./Ingredients";
import "./basket-prep.css";
import MealPlanner from "./MealPlanner";
import { DishThumbnail } from "./DishPhoto";
export default function Basket({ state, setState, recipes, go }) {
  const [prepView, setPrepView] = useState("all");
  const [copyResult, setCopyResult] = useState(null);
  const copyPending = useRef(false);
  const copyField = useRef(null);
  const startDialog = useRef(null);
  const endDialog = useRef(null);
  const mealTimer = state.meal?.ids.includes(state.timer?.id) ? state.timer : null;
  const timedRecipe = mealTimer && recipes.find((r) => r.id === mealTimer.id);
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
  const resumeRecipe = active && resumeMealRecipe(state, recipes);
  const completed = active && state.meal.done.length === state.meal.ids.length;
  const removedMealRows = active ? basketRecipes(state.meal.ids.filter((id) => !state.basket.includes(id)), recipes) : [];
  const statusOf = (r) => !state.meal?.ids.includes(r.id) ? "下一餐"
    : state.meal.done.includes(r.id) ? "已完成"
    : state.cooking?.id === r.id && state.cooking.step < r.steps.length ? "正在做" : "待做";
  const progress = (r) => active && (
    <div className="basket-dish-progress">
      <span className={statusOf(r) === "已完成" ? "ready" : "hint"}>
        {statusOf(r) === "已完成" && <Check size={16} aria-hidden="true" />}{statusOf(r)}
      </span>
      {state.meal.done.includes(r.id) && <button aria-label={`恢复待做${r.name}`}
        onClick={() => setState((s) => restoreMealRecipe(s, r))}>恢复待做</button>}
    </div>
  );
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
    if (state.meal || (previous && state.cooking.step < previous.steps.length)) {
      startDialog.current.showModal();
      return;
    }
    beginNow();
  };
  return (
    <section className="browse basket-page">
      <dialog ref={startDialog} className="timer-dialog" aria-labelledby="basket-start-title">
        <h2 id="basket-start-title">从这份菜篮重新开始？</h2>
        <p>{state.meal ? "本餐完成记录将清空，按现在的菜篮开始新一餐。" : "当前单道菜的跟做进度和步骤计时会结束。"}菜篮、收藏和独立厨房计时保留。</p>
        <div className="chips">
          <button autoFocus onClick={() => startDialog.current.close()}>保留当前跟做</button>
          <button className="primary" onClick={() => { startDialog.current.close(); beginNow(); }}>确认，开始这顿饭</button>
        </div>
      </dialog>
      <dialog ref={endDialog} className="timer-dialog" aria-labelledby="end-meal-title">
        <h2 id="end-meal-title">结束这顿饭的跟做？</h2>
        <p>将清除本餐的步骤进度。{timedRecipe ? `${timedRecipe.name}的「${timedRecipe.steps[mealTimer.step]?.title || "步骤"}」计时也会结束。` : state.timer ? "独立厨房计时将继续。" : ""}</p>
        <div className="chips">
          <button autoFocus onClick={() => endDialog.current.close()}>取消，保留进度</button>
          <button onClick={() => {
            endDialog.current.close();
            setState((s) => ({ ...s, cooking: null, meal: null,
              timer: s.meal?.ids.includes(s.timer?.id) ? null : s.timer }));
          }}>{mealTimer ? "确认结束跟做及计时" : "确认结束跟做"}</button>
        </div>
      </dialog>
      <h1 tabIndex="-1">今天的菜篮</h1>
      {active && (
        <aside className="meal-progress">
          <p role="status" aria-atomic="true">
            已完成 {state.meal.done.length} / 共 {state.meal.ids.length} 道 · 剩余 {state.meal.ids.length - state.meal.done.length} 道
          </p>
          <p className="hint">调整菜篮只影响下一餐，本餐顺序保持不变。</p>
          {completed && <p>本餐已完成。可以恢复待做，或开始新的一餐。</p>}
          {!completed && (currentBlocked || !resumeRecipe) && (
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
                if (state.cooking.id !== resumeRecipe.id || state.cooking.step >= resumeRecipe.steps.length)
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
          {!completed && (currentBlocked || !resumeRecipe) && (
            <button onClick={() => go("settings")}>查看厨房设置</button>
          )}
          {completed && rows.length > 0 && <button className="primary" disabled={!canBegin} onClick={begin}>开始新的一餐 · {rows.length} 道</button>}
          <button onClick={() => endDialog.current.showModal()}>
            结束本次跟做
          </button>
          {removedMealRows.length > 0 && <details className="meal-retained">
            <summary>本餐另有 {removedMealRows.length} 道已移出下一餐菜篮</summary>
            <ul>{removedMealRows.map((r) => <li key={r.id}><span>{r.name}</span>{progress(r)}</li>)}</ul>
          </details>}
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
          <ol className="basket-dishes">
            {rows.map((r, index) => (
              <li key={r.id}>
                <div className="basket-dish-heading">
                  <button
                    className="text-button"
                    onClick={() => go("recipe/" + r.id)}
                  >
                    <DishThumbnail recipe={r} tile />
                    <span>{r.name}<small>{r.servings} 人份 · 约 {r.minutes} 分钟</small></span>
                  </button>
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
                {progress(r)}
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
          <section
            className="basket-prep-summary"
            aria-labelledby="basket-prep-title"
          >
            <h2 id="basket-prep-title">{needed.length ? `清单未记 ${needed.length} 样` : "必需食材都已记录"}</h2>
            {needed.length > 0 && <p className="basket-prep-names">{needed.slice(0, 5).map((i) => i.name).join("、")}{needed.length > 5 && " 等"}</p>}

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
          <MealPlanner rows={rows} state={state} setState={setState} go={go} canBegin={canBegin} />

          {!active && (
            <div className="basket-start-bar">
              <button
                className="primary wide meal-start"
                disabled={!canBegin}
                onClick={begin}
              >
                <Play size={20} />
                一键开始做饭 · {rows.length} 道
              </button>
            </div>
          )}
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
          <button className="text-button" onClick={() => go("search")}>
            再挑一道菜
          </button>
        </>
      )}
      <button className="text-button" onClick={() => go("pantry")}>去选今天的食材</button>
    </section>
  );
}
