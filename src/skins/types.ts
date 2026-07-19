import type { Phase } from '../timer/engine';

export interface SkinProps {
  phase: Phase;
  remainingSec: number;
  totalSec: number;
  isRunning: boolean;
  onToggle(): void;
}

export function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
