import React, { useState, useRef, useEffect } from "react";
import { Timer, X } from "lucide-react";
import { remaining } from "./logic";
export default function TimerWidget({ timer, setTimer, now, recipes }) {
  const dialog = useRef();
  const [minutes, setMinutes] = useState("5");
  const [label, setLabel] = useState("厨房计时");
  const left = timer?.paused ?? (timer ? remaining(timer.deadline, now) : 0);
  const recipe = recipes.find((r) => r.id === timer?.id);
  const title =
    timer?.label ||
    (recipe
      ? `${recipe.name} · ${recipe.steps[timer.step]?.title || "步骤计时"}`
      : "厨房计时");
  const display = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const caption = timer
    ? `${title} · ${timer.paused != null ? "已暂停 " : ""}${left ? display : "时间到了"}`
    : "随手计时";
  useEffect(() => () => dialog.current?.close(), []);
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
      <div
        className={"floating-timer " + (timer && left === 0 ? "expired" : "")}
      >
        <button
          onClick={() => dialog.current.showModal()}
          aria-label={`打开厨房计时器：${caption}`}
        >
          <Timer size={21} />
          <span>{caption}</span>
        </button>
        {timer && (
          <button aria-label="关闭计时器" onClick={() => setTimer(null)}>
            <X size={18} />
          </button>
        )}
        <span className="sr-only" role="status">
          {timer
            ? left
              ? `${title}，${timer.paused != null ? "已暂停" : "计时中"}`
              : "时间到了，请检查锅里状态"
            : ""}
        </span>
      </div>
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
                      ? { ...timer, paused: Math.min(timer.paused + 60, 86400) }
                      : {
                          ...timer,
                          deadline:
                            Math.max(timer.deadline, Date.now()) + 60000,
                        },
                  )
                }
              >
                加 1 分钟
              </button>
              <button onClick={() => setTimer(null)}>结束当前计时</button>
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
          一次保留一个计时；切换页面、刷新后可恢复。锁屏或后台不保证声音和通知，回到页面会校正时间。
        </p>
      </dialog>
    </>
  );
}
