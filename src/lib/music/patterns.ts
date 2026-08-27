import type { Quality } from "./theory";

export type ChordSlot = {
  degree: number;
  quality?: Quality;
};

export type ChordFace = {
  id: string;
  name: string;
  hint: string;
  slots: ChordSlot[];
};

export type BassEvent = {
  step: number;
  dur: number;
  tone: 0 | 1 | 2 | 3;
  oct: 0 | 1;
};

export type BassFace = {
  id: string;
  name: string;
  hint: string;
  phrase: BassEvent[];
};

export type DrumFace = {
  id: string;
  name: string;
  hint: string;
  kick: number[];
  snare: number[];
  hat: number[];
  open: number[];
  extra?: "trap32" | "shuffle";
};

export type MelEvent = {
  step: number;
  dur: number;
  degree: number;
  oct: number;
};

export type MelodyKind = "composed" | "arp" | "stabs";

export type MelodyFace = {
  id: string;
  name: string;
  hint: string;
  kind: MelodyKind;
  notes?: MelEvent[];
};

export const CHORD_FACES: ChordFace[] = [
  {
    id: "anthem",
    name: "Anthem",
    hint: "I–V–vi–IV",
    slots: [{ degree: 0 }, { degree: 4 }, { degree: 5 }, { degree: 3 }],
  },
  {
    id: "night",
    name: "Night Drive",
    hint: "i–VI–III–VII",
    slots: [
      { degree: 0, quality: "min" },
      { degree: 5, quality: "maj" },
      { degree: 2, quality: "maj" },
      { degree: 6, quality: "maj" },
    ],
  },
  {
    id: "after",
    name: "After Hours",
    hint: "ii–V–I–vi",
    slots: [
      { degree: 1 },
      { degree: 4, quality: "dom7" },
      { degree: 0 },
      { degree: 5 },
    ],
  },
  {
    id: "golden",
    name: "Golden",
    hint: "I–vi–IV–V",
    slots: [{ degree: 0 }, { degree: 5 }, { degree: 3 }, { degree: 4 }],
  },
  {
    id: "haze",
    name: "Haze",
    hint: "i–iv–v–i",
    slots: [
      { degree: 0, quality: "min" },
      { degree: 3, quality: "min" },
      { degree: 4, quality: "min" },
      { degree: 0, quality: "min" },
    ],
  },
  {
    id: "lift",
    name: "Lift",
    hint: "IV–I–V–vi",
    slots: [{ degree: 3 }, { degree: 0 }, { degree: 4 }, { degree: 5 }],
  },
];

export const BASS_FACES: BassFace[] = [
  {
    id: "roots",
    name: "Roots",
    hint: "Whole-note floor",
    phrase: [
      { step: 0, dur: 16, tone: 0, oct: 0 },
      { step: 16, dur: 16, tone: 0, oct: 0 },
    ],
  },
  {
    id: "pump",
    name: "Pump",
    hint: "Root on 1 and 3",
    phrase: [
      { step: 0, dur: 4, tone: 0, oct: 0 },
      { step: 8, dur: 4, tone: 0, oct: 0 },
      { step: 16, dur: 4, tone: 0, oct: 0 },
      { step: 24, dur: 4, tone: 0, oct: 0 },
    ],
  },
  {
    id: "walk",
    name: "Walk",
    hint: "Quarter-note line",
    phrase: [
      { step: 0, dur: 4, tone: 0, oct: 0 },
      { step: 4, dur: 4, tone: 1, oct: 0 },
      { step: 8, dur: 4, tone: 2, oct: 0 },
      { step: 12, dur: 4, tone: 1, oct: 0 },
      { step: 16, dur: 4, tone: 0, oct: 0 },
      { step: 20, dur: 4, tone: 2, oct: 0 },
      { step: 24, dur: 4, tone: 3, oct: 0 },
      { step: 28, dur: 4, tone: 2, oct: 0 },
    ],
  },
  {
    id: "bounce",
    name: "Bounce",
    hint: "Octave jumps",
    phrase: [
      { step: 0, dur: 2, tone: 0, oct: 0 },
      { step: 4, dur: 2, tone: 0, oct: 1 },
      { step: 8, dur: 2, tone: 2, oct: 0 },
      { step: 12, dur: 2, tone: 0, oct: 1 },
      { step: 16, dur: 2, tone: 0, oct: 0 },
      { step: 20, dur: 2, tone: 0, oct: 1 },
      { step: 24, dur: 2, tone: 2, oct: 0 },
      { step: 28, dur: 2, tone: 0, oct: 1 },
    ],
  },
  {
    id: "sync",
    name: "Sync",
    hint: "Offbeat 808",
    phrase: [
      { step: 2, dur: 2, tone: 0, oct: 0 },
      { step: 6, dur: 2, tone: 0, oct: 1 },
      { step: 10, dur: 2, tone: 2, oct: 0 },
      { step: 14, dur: 2, tone: 0, oct: 0 },
      { step: 18, dur: 2, tone: 0, oct: 0 },
      { step: 22, dur: 2, tone: 2, oct: 0 },
      { step: 26, dur: 2, tone: 0, oct: 1 },
      { step: 30, dur: 2, tone: 0, oct: 0 },
    ],
  },
  {
    id: "pedal",
    name: "Pedal",
    hint: "Drone with grace",
    phrase: [
      { step: 0, dur: 14, tone: 0, oct: 0 },
      { step: 14, dur: 2, tone: 2, oct: 0 },
      { step: 16, dur: 14, tone: 0, oct: 0 },
      { step: 30, dur: 2, tone: 1, oct: 0 },
    ],
  },
];

