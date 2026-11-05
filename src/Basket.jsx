import React from "react";
import {
  ShoppingBasket,
  ArrowUp,
  ArrowDown,
  X,
  Play,
  Check,
} from "lucide-react";
import { basketRecipes, canStartMeal, mealIngredients } from "./meal";
import { allowedRecipe, dietaryWarnings } from "./preferences";
import { FoodIcon } from "./Ingredients";
export default function Basket({ state, setState, recipes, go }) {
  const rows = basketRecipes(state.basket, recipes);
  const ingredients = mealIngredients(rows, state.pantry);
  const active = state.meal && state.cooking;
  const move = (index, delta) =>
    setState((s) => {
      const basket = [...s.basket];
      [basket[index], basket[index + delta]] = [
        basket[index + delta],
        basket[index],
      ];
      return { ...s, basket };
    });
  const begin = () => {
    if (!canStartMeal(state.basket, recipes, state.preferences)) return;
    const ids = rows.map((r) => r.id);
    setState((s) => ({
      ...s,
      meal: { ids, done: [] },
      cooking: { id: ids[0], step: 0 },
    }));
    go("cook/" + ids[0]);
  };
  return (
    <section className="browse basket-page">
      <p className="eyebrow">选好菜，再一起开火</p>
      <h1 tabIndex="-1">今天的菜篮</h1>
      <p>放进今天想做的菜，备料集中看。按下面的顺序，一道接着一道做。</p>
      {active && (
        <aside className="meal-progress">
          <p>
            这餐已完成 {state.meal.done.length} / {state.meal.ids.length}{" "}
            道。调整菜篮只影响下一餐，正在做的顺序保持不变。
          </p>
          <button
            className="primary"
            onClick={() => go("cook/" + state.cooking.id)}
          >
            继续这顿饭
          </button>
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
          <ul className="meal-ingredients">
            {ingredients.map((i) => (
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
              disabled={!canStartMeal(state.basket, recipes, state.preferences)}
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
