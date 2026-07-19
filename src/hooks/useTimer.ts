import { useEffect, useRef, useState } from 'react';
import {
  createTimer, remainingMs, reset as resetTimer, setConfig, tick, toggle as toggleTimer,
  type Phase, type TimerState,
} from '../timer/engine';
import { playChime } from '../audio/chime';
import { notifyPhase } from '../notify/notify';
import type { Settings } from '../store/settings';

export interface TimerView {
  phase: Phase;
  remainingSec: number;
  totalSec: number;
  isRunning: boolean;
  toggle(): void;
  reset(): void;
}

export function useTimer(settings: Settings): TimerView {
  const [state, setState] = useState<TimerState>(() =>
    createTimer({ workMin: settings.workMin, breakMin: settings.breakMin }));
  const [, setNowTick] = useState(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // 分数変更でリセット
  const cfgKey = `${settings.workMin}/${settings.breakMin}`;
  const prevCfg = useRef(cfgKey);
  useEffect(() => {
    if (prevCfg.current !== cfgKey) {
      prevCfg.current = cfgKey;
      setState(s => setConfig(s, { workMin: settings.workMin, breakMin: settings.breakMin }));
    }
  }, [cfgKey, settings.workMin, settings.breakMin]);

  useEffect(() => {
    const id = setInterval(() => {
      setState(s => {
        const { state: ns, phaseChanged } = tick(s, Date.now());
        if (phaseChanged) {
          const cfg = settingsRef.current;
          if (cfg.sound) playChime(ns.phase);
          if (cfg.notify) {
            void notifyPhase(ns.phase, cfg.lang, ns.phase === 'work' ? cfg.workMin : cfg.breakMin);
          }
        }
        return phaseChanged ? ns : s;
      });
      setNowTick(t => t + 1); // 表示更新用
    }, 250);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  return {
    phase: state.phase,
    remainingSec: Math.ceil(remainingMs(state, now) / 1000),
    totalSec: (state.phase === 'work' ? settings.workMin : settings.breakMin) * 60,
    isRunning: state.status === 'running',
    toggle: () => setState(s => toggleTimer(s, Date.now())),
    reset: () => setState(s => resetTimer(s)),
  };
}
