// A session-only request, never a guarantee against OS lock or background sleep.
export function createKeepAwake({ wakeLock, document, onChange = () => {} }) {
  const supported = typeof wakeLock?.request === "function";
  let wanted = false;
  let disposed = false;
  let generation = 0;
  let sentinel = null;
  let status = supported ? "off" : "unsupported";
  const emit = (next) => {
    status = next;
    if (!disposed) onChange({ wanted, status });
  };
  const release = (lock) => {
    if (!lock || lock.released) return;
    try { Promise.resolve(lock.release()).catch(() => {}); } catch { /* OS owns lock. */ }
  };
  const invalidate = () => {
    generation += 1;
    const previous = sentinel;
    sentinel = null;
    release(previous);
  };
  const request = async () => {
    if (disposed || !wanted || !supported) return;
    if (document.visibilityState !== "visible") {
      emit("paused");
      return;
    }
    const token = ++generation;
    emit("requesting");
    try {
      const lock = await wakeLock.request("screen");
      if (disposed || !wanted || token !== generation || document.visibilityState !== "visible") {
        release(lock);
        return;
      }
      if (lock.released) {
        emit("released");
        return;
      }
      sentinel = lock;
      lock.addEventListener("release", () => {
        if (sentinel !== lock || disposed) return;
        sentinel = null;
        emit(wanted ? "released" : "off");
      }, { once: true });
      emit("active");
    } catch {
      if (!disposed && wanted && token === generation) emit("error");
    }
  };
  const visibility = () => {
    if (disposed || !wanted) return;
    if (document.visibilityState !== "visible") {
      invalidate();
      emit("paused");
    } else if (!sentinel) request();
  };
  document.addEventListener("visibilitychange", visibility);
  return {
    snapshot: () => ({ wanted, status }),
    enable() {
      if (disposed || !supported || sentinel || status === "requesting") return;
      wanted = true;
      request();
    },
    disable() {
      if (disposed) return;
      wanted = false;
      invalidate();
      emit(supported ? "off" : "unsupported");
    },
    dispose() {
      disposed = true;
      wanted = false;
      invalidate();
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
