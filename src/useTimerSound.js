import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { createTimerAudio } from "./timer-audio";

export function useTimerSound(timer, enabled, now) {
  const controller = useRef(null), sync = useRef(() => {});
  const latest = useRef({ timer, enabled }); latest.current = { timer, enabled };
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    let disposed = false, nativeActive = true, nativeHandle;
    const audio = createTimerAudio({
      createContext: () => new (window.AudioContext || window.webkitAudioContext)(),
      onStatus: setStatus,
    });
    controller.current = audio;
    const update = () => audio.update({ ...latest.current,
      now: Date.now(), foreground: nativeActive && document.visibilityState === "visible" });
    sync.current = update;
    const gesture = () => { if (latest.current.enabled) audio.activate(); };
    document.addEventListener("pointerdown", gesture, true);
    document.addEventListener("keydown", gesture, true);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pagehide", pause);
    window.addEventListener("pageshow", resume);
    function pause() { nativeActive = false; update(); }
    function resume() { nativeActive = true; update(); }
    if (Capacitor.getPlatform() === "android") {
      import("@capacitor/app").then(async ({ App }) => {
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (!disposed) { nativeActive = isActive; update(); }
        });
        if (disposed) { handle.remove(); return; }
        nativeHandle = handle;
      }).catch(() => { /* Web visibility remains the foreground fallback. */ });
    }
    update();
    return () => {
      disposed = true; audio.dispose(); nativeHandle?.remove();
      document.removeEventListener("pointerdown", gesture, true);
      document.removeEventListener("keydown", gesture, true);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pagehide", pause); window.removeEventListener("pageshow", resume);
      controller.current = null; sync.current = () => {};
    };
  }, []);
  useEffect(() => sync.current(), [timer, enabled, now]);
  return { status, activate: () => controller.current?.activate(), preview: () => controller.current?.preview() };
}
