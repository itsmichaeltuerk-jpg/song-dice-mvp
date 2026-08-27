import { create } from "zustand";
import { bassFace, chordFace, drumFace, melodyFace } from "./music/arrange";
import { engine, type MixerState } from "./music/engine";
import type { Mode, StemId } from "./music/theory";
import { STEMS } from "./music/theory";

export type Faces = Record<StemId, number>;
export type Locked = Record<StemId, boolean>;

export type SavedRoll = {
  id: string;
  createdAt: number;
  name: string;
  tonic: number;
  mode: Mode;
  bpm: number;
  swing: number;
  faces: Faces;
};

type StudioState = {
  tonic: number;
  mode: Mode;
  bpm: number;
  swing: number;
  faces: Faces;
  locked: Locked;
  mixer: MixerState;
  rolling: Record<StemId, boolean>;
  library: SavedRoll[];
  setTonic: (n: number) => void;
  setMode: (m: Mode) => void;
  setBpm: (n: number) => void;
  setSwing: (n: number) => void;
  setFace: (stem: StemId, face: number) => void;
  toggleLock: (stem: StemId) => void;
  setVolume: (stem: StemId, v: number) => void;
  toggleMute: (stem: StemId) => void;
  toggleSolo: (stem: StemId) => void;
  roll: (stems?: StemId[]) => void;
  setRolling: (stem: StemId, on: boolean) => void;
  saveRoll: () => void;
  loadRoll: (id: string) => void;
  deleteRoll: (id: string) => void;
  rehydrate: () => void;
  syncEngine: () => void;
};

const SAVE_KEY = "song-dice:v1";
const SAVE_VERSION = 1;

const defaultFaces: Faces = { chords: 0, bass: 1, drums: 0, melody: 0 };
const defaultLocked: Locked = { chords: false, bass: false, drums: false, melody: false };
const defaultMixer: MixerState = {
  volumes: { chords: 0.9, bass: 1, drums: 1, melody: 0.85 },
  muted: { chords: false, bass: false, drums: false, melody: false },
  solo: null,
};

function randomFace(exclude: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let next = buf[0]! % 6;
  if (next === exclude) next = (next + 1 + (buf[0]! % 5)) % 6;
  return next;
}

function rollName(s: Pick<StudioState, "tonic" | "mode" | "bpm" | "faces">): string {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${notes[s.tonic]!} ${s.mode} · ${s.bpm} · ${chordFace(s.faces.chords).name}`;
}

type PersistShape = {
  version: number;
  tonic: number;
  mode: Mode;
  bpm: number;
  swing: number;
  faces: Faces;
  locked: Locked;
  mixer: MixerState;
  library: SavedRoll[];
};

function loadPersist(): Partial<PersistShape> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistShape;
    if (parsed.version !== SAVE_VERSION) return { library: parsed.library ?? [] };
    return parsed;
  } catch {
    return {};
  }
}

function persist(state: StudioState) {
  if (typeof window === "undefined") return;
  const blob: PersistShape = {
    version: SAVE_VERSION,
    tonic: state.tonic,
    mode: state.mode,
    bpm: state.bpm,
    swing: state.swing,
    faces: state.faces,
    locked: state.locked,
    mixer: state.mixer,
    library: state.library,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  } catch {
    /* quota / private mode */
  }
}

export const useStudio = create<StudioState>((set, get) => ({
  tonic: 0,
  mode: "minor",
  bpm: 96,
  swing: 0,
  faces: { ...defaultFaces },
  locked: { ...defaultLocked },
  mixer: { ...defaultMixer, volumes: { ...defaultMixer.volumes }, muted: { ...defaultMixer.muted } },
  rolling: { chords: false, bass: false, drums: false, melody: false },
  library: [],
  setTonic: (n) => {
    set({ tonic: n });
    get().syncEngine();
  },
  setMode: (m) => {
    set({ mode: m });
    get().syncEngine();
  },
  setBpm: (n) => {
    set({ bpm: Math.round(Math.min(160, Math.max(60, n))) });
    get().syncEngine();
  },
  setSwing: (n) => {
    set({ swing: Math.min(1, Math.max(0, n)) });
    get().syncEngine();
  },
  setFace: (stem, face) => {
    set({ faces: { ...get().faces, [stem]: face } });
    get().syncEngine();
  },
  toggleLock: (stem) => {
    set({ locked: { ...get().locked, [stem]: !get().locked[stem] } });
    persist(get());
  },
  setVolume: (stem, v) => {
    const mixer = {
      ...get().mixer,
      volumes: { ...get().mixer.volumes, [stem]: v },
    };
    set({ mixer });
    get().syncEngine();
  },
  toggleMute: (stem) => {
    const mixer = {
      ...get().mixer,
      muted: { ...get().mixer.muted, [stem]: !get().mixer.muted[stem] },
    };
    set({ mixer });
    get().syncEngine();
  },
  toggleSolo: (stem) => {
    const cur = get().mixer.solo;
    const mixer = { ...get().mixer, solo: cur === stem ? null : stem };
    set({ mixer });
    get().syncEngine();
  },
  roll: (stems) => {
    const targets = stems ?? STEMS.filter((s) => !get().locked[s]);
    if (!targets.length) return;
    const faces = { ...get().faces };
    for (const s of targets) faces[s] = randomFace(faces[s]);
    set({ faces });
    get().syncEngine();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([8, 30, 12]);
  },
  setRolling: (stem, on) => {
    set({ rolling: { ...get().rolling, [stem]: on } });
  },
  saveRoll: () => {
    const s = get();
    const item: SavedRoll = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      name: rollName(s),
      tonic: s.tonic,
      mode: s.mode,
      bpm: s.bpm,
      swing: s.swing,
      faces: { ...s.faces },
    };
    set({ library: [item, ...s.library].slice(0, 24) });
    persist(get());
  },
  loadRoll: (id) => {
    const item = get().library.find((r) => r.id === id);
    if (!item) return;
    set({
      tonic: item.tonic,
      mode: item.mode,
      bpm: item.bpm,
      swing: item.swing,
      faces: { ...item.faces },
    });
    get().syncEngine();
  },
  deleteRoll: (id) => {
    set({ library: get().library.filter((r) => r.id !== id) });
    persist(get());
  },
  rehydrate: () => {
    const data = loadPersist();
    set({
      tonic: data.tonic ?? 0,
      mode: data.mode ?? "minor",
      bpm: data.bpm ?? 96,
      swing: data.swing ?? 0,
      faces: data.faces ?? { ...defaultFaces },
      locked: data.locked ?? { ...defaultLocked },
      mixer: data.mixer ?? {
        ...defaultMixer,
        volumes: { ...defaultMixer.volumes },
        muted: { ...defaultMixer.muted },
      },
      library: data.library ?? [],
    });
    get().syncEngine();
  },
  syncEngine: () => {
    const s = get();
    engine.setSnapshot({
      tonic: s.tonic,
      mode: s.mode,
      faces: s.faces,
      bpm: s.bpm,
      swing: s.swing,
      mixer: s.mixer,
    });
    persist(s);
  },
}));

export function sessionOf(s: StudioState) {
  return { tonic: s.tonic, mode: s.mode, faces: s.faces };
}

export { chordFace, bassFace, drumFace, melodyFace };
