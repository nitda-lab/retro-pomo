import { describe, expect, test } from 'bun:test';
import { createTimer, toggle, reset, setConfig, remainingMs, tick } from './engine';

const CFG = { workMin: 25, breakMin: 5 };
const MIN = 60_000;

describe('createTimer', () => {
  test('idle work フル残り時間で開始', () => {
    const s = createTimer(CFG);
    expect(s.phase).toBe('work');
    expect(s.status).toBe('idle');
    expect(remainingMs(s, 999)).toBe(25 * MIN);
  });
});

describe('toggle', () => {
  test('start後は経過分だけ残りが減る', () => {
    const s = toggle(createTimer(CFG), 1000);
    expect(s.status).toBe('running');
    expect(remainingMs(s, 1000 + 3 * MIN)).toBe(22 * MIN);
  });
  test('pauseで残りが凍結、resumeで続きから', () => {
    let s = toggle(createTimer(CFG), 0);
    s = toggle(s, 5 * MIN); // pause: 残20分
    expect(s.status).toBe('paused');
    expect(remainingMs(s, 100 * MIN)).toBe(20 * MIN);
    s = toggle(s, 100 * MIN); // resume
    expect(remainingMs(s, 101 * MIN)).toBe(19 * MIN);
  });
});

describe('tick', () => {
  test('残り>0では何も起きない', () => {
    const s = toggle(createTimer(CFG), 0);
    const r = tick(s, 10 * MIN);
    expect(r.phaseChanged).toBe(false);
    expect(r.state).toBe(s);
  });
  test('work満了でbreakへ、超過分は持ち越し', () => {
    const s = toggle(createTimer(CFG), 0);
    const r = tick(s, 25 * MIN + 30_000); // 30秒超過
    expect(r.phaseChanged).toBe(true);
    expect(r.state.phase).toBe('break');
    expect(remainingMs(r.state, 25 * MIN + 30_000)).toBe(5 * MIN - 30_000);
  });
  test('スリープ相当の大ジャンプで複数フェーズを正しくロールオーバー', () => {
    const s = toggle(createTimer(CFG), 0);
    // 25+5+25=55分 + 1分 → 2回目のbreakの1分経過地点
    const now = 56 * MIN;
    const r = tick(s, now);
    expect(r.phaseChanged).toBe(true);
    expect(r.state.phase).toBe('break');
    expect(remainingMs(r.state, now)).toBe(4 * MIN);
  });
  test('idle/pausedでは満了時刻を過ぎても遷移しない', () => {
    const r = tick(createTimer(CFG), 999 * MIN);
    expect(r.phaseChanged).toBe(false);
  });
});

describe('reset / setConfig', () => {
  test('resetでidle work フルに戻る', () => {
    let s = toggle(createTimer(CFG), 0);
    s = reset(tick(s, 26 * MIN).state);
    expect(s.status).toBe('idle');
    expect(s.phase).toBe('work');
    expect(remainingMs(s, 0)).toBe(25 * MIN);
  });
  test('setConfigは新しい分数でリセットする', () => {
    const s = setConfig(toggle(createTimer(CFG), 0), { workMin: 50, breakMin: 10 });
    expect(s.status).toBe('idle');
    expect(remainingMs(s, 0)).toBe(50 * MIN);
  });
});
