import { buildArrangement, type Arrangement } from "./arrange";
import {
  createMixer,
  duckPad,
  playBass,
  playChord,
  playHat,
  playKick,
  playMelody,
  playSnare,
  setBusGain,
  setDelayForBpm,
  type Mixer,
} from "./synth";
import { STEPS_PER_BAR, TOTAL_STEPS, stepDuration, type StemId } from "./theory";
import type { Mode } from "./theory";

export type MixerState = {
  volumes: Record<StemId, number>;
  muted: Record<StemId, boolean>;
  solo: StemId | null;
};

export type EngineSnapshot = {
  tonic: number;
  mode: Mode;
  faces: Record<StemId, number>;
  bpm: number;
  swing: number;
  mixer: MixerState;
};

type StepListener = (step: number, playing: boolean) => void;

function audible(mixer: MixerState, stem: StemId): boolean {
  if (mixer.muted[stem]) return false;
  if (mixer.solo && mixer.solo !== stem) return false;
  return true;
}

function scheduleStep(
  ctx: BaseAudioContext,
  mix: Mixer,
  arr: Arrangement,
  step: number,
  time: number,
  stepDur: number,
  mixerState: MixerState,
) {
  const vol = mixerState.volumes;
  for (const ch of arr.chords) {
    if (ch.step === step && audible(mixerState, "chords")) {
      playChord(ctx, mix.chords, time, ch.notes, ch.dur * stepDur * 0.98, vol.chords);
    }
  }
  for (const n of arr.bass) {
    if (n.step === step && audible(mixerState, "bass")) {
      playBass(ctx, mix.bass, time, n.note, n.dur * stepDur * 0.92, n.vel * vol.bass);
    }
  }
  for (const n of arr.melody) {
    if (n.step === step && audible(mixerState, "melody")) {
      playMelody(ctx, mix.melody, time, n.note, n.dur * stepDur * 0.9, n.vel * vol.melody);
    }
  }
  if (audible(mixerState, "drums")) {
    for (const d of arr.drums) {
      if (d.step !== step) continue;
      const t = time + d.offset * stepDur;
      const v = d.vel * vol.drums;
      if (d.kind === "kick") {
        playKick(ctx, mix.drums, t, v);
        if (audible(mixerState, "chords")) duckPad(mix, t);
      } else if (d.kind === "snare") {
        playSnare(ctx, mix.drums, t, v);
      } else {
        playHat(ctx, mix.drums, t, v, d.kind === "open");
      }
    }
  }
}

export function scheduleAll(
  ctx: BaseAudioContext,
  mix: Mixer,
  arr: Arrangement,
  bpm: number,
  swing: number,
  mixerState: MixerState,
  origin: number,
) {
  const stepDur = stepDuration(bpm);
  setDelayForBpm(mix, bpm, origin);
  for (let step = 0; step < TOTAL_STEPS; step++) {
    const barStep = step % STEPS_PER_BAR;
    const swingDelay = barStep % 2 === 1 ? stepDur * swing * 0.58 : 0;
    const time = origin + step * stepDur + swingDelay;
    scheduleStep(ctx, mix, arr, step, time, stepDur, mixerState);
  }
}

class SongEngine {
  ctx: AudioContext | null = null;
  mix: Mixer | null = null;
  playing = false;
  currentStep = 0;
  nextNoteTime = 0;
  timer: number | null = null;
  snapshot: EngineSnapshot | null = null;
  arrangement: Arrangement | null = null;
  listeners = new Set<StepListener>();
  unlocked = false;

  unlock() {
    if (typeof window === "undefined") return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC({ latencyHint: "interactive" });
        this.mix = createMixer(this.ctx);
      }
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {});
      }
      this.unlocked = true;
    } catch {
      /* Preview iframes can block AudioContext; retry on the next gesture. */
    }
  }

  setSnapshot(snap: EngineSnapshot) {
    this.snapshot = snap;
    this.arrangement = buildArrangement({
      tonic: snap.tonic,
      mode: snap.mode,
      faces: snap.faces,
    });
    if (this.ctx && this.mix) {
      setDelayForBpm(this.mix, snap.bpm, this.ctx.currentTime);
      this.applyMixer();
    }
  }

  applyMixer() {
    if (!this.ctx || !this.mix || !this.snapshot) return;
    const t = this.ctx.currentTime;
    const { volumes, muted, solo } = this.snapshot.mixer;
    (["chords", "bass", "drums", "melody"] as StemId[]).forEach((stem) => {
      const on = audible({ volumes, muted, solo }, stem);
      const node =
        stem === "chords"
          ? this.mix!.chords
          : stem === "bass"
            ? this.mix!.bass
            : stem === "drums"
              ? this.mix!.drums
              : this.mix!.melody;
      setBusGain(node, on ? 1 : 0, t);
    });
  }

  subscribe(fn: StepListener) {
    this.listeners.add(fn);
    fn(this.currentStep, this.playing);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    for (const fn of this.listeners) fn(this.currentStep, this.playing);
  }

  play() {
    this.unlock();
    if (!this.ctx || !this.mix || !this.arrangement || !this.snapshot) return;
    if (this.playing) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.playing = true;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    this.timer = window.setInterval(() => this.tick(), 25);
    this.emit();
  }

  stop() {
    this.playing = false;
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.currentStep = 0;
    this.emit();
  }

  toggle() {
    if (this.playing) this.stop();
    else this.play();
  }

  private tick() {
    if (!this.playing || !this.ctx || !this.mix || !this.arrangement || !this.snapshot) return;
    const stepDur = stepDuration(this.snapshot.bpm);
    const swing = this.snapshot.swing;
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      const step = this.currentStep;
      const swingDelay = step % 2 === 1 ? stepDur * swing * 0.58 : 0;
      scheduleStep(
        this.ctx,
        this.mix,
        this.arrangement,
        step,
        this.nextNoteTime + swingDelay,
        stepDur,
        this.snapshot.mixer,
      );
      this.nextNoteTime += stepDur;
      this.currentStep = (this.currentStep + 1) % TOTAL_STEPS;
      this.emit();
    }
  }
}

export const engine = new SongEngine();

export function bindVisibility() {
  if (typeof document === "undefined") return () => {};
  const onVis = () => {
    if (document.visibilityState === "visible" && engine.ctx?.state === "suspended") {
      void engine.ctx.resume();
    }
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("focus", onVis);
  return () => {
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("focus", onVis);
  };
}
