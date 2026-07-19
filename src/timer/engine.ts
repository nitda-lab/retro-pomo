export type Phase = 'work' | 'break';
export type Status = 'idle' | 'running' | 'paused';

export interface TimerConfig { workMin: number; breakMin: number; }

export interface TimerState {
  phase: Phase;
  status: Status;
  /** running時: remainingMs を測った時刻 (epoch ms) */
  anchorAt: number;
  /** anchorAt 時点の残りms (idle/paused時はそのまま残り) */
  remainingMs: number;
  config: TimerConfig;
}

export function durationMs(phase: Phase, c: TimerConfig): number {
  return (phase === 'work' ? c.workMin : c.breakMin) * 60_000;
}

export function createTimer(config: TimerConfig): TimerState {
  return { phase: 'work', status: 'idle', anchorAt: 0, remainingMs: durationMs('work', config), config };
}

export function remainingMs(s: TimerState, now: number): number {
  if (s.status !== 'running') return s.remainingMs;
  return Math.max(0, s.remainingMs - (now - s.anchorAt));
}

export function toggle(s: TimerState, now: number): TimerState {
  if (s.status === 'running') {
    return { ...s, status: 'paused', remainingMs: remainingMs(s, now), anchorAt: now };
  }
  return { ...s, status: 'running', anchorAt: now };
}

export function reset(s: TimerState): TimerState {
  return createTimer(s.config);
}

export function setConfig(_s: TimerState, config: TimerConfig): TimerState {
  return createTimer(config);
}

export function tick(s: TimerState, now: number): { state: TimerState; phaseChanged: boolean } {
  if (s.status !== 'running') return { state: s, phaseChanged: false };
  let rem = s.remainingMs - (now - s.anchorAt);
  if (rem > 0) return { state: s, phaseChanged: false };
  let phase = s.phase;
  while (rem <= 0) {
    phase = phase === 'work' ? 'break' : 'work';
    rem += durationMs(phase, s.config);
  }
  return { state: { ...s, phase, anchorAt: now, remainingMs: rem }, phaseChanged: true };
}
