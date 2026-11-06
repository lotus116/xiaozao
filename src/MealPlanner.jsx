import React, { useRef, useState } from "react";
import { ListOrdered, Undo2 } from "lucide-react";
import { applyBasketOrder, planMeal } from "./meal-planning.js";
import "./meal-planner.css";

const sameOrder = (a, b) => a.length === b.length && a.every((id, index) => id === b[index]);
const kindLabels = { marinate: "先腌制", soak: "先泡发", "rice-cooker": "先看电饭锅", other: "先备好" };

function Preparation({ items, go }) {
  return <>
    {items.length > 0 ? (
      <ul className="meal-advance-list">
        {items.map((item, index) => (
          <li key={`${item.recipe.id}-${index}`}>
            <p><span className="meal-plan-tag">{kindLabels[item.kind]}</span> <strong>{item.recipe.name}</strong></p>
            <p>{item.text}</p>
            <details className="meal-plan-evidence">
              <summary>查看准备依据 · {item.recipe.name}</summary>
              <p>第 {item.step + 1} 步「{item.recipe.steps[item.step].title}」：{item.quote}</p>
              <button className="text-button" onClick={() => go("recipe/" + item.recipe.id)}>查看{item.recipe.name}完整做法</button>
            </details>
          </li>
        ))}
      </ul>
    ) : <p className="hint">暂未记录这几道菜明确的腌制、泡发或电饭锅提醒，不代表不需要备料。开火前仍请看各道完整做法。</p>}
    {!items.some((item) => item.kind === "rice-cooker") && <p className="hint">如果这餐另外配米饭、手边还没有熟饭，可先按电饭锅说明煮饭；这份额外米饭不在菜篮估时内。</p>}
    <p className="hint">提醒不会自动完成步骤或启动计时。已做过的准备直接跳过，不要重复腌制或启动电饭锅。</p>
  </>;
}

