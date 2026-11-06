import { test } from "node:test";
import assert from "node:assert/strict";
import { createKeepAwake } from "../src/keep-awake.js";

const flush = () => new Promise((resolve) => setImmediate(resolve));
function setup(request) {
  const document = new EventTarget();
  document.visibilityState = "visible";
  const changes = [];
  const controller = createKeepAwake({
    document,
    wakeLock: request ? { request } : undefined,
    onChange: (state) => changes.push(state),
  });
  return {
    controller, changes,
    visibility(value) {
      document.visibilityState = value;
      document.dispatchEvent(new Event("visibilitychange"));
    },
  };
}
function lock() {
  const sentinel = new EventTarget();
  sentinel.released = false;
  sentinel.releaseCalls = 0;
  sentinel.release = async () => {
    sentinel.releaseCalls += 1;
    sentinel.released = true;
    sentinel.dispatchEvent(new Event("release"));
  };
  return sentinel;
}

test("wake lock never starts automatically and reports unsupported environments", () => {
  const { controller } = setup();
  assert.deepEqual(controller.snapshot(), { wanted: false, status: "unsupported" });
  controller.enable();
  assert.equal(controller.snapshot().wanted, false);
  controller.dispose();
});

test("wake lock reflects acquisition, releases on hidden, and reacquires on return", async () => {
  const locks = [];
  const s = setup(async (kind) => {
    assert.equal(kind, "screen");
    const value = lock(); locks.push(value); return value;
  });
  assert.equal(locks.length, 0);
  s.controller.enable();
  assert.equal(s.controller.snapshot().status, "requesting");
  await flush();
  assert.equal(s.controller.snapshot().status, "active");
  s.visibility("hidden");
  assert.equal(locks[0].releaseCalls, 1);
  assert.equal(s.controller.snapshot().status, "paused");
  s.visibility("visible");
  await flush();
  assert.equal(locks.length, 2);
  assert.equal(s.controller.snapshot().status, "active");
  s.controller.dispose();
  assert.equal(locks[1].releaseCalls, 1);
});

test("closing a pending request releases a late sentinel and never reacquires", async () => {
  let resolve;
  let requests = 0;
  const s = setup(() => { requests += 1; return new Promise((r) => { resolve = r; }); });
  s.controller.enable();
  s.controller.disable();
  const late = lock(); resolve(late);
  await flush();
  assert.equal(late.releaseCalls, 1);
  assert.deepEqual(s.controller.snapshot(), { wanted: false, status: "off" });
  s.visibility("hidden"); s.visibility("visible");
  assert.equal(requests, 1);
  s.controller.dispose();
});

test("unmount during pending acquisition releases result without callbacks", async () => {
  let resolve;
  const s = setup(() => new Promise((r) => { resolve = r; }));
  s.controller.enable();
  s.controller.dispose();
  const count = s.changes.length;
  const late = lock(); resolve(late);
  await flush();
  assert.equal(late.releaseCalls, 1);
  assert.equal(s.changes.length, count);
});

test("system release is reported honestly and requires retry or a foreground return", async () => {
  let current;
  let requests = 0;
  const s = setup(async () => { requests += 1; current = lock(); return current; });
  s.controller.enable(); await flush();
  await current.release();
  assert.equal(s.controller.snapshot().status, "released");
  assert.equal(requests, 1);
  s.controller.enable(); await flush();
  assert.equal(requests, 2);
  assert.equal(s.controller.snapshot().status, "active");
  s.controller.dispose();
});

test("failed acquisition supports retry without claiming active", async () => {
  let attempts = 0;
  const s = setup(async () => {
    if (++attempts === 1) throw new Error("OS denied");
    return lock();
  });
  s.controller.enable(); await flush();
  assert.equal(s.controller.snapshot().status, "error");
  s.controller.enable(); await flush();
  assert.equal(s.controller.snapshot().status, "active");
  s.controller.dispose();
});

test("stale acquisition cannot replace newer foreground lock", async () => {
  const pending = [];
  const s = setup(() => new Promise((resolve) => pending.push(resolve)));
  s.controller.enable();
  s.visibility("hidden"); s.visibility("visible");
  const newest = lock(); pending[1](newest); await flush();
  const stale = lock(); pending[0](stale); await flush();
  assert.equal(stale.releaseCalls, 1);
  assert.equal(newest.releaseCalls, 0);
  assert.equal(s.controller.snapshot().status, "active");
  s.controller.disable();
  assert.equal(newest.releaseCalls, 1);
  s.controller.dispose();
});
