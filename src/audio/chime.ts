import type { Phase } from '../timer/engine';

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function note(ac: AudioContext, freq: number, at: number, dur: number): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** enteredPhase: 今から始まるフェーズ。break=下降(ほっと一息)、work=上昇(始めるぞ) */
export function playChime(enteredPhase: Phase): void {
  const ac = ensureCtx();
  void ac.resume();
  const seq = enteredPhase === 'break'
    ? [1046.5, 784.0, 659.3]
    : [523.3, 659.3, 784.0, 1046.5];
  const t0 = ac.currentTime + 0.05;
  seq.forEach((f, i) => note(ac, f, t0 + i * 0.16, 0.5));
}
