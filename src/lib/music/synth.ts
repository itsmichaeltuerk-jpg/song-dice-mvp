import { midiToFreq } from "./theory";

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

function later(ctx: BaseAudioContext, time: number, dur: number, cleanup: () => void) {
  if (typeof window === "undefined") return;
  if (!(ctx instanceof AudioContext)) return;
  const wait = Math.max(0, time + dur - ctx.currentTime) * 1000 + 40;
  window.setTimeout(cleanup, wait);
}

export function playKick(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  vel: number,
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(148, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);
  const click = ctx.createOscillator();
  click.type = "square";
  click.frequency.setValueAtTime(90, time);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vel * 0.95, time + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.0001, time);
  cg.gain.exponentialRampToValueAtTime(vel * 0.18, time + 0.001);
  cg.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
  osc.connect(g);
  click.connect(cg);
  g.connect(dest);
  cg.connect(dest);
  osc.start(time);
  click.start(time);
  osc.stop(time + 0.46);
  click.stop(time + 0.04);
  later(ctx, time, 0.5, () => {
    osc.disconnect();
    click.disconnect();
    g.disconnect();
    cg.disconnect();
  });
}

export function playSnare(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  vel: number,
) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1800, time);
  bp.Q.value = 0.9;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, time);
  ng.gain.exponentialRampToValueAtTime(vel * 0.55, time + 0.003);
  ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(186, time);
  body.frequency.exponentialRampToValueAtTime(110, time + 0.08);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0.0001, time);
  bg.gain.exponentialRampToValueAtTime(vel * 0.28, time + 0.002);
  bg.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  noise.connect(bp);
  bp.connect(ng);
  ng.connect(dest);
  body.connect(bg);
  bg.connect(dest);
  noise.start(time);
  body.start(time);
  noise.stop(time + 0.22);
  body.stop(time + 0.14);
  later(ctx, time, 0.3, () => {
    noise.disconnect();
    bp.disconnect();
    ng.disconnect();
    body.disconnect();
    bg.disconnect();
  });
}

export function playHat(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  vel: number,
  open: boolean,
) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(open ? 5400 : 7800, time);
  const g = ctx.createGain();
  const dur = open ? 0.28 : 0.045;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vel * (open ? 0.28 : 0.2), time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  noise.connect(hp);
  hp.connect(g);
  g.connect(dest);
  noise.start(time);
  noise.stop(time + dur + 0.02);
  later(ctx, time, dur + 0.05, () => {
    noise.disconnect();
    hp.disconnect();
    g.disconnect();
  });
}

export function playBass(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  midi: number,
  durSec: number,
  vel: number,
) {
  const freq = midiToFreq(midi);
  const saw = ctx.createOscillator();
  saw.type = "sawtooth";
  saw.frequency.setValueAtTime(freq, time);
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(freq / 2, time);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(720, time);
  filter.frequency.exponentialRampToValueAtTime(220, time + Math.min(0.18, durSec * 0.4));
  const g = ctx.createGain();
  const peak = vel * 0.32;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.008);
  g.gain.setValueAtTime(peak * 0.75, time + Math.max(0.05, durSec - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, time + durSec);
  saw.connect(filter);
  filter.connect(g);
  sub.connect(g);
  g.connect(dest);
  saw.start(time);
  sub.start(time);
  saw.stop(time + durSec + 0.02);
  sub.stop(time + durSec + 0.02);
  later(ctx, time, durSec + 0.05, () => {
    saw.disconnect();
    sub.disconnect();
    filter.disconnect();
    g.disconnect();
  });
}

export function playChord(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  midis: number[],
  durSec: number,
  vel: number,
) {
  const g = ctx.createGain();
  const peak = vel * 0.07;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(peak, time + 0.04);
  g.gain.setValueAtTime(peak * 0.85, time + durSec - 0.08);
  g.gain.linearRampToValueAtTime(0.0001, time + durSec);
  g.connect(dest);
  const oscs: OscillatorNode[] = [];
  const filters: BiquadFilterNode[] = [];
  midis.forEach((midi, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const detune = (i - (midis.length - 1) / 2) * 7;
    osc.frequency.setValueAtTime(midiToFreq(midi), time);
    osc.detune.setValueAtTime(detune, time);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1400, time);
    osc.connect(lp);
    lp.connect(g);
    osc.start(time);
    osc.stop(time + durSec + 0.02);
    oscs.push(osc);
    filters.push(lp);
  });
  later(ctx, time, durSec + 0.05, () => {
    oscs.forEach((o) => o.disconnect());
    filters.forEach((f) => f.disconnect());
    g.disconnect();
  });
}

export function playMelody(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  midi: number,
  durSec: number,
  vel: number,
) {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(midiToFreq(midi), time);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2600, time);
  lp.frequency.exponentialRampToValueAtTime(900, time + Math.min(durSec, 0.25));
  const g = ctx.createGain();
  const peak = vel * 0.22;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.01);
  g.gain.exponentialRampToValueAtTime(peak * 0.55, time + Math.min(0.12, durSec * 0.4));
  g.gain.setValueAtTime(peak * 0.4, time + Math.max(0.04, durSec - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, time + durSec);
  osc.connect(lp);
  lp.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + durSec + 0.02);
  later(ctx, time, durSec + 0.05, () => {
    osc.disconnect();
    lp.disconnect();
    g.disconnect();
  });
}

export type Mixer = {
  master: GainNode;
  compressor: DynamicsCompressorNode;
  chords: GainNode;
  duck: GainNode;
  bass: GainNode;
  drums: GainNode;
  melody: GainNode;
  melodyDelay: DelayNode;
  melodyDelayGain: GainNode;
};

export function createMixer(ctx: BaseAudioContext): Mixer {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 12;
  compressor.ratio.value = 3.2;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.18;
  compressor.connect(master);
  master.connect(ctx.destination);

  const mk = () => {
    const g = ctx.createGain();
    g.gain.value = 1;
    return g;
  };

  const chords = mk();
  const duck = mk();
  const bass = mk();
  const drums = mk();
  const melody = mk();

  chords.connect(duck);
  duck.connect(compressor);
  bass.connect(compressor);
  drums.connect(compressor);
  melody.connect(compressor);

  const melodyDelay = ctx.createDelay(1);
  melodyDelay.delayTime.value = 0.25;
  const melodyDelayGain = ctx.createGain();
  melodyDelayGain.gain.value = 0.18;
  melody.connect(melodyDelay);
  melodyDelay.connect(melodyDelayGain);
  melodyDelayGain.connect(compressor);

  return { master, compressor, chords, duck, bass, drums, melody, melodyDelay, melodyDelayGain };
}

export function duckPad(mixer: Mixer, time: number) {
  const g = mixer.duck.gain;
  g.cancelScheduledValues(time);
  g.setValueAtTime(Math.max(0.35, g.value), time);
  g.linearRampToValueAtTime(0.38, time + 0.02);
  g.linearRampToValueAtTime(1, time + 0.18);
}

export function setBusGain(node: GainNode, value: number, time: number) {
  node.gain.setTargetAtTime(Math.max(0, value), time, 0.03);
}

export function setDelayForBpm(mixer: Mixer, bpm: number, time: number) {
  const eighth = 60 / bpm / 2;
  mixer.melodyDelay.delayTime.setTargetAtTime(eighth, time, 0.05);
}