export default function MealPlanner({ rows, state, setState, go, canBegin }) {
  const [preview, setPreview] = useState(null);
  const [undo, setUndo] = useState(null);
  const [message, setMessage] = useState(null);
  const trigger = useRef(null);
  const previewTitle = useRef(null);
  const current = planMeal(rows);
  const stale = preview && !sameOrder(preview.sourceIds, state.basket);
  const canUndo = undo && sameOrder(undo.after, state.basket);
  const showPreview = () => {
    setPreview({ ...current, sourceIds: [...state.basket] });
    setMessage(null);
    // Wait for the inline region to mount, then put keyboard users at its title.
    requestAnimationFrame(() => previewTitle.current?.focus({ preventScroll: true }));
  };
  const closePreview = () => {
    setPreview(null);
    trigger.current?.focus({ preventScroll: true });
  };
  const adopt = () => {
    if (!preview || stale || !canBegin) return;
    setState((s) => applyBasketOrder(s, preview.sourceIds, preview.ids));
    setUndo(preview.changed ? { before: preview.sourceIds, after: preview.ids } : null);
    setMessage({ ids: preview.ids, text: preview.changed ? "已采用建议顺序。还可以用下方的提前、延后按钮调整。" : "已保留当前顺序。还可以用下方的提前、延后按钮调整。" });
    closePreview();
  };
  const undoOrder = () => {
    if (!canUndo) return;
    setState((s) => applyBasketOrder(s, undo.after, undo.before));
    setUndo(null);
    setPreview(null);
    setMessage({ ids: undo.before, text: "已恢复采用前的菜篮顺序。" });
    trigger.current?.focus({ preventScroll: true });
  };
  return (
    <section className="meal-planner" aria-labelledby="meal-planner-title">
      <div className="meal-planner-heading">
        <h2 id="meal-planner-title">先想好做菜顺序</h2>
        <button ref={trigger} className="primary" onClick={showPreview} aria-expanded={Boolean(preview)} aria-controls="meal-order-preview" disabled={!canBegin}>
          <ListOrdered size={18} aria-hidden="true" />帮我排个顺序
        </button>
      </div>
      <p className="hint">先看建议和理由，点采用才会改菜篮。跟做仍是做完一道，再做下一道。</p>
      {!canBegin && <p className="warning">有菜不符合厨房设置，请先移出再生成建议。</p>}
      {state.meal && state.cooking && <p className="hint">这里只调整下一餐菜篮，不改变正在做的一餐、进度或计时。</p>}
      {!preview && <details className="meal-advance-details">
        <summary>开火前要准备 · {current.prep.length ? `${current.prep.length} 项提醒` : "先看一眼"}</summary>
        <Preparation items={current.prep} go={go} />
      </details>}
      <p className="meal-plan-status" role="status" aria-live="polite">{message && sameOrder(message.ids, state.basket) ? message.text : ""}</p>
      {canUndo && <button onClick={undoOrder}><Undo2 size={16} aria-hidden="true" />撤销采用</button>}
      {preview && (
        <section id="meal-order-preview" className="meal-order-preview" aria-labelledby="meal-order-preview-title">
          <h3 id="meal-order-preview-title" ref={previewTitle} tabIndex="-1">顺序建议 · 尚未采用</h3>
          {stale && <p className="warning" role="alert">菜篮已经变化，这份预览已过期。请重新生成，避免覆盖刚才的调整。</p>}
          <div className="meal-time-estimate">
            <strong>{preview.estimate.minutes ? `菜谱标注合计约 ${preview.estimate.minutes} 分钟` : "暂缺菜谱用时"}</strong>
            {preview.estimate.missing > 0 && <p>另有 {preview.estimate.missing} 道未标用时，不能据此估算整餐。</p>}
            <p className="hint">逐道做的粗略参考，不是上桌倒计时；未计入的泡发、另煮米饭等需另外留时间。</p>
            <details className="meal-plan-evidence"><summary>估时怎么算？</summary><p className="hint">只把每道菜的标注用时加一次，不再叠加步骤计时或提前腌制时间，也不因排序扣除等待。实际用时还受份量、火力、熟练度和机器程序影响。</p></details>
          </div>
          <h3>开火前先准备</h3>
          <Preparation items={preview.prep} go={go} />
          <h3>然后按这个顺序做</h3>
          {!preview.changed && <p className="hint">暂时不需要改动当前顺序。只有依据明确的菜会前移或后移，其余保持相对顺序。</p>}
          <ol className="meal-plan-dishes">
            {preview.items.map((item, index) => (
              <li key={item.recipe.id}>
                <div className="meal-plan-dish-title"><span className="meal-plan-number" aria-hidden="true">{index + 1}</span><strong>{item.recipe.name}</strong><span className="meal-plan-tag">{item.label}</span></div>
                <p className="hint">{Number.isFinite(item.recipe.minutes) && item.recipe.minutes > 0 ? `菜谱标注约 ${item.recipe.minutes} 分钟` : "菜谱暂未标用时"} · {item.recipe.tools}</p>
                <details className="meal-plan-evidence">
                  <summary>为什么这样排 · {item.recipe.name}</summary>
                  <p>{item.reason}</p>
                  {item.evidence.map((e, i) => <p className="hint" key={i}>菜谱第 {e.step + 1} 步「{item.recipe.steps[e.step].title}」：{e.quote}</p>)}
                  <button className="text-button" onClick={() => go("recipe/" + item.recipe.id)}>查看{item.recipe.name}完整做法</button>
                </details>
              </li>
            ))}
          </ol>
          <p className="hint">生熟分开，炉火不要无人照看，熟菜别在室温久放。可按锅具和上桌时间调整；这里不安排跨菜穿插，也不保证更省时。</p>
          <div className="meal-plan-actions">
            <button onClick={closePreview}>先不采用</button>
            {stale ? <button className="primary" onClick={showPreview} disabled={!canBegin}>重新生成建议</button> : <button className="primary" onClick={adopt} disabled={!canBegin}>采用这个顺序</button>}
          </div>
        </section>
      )}
    </section>
  );
}