function vel16(pattern: string): number[] {
  return pattern.replace(/\s/g, "").split("").map((c) => {
    if (c === "X") return 1;
    if (c === "x") return 0.78;
    if (c === "o") return 0.45;
    return 0;
  });
}

export const DRUM_FACES: DrumFace[] = [
  {
    id: "boombap",
    name: "Boom Bap",
    hint: "Head-nod pocket",
    kick: vel16("X------x-x------"),
    snare: vel16("----X-------X---"),
    hat: vel16("x-o-x-o-x-o-x-o-"),
    open: vel16("--------x-------"),
  },
  {
    id: "floor",
    name: "Floor",
    hint: "Four on the floor",
    kick: vel16("X---X---X---X---"),
    snare: vel16("----X-------X---"),
    hat: vel16("xoxoxoxoxoxoxoxo"),
    open: vel16("------------x---"),
  },
  {
    id: "trap",
    name: "Trap",
    hint: "Rolling hats",
    kick: vel16("X-----x---x-----"),
    snare: vel16("----X-------X---"),
    hat: vel16("xxxxxxxxxxxxxxxx"),
    open: vel16("------x-------x-"),
    extra: "trap32",
  },
  {
    id: "breaks",
    name: "Breaks",
    hint: "Broken kick/snare",
    kick: vel16("X-----x-x--x----"),
    snare: vel16("----X--x----X---"),
    hat: vel16("xx-xxx-xxx-xxx-x"),
    open: vel16("------x-------x-"),
  },
  {
    id: "dust",
    name: "Dust",
    hint: "Laid-back shuffle",
    kick: vel16("X-------X-------"),
    snare: vel16("----o-------X---"),
    hat: vel16("x---x---x---x---"),
    open: vel16("--------x-------"),
    extra: "shuffle",
  },
  {
    id: "clave",
    name: "Clave",
    hint: "Latin cross-stick",
    kick: vel16("X-----x-X-------"),
    snare: vel16("----X-----x-X---"),
    hat: vel16("--x-x-x---x-x-x-"),
    open: vel16("x---------------"),
  },
];

