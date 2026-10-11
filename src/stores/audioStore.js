import { atom } from "nanostores";

export const activeAudio = atom(null);
export const audioExpanded = atom(false);
export const audioDock = atom(null);
const idlePlayback = {
  key: null,
  paused: true,
  currentTime: 0,
  duration: 0,
  loading: false,
  ready: false,
  error: "",
};
export const audioPlayback = atom(idlePlayback);
let audioController;

export function attachAudioController(key, controls) {
  if (activeAudio.get()?.key !== key) return () => {};
  const owner = { key, ...controls };
  audioController = owner;
  return () => {
    if (audioController === owner) audioController = undefined;
  };
}

export function publishAudioPlayback(key, state) {
  if (activeAudio.get()?.key === key) audioPlayback.set({ key, ...state });
}

export function controlAudio(key, action, value) {
  if (activeAudio.get()?.key !== key || audioController?.key !== key)
    return false;
  if (typeof audioController[action] !== "function") return false;
  audioController[action](value);
  return true;
}

export function playAudio(track) {
  // Keep the same media instance and position when reopening its article.
  if (activeAudio.get()?.key !== track.key) {
    audioController?.pause();
    audioController = undefined;
    audioPlayback.set({ ...idlePlayback, key: track.key, loading: true });
    activeAudio.set(track);
  }
  audioExpanded.set(false);
}

export function resetAudio() {
  audioController?.pause();
  audioController = undefined;
  activeAudio.set(null);
  audioPlayback.set(idlePlayback);
  audioExpanded.set(false);
}

window.addEventListener("nextflux:logout", resetAudio);
