import { DishThumbnail, DishPreview, hasDishPhoto } from "./DishPhoto";
import Source from "./RecipeSources";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  CookingPot,
  Carrot,
  BookOpen,
  Heart,
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  Clock,
  Search,
  Flame,
  Users,
  Leaf,
  Timer,
  X,
  ChefHat,
  Settings as SettingsIcon,
  ShoppingBasket,
} from "lucide-react";
import { recipes, catalog, seasonings } from "./recipes";
import {
  unique,
  missing,
  requiredCount,
  recommend,
  searchRecipes,
  cleanState,
  KEY,
} from "./logic";
import "./style.css";
import "./kitchen.css";
import Settings from "./Settings";
import IngredientPicker from "./IngredientPicker";
import IngredientInput from "./IngredientInput";
import PantryReset from "./PantryReset";
import { setupNative } from "./native";
import { addPantryInput } from "./pantry-input";
import { useKitchenNavigation, initialBrowseState } from "./navigation";
import TimerWidget from "./TimerWidget";
import Ingredients from "./Ingredients";
import Basket from "./Basket";
import Cooking from "./Cooking";
import { PreparationNotes, ChefNotes } from "./CookingNotes";
import {
  allowedRecipe,
  dietaryWarnings,
  categoryOf,
  categories,
} from "./preferences";
const load = () => {
  try {
    return cleanState(localStorage.getItem(KEY), recipes);
  } catch {
    return cleanState(null, recipes);
  }
};
setupNative().catch((error) =>
  console.error("Android navigation setup failed", error),
);
function Card({ r, state, go, fav, addToBasket }) {
  const miss = missing(r, state.pantry);
  return (
    <article className="recipe-row">
      <button className="recipe-open" onClick={() => go(`recipe/${r.id}`)}>
        <DishThumbnail recipe={r} />
        <span className="recipe-copy">
          <strong>{r.name}</strong>
          <span className="meta">
            {r.minutes} 分钟 · {r.level === 1 ? "简单" : "需练习"} ·{" "}
            {r.servings} 人份 · 必需 {requiredCount(r)} 样
          </span>
          <span className={miss.length ? "missing" : "ready"}>
            {miss.length
              ? `还缺 ${miss.length} 样：${miss.join("、")}`
              : "可以做，必需食材齐全"}
          </span>
          {r.ingredients.some(
            (i) => i.optional && !state.pantry.includes(i.name),
          ) && (
            <span className="meta">
              可省：
              {r.ingredients
                .filter((i) => i.optional && !state.pantry.includes(i.name))
                .map((i) => i.name)
                .join("、")}
            </span>
          )}
          {dietaryWarnings(r, state.preferences).length > 0 && (
            <span className="missing">
              {dietaryWarnings(r, state.preferences).join("；")}
            </span>
          )}
        </span>
      </button>
      <div className="recipe-actions">
        <button
          className={`favorite ${state.favorites.includes(r.id) ? "saved" : ""}`}
          aria-label={`${state.favorites.includes(r.id) ? "取消收藏" : "收藏"}${r.name}`}
          aria-pressed={state.favorites.includes(r.id)}
          onClick={() => fav(r.id)}
        >
          <Heart size={20} />
        </button>
        <button
          className={
            "basket-add " + (state.basket.includes(r.id) ? "selected" : "")
          }
          aria-label={
            (state.basket.includes(r.id) ? "移出菜篮" : "加入菜篮") + r.name
          }
          aria-pressed={state.basket.includes(r.id)}
          onClick={() => addToBasket(r.id)}
        >
          <ShoppingBasket size={21} />
        </button>
      </div>
    </article>
  );
}
function App() {
  const [browse, setBrowse] = useState(initialBrowseState);
  const { query, category, max, level, fewIngredients, photosOnly } = browse;
  const setFilter = (key, value) => setBrowse((s) => ({ ...s, [key]: typeof value === "function" ? value(s[key]) : value }));
  const setQuery = (value) => setFilter("query", value);
  const setCategory = (value) => setFilter("category", value);
  const setMax = (value) => setFilter("max", value);
  const setLevel = (value) => setFilter("level", value);
  const setFewIngredients = (value) => setFilter("fewIngredients", value);
  const { hash, go, backToList } = useKitchenNavigation(browse, setBrowse);
  const switchDialog = useRef(null);
  const timerDialog = useRef(null);
  const [pendingRecipe, setPendingRecipe] = useState(null);
  useEffect(() => {
    if (pendingRecipe) switchDialog.current?.showModal();
  }, [pendingRecipe]);
  const [state, setState] = useState(load),
    [storageError, setStorageError] = useState(false),
    [input, setInput] = useState(""),
    [message, setMessage] = useState(""),
    [clearedIngredients, setClearedIngredients] = useState([]),
    [resetMessage, setResetMessage] = useState(null),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!state.timer) return;
    setNow(Date.now());
    const refresh = () => setNow(Date.now());
    const t = setInterval(refresh, 500);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [state.timer]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, version: 3 }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  const toggle = (name) =>
    setState((s) => ({
      ...s,
      pantry: s.pantry.includes(name)
        ? s.pantry.filter((x) => x !== name)
        : unique([...s.pantry, name]),
    }));
  const add = (e) => {
    e.preventDefault();
    const result = addPantryInput(state.pantry, input);
    if (!result.added.length && !result.duplicate.length && !result.rejected.length) return;
    const unknown = result.added.filter((name) => !catalog.includes(name));
    const feedback = [
      result.added.length ? `已添加${result.added.join("、")}` : "",
      result.duplicate.length ? `${result.duplicate.join("、")}已经在清单里了` : "",
      unknown.length ? "部分食材在当前菜谱库可能暂未收录相关菜" : "",
      result.rejected.length ? "部分内容未添加：每样最多 30 字，清单最多 200 样" : "",
    ].filter(Boolean).join("；");
    setMessage(feedback);
    setState((s) => ({ ...s, pantry: result.pantry }));
    setInput(result.rejected.join("、"));
  };
  const clearIngredients = () => {
    const fresh = state.pantry.filter((name) => !seasonings.includes(name));
    if (!fresh.length) return;
    setClearedIngredients((previous) => unique([...previous, ...fresh]));
    const pantry = state.pantry.filter((name) => seasonings.includes(name));
    setState((s) => ({ ...s, pantry }));
    setResetMessage({ pantry, text: "本次食材已清空，调料和已选菜都保留。可撤销。" });
  };
  const undoClear = () => {
    const restored = addPantryInput(state.pantry, clearedIngredients.join("、"));
    setState((s) => ({ ...s, pantry: restored.pantry }));
    setClearedIngredients(restored.rejected);
    setResetMessage({ pantry: restored.pantry, text: restored.rejected.length
      ? `已恢复 ${restored.added.length} 样；清单已满，还有 ${restored.rejected.length} 样未恢复。移除部分食材后可再撤销。`
      : "已恢复清空的食材，后来添加的食材和调料也保留。" });
  };
  const resetControls = <PantryReset
    count={state.pantry.filter((name) => !seasonings.includes(name)).length}
    canUndo={clearedIngredients.length > 0}
    message={resetMessage?.pantry === state.pantry ? resetMessage.text : ""}
    onClear={clearIngredients}
    onUndo={undoClear}
  />;
  const fav = (id) =>
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }));
  const addToBasket = (id) =>
    setState((s) => ({
      ...s,
      basket: s.basket.includes(id)
        ? s.basket.filter((x) => x !== id)
        : [...s.basket, id],
    }));
  const visibleRecipes = recipes.filter((r) =>
    allowedRecipe(r, state.preferences),
  );
  const heroRecipe = visibleRecipes.find((r) => hasDishPhoto(r.id));
  const selectedRecipes = visibleRecipes.filter(
    (r) => categoryOf(r) === category,
  );
  const rec = recommend(selectedRecipes, state.pantry);
  const [page, id] = hash.replace("#", "").split("/");
  const recipe = recipes.find((r) => r.id === id);
  const cooking = state.cooking;
  const active = recipes.find((r) => r.id === cooking?.id);
  const beginRecipe = (r, replace = false) => {
    setState((s) => {
      if (s.cooking?.id === r.id) return s;
      const inMeal = !replace && s.meal?.ids.includes(r.id);
      return {
        ...s,
        meal: inMeal ? s.meal : null,
        cooking: { id: r.id, step: inMeal && s.meal.done.includes(r.id) ? r.steps.length : -1 },
        timer: replace && s.timer?.id ? null : s.timer,
      };
    });
    go(`cook/${r.id}`);
  };
  const start = (r) => {
    const different = cooking && cooking.id !== r.id;
    const ongoing = state.meal || (active && cooking.step < active.steps.length);
    if (different && ongoing && !state.meal?.ids.includes(r.id)) {
      setPendingRecipe(r);
      return;
    }
    beginRecipe(r);
  };
  const empty = (title, text) => (
    <div className="empty">
      <CookingPot size={34} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="text-button" onClick={() => go("search")}>
        去找菜谱 <ArrowRight size={16} />
      </button>
    </div>
  );
  const chip = (name) => (
    <button
      key={name}
      aria-pressed={state.pantry.includes(name)}
      onClick={() => toggle(name)}
      className={`chip ${state.pantry.includes(name) ? "selected" : ""}`}
    >
      {state.pantry.includes(name) ? <Check size={15} /> : <Plus size={15} />}{" "}
      {name}
    </button>
  );
  return (
    <>
      <header>
        <a className="brand" href="#pantry">
          <CookingPot size={27} />
          <span>小灶</span>
          <small>今天，自己做饭</small>
        </a>
        <span className="local-note">不用登录 · 存在本机</span>
      </header>
      <main id="main">
        {storageError && (
          <p role="alert" className="warning">
            浏览器未允许保存。当前仍可使用，但关闭页面后可能丢失清单。
          </p>
        )}
        {page === "pantry" && (
          <>
            <div className="hero">
              <div>
                <p className="eyebrow">从手边的食材开始</p>
                <h1 tabIndex="-1">
                  今天这顿，
                  <br />
                  我们慢慢做好。
                </h1>
                <p>
                  告诉小灶厨房里有什么，
                  <br className="mobile-break" /> 找一道会做、想吃的家常菜。
                </p>
              </div>
              {heroRecipe && <button className="hero-photo" onClick={() => go("recipe/" + heroRecipe.id)}>
                <DishThumbnail recipe={heroRecipe} eager /><span>{heroRecipe.name} ›</span>
              </button>}
            </div>
            {active && (
              <button
                className="resume"
                onClick={() => go(`cook/${active.id}`)}
              >
                <ChefHat size={22} />
                <span>
                  继续做 {active.name}
                  <small>
                    {cooking.step < 0
                      ? "正在备料"
                      : cooking.step >= active.steps.length
                        ? "已完成"
                        : "第 " + (cooking.step + 1) + " 步"}
                  </small>
                </span>
                <ArrowRight size={20} />
              </button>
            )}
            <div className="workspace">
              <section className="pantry-panel">
                <div className="section-title">
                  <h2>我的食材</h2>
                  <span>
                    {state.pantry.filter((n) => !seasonings.includes(n)).length}{" "}
                    样已添加
                  </span>
                </div>
                <form onSubmit={add}>
                  <label htmlFor="ingredient">添加厨房里已有的食材</label>
                  <IngredientInput value={input} onChange={setInput} catalog={catalog} />
                </form>
                <p className="live-message" role="status">
                  {message || "多样食材用顿号、逗号或空格隔开；支持别名，自动去重。"}
                </p>
                {state.pantry.filter((n) => !seasonings.includes(n)).length >
                  0 && (
                  <div className="selected-list">
                    {state.pantry
                      .filter((n) => !seasonings.includes(n))
                      .map((n) => (
                        <button
                          className="chip selected"
                          key={n}
                          onClick={() => toggle(n)}
                          aria-label={`移除${n}`}
                        >
                          {n}
                          <X size={14} />
                        </button>
                      ))}
                  </div>
                )}
                <IngredientPicker
                  frequent={state.frequentIngredients}
                  pantry={state.pantry}
                  toggle={toggle}
                  onChange={(names) =>
                    setState((s) => ({ ...s, frequentIngredients: names }))
                  }
                />
                <div className="seasoning-title">
                  <h2>常备调料 · 自动记住</h2>
                  <p>选一次，下次直接用；用完或补货时再修改。</p>
                </div>
                <details>
                  <summary>
                    管理常备调料（已记住{" "}
                    {state.pantry.filter((n) => seasonings.includes(n)).length}{" "}
                    样）
                  </summary>
                  <div className="chips">{seasonings.map(chip)}</div>
                </details>
                {resetControls}
                <button
                  className="primary find-button"
                  onClick={() =>
                    document
                      .getElementById("recommendations")
                      ?.scrollIntoView({ behavior: "auto" })
                  }
                >
                  看看能做什么 <ArrowRight size={18} />
                </button>
              </section>
              <section className="recommendations" id="recommendations">
                <div className="section-title">
                  <h2>今晚可以做</h2>
                  <span>按简单、快捷排序</span>
                </div>
                <CategoryTabs category={category} setCategory={setCategory} />
                <p className="hint">
                  可省的增香配料不影响“可以做”，必需缺料仍会列出。请核对用量。
                </p>
                <p className="hint">
                  饮食设置已隐藏 {recipes.length - visibleRecipes.length} 道菜。
                  <a href="#settings">管理偏好</a>
                </p>
                {!state.pantry.length ? (
                  empty(
                    "先打开你的食材清单",
                    "选几样手边食材和调料，推荐会出现在这里。",
                  )
                ) : (
                  <>
                    <h3 className="group-title">
                      <span className="dot" />
                      现在可以做 <span>{rec.ready.length}</span>
                    </h3>
                    {rec.ready.length ? (
                      rec.ready.map((r) => (
                        <Card
                          key={r.id}
                          r={r}
                          state={state}
                          go={go}
                          fav={fav}
                          addToBasket={addToBasket}
                        />
                      ))
                    ) : (
                      <p className="quiet">
                        还没有完全齐全的菜，看看下面还差什么。
                      </p>
                    )}
                    <h3 className="group-title near">
                      再添 1–2 样 <span>{rec.near.length}</span>
                    </h3>
                    {rec.near.length
                      ? rec.near.map((r) => (
                          <Card
                            key={r.id}
                            r={r}
                            state={state}
                            go={go}
                            fav={fav}
                            addToBasket={addToBasket}
                          />
                        ))
                      : empty(
                          "暂时没有近似搭配",
                          "已核对的菜谱中，还需要更多食材或调料。可以补充清单，也可以先浏览菜谱。",
                        )}
                  </>
                )}
                <aside className="note">
                  <Leaf size={20} />
                  <p>
                    一餐的小提醒
                    <br />
                    <span>菜谱之外，也记得看看有没有蔬菜和主食。</span>
                  </p>
                </aside>
                <p className="catalog-note">
                  目前收录 {recipes.length}{" "}
                  道家常菜笔记。各菜来源与核对范围见详情，尚未下厨试做。
                </p>
              </section>
            </div>
          </>
        )}
        {["search", "favorites"].includes(page) && (
          <section className="browse">
            <p className="eyebrow">把下一顿也安排好</p>
            <h1 tabIndex="-1">
              {page === "search" ? "找一道想吃的菜" : "我的收藏"}
            </h1>
            <p>
              {page === "search"
                ? `${recipes.length} 道家常菜，从熟悉的味道开始。`
                : "喜欢的味道，留着下次再做。"}
            </p>
            <CategoryTabs category={category} setCategory={setCategory} />
            <p className="hint">
              当前只看{categories[category]}。饮食设置已隐藏{" "}
              {recipes.length - visibleRecipes.length} 道菜。
            </p>
            <label className="searchbox">
              <Search size={20} />
              <input
                aria-label="搜索菜谱"
                placeholder="搜索菜名或食材，如西红柿"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="filters">
              <button
                aria-pressed={fewIngredients}
                onClick={() => setFewIngredients((v) => !v)}
                className={fewIngredients ? "chip selected" : "chip"}
              >
                少配料 · 5 样以内
              </button>
              <button className={photosOnly ? "chip selected" : "chip"} aria-pressed={photosOnly}
                onClick={() => setFilter("photosOnly", !photosOnly)}>有成品实拍</button>
              <label>
                用时
                <select value={max} onChange={(e) => setMax(e.target.value)}>
                  <option value="all">不限时间</option>
                  <option value="15">15 分钟内</option>
                  <option value="30">30 分钟内</option>
                </select>
              </label>
              <label>
                难度
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="0">不限难度</option>
                  <option value="1">简单</option>
                  <option value="2">需练习</option>
                </select>
              </label>
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setMax("all");
                  setLevel("0");
                  setFewIngredients(false);
                  setFilter("photosOnly", false);
                }}
              >
                重置筛选
              </button>
            </div>
            {(() => {
              const matches = searchRecipes(
                visibleRecipes,
                query,
                max === "all" ? Infinity : Number(max),
                Number(level),
              ).filter(
                (r) =>
                  (page !== "favorites" || state.favorites.includes(r.id)) &&
                  (!fewIngredients || requiredCount(r) <= 5) && (!photosOnly || hasDishPhoto(r.id)),
              );
              const list = matches.filter((r) => categoryOf(r) === category);
              const otherCategories = !list.length && query.trim()
                ? [...new Set(matches.map(categoryOf))]
                : [];
              return list.length ? (
                <>
                  <p className="hint">找到 {list.length} 道菜</p>
                  {list.map((r) => (
                    <Card
                      key={r.id}
                      r={r}
                      state={state}
                      go={go}
                      fav={fav}
                      addToBasket={addToBasket}
                    />
                  ))}
                </>
              ) : (
                <div className="empty">
                  <BookOpen size={32} />
                  <h3>
                    {page === "favorites"
                      ? "这里还没有符合条件的收藏"
                      : "暂时没找到这道菜"}
                  </h3>
                  {otherCategories.length ? <div className="chips">
                    {otherCategories.map((key) => <button key={key} onClick={() => setCategory(key)}>
                      在{categories[key]}中查看（{matches.filter((r) => categoryOf(r) === key).length}）
                    </button>)}
                  </div> : <p>试试“鸡蛋”或清除筛选。</p>}
                  <button
                    onClick={() => {
                      setQuery("");
                      setMax("all");
                      setLevel("0");
                      setFewIngredients(false);
                      setFilter("photosOnly", false);
                      go("search");
                    }}
                  >
                    浏览全部菜谱
                  </button>
                </div>
              );
            })()}
          </section>
        )}
        {page === "basket" && (
          <Basket state={state} setState={setState} recipes={recipes} go={go} resetControls={resetControls} />
        )}
        {page === "settings" && (
          <Settings state={state} setState={setState} seasonings={seasonings} />
        )}
        {["recipe", "cook"].includes(page) &&
          recipe &&
          !allowedRecipe(recipe, state.preferences) && (
            <section className="browse">
              <h1 tabIndex="-1">这道菜已被饮食设置排除</h1>
              <p className="warning">
                {dietaryWarnings(recipe, state.preferences).join("；")}
              </p>
              <button onClick={() => go("search")}>找其他菜谱</button>
              <button onClick={() => go("settings")}>查看饮食设置</button>
            </section>
          )}
        {page === "recipe" &&
          recipe &&
          allowedRecipe(recipe, state.preferences) && (
            <section className="detail">
              <button className="text-button" onClick={backToList}>
                <ArrowLeft size={18} /> 返回菜谱
              </button>
              <div className="dish-heading">
                <div>
                  <p className="eyebrow">家常的一道，认真做好</p>
                  <h1 tabIndex="-1">{recipe.name}</h1>
                  <p>{recipe.description}</p>
                </div>
                <DishPreview key={recipe.id} recipe={recipe} />
              </div>
              <div className="facts">
                <span>
                  <Clock size={18} />
                  {recipe.minutes} 分钟
                </span>
                <span>
                  <Users size={18} />
                  {recipe.servings} 人份
                </span>
                <span>
                  <Flame size={18} />
                  {recipe.level === 1 ? "简单" : "需练习"}
                </span>
              </div>
              <p className="hint">
                {recipe.timeNote || "用时含原作者备料估计；新手可能更久。"}{" "}
                {recipe.servingsNote || "标准份数保持原配方。"}
              </p>
              <div className="detail-actions">
                <button
                  aria-pressed={state.basket.includes(recipe.id)}
                  onClick={() => addToBasket(recipe.id)}
                >
                  <ShoppingBasket size={20} />
                  {state.basket.includes(recipe.id)
                    ? "已加入菜篮"
                    : "加入今天的菜篮"}
                </button>
                <button className="primary" onClick={() => start(recipe)}>
                  看看备料，开始做 <ArrowRight size={18} />
                </button>
                <button
                  aria-pressed={state.favorites.includes(recipe.id)}
                  onClick={() => fav(recipe.id)}
                >
                  <Heart size={18} />
                  {state.favorites.includes(recipe.id) ? "已收藏" : "收藏"}
                </button>
              </div>
              {dietaryWarnings(recipe, state.preferences).length > 0 && (
                <p className="warning">
                  {dietaryWarnings(recipe, state.preferences).join("；")}
                </p>
              )}
              <h2>先看看用量</h2>
              <p className="warning">
                {missing(recipe, state.pantry).length
                  ? `清单还缺：${missing(recipe, state.pantry).join("、")}。备齐后再开火。`
                  : "食材种类齐全。请再核对实际重量是否够用。"}
              </p>
              <Ingredients r={recipe} />
              <p className="hint">
                1 茶匙 = 5 毫升，1 汤匙 = 15 毫升。杯量按约 240
                毫升；少量盐按口味酌加。
              </p>
              <h2>需要的厨具</h2>
              <p>{recipe.tools}</p>
              <PreparationNotes recipe={recipe} />
              <ChefNotes recipe={recipe} />
              <h2>怎么做</h2>
              <ol className="step-preview">
                {recipe.steps.map((st) => (
                  <li key={st.title}>
                    <strong>{st.title}</strong>
                    <p>{st.text}</p>
                  </li>
                ))}
              </ol>
              <h2>每份营养参考</h2>
              {recipe.nutrition ? (
                <>
                  <div className="nutrition">
                    {["热量", "蛋白质", "碳水", "脂肪"].map((n, index) => (
                      <div key={n}>
                        <strong>
                          {recipe.nutrition[index]}
                          <small>{index === 0 ? " kcal" : " g"}</small>
                        </strong>
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                  <p className="hint">
                    原作者按上述 {recipe.servings}{" "}
                    份配方估算，非实测。品牌、实际用量及可选配料会造成差异；不含另外搭配的米饭或配菜。
                  </p>
                </>
              ) : (
                <p className="hint">
                  暂无可靠估算。当前来源数据未完成一致性核对，不以猜测数字代替。
                </p>
              )}
              <aside className="note">
                <Leaf size={20} />
                <p>
                  {recipe.vegetable
                    ? "这道菜包含蔬菜。再看看这一餐是否搭配了主食和蛋白质食物。"
                    : "这道菜的主要用料不是蔬菜，可以再搭配一盘蔬菜。"}
                  <small>依据菜谱食材分类的搭配提醒。</small>
                </p>
              </aside>
              <Source r={recipe} />
            </section>
          )}
        {page === "cook" &&
          recipe &&
          allowedRecipe(recipe, state.preferences) && (
            <Cooking
              recipe={recipe}
              state={state}
              setState={setState}
              recipes={recipes}
              go={go}
              start={start}
              now={now}
              openTimer={() => timerDialog.current?.showModal()}
            />
          )}
        {![
          "pantry",
          "search",
          "favorites",
          "recipe",
          "cook",
          "recommendations",
          "settings",
          "basket",
        ].includes(page) ||
        (["recipe", "cook"].includes(page) && !recipe)
          ? empty("没有找到这个页面", "回到找菜谱，重新选一道菜吧。")
          : null}
        {page === "recommendations" && (
          <Redirect
            go={() => {
              go("pantry");
              setTimeout(
                () =>
                  document.getElementById("recommendations")?.scrollIntoView(),
                50,
              );
            }}
          />
        )}
      </main>
      <dialog ref={switchDialog} className="timer-dialog" aria-labelledby="switch-title"
        onClose={() => setPendingRecipe(null)}>
        <h2 id="switch-title">换一道菜开始？</h2>
        <p>正在跟做的{state.meal ? "这一餐" : active?.name}会结束，当前跟做进度和菜谱步骤计时会清除。菜篮、收藏和独立厨房计时保留。</p>
        <div className="chips">
          <button autoFocus onClick={() => switchDialog.current.close()}>保留当前进度</button>
          <button className="primary" onClick={() => {
            const next = pendingRecipe;
            switchDialog.current.close();
            if (next) beginRecipe(next, true);
          }}>确认，开始{pendingRecipe?.name}</button>
        </div>
      </dialog>
      <TimerWidget
        dialogRef={timerDialog}
        timer={state.timer}
        dock={state.timerDock}
        setDock={(dock) => setState((s) => ({ ...s, timerDock: dock }))}
        now={now}
        recipes={recipes}
        setTimer={(timer) => setState((s) => ({ ...s, timer }))}
      />
      <nav aria-label="主要导航">
        {[
          ["pantry", Carrot, "我的食材"],
          ["search", BookOpen, "找菜谱"],
          ["favorites", Heart, "收藏"],
          ["basket", ShoppingBasket, "菜篮"],
          ["settings", SettingsIcon, "设置"],
        ].map(([p, Icon, label]) => (
          <a
            key={p}
            href={`#${p}`}
            aria-current={page === p ? "page" : undefined}
            className={page === p ? "active" : ""}
          >
            <Icon size={22} />
            <span>
              {label}
              {p === "basket" && state.basket.length > 0 && (
                <b className="basket-count">{state.basket.length}</b>
              )}
            </span>
          </a>
        ))}
      </nav>
    </>
  );
}
function CategoryTabs({ category, setCategory }) {
  return (
    <div className="category-tabs" aria-label="菜谱分类">
      {Object.entries(categories).map(([id, label]) => (
        <button
          key={id}
          aria-pressed={category === id}
          onClick={() => setCategory(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
function Redirect({ go }) {
  useEffect(go, []);
  return null;
}
createRoot(document.getElementById("root")).render(<App />);