export const MELODY_FACES: MelodyFace[] = [
  {
    id: "hook",
    name: "Hook",
    hint: "Singable motif",
    kind: "composed",
    notes: [
      { step: 0, dur: 2, degree: 2, oct: 5 },
      { step: 2, dur: 2, degree: 1, oct: 5 },
      { step: 4, dur: 2, degree: 0, oct: 5 },
      { step: 6, dur: 2, degree: 2, oct: 5 },
      { step: 8, dur: 4, degree: 4, oct: 5 },
      { step: 16, dur: 2, degree: 4, oct: 5 },
      { step: 18, dur: 2, degree: 5, oct: 5 },
      { step: 20, dur: 2, degree: 4, oct: 5 },
      { step: 22, dur: 2, degree: 2, oct: 5 },
      { step: 24, dur: 8, degree: 0, oct: 5 },
      { step: 32, dur: 2, degree: 5, oct: 5 },
      { step: 34, dur: 2, degree: 4, oct: 5 },
      { step: 36, dur: 2, degree: 2, oct: 5 },
      { step: 38, dur: 2, degree: 0, oct: 5 },
      { step: 40, dur: 4, degree: 1, oct: 5 },
      { step: 48, dur: 12, degree: 0, oct: 5 },
      { step: 64, dur: 2, degree: 2, oct: 5 },
      { step: 66, dur: 2, degree: 4, oct: 5 },
      { step: 68, dur: 2, degree: 5, oct: 5 },
      { step: 70, dur: 2, degree: 7, oct: 5 },
      { step: 72, dur: 4, degree: 4, oct: 5 },
      { step: 80, dur: 2, degree: 5, oct: 5 },
      { step: 82, dur: 2, degree: 4, oct: 5 },
      { step: 84, dur: 2, degree: 2, oct: 5 },
      { step: 86, dur: 2, degree: 4, oct: 5 },
      { step: 88, dur: 8, degree: 0, oct: 5 },
      { step: 96, dur: 4, degree: 4, oct: 5 },
      { step: 100, dur: 4, degree: 2, oct: 5 },
      { step: 104, dur: 4, degree: 1, oct: 5 },
      { step: 108, dur: 4, degree: 0, oct: 5 },
      { step: 112, dur: 12, degree: 0, oct: 5 },
    ],
  },
  {
    id: "arp",
    name: "Arp",
    hint: "Chord cascade",
    kind: "arp",
  },
  {
    id: "call",
    name: "Call",
    hint: "Question and answer",
    kind: "composed",
    notes: [
      { step: 0, dur: 2, degree: 4, oct: 5 },
      { step: 4, dur: 2, degree: 5, oct: 5 },
      { step: 8, dur: 4, degree: 7, oct: 5 },
      { step: 16, dur: 2, degree: 5, oct: 5 },
      { step: 20, dur: 2, degree: 4, oct: 5 },
      { step: 24, dur: 8, degree: 2, oct: 5 },
      { step: 32, dur: 2, degree: 4, oct: 5 },
      { step: 36, dur: 2, degree: 2, oct: 5 },
      { step: 40, dur: 4, degree: 0, oct: 5 },
      { step: 48, dur: 12, degree: 0, oct: 4 },
      { step: 64, dur: 2, degree: 7, oct: 5 },
      { step: 68, dur: 2, degree: 5, oct: 5 },
      { step: 72, dur: 4, degree: 4, oct: 5 },
      { step: 80, dur: 2, degree: 5, oct: 5 },
      { step: 84, dur: 2, degree: 7, oct: 5 },
      { step: 88, dur: 8, degree: 9, oct: 5 },
      { step: 96, dur: 4, degree: 7, oct: 5 },
      { step: 100, dur: 4, degree: 5, oct: 5 },
      { step: 104, dur: 4, degree: 4, oct: 5 },
      { step: 112, dur: 12, degree: 2, oct: 5 },
    ],
  },
  {
    id: "drift",
    name: "Drift",
    hint: "Held tones",
    kind: "composed",
    notes: [
      { step: 0, dur: 24, degree: 4, oct: 5 },
      { step: 32, dur: 24, degree: 5, oct: 5 },
      { step: 64, dur: 24, degree: 2, oct: 5 },
      { step: 96, dur: 28, degree: 0, oct: 5 },
    ],
  },
  {
    id: "stabs",
    name: "Stabs",
    hint: "Backbeat punches",
    kind: "stabs",
  },
  {
    id: "climb",
    name: "Climb",
    hint: "Rising sequence",
    kind: "composed",
    notes: [
      { step: 0, dur: 2, degree: 0, oct: 5 },
      { step: 4, dur: 2, degree: 2, oct: 5 },
      { step: 8, dur: 2, degree: 4, oct: 5 },
      { step: 12, dur: 2, degree: 5, oct: 5 },
      { step: 16, dur: 2, degree: 1, oct: 5 },
      { step: 20, dur: 2, degree: 3, oct: 5 },
      { step: 24, dur: 2, degree: 5, oct: 5 },
      { step: 28, dur: 2, degree: 7, oct: 5 },
      { step: 32, dur: 2, degree: 2, oct: 5 },
      { step: 36, dur: 2, degree: 4, oct: 5 },
      { step: 40, dur: 2, degree: 6, oct: 5 },
      { step: 44, dur: 2, degree: 7, oct: 5 },
      { step: 48, dur: 8, degree: 9, oct: 5 },
      { step: 64, dur: 2, degree: 4, oct: 5 },
      { step: 68, dur: 2, degree: 5, oct: 5 },
      { step: 72, dur: 2, degree: 7, oct: 5 },
      { step: 76, dur: 2, degree: 9, oct: 5 },
      { step: 80, dur: 2, degree: 5, oct: 5 },
      { step: 84, dur: 2, degree: 7, oct: 5 },
      { step: 88, dur: 2, degree: 9, oct: 5 },
      { step: 92, dur: 2, degree: 11, oct: 5 },
      { step: 96, dur: 4, degree: 7, oct: 5 },
      { step: 104, dur: 4, degree: 4, oct: 5 },
      { step: 112, dur: 12, degree: 0, oct: 6 },
    ],
  },
];

export const FACE_PACKS = {
  chords: CHORD_FACES,
  bass: BASS_FACES,
  drums: DRUM_FACES,
  melody: MELODY_FACES,
} as const;

export function faceName(stem: keyof typeof FACE_PACKS, index: number): string {
  return FACE_PACKS[stem][index]!.name;
}

export function faceHint(stem: keyof typeof FACE_PACKS, index: number): string {
  return FACE_PACKS[stem][index]!.hint;
}
