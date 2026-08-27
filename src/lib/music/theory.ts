export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type Mode = "major" | "minor";
export type Quality = "maj" | "min" | "dim" | "dom7";
export type StemId = "chords" | "bass" | "drums" | "melody";

export const STEMS: StemId[] = ["chords", "bass", "drums", "melody"];

export const STEM_LABEL: Record<StemId, string> = {
  chords: "Chords",
  bass: "Bass",
  drums: "Drums",
  melody: "Melody",
};

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const MAJOR_QUAL: Quality[] = ["maj", "min", "min", "maj", "maj", "min", "dim"];
const MINOR_QUAL: Quality[] = ["min", "dim", "maj", "min", "min", "maj", "maj"];

export function scaleIntervals(mode: Mode): number[] {
  return mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
}

export function diatonicQuality(mode: Mode, degree: number): Quality {
  const table = mode === "major" ? MAJOR_QUAL : MINOR_QUAL;
  return table[((degree % 7) + 7) % 7]!;
}

export function degreeToPc(tonic: number, mode: Mode, degree: number): number {
  const scale = scaleIntervals(mode);
  const oct = Math.floor(degree / 7);
  const d = ((degree % 7) + 7) % 7;
  return (((tonic + scale[d]! + oct * 12) % 12) + 12) % 12;
}

export function degreeToMidi(
  tonic: number,
  mode: Mode,
  degree: number,
  octave: number,
): number {
  const scale = scaleIntervals(mode);
  const extra = Math.floor(degree / 7);
  const d = ((degree % 7) + 7) % 7;
  return tonic + (octave + extra) * 12 + scale[d]!;
}

export function chordTones(quality: Quality): number[] {
  switch (quality) {
    case "maj":
      return [0, 4, 7];
    case "min":
      return [0, 3, 7];
    case "dim":
      return [0, 3, 6];
    case "dom7":
      return [0, 4, 7, 10];
  }
}

export function voiceChord(rootMidi: number, quality: Quality): number[] {
  const tones = chordTones(quality);
  const notes = tones.map((t) => rootMidi + t);
  if (notes[0]! < 52) {
    return notes.map((n) => n + 12);
  }
  if (notes[0]! > 64) {
    return notes.map((n) => n - 12);
  }
  return notes;
}

const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
const FLAT_MAJOR = new Set([5, 10, 3, 8, 1, 6]);
const FLAT_MINOR = new Set([2, 7, 0, 5, 10, 3]);

export function preferFlats(tonic: number, mode: Mode): boolean {
  return mode === "major" ? FLAT_MAJOR.has(tonic) : FLAT_MINOR.has(tonic);
}

export function pcName(pc: number, flats = false): string {
  const n = ((pc % 12) + 12) % 12;
  return flats ? FLAT_NAMES[n]! : NOTE_NAMES[n]!;
}

export function chordSymbol(rootPc: number, quality: Quality, flats = false): string {
  const name = pcName(rootPc, flats);
  switch (quality) {
    case "maj":
      return name;
    case "min":
      return `${name}m`;
    case "dim":
      return `${name}dim`;
    case "dom7":
      return `${name}7`;
  }
}

export function romanFor(degree: number, quality: Quality): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const n = numerals[((degree % 7) + 7) % 7]!;
  if (quality === "min" || quality === "dim") return n.toLowerCase() + (quality === "dim" ? "°" : "");
  if (quality === "dom7") return n + "7";
  return n;
}

export function keyLabel(tonic: number, mode: Mode): string {
  return `${pcName(tonic, preferFlats(tonic, mode))} ${mode === "major" ? "major" : "minor"}`;
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export const STEPS_PER_BAR = 16;
export const BARS = 8;
export const TOTAL_STEPS = STEPS_PER_BAR * BARS;

export function stepDuration(bpm: number): number {
  return 60 / bpm / 4;
}

export function arrangementDuration(bpm: number): number {
  return BARS * 4 * (60 / bpm);
}
