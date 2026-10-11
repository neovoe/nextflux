import test from "node:test";
import assert from "node:assert/strict";

const events = new EventTarget();
globalThis.window = events;
const {
  activeAudio,
  audioExpanded,
  audioPlayback,
  attachAudioController,
  publishAudioPlayback,
  controlAudio,
  playAudio,
  resetAudio,
} = await import("../../src/stores/audioStore.js");

test("reopening audio preserves its instance while switching audio replaces it", () => {
  const first = { key: "first", src: "https://example.com/first.mp3" };
  playAudio(first);
  assert.equal(audioExpanded.get(), false);
  audioExpanded.set(true);
  playAudio({ ...first });
  assert.equal(activeAudio.get(), first);
  assert.equal(audioExpanded.get(), false);
  const second = { key: "second", src: "https://example.com/second.mp3" };
  playAudio(second);
  assert.equal(activeAudio.get(), second);
  assert.equal(audioExpanded.get(), false);
  resetAudio();
  assert.equal(activeAudio.get(), null);
  assert.equal(audioExpanded.get(), false);
});

test("logout clears the global track and its expanded state", () => {
  playAudio({ key: "first" });
  events.dispatchEvent(new Event("nextflux:logout"));
  assert.equal(activeAudio.get(), null);
  assert.equal(audioExpanded.get(), false);
});

test("both interfaces command one controller and stale tracks cannot overwrite its state", () => {
  playAudio({ key: "first" });
  const calls = [];
  const detachFirst = attachAudioController("first", {
    toggle: () => calls.push("toggle-first"),
    seek: (time) => calls.push(time),
    pause: () => calls.push("pause-first"),
  });
  publishAudioPlayback("first", {
    paused: false,
    currentTime: 42,
    duration: 120,
    ready: true,
  });
  assert.equal(audioPlayback.get().currentTime, 42);
  assert.equal(controlAudio("first", "toggle"), true);
  assert.equal(controlAudio("first", "seek", 60), true);
  playAudio({ key: "second" });
  assert.deepEqual(calls, ["toggle-first", 60, "pause-first"]);
  assert.equal(audioPlayback.get().currentTime, 0);
  attachAudioController("second", {
    toggle: () => calls.push("toggle-second"),
    pause: () => calls.push("pause-second"),
  });
  detachFirst();
  attachAudioController("first", { toggle: () => calls.push("stale") });
  publishAudioPlayback("first", { currentTime: 99 });
  assert.equal(audioPlayback.get().key, "second");
  assert.equal(controlAudio("first", "toggle"), false);
  assert.equal(controlAudio("second", "toggle"), true);
  assert.equal(calls.at(-1), "toggle-second");
  resetAudio();
  assert.equal(calls.at(-1), "pause-second");
  assert.equal(audioPlayback.get().key, null);
  assert.equal(controlAudio("second", "toggle"), false);
});
