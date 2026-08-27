import {
  BASS_FACES,
  CHORD_FACES,
  DRUM_FACES,
  MELODY_FACES,
  type BassFace,
  type ChordFace,
  type DrumFace,
  type MelodyFace,
} from "./patterns";
import {
  BARS,
  STEPS_PER_BAR,
  TOTAL_STEPS,
  chordSymbol,
  chordTones,
  degreeToMidi,
  degreeToPc,
  diatonicQuality,
  keyLabel,
  preferFlats,
  romanFor,
  type Mode,
  type Quality,
  type StemId,
} from "./theory";

export type Faces = Record<StemId, number>;

export type ChordEvent = {
  step: number;
  dur: number;
  notes: number[];
  root: number;
  quality: Quality;
  symbol: string;
  roman: string;
};

export type NoteEvent = {
  step: number;
  dur: number;
  note: number;
  vel: number;
};

export type DrumKind = "kick" | "snare" | "hat" | "open";

export type DrumEvent = {
  step: number;
  offset: number;
  kind: DrumKind;
  vel: number;
};

export type Arrangement = {
  chords: ChordEvent[];
  bass: NoteEvent[];
  melody: NoteEvent[];
  drums: DrumEvent[];
  chordChart: string[];
};

export type Session = {
  tonic: number;
  mode: Mode;
  faces: Faces;
};

function clampFace(n: number): number {
  return ((n % 6) + 6) % 6;
}

export function chordFace(index: number): ChordFace {
  return CHORD_FACES[clampFace(index)]!;
}
export function bassFace(index: number): BassFace {
  return BASS_FACES[clampFace(index)]!;
}
export function drumFace(index: number): DrumFace {
  return DRUM_FACES[clampFace(index)]!;
}
export function melodyFace(index: number): MelodyFace {
  return MELODY_FACES[clampFace(index)]!;
}

function resolveQuality(mode: Mode, degree: number, override?: Quality): Quality {
  return override ?? diatonicQuality(mode, degree);
}

function chordRootMidi(tonic: number, mode: Mode, degree: number): number {
  return degreeToMidi(tonic, mode, degree, 4);
}

