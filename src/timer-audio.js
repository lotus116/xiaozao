// One foreground audio owner for the whole app; never a background alarm.
export function createTimerAudio({ createContext, onStatus = () => {},
  every = setInterval, cancelEvery = clearInterval }) {
  let context, disposed = false, pending = null, loop = null, key = null;
  let state = { enabled: true, foreground: true, timer: null, now: 0 };
  let status = "idle";
  const voices = new Set();
  const emit = (value) => {
    if (!disposed && value !== status) { status = value; onStatus(value); }
  };
  const stopVoices = () => {
    for (const voice of [...voices]) {
      try { voice.oscillator.stop(); } catch { /* Already ended. */ }
      voice.oscillator.disconnect(); voice.gain.disconnect(); voices.delete(voice);
    }
  };
  const stop = () => {
    if (loop !== null) cancelEvery(loop);
    loop = null; key = null; stopVoices();
  };
  const due = () => state.enabled && state.foreground && state.timer &&
    state.timer.paused == null && state.timer.deadline <= state.now;
  const tone = () => {
    if (context?.state !== "running") return false;
    try {
      const start = context.currentTime;
      [660, 880, 660].forEach((frequency, i) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const voice = { oscillator, gain }; voices.add(voice);
        oscillator.type = "sine"; oscillator.frequency.value = frequency;
        const at = start + i * 0.25;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.16, at + 0.02);
        gain.gain.linearRampToValueAtTime(0, at + 0.2);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => {
          oscillator.disconnect(); gain.disconnect(); voices.delete(voice);
        };
        oscillator.start(at); oscillator.stop(at + 0.22);
      });
      return true;
    } catch { stop(); emit("blocked"); return false; }
  };
  const reconcile = () => {
    if (disposed) return;
    if (!state.enabled || !state.foreground) {
      stop(); emit(state.enabled ? "background" : "off"); return;
    }
    if (!due()) {
      if (loop !== null) stop();
      if (status !== "blocked") emit(context?.state === "running" ? "ready" : "idle");
      return;
    }
    if (context?.state !== "running") { stop(); emit("blocked"); return; }
    const nextKey = `${state.timer.id}:${state.timer.step}:${state.timer.deadline}`;
    if (key === nextKey && loop !== null) { emit("ringing"); return; }
    stop();
    if (!tone()) return;
    key = nextKey; emit("ringing");
    loop = every(() => {
      if (!due()) { reconcile(); return; }
      if (!tone()) { stop(); emit("blocked"); }
    }, 3000);
  };
  const activate = () => {
    if (disposed || !state.foreground) return Promise.resolve(false);
    if (pending) return pending;
    try {
      if (!context || context.state === "closed") context = createContext();
      // Called from a real click/key gesture before awaiting anything.
      const resumed = context.state === "running" ? Promise.resolve() : context.resume();
      pending = Promise.resolve(resumed).then(() => {
        if (disposed) return false;
        const ready = context.state === "running";
        emit(ready ? "ready" : "blocked"); reconcile(); return ready;
      }).catch(() => { if (!disposed) emit("blocked"); return false; })
        .finally(() => { pending = null; });
      return pending;
    } catch { emit("blocked"); return Promise.resolve(false); }
  };
  return {
    activate,
    update(next) { state = next; reconcile(); },
    async preview() {
      if (!state.enabled || !state.foreground || disposed) return false;
      if (!await activate() || disposed || !state.enabled || !state.foreground) return false;
      if (due()) return true; // Do not overlay a preview on the actual alarm.
      stopVoices(); return tone();
    },
    dispose() {
      disposed = true; stop();
      if (context) { try { Promise.resolve(context.close()).catch(() => {}); } catch { /* Closed. */ } }
    },
  };
}
