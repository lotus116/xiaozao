import React, { useState, useRef, useEffect } from "react";
import { Timer, X, EyeOff } from "lucide-react";
import { remaining } from "./logic";
export default function TimerWidget({
  timer,
  setTimer,
  now,
  recipes,
  dock,
  setDock,
  dialogRef,
}) {
  const localDialog = useRef();
  const dialog = dialogRef || localDialog,
    gesture = useRef(null),
    hold = useRef(null),
    blockedUntil = useRef(0),
    previous = useRef(timer);
  const [minutes, setMinutes] = useState("5"),
    [label, setLabel] = useState("厨房计时");
  const [dragPoint, setDragPoint] = useState(null),
    [notice, setNotice] = useState("");
  const [viewport, setViewport] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const maxX = Math.max(12, viewport.w - 68),
    maxY = Math.max(12, viewport.h - 142);
  const bounded = (x, y) => ({
    x: Math.min(maxX, Math.max(12, x)),
    y: Math.min(maxY, Math.max(12, y)),
  });
  const position = dock.position || { x: 1, y: 1 };
  const point = dragPoint || {
    x: 12 + (maxX - 12) * position.x,
    y: 12 + (maxY - 12) * position.y,
  };
  const savePosition = (p) =>
    setDock({
      ...dock,
      position: {
        x: (p.x - 12) / Math.max(1, maxX - 12),
        y: (p.y - 12) / Math.max(1, maxY - 12),
      },
    });
  const left = timer?.paused ?? (timer ? remaining(timer.deadline, now) : 0);
  const recipe = recipes.find((r) => r.id === timer?.id);
  const title =
    timer?.label ||
    (recipe
      ? recipe.name + " · " + (recipe.steps[timer.step]?.title || "步骤计时")
      : "厨房计时");
  const display =
    Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  const status = timer
    ? left
      ? timer.paused != null
        ? "已暂停"
        : "计时中"
      : "时间到了"
    : "";
  useEffect(() => {
    const resize = () => {
      clearTimeout(hold.current);
      gesture.current = null;
      setDragPoint(null);
      setViewport({ w: innerWidth, h: innerHeight });
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      clearTimeout(hold.current);
    };
  }, []);
  useEffect(() => {
    if (previous.current && !timer) dialog.current?.close();
    previous.current = timer;
  }, [timer]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const stop = () => {
    dialog.current?.close();
    setTimer(null);
  };
  const hide = () => {
    clearTimeout(hold.current);
    dialog.current?.close();
    blockedUntil.current = Date.now() + 500;
    gesture.current = null;
    setDragPoint(null);
    setDock({ ...dock, hidden: true });
    setNotice("计时图标已隐藏，可在设置中恢复。正在运行的计时会继续。");
  };
  const down = (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      origin: point,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    hold.current = setTimeout(hide, 650);
  };
  const move = (e) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (Math.hypot(dx, dy) > 8) {
      g.moved = true;
      clearTimeout(hold.current);
    }
    if (g.moved) {
      e.preventDefault();
      setDragPoint(bounded(g.origin.x + dx, g.origin.y + dy));
    }
  };
  const up = (e) => {
    clearTimeout(hold.current);
    const g = gesture.current;
    gesture.current = null;
    if (g?.moved) {
      savePosition(
        bounded(g.origin.x + e.clientX - g.x, g.origin.y + e.clientY - g.y),
      );
      blockedUntil.current = Date.now() + 400;
    }
    setDragPoint(null);
  };
  const cancel = () => {
    clearTimeout(hold.current);
    gesture.current = null;
    setDragPoint(null);
    blockedUntil.current = Date.now() + 400;
  };
  const start = (seconds) => {
    if (timer) return;
    setTimer({
      id: null,
      step: null,
      label: label.trim() || "厨房计时",
      deadline: Date.now() + seconds * 1000,
    });
    dialog.current.close();
  };
  return (
    <>
      {!dock.hidden && (!timer || left > 0) && (
        <div
          className={
            "floating-timer icon-timer " +
            (timer ? "running " : "") +
            (timer && left === 0 ? "expired" : "")
          }
          style={{
            left: "clamp(12px, " + point.x + "px, calc(100vw - 68px))",
            top:
              "clamp(calc(12px + var(--app-safe-top)), " +
              point.y +
              "px, calc(100dvh - 142px - var(--app-safe-bottom)))",
          }}
        >
          <button
            className="timer-handle"
            aria-label={
              "打开厨房计时器" +
              (timer ? "：" + title + "，" + status + " " + display : "")
            }
            title="点击计时，拖动换位置，长按隐藏"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => {
              if (Date.now() >= blockedUntil.current)
                dialog.current.showModal();
            }}
            onKeyDown={(e) => {
              const dirs = {
                ArrowLeft: [-20, 0],
                ArrowRight: [20, 0],
                ArrowUp: [0, -20],
                ArrowDown: [0, 20],
              };
              if (dirs[e.key]) {
                e.preventDefault();
                savePosition(
                  bounded(point.x + dirs[e.key][0], point.y + dirs[e.key][1]),
                );
              }
              if (e.key === "Home") {
                e.preventDefault();
                setDock({ ...dock, position: null });
              }
            }}
          >
            <Timer size={26} aria-hidden="true" />
            {timer && <i className="timer-dot" aria-hidden="true" />}
          </button>
        </div>
      )}
      {timer && left === 0 && (
        <aside className="timer-complete" aria-label="计时到点提醒">
          <div role="status"><strong>时间到了</strong><span>{title} · 看一眼锅里的状态</span></div>
          <div className="chips">
            <button aria-label={"查看计时，打开厨房计时器：" + title + "，时间到了 " + display} onClick={() => dialog.current.showModal()}>查看计时</button>
            <button onClick={stop}>知道了，结束计时</button>
          </div>
        </aside>
      )}
      <span className="sr-only" role="status">
        {timer ? title + "，" + status : ""}
      </span>
      {notice && (
        <div className="timer-notice" role="status">
          {notice}
          <a href="#settings">去设置</a>
        </div>
      )}
      <dialog
        ref={dialog}
        className="timer-dialog"
        aria-labelledby="timer-title"
      >
        <div className="section-title">
          <h2 id="timer-title">厨房计时器</h2>
          <button
            aria-label="收起计时器"
            onClick={() => dialog.current.close()}
          >
            <X size={20} />
          </button>
        </div>
        {timer ? (
          <>
            <p>{title}</p>
            <p className="timer-digits">{display}</p>
            <p role="status">{status}</p>
            <div className="chips">
              {left > 0 && (
                <button
                  onClick={() =>
                    setTimer(
                      timer.paused != null
                        ? {
                            ...timer,
                            paused: null,
                            deadline: Date.now() + timer.paused * 1000,
                          }
                        : { ...timer, paused: left },
                    )
                  }
                >
                  {timer.paused != null ? "继续计时" : "暂停计时"}
                </button>
              )}
              <button
                onClick={() =>
                  setTimer(
                    timer.paused != null
                      ? { ...timer, paused: Math.min(timer.paused + 60, 10800) }
                      : {
                          ...timer,
                          deadline: Math.min(
                            Math.max(timer.deadline, Date.now()) + 60000,
                            Date.now() + 10800000,
                          ),
                        },
                  )
                }
              >
                加 1 分钟
              </button>
              <button onClick={stop}>结束当前计时</button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (Number(minutes) > 0 && Number(minutes) <= 180)
                start(Math.round(Number(minutes) * 60));
            }}
          >
            <label htmlFor="timer-label">计时名称</label>
            <input
              id="timer-label"
              maxLength={30}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <label htmlFor="timer-minutes">时长（分钟，最多 180）</label>
            <input
              id="timer-minutes"
              type="number"
              min="0.1"
              max="180"
              step="0.1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <div className="chips">
              {[1, 3, 5, 10, 15].map((n) => (
                <button key={n} type="button" onClick={() => start(n * 60)}>
                  {n} 分钟
                </button>
              ))}
            </div>
            <button
              className="primary wide"
              disabled={
                !Number(minutes) ||
                Number(minutes) <= 0 ||
                Number(minutes) > 180
              }
            >
              开始计时
            </button>
          </form>
        )}
        <p className="hint">
          一次一个计时，刷新会保留。这里提供页面内提醒，不保证后台或锁屏响铃；长时间蒸炖请同时设手机系统计时器。
        </p>
        <details className="timer-placement">
          <summary>图标位置与隐藏</summary>
          <p className="hint">
            拖动可移动，长按可隐藏。键盘方向键移动，Home
            复位；隐藏后在设置恢复。
          </p>
          <div className="chips">
            <button
              onClick={() =>
                setDock({ ...dock, position: { ...position, x: 0 } })
              }
            >
              放在左侧
            </button>
            <button
              onClick={() =>
                setDock({ ...dock, position: { ...position, x: 1 } })
              }
            >
              放在右侧
            </button>
            <button onClick={() => setDock({ ...dock, position: null })}>
              恢复默认位置
            </button>
            <button onClick={hide}>
              <EyeOff size={16} />
              隐藏悬浮图标
            </button>
          </div>
        </details>
      </dialog>
    </>
  );
}
