import React, { useRef, useState } from "react";
import {
  Apple,
  ArrowDown,
  ArrowUp,
  Bean,
  Beef,
  Carrot,
  Check,
  Egg,
  Fish,
  GripVertical,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Wheat,
  X,
} from "lucide-react";
import { catalog, seasonings } from "./recipes";
import { normalize, unique } from "./logic";
import {
  defaultFrequentIngredients,
  ingredientGroup,
  ingredientGroups,
  moveIngredient,
} from "./ingredient-groups";
import "./ingredient-picker.css";

const icons = {
  apple: Apple,
  bean: Bean,
  beef: Beef,
  carrot: Carrot,
  egg: Egg,
  fish: Fish,
  package: Package,
  wheat: Wheat,
};

export default function IngredientPicker({
  frequent,
  pantry,
  onChange,
  toggle,
}) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState("vegetables");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const drag = useRef(null);
  const available = unique([...catalog, ...pantry, ...frequent]).filter(
    (n) => !seasonings.includes(n),
  );
  const candidates = available.filter(
    (n) =>
      (!editing || !frequent.includes(n)) &&
      (query.trim()
        ? n.includes(normalize(query))
        : ingredientGroup(n) === category),
  );
  const update = (next, text) => {
    onChange(next);
    setAnnouncement(text);
  };
  const move = (name, offset) => {
    const from = frequent.indexOf(name),
      to = from + offset;
    update(moveIngredient(frequent, from, to), `${name}已移到第 ${to + 1} 位`);
  };
  const finishDrag = (event, cancel = false) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    if (!cancel && d.target && d.target !== d.name) {
      const next = moveIngredient(
        frequent,
        frequent.indexOf(d.name),
        frequent.indexOf(d.target),
      );
      update(next, `${d.name}已移到第 ${next.indexOf(d.name) + 1} 位`);
    }
    drag.current = null;
    setDragging(null);
    setDropTarget(null);
  };
  const select = (name) => (
    <button
      key={name}
      className={`chip ${pantry.includes(name) ? "selected" : ""}`}
      aria-pressed={pantry.includes(name)}
      onClick={() => toggle(name)}
    >
      {name}
      {pantry.includes(name) ? <Check size={14} /> : <Plus size={14} />}
    </button>
  );
  return (
    <div className="ingredient-picker">
      <div className="frequent-heading">
        <div>
          <h3>常用食材</h3>
          <p className="hint">
            {editing
              ? "拖动把手调整顺序，改完自动保存。"
              : "点一下加入今天的食材，顺序按你的习惯。"}
          </p>
        </div>
        <button
          className="manage-frequent"
          aria-expanded={editing}
          onClick={() => {
            setEditing(!editing);
            setQuery("");
          }}
        >
          {editing ? <Check size={17} /> : <SlidersHorizontal size={17} />}
          {editing ? "完成管理" : "管理常用"}
        </button>
      </div>
      {editing ? (
        <>
          <ol className="frequent-editor" aria-label="常用食材排序">
            {frequent.map((name, index) => (
              <li
                key={name}
                data-frequent-name={name}
                className={`${dragging === name ? "dragging" : ""} ${dropTarget === name ? "drop-target" : ""}`}
              >
                <button
                  className="drag-handle"
                  aria-label={`拖动排序${name}`}
                  aria-describedby="drag-help"
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" && index > 0) {
                      e.preventDefault();
                      move(name, -1);
                    }
                    if (e.key === "ArrowDown" && index < frequent.length - 1) {
                      e.preventDefault();
                      move(name, 1);
                    }
                  }}
                  onPointerDown={(e) => {
                    if (!e.isPrimary || e.button !== 0) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drag.current = {
                      name,
                      pointerId: e.pointerId,
                      target: name,
                    };
                    setDragging(name);
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d || d.pointerId !== e.pointerId) return;
                    // Scroll the page near the edges while retaining pointer capture.
                    if (e.clientY < 85) window.scrollBy(0, -14);
                    else if (e.clientY > window.innerHeight - 95)
                      window.scrollBy(0, 14);
                    const row = document
                      .elementFromPoint(e.clientX, e.clientY)
                      ?.closest("[data-frequent-name]");
                    d.target = row?.dataset.frequentName || null;
                    setDropTarget(d.target);
                  }}
                  onPointerUp={(e) => finishDrag(e)}
                  onPointerCancel={(e) => finishDrag(e, true)}
                  onLostPointerCapture={(e) => finishDrag(e, true)}
                >
                  <GripVertical size={20} />
                </button>
                <span className="frequent-name">
                  <span>{index + 1}</span>
                  {name}
                </span>
                <button
                  aria-label={`上移${name}`}
                  disabled={index === 0}
                  onClick={() => move(name, -1)}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  aria-label={`下移${name}`}
                  disabled={index === frequent.length - 1}
                  onClick={() => move(name, 1)}
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  aria-label={`取消常用${name}`}
                  onClick={() =>
                    update(
                      frequent.filter((n) => n !== name),
                      `已取消常用${name}，今天的食材不变`,
                    )
                  }
                >
                  <X size={17} />
                </button>
              </li>
            ))}
          </ol>
          <p id="drag-help" className="hint">
            也可以点上下箭头；把手支持键盘方向键。移出常用不会删除今天的食材。
          </p>
          <button
            className="text-button"
            onClick={() =>
              update([...defaultFrequentIngredients], "已恢复默认常用食材")
            }
          >
            恢复默认常用食材
          </button>
        </>
      ) : (
        <div className="chips frequent-chips" aria-label="常用食材">
          {frequent.map(select)}
        </div>
      )}
      {!frequent.length && (
        <p className="hint">还没有常用食材，点“管理常用”添加你经常买的食材。</p>
      )}
      <details
        className="ingredient-categories"
        open={editing ? true : undefined}
      >
        <summary>{editing ? "添加到常用食材" : "更多食材 · 按分类找"}</summary>
        <label className="ingredient-search">
          <Search size={17} />
          <input
            type="search"
            aria-label="查找食材"
            placeholder="找食材，如豆腐、排骨"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="ingredient-category-tabs" aria-label="食材分类">
          {ingredientGroups.map((g) => {
            const Icon = icons[g.icon];
            return (
              <button
                key={g.id}
                aria-pressed={!query.trim() && category === g.id}
                onClick={() => {
                  setCategory(g.id);
                  setQuery("");
                }}
              >
                <Icon size={18} />
                {g.label}
              </button>
            );
          })}
        </div>
        <p className="ingredient-results">
          {query.trim()
            ? `“${query.trim()}”的搜索结果`
            : ingredientGroups.find((g) => g.id === category).label}{" "}
          · {candidates.length} 样
        </p>
        <div className="chips category-ingredients">
          {candidates.map((name) =>
            editing ? (
              <button
                className="chip"
                key={name}
                aria-label={`设为常用${name}`}
                onClick={() =>
                  update([...frequent, name], `已将${name}加入常用`)
                }
              >
                {name}
                <Plus size={14} />
              </button>
            ) : (
              select(name)
            ),
          )}
        </div>
        {!candidates.length && (
          <p className="hint">
            {editing
              ? "没有其他匹配食材。自定义食材可以先在上方输入添加，再设为常用。"
              : "没有找到，试试上方输入框添加自定义食材。"}
          </p>
        )}
      </details>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}
