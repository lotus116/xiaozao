import React, { useEffect, useRef, useState } from "react";
import { Sun } from "lucide-react";
import { createKeepAwake } from "./keep-awake";

const messages = {
  off: "可选开启，只在当前做菜页请求屏幕常亮。",
  unsupported: "当前环境不支持屏幕常亮，请留意自动锁屏。",
  requesting: "正在申请屏幕常亮…",
  active: "屏幕常亮已开启，离开做菜页后释放。系统仍可能中断。",
  paused: "已切到后台，常亮已暂停；回到前台会尝试恢复。",
  released: "系统已释放常亮，请留意锁屏，可重新尝试。",
  error: "常亮未能开启，请留意锁屏，可重新尝试。",
};

export default function KeepAwake() {
  const controller = useRef(null);
  const [state, setState] = useState({ wanted: false, status: "off" });
  useEffect(() => {
    const current = createKeepAwake({
      wakeLock: navigator.wakeLock,
      document,
      onChange: setState,
    });
    controller.current = current;
    setState(current.snapshot());
    return () => {
      current.dispose();
      if (controller.current === current) controller.current = null;
    };
  }, []);
  return (
    <div className="keep-awake">
      <div className="chips">
        <button
          type="button"
          aria-pressed={state.wanted}
          disabled={state.status === "unsupported"}
          onClick={() => state.wanted ? controller.current?.disable() : controller.current?.enable()}
        >
          <Sun size={18} aria-hidden="true" />
          {state.wanted ? "关闭常亮请求" : "做菜时保持亮屏"}
        </button>
        {state.wanted && ["released", "error"].includes(state.status) && (
          <button type="button" onClick={() => controller.current?.enable()}>重试常亮</button>
        )}
      </div>
      <p className="hint" role="status">{messages[state.status]}</p>
    </div>
  );
}
