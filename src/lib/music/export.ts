import { buildArrangement, summaryLines, type Session } from "./arrange";
import { engine, scheduleAll, type MixerState } from "./engine";
import { createMixer } from "./synth";
import { TOTAL_STEPS, arrangementDuration, keyLabel, stepDuration } from "./theory";
import type { StemId } from "./theory";

function vlq(value: number): number[] {
  const bytes = [value & 0x7f];
  let v = value >> 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

type MidiEv = { tick: number; bytes: number[] };

function trackBytes(events: MidiEv[]): Uint8Array {
  events.sort((a, b) => a.tick - b.tick);
  const body: number[] = [];
  let last = 0;
  for (const ev of events) {
    body.push(...vlq(ev.tick - last));
    body.push(...ev.bytes);
    last = ev.tick;
  }
  body.push(...vlq(0), 0xff, 0x2f, 0x00);
  const len = body.length;
  const out = new Uint8Array(8 + len);
  out.set([0x4d, 0x54, 0x72, 0x6b, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
  out.set(body, 8);
  return out;
}

export function buildMidi(session: Session, bpm: number, swing: number): Uint8Array {
  const arr = buildArrangement(session);
  const ppq = 480;
  const stepTicks = ppq / 4;
  const tempo = Math.round(60_000_000 / bpm);

  const tempoTrack: MidiEv[] = [
    { tick: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff] },
    { tick: 0, bytes: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] },
  ];

  const swung = (step: number) => {
    const base = step * stepTicks;
    if (step % 2 === 1) return base + Math.round(stepTicks * swing * 0.58);
    return base;
  };

  const chords: MidiEv[] = [{ tick: 0, bytes: [0xc0, 89] }];
  for (const ch of arr.chords) {
    const on = swung(ch.step);
    const off = swung(Math.min(TOTAL_STEPS, ch.step + ch.dur));
    for (const n of ch.notes) {
      chords.push({ tick: on, bytes: [0x90, n, 64] });
      chords.push({ tick: off, bytes: [0x80, n, 0] });
    }
  }

  const bass: MidiEv[] = [{ tick: 0, bytes: [0xc1, 38] }];
  for (const n of arr.bass) {
    const on = swung(n.step);
    const off = swung(n.step + n.dur);
    bass.push({ tick: on, bytes: [0x91, n.note, Math.round(n.vel * 100)] });
    bass.push({ tick: off, bytes: [0x81, n.note, 0] });
  }

  const melody: MidiEv[] = [{ tick: 0, bytes: [0xc2, 81] }];
  for (const n of arr.melody) {
    const on = swung(n.step);
    const off = swung(n.step + n.dur);
    melody.push({ tick: on, bytes: [0x92, n.note, Math.round(n.vel * 100)] });
    melody.push({ tick: off, bytes: [0x82, n.note, 0] });
  }

  const drums: MidiEv[] = [];
  const drumMap = { kick: 36, snare: 38, hat: 42, open: 46 };
  for (const d of arr.drums) {
    const on = swung(d.step) + Math.round(d.offset * stepTicks);
    const note = drumMap[d.kind];
    drums.push({ tick: on, bytes: [0x99, note, Math.round(d.vel * 110)] });
    drums.push({ tick: on + 40, bytes: [0x89, note, 0] });
  }

  const tracks = [trackBytes(tempoTrack), trackBytes(chords), trackBytes(bass), trackBytes(melody), trackBytes(drums)];
  const header = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, tracks.length, (ppq >> 8) & 0xff, ppq & 0xff,
  ]);
  const total = tracks.reduce((n, t) => n + t.length, header.length);
  const out = new Uint8Array(total);
  out.set(header, 0);
  let offset = header.length;
  for (const t of tracks) {
    out.set(t, offset);
    offset += t.length;
  }
  return out;
}

function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const channels = buffer.numberOfChannels;
  const rate = buffer.sampleRate;
  const length = buffer.length;
  const dataSize = length * channels * 2;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const chans: Float32Array[] = [];
  for (let i = 0; i < channels; i++) chans.push(buffer.getChannelData(i));
  let o = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, chans[c]![i]!));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return ab;
}

export async function bounceWav(
  session: Session,
  bpm: number,
  swing: number,
  mixer: MixerState,
): Promise<ArrayBuffer> {
  const dur = arrangementDuration(bpm) + 1.2;
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * sampleRate), sampleRate);
  const mix = createMixer(ctx);
  mix.master.gain.value = 0.95;
  const arr = buildArrangement(session);
  scheduleAll(ctx, mix, arr, bpm, swing, mixer, 0.05);
  const rendered = await ctx.startRendering();
  return encodeWav(rendered);
}

export function fileBase(session: Session, bpm: number): string {
  return `song-dice-${keyLabel(session.tonic, session.mode).replace(" ", "-")}-${bpm}bpm`;
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function arrangementText(session: Session, bpm: number, swing: number): string {
  return summaryLines(session, bpm, swing).join("\n");
}

export function liveMixer(): MixerState {
  return (
    engine.snapshot?.mixer ?? {
      volumes: { chords: 1, bass: 1, drums: 1, melody: 1 },
      muted: { chords: false, bass: false, drums: false, melody: false },
      solo: null,
    }
  );
}

export const STEM_ORDER: StemId[] = ["chords", "bass", "drums", "melody"];

export { stepDuration };