export function buildArrangement(session: Session): Arrangement {
  const { tonic, mode, faces } = session;
  const cf = chordFace(faces.chords);
  const bf = bassFace(faces.bass);
  const df = drumFace(faces.drums);
  const mf = melodyFace(faces.melody);

  const slots = cf.slots;
  const barsPerChord = BARS / slots.length;
  const stepsPerChord = barsPerChord * STEPS_PER_BAR;

  const chords: ChordEvent[] = slots.map((slot, i) => {
    const quality = resolveQuality(mode, slot.degree, slot.quality);
    const root = chordRootMidi(tonic, mode, slot.degree);
    const notes = chordTones(quality).map((t) => {
      let n = root + t;
      while (n < 52) n += 12;
      while (n > 67) n -= 12;
      return n;
    });
    if (notes.length === 3) notes.push(notes[0]! + 12);
    const rootPc = degreeToPc(tonic, mode, slot.degree);
    const flats = preferFlats(tonic, mode);
    return {
      step: i * stepsPerChord,
      dur: stepsPerChord,
      notes,
      root,
      quality,
      symbol: chordSymbol(rootPc, quality, flats),
      roman: romanFor(slot.degree, quality),
    };
  });

  const chordChart: string[] = [];
  for (const c of chords) {
    const bars = c.dur / STEPS_PER_BAR;
    for (let i = 0; i < bars; i++) chordChart.push(c.symbol);
  }

  const chordAt = (step: number) => {
    for (let i = chords.length - 1; i >= 0; i--) {
      if (step >= chords[i]!.step) return chords[i]!;
    }
    return chords[0]!;
  };

  const bass: NoteEvent[] = [];
  for (let cycle = 0; cycle < BARS / 2; cycle++) {
    const base = cycle * 32;
    for (const ev of bf.phrase) {
      const step = base + ev.step;
      if (step >= TOTAL_STEPS) continue;
      const ch = chordAt(step);
      const intervals = chordTones(ch.quality);
      const tone = intervals[Math.min(ev.tone, intervals.length - 1)] ?? 0;
      let note = ch.root - 24 + tone + ev.oct * 12;
      while (note > 48) note -= 12;
      while (note < 28) note += 12;
      bass.push({ step, dur: ev.dur, note, vel: 0.85 });
    }
  }

  const drums: DrumEvent[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const isFill = bar === BARS - 1;
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      const step = bar * STEPS_PER_BAR + s;
      const kick = df.kick[s] ?? 0;
      const snare = df.snare[s] ?? 0;
      const hat = df.hat[s] ?? 0;
      const open = df.open[s] ?? 0;
      if (kick) drums.push({ step, offset: 0, kind: "kick", vel: kick });
      if (snare) drums.push({ step, offset: 0, kind: "snare", vel: isFill && s >= 12 ? 1 : snare });
      if (hat) drums.push({ step, offset: 0, kind: "hat", vel: hat * (isFill ? 1.05 : 1) });
      if (open) drums.push({ step, offset: 0, kind: "open", vel: open });
      if (df.extra === "trap32" && hat && s % 1 === 0) {
        drums.push({ step, offset: 0.5, kind: "hat", vel: hat * 0.55 });
      }
      if (isFill && s >= 12 && s % 2 === 0) {
        drums.push({ step, offset: 0, kind: "snare", vel: 0.7 });
      }
    }
  }

  const melody: NoteEvent[] = [];
  if (mf.kind === "composed" && mf.notes) {
    for (const n of mf.notes) {
      melody.push({
        step: n.step,
        dur: n.dur,
        note: degreeToMidi(tonic, mode, n.degree, n.oct) + 12,
        vel: 0.78,
      });
    }
  } else if (mf.kind === "arp") {
    for (const ch of chords) {
      const seq = [0, 1, 2, 3, 2, 1];
      const span = ch.dur;
      for (let i = 0; i < span; i++) {
        const idx = seq[i % seq.length]!;
        const note = ch.notes[idx % ch.notes.length]! + 12;
        melody.push({ step: ch.step + i, dur: 1, note, vel: 0.55 + (i % 4 === 0 ? 0.15 : 0) });
      }
    }
  } else if (mf.kind === "stabs") {
    for (let bar = 0; bar < BARS; bar++) {
      for (const beat of [4, 12]) {
        const step = bar * STEPS_PER_BAR + beat;
        const ch = chordAt(step);
        melody.push({
          step,
          dur: 2,
          note: ch.notes[1]! + 12,
          vel: 0.82,
        });
        melody.push({
          step,
          dur: 2,
          note: ch.notes[0]! + 12,
          vel: 0.7,
        });
      }
    }
  }

  return { chords, bass, melody, drums, chordChart };
}

export function summaryLines(session: Session, bpm: number, swing: number): string[] {
  const arr = buildArrangement(session);
  const cf = chordFace(session.faces.chords);
  const bf = bassFace(session.faces.bass);
  const df = drumFace(session.faces.drums);
  const mf = melodyFace(session.faces.melody);
  const swingPct = Math.round(swing * 100);
  return [
    `Song Dice · ${keyLabel(session.tonic, session.mode)} · ${bpm} BPM · 8 bars`,
    `Chords  ${cf.name.padEnd(12)} ${cf.hint.padEnd(16)} ${arr.chordChart.filter((_, i) => i % 2 === 0).join("  ")}`,
    `Bass    ${bf.name.padEnd(12)} ${bf.hint}`,
    `Drums   ${df.name.padEnd(12)} ${df.hint}`,
    `Melody  ${mf.name.padEnd(12)} ${mf.hint}`,
    swingPct ? `Swing   ${swingPct}%` : `Swing   straight`,
  ];
}
