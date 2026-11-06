import React from "react";

// Both entry points use the same undo state, including after changing pages.
export default function PantryReset({ count, canUndo, message, onClear, onUndo }) {
  return (
    <div className="pantry-reset">
      <div className="chips">
        <button className="text-button" disabled={!count} onClick={onClear}>
          清空本次食材，保留调料
        </button>
        {canUndo && <button className="text-button" onClick={onUndo}>撤销清空</button>}
      </div>
      <p role="status" className="hint pantry-reset-status">
        {message || (count ? `本次记录了 ${count} 样食材，清空不会移除菜篮里的菜。` : "本次还没有食材，不需要清空。")}
      </p>
    </div>
  );
}
