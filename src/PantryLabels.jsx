import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ingredientStatus, refineIngredient } from "./ingredient-status";

export default function PantryLabels({ names, toggle, setState, downloaded }) {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  const unrecognized = names.some((name) => ingredientStatus(name, downloaded).label === "自定义");
  return <>
    <div className="selected-list">
      {names.map((name) => {
        const { label, choices } = ingredientStatus(name, downloaded);
        return <div className={`pantry-label ${label ? "needs-review" : ""}`} key={name}>
          <button className="chip selected" onClick={() => toggle(name)} aria-label={`移除${name}`}
            aria-describedby={label ? `food-status-${name}` : undefined}>
            {name}{label && <small id={`food-status-${name}`} className="food-status">{label}</small>}<X size={14} aria-hidden="true" />
          </button>
          {choices.length > 0 && <button className="refine-food" aria-label={`选择${name}的具体食材`} onClick={() => setSelected(name)}>选择具体食材</button>}
        </div>;
      })}
    </div>
    {unrecognized && <p className="hint">自定义食材已保存，可匹配菜谱中的同名食材。</p>}
    <dialog ref={dialog} className="timer-dialog" aria-labelledby="refine-food-title" onClose={() => setSelected(null)}>
      <h2 id="refine-food-title">选择{selected}的具体食材</h2>
      <p className="hint">{selected === "牛肉卷"
        ? "如果手上这份是肥牛片，确认后，本机菜谱中的牛肉卷也会按肥牛片备料。可在“我的食材”取消关联。"
        : "按手边实际部位或种类选择。"}</p>
      <div className="chips">{selected && ingredientStatus(selected).choices.map((choice) => <button key={choice}
        aria-label={`将${selected}改为${choice}`} onClick={() => {
          setState((s) => ({ ...s, useFattyBeefForRolls: s.useFattyBeefForRolls || (selected === "牛肉卷" && choice === "肥牛片"), pantry: refineIngredient(s.pantry, selected, choice) }));
          dialog.current.close();
        }}>{choice}</button>)}</div>
      <button autoFocus onClick={() => dialog.current.close()}>取消，保留原食材</button>
    </dialog>
  </>;
}
