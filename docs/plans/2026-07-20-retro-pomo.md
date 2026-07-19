# retro-pomo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** レトロOSウィンドウ風デザインの常駐ポモドーロタイマー(Windows / Tauri 2)を4スキン切替・エッジリサイズ対応で完成させる。

**Architecture:** Tauri 2 の枠なし透過・常時最前面ウィンドウに、Vite + React 19 のフロントを載せる。タイマーはタイムスタンプ基準の純粋関数エンジン(bun test 対象)。4つのスキンは共通 props を受け取る交換可能コンポーネント。ネイティブ右クリックメニューで操作、ウィンドウの端ドラッグは onResized イベントから scale 値に変換して CSS transform で全体拡縮する。

**Tech Stack:** Tauri 2 (Rust), Vite, React 19, TypeScript, bun, 手書きCSS (Tailwind不使用), WebAudio

## Global Constraints

- スペック: `docs/specs/2026-07-20-retro-pomo-design.md` が一次情報
- ランタイム/パッケージ管理は **bun**(`C:\Users\smile\.bun\bin`)
- カラートークン(verbatim): cream `#EFE5D8` / paper `#F8F1E7` / maroon `#6E2B44` / orange `#E4643D` / yellow `#F3B94A` / mint `#A9D9B7` / blue `#6F9FD8` / teal `#4FA3A0` / red `#D95C48`
- フォント: `'Courier New', 'Consolas', monospace`。絵文字は UI に使わない(全モチーフ CSS 描画)
- 影はべた塗りオフセット(`box-shadow: Npx Npx 0 maroon`)。ぼかし影禁止
- Windows 通知は実装しない(音のみ)
- メッセージ copy (verbatim): B作業中 `DON'T THINK OF OTHER THINGS` / B休憩中 `TEA TIME!` / C作業中 `Focus is Loading_` / C休憩中 `TEA TIME_`(`_` は点滅カーソル)
- 完了報告前に `bun run typecheck` と `bun test` を green にする(CLAUDE.md 品質ルール)

---

### Task 1: プロジェクト scaffold + Tauri ウィンドウ設定

**Files:**
- Create: `C:\MyProject\retro-pomo\` 一式(create-tauri-app で生成後、既存 docs/ とマージ)
- Modify: `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `package.json`
- Delete: テンプレートのデモ UI (`src/App.css` の中身、`src/assets/`)

**Interfaces:**
- Produces: `bun run typecheck` / `bun test` / `bun run tauri dev` が動くプロジェクト土台

- [ ] **Step 1: scaffold**(retro-pomo に docs/ が既にあるため一時ディレクトリ経由)

```bash
cd /c/MyProject
bun create tauri-app retro-pomo-tmp --template react-ts --manager bun --yes
# 生成物を retro-pomo/ に移動(docs/ は保持)
(PowerShell) Get-ChildItem retro-pomo-tmp -Force | Move-Item -Destination retro-pomo
Remove-Item retro-pomo-tmp
cd retro-pomo && bun install
```

- [ ] **Step 2: `src-tauri/tauri.conf.json` の windows 設定を差し替え**

```json
"app": {
  "windows": [
    {
      "title": "retro-pomo",
      "label": "main",
      "width": 280,
      "height": 230,
      "minWidth": 100,
      "minHeight": 60,
      "decorations": false,
      "transparent": true,
      "shadow": false,
      "resizable": true,
      "alwaysOnTop": true,
      "skipTaskbar": false,
      "center": true
    }
  ],
  "security": { "csp": null }
}
```

- [ ] **Step 3: `src-tauri/capabilities/default.json` に権限追加**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-set-always-on-top",
    "core:window:allow-minimize",
    "core:window:allow-close",
    "core:window:allow-start-dragging",
    "core:menu:default"
  ]
}
```

- [ ] **Step 4: `package.json` に `"typecheck": "tsc --noEmit"` を scripts へ追加**

- [ ] **Step 5: 検証**

Run: `bun run typecheck` → PASS(エラー0)
Run: `cd src-tauri && cargo check` → PASS(初回は数分)

- [ ] **Step 6: git init + commit**

```bash
cd /c/MyProject/retro-pomo && git init && git add -A
git commit -m "chore: scaffold tauri2 + react19 project with frameless transparent window"
```

---

### Task 2: タイマーエンジン(TDD)

**Files:**
- Create: `src/timer/engine.ts`, `src/timer/engine.test.ts`

**Interfaces:**
- Produces:
  - `type Phase = 'work' | 'break'` / `type Status = 'idle' | 'running' | 'paused'`
  - `interface TimerConfig { workMin: number; breakMin: number }`
  - `interface TimerState { phase: Phase; status: Status; anchorAt: number; remainingMs: number; config: TimerConfig }`
  - `createTimer(config: TimerConfig): TimerState`
  - `toggle(s: TimerState, now: number): TimerState`(idle/paused→running、running→paused)
  - `reset(s: TimerState): TimerState`
  - `setConfig(s: TimerState, config: TimerConfig): TimerState`(リセットを伴う)
  - `remainingMs(s: TimerState, now: number): number`
  - `durationMs(phase: Phase, c: TimerConfig): number`
  - `tick(s: TimerState, now: number): { state: TimerState; phaseChanged: boolean }`

- [ ] **Step 1: 失敗するテストを書く** — `src/timer/engine.test.ts`

```ts
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
    s = toggle(s, 5 * MIN);            // pause: 残20分
    expect(s.status).toBe('paused');
    expect(remainingMs(s, 100 * MIN)).toBe(20 * MIN);
    s = toggle(s, 100 * MIN);          // resume
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
```

- [ ] **Step 2: 失敗確認** — Run: `bun test` → FAIL (`Cannot find module './engine'`)

- [ ] **Step 3: 実装** — `src/timer/engine.ts`

```ts
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

export function setConfig(s: TimerState, config: TimerConfig): TimerState {
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
```

- [ ] **Step 4: テスト green 確認** — Run: `bun test` → 9 pass / `bun run typecheck` → PASS

- [ ] **Step 5: Commit** — `git add src/timer && git commit -m "feat: pure timestamp-based pomodoro timer engine with sleep-safe rollover"`

---

### Task 3: 設定ストア(TDDでsanitize)+ WebAudioチャイム

**Files:**
- Create: `src/store/settings.ts`, `src/store/settings.test.ts`, `src/audio/chime.ts`

**Interfaces:**
- Produces:
  - `type Skin = 'A' | 'B' | 'C' | 'D'`
  - `interface Settings { workMin: number; breakMin: number; sound: boolean; skin: Skin; scale: number; alwaysOnTop: boolean; pos: { x: number; y: number } | null }`
  - `DEFAULTS: Settings`(25/5, sound:true, skin:'A', scale:1, alwaysOnTop:true, pos:null)
  - `sanitize(raw: unknown): Settings`(clamp: 分1〜180, scale 0.75〜2)
  - `loadSettings(): Settings` / `saveSettings(s: Settings): void`(key: `retro-pomo:v1`)
  - `playChime(enteredPhase: Phase): void`(break=下降音、work=上昇音。AudioContext遅延生成)

- [ ] **Step 1: 失敗するテスト** — `src/store/settings.test.ts`

```ts
import { describe, expect, test } from 'bun:test';
import { sanitize, DEFAULTS } from './settings';

describe('sanitize', () => {
  test('null/ゴミはDEFAULTSへ', () => {
    expect(sanitize(null)).toEqual(DEFAULTS);
    expect(sanitize('garbage')).toEqual(DEFAULTS);
  });
  test('正常値は通す', () => {
    const v = { workMin: 50, breakMin: 10, sound: false, skin: 'C', scale: 1.5, alwaysOnTop: false, pos: { x: 10, y: 20 } };
    expect(sanitize(v)).toEqual(v);
  });
  test('範囲外はclamp、不正skinはA', () => {
    const v = sanitize({ ...DEFAULTS, workMin: 0, breakMin: 999, scale: 9, skin: 'Z' });
    expect(v.workMin).toBe(1);
    expect(v.breakMin).toBe(180);
    expect(v.scale).toBe(2);
    expect(v.skin).toBe('A');
  });
});
```

- [ ] **Step 2: 失敗確認** — `bun test src/store` → FAIL

- [ ] **Step 3: 実装** — `src/store/settings.ts`

```ts
export type Skin = 'A' | 'B' | 'C' | 'D';

export interface Settings {
  workMin: number;
  breakMin: number;
  sound: boolean;
  skin: Skin;
  scale: number;
  alwaysOnTop: boolean;
  pos: { x: number; y: number } | null;
}

export const DEFAULTS: Settings = {
  workMin: 25, breakMin: 5, sound: true, skin: 'A', scale: 1, alwaysOnTop: true, pos: null,
};

const KEY = 'retro-pomo:v1';
const SKINS: Skin[] = ['A', 'B', 'C', 'D'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function sanitize(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULTS };
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const pos = r.pos as { x?: unknown; y?: unknown } | null | undefined;
  return {
    workMin: clamp(Math.round(num(r.workMin, DEFAULTS.workMin)), 1, 180),
    breakMin: clamp(Math.round(num(r.breakMin, DEFAULTS.breakMin)), 1, 180),
    sound: typeof r.sound === 'boolean' ? r.sound : DEFAULTS.sound,
    skin: SKINS.includes(r.skin as Skin) ? (r.skin as Skin) : DEFAULTS.skin,
    scale: clamp(num(r.scale, DEFAULTS.scale), 0.75, 2),
    alwaysOnTop: typeof r.alwaysOnTop === 'boolean' ? r.alwaysOnTop : DEFAULTS.alwaysOnTop,
    pos: pos && typeof pos.x === 'number' && typeof pos.y === 'number' ? { x: pos.x, y: pos.y } : null,
  };
}

export function loadSettings(): Settings {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
```

- [ ] **Step 4: チャイム実装** — `src/audio/chime.ts`(手動確認のみ。純関数部なしの薄い層)

```ts
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
```

- [ ] **Step 5: green 確認** — `bun test` → 12 pass / `bun run typecheck` → PASS

- [ ] **Step 6: Commit** — `git add src/store src/audio && git commit -m "feat: settings store with sanitize + webaudio retro chime"`

---

### Task 4: デザイントークンCSS + 共通レトロ部品 + useTimerフック + Appシェル

**Files:**
- Create: `src/styles.css`(トークン+リセット), `src/skins/shared.css`, `src/skins/shared.tsx`, `src/skins/types.ts`, `src/hooks/useTimer.ts`
- Modify: `src/App.tsx`(全面書換), `src/main.tsx`(styles.css import), 旧 `src/App.css` `src/assets/` 削除

**Interfaces:**
- Consumes: Task 2 engine 全API、Task 3 `Settings` `playChime`
- Produces:
  - `src/skins/types.ts`: `interface SkinProps { phase: Phase; remainingSec: number; totalSec: number; isRunning: boolean; onToggle(): void }` と `fmt(sec: number): string`("MM:SS")
  - `src/skins/shared.tsx`: `TitleDots()`, `Sparkle({ style?, size?, delay? })`
  - `src/hooks/useTimer.ts`: `useTimer(settings: Settings): { phase: Phase; remainingSec: number; totalSec: number; isRunning: boolean; toggle(): void; reset(): void }`(250ms間隔でtick、phaseChanged && settings.sound で playChime)
  - CSSクラス: `.retro-win` `.titlebar` `.dot/.dots` `.titlebar-text` `.timer-digits` `.pill` `.sparkle` `@keyframes twinkle`
  - App: `skinComponents: Record<Skin, ComponentType<SkinProps>>` にスキンを登録する構造(この時点ではプレースホルダdiv)

- [ ] **Step 1: `src/styles.css`**

```css
:root {
  --cream: #EFE5D8;
  --paper: #F8F1E7;
  --maroon: #6E2B44;
  --orange: #E4643D;
  --yellow: #F3B94A;
  --mint: #A9D9B7;
  --blue: #6F9FD8;
  --teal: #4FA3A0;
  --red: #D95C48;
  --font: 'Courier New', 'Consolas', monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
html, body, #root { background: transparent; overflow: hidden; height: 100%; }
body { font-family: var(--font); color: var(--maroon); }
.scale-root { transform-origin: top left; width: max-content; height: max-content; }
```

- [ ] **Step 2: `src/skins/shared.css`**

```css
.retro-win {
  background: var(--paper);
  border: 2px solid var(--maroon);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
.titlebar {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  border-bottom: 2px solid var(--maroon);
}
.dots { display: flex; gap: 6px; }
.dot { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--maroon); }
.dot.t { background: var(--teal); }
.dot.b { background: var(--blue); }
.dot.r { background: var(--red); }
.titlebar-text {
  margin-left: auto; font-size: 10px; font-weight: bold; letter-spacing: 1px;
}
.timer-digits {
  font-weight: bold; letter-spacing: 2px; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.pill {
  display: inline-block;
  border: 2px solid var(--maroon); border-radius: 999px;
  padding: 5px 22px;
  font-size: 11px; font-weight: bold; color: var(--maroon);
  font-family: var(--font);
  background: var(--paper);
  box-shadow: 0 3px 0 var(--maroon);
  cursor: pointer;
}
.pill:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--maroon); }
.sparkle {
  position: absolute;
  background: var(--yellow);
  clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%);
  animation: twinkle 1.8s ease-in-out infinite;
  pointer-events: none;
}
@keyframes twinkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(0.45) rotate(20deg); opacity: 0.5; }
}
@keyframes blink { 50% { opacity: 0; } }
```

- [ ] **Step 3: `src/skins/types.ts` と `src/skins/shared.tsx`**

```ts
// types.ts
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
```

```tsx
// shared.tsx
import type { CSSProperties } from 'react';
import './shared.css';

export function TitleDots() {
  return (
    <span className="dots">
      <i className="dot t" /><i className="dot b" /><i className="dot r" />
    </span>
  );
}

export function Sparkle({ style, size = 18, delay = 0 }: {
  style?: CSSProperties; size?: number; delay?: number;
}) {
  return (
    <span
      className="sparkle"
      style={{ ...style, width: size, height: size, animationDelay: `${delay}s` }}
    />
  );
}
```

- [ ] **Step 4: `src/hooks/useTimer.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import {
  createTimer, remainingMs, reset as resetTimer, setConfig, tick, toggle as toggleTimer,
  type Phase, type TimerState,
} from '../timer/engine';
import { playChime } from '../audio/chime';
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
  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;

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
        if (phaseChanged && soundRef.current) playChime(ns.phase);
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
```

- [ ] **Step 5: `src/App.tsx` 全面書換(スキンはプレースホルダ)+ `src/main.tsx` で `./styles.css` を import、`App.css`/`assets/` 削除**

```tsx
import { useState, type ComponentType } from 'react';
import { useTimer } from './hooks/useTimer';
import { loadSettings, saveSettings, type Settings, type Skin } from './store/settings';
import type { SkinProps } from './skins/types';

const Placeholder = ({ remainingSec }: SkinProps) => <div>{remainingSec}</div>;

export const skinComponents: Record<Skin, ComponentType<SkinProps>> = {
  A: Placeholder, B: Placeholder, C: Placeholder, D: Placeholder,
};

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const timer = useTimer(settings);
  const SkinComp = skinComponents[settings.skin];

  const update = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };
  void update; // Task 9/10 で使用

  return (
    <div className="scale-root" style={{ transform: `scale(${settings.scale})` }}>
      <SkinComp
        phase={timer.phase}
        remainingSec={timer.remainingSec}
        totalSec={timer.totalSec}
        isRunning={timer.isRunning}
        onToggle={timer.toggle}
      />
    </div>
  );
}
```

- [ ] **Step 6: 検証+Commit** — `bun run typecheck` → PASS / `bun test` → 12 pass。
  `git add -A && git commit -m "feat: design tokens, retro shared components, useTimer hook, app shell"`

---

### Task 5: スキンA(ログイン窓・フル再現+動き)

**Files:**
- Create: `src/skins/SkinA.tsx`, `src/skins/skinA.css`
- Modify: `src/App.tsx`(skinComponents.A 差し替え)

**Interfaces:**
- Consumes: `SkinProps`, `fmt`, `TitleDots`, `Sparkle`
- Produces: `SkinA: ComponentType<SkinProps>`。ルート要素サイズ 280×230(透過余白込み、Task 11 の BASE.A と一致必須)

- [ ] **Step 1: `src/skins/skinA.css`**

```css
.skin-a { position: relative; width: 280px; height: 230px; padding: 12px 18px 18px 12px; }
.skin-a .win {
  width: 250px;
  box-shadow: 5px 5px 0 0 var(--maroon);
}
.skin-a .titlebar { background: var(--yellow); }
.skin-a .face {
  width: 52px; height: 52px;
  background: var(--yellow);
  border: 2px solid var(--maroon); border-radius: 50%;
  margin: 14px auto 10px;
  position: relative;
  animation: bob 2.4s ease-in-out infinite;
}
@keyframes bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  30% { transform: translateY(-4px) rotate(-4deg); }
  60% { transform: translateY(0) rotate(3deg); }
}
.skin-a .eye {
  position: absolute; top: 17px;
  width: 6px; height: 9px;
  background: var(--maroon); border-radius: 50%;
}
.skin-a .eye.l { left: 13px; }
.skin-a .eye.r { right: 13px; }
.skin-a .mouth {
  position: absolute; left: 14px; bottom: 10px;
  width: 22px; height: 11px;
  border: 2.5px solid var(--maroon); border-top: none;
  border-radius: 0 0 22px 22px;
}
/* 休憩中: 目を閉じてリラックス */
.skin-a .face.break .eye { height: 3px; top: 21px; border-radius: 3px; width: 8px; }
.skin-a .face.break .mouth { width: 14px; height: 7px; left: 18px; }
.skin-a .field {
  border: 2px solid var(--maroon); border-radius: 999px;
  margin: 0 24px 10px;
  padding: 6px 0;
  text-align: center;
  background: var(--paper);
}
.skin-a .field .timer-digits { font-size: 26px; }
.skin-a .btn-row { text-align: center; margin-bottom: 8px; }
.skin-a .start { background: var(--blue); }
.skin-a .strip {
  height: 10px; width: 45%;
  background: var(--mint);
  border-top: 2px solid var(--maroon);
  border-right: 2px solid var(--maroon);
  border-radius: 0 6px 0 0;
}
```

- [ ] **Step 2: `src/skins/SkinA.tsx`**

```tsx
import { Sparkle, TitleDots } from './shared';
import { fmt, type SkinProps } from './types';
import './skinA.css';

export function SkinA({ phase, remainingSec, isRunning, onToggle }: SkinProps) {
  return (
    <div className="skin-a" data-tauri-drag-region>
      <Sparkle style={{ top: 0, left: 34 }} delay={0} />
      <Sparkle style={{ bottom: 4, right: 6 }} size={12} delay={0.9} />
      <div className="retro-win win" data-tauri-drag-region>
        <div className="titlebar" data-tauri-drag-region>
          <TitleDots />
          <span className="titlebar-text">POMO TIMER</span>
        </div>
        <div className={`face ${phase}`} data-tauri-drag-region>
          <span className="eye l" /><span className="eye r" /><span className="mouth" />
        </div>
        <div className="field" data-tauri-drag-region>
          <span className="timer-digits">{fmt(remainingSec)}</span>
        </div>
        <div className="btn-row">
          <button className="pill start" onClick={onToggle}>
            {isRunning ? 'PAUSE' : 'START'}
          </button>
        </div>
        <div className="strip" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx の skinComponents.A を `SkinA` に差し替え、Placeholder import 整理**

- [ ] **Step 4: 検証+Commit** — `bun run typecheck` → PASS。
  `git add -A && git commit -m "feat: skin A login-window with bobbing smiley and sparkles"`

---

### Task 6: スキンB(スタック・ダイアログ)

**Files:**
- Create: `src/skins/SkinB.tsx`, `src/skins/skinB.css`
- Modify: `src/App.tsx`(skinComponents.B)

**Interfaces:**
- Consumes: `SkinProps`, `fmt`
- Produces: `SkinB: ComponentType<SkinProps>`。ルート 250×180(BASE.B と一致必須)。copy verbatim: 作業中 `DON'T THINK OF OTHER THINGS` / 休憩中 `TEA TIME!`

- [ ] **Step 1: `src/skins/skinB.css`**

```css
.skin-b { position: relative; width: 250px; height: 180px; padding: 6px 26px 26px 4px; }
.skin-b .win {
  width: 220px;
  text-align: center;
  animation: stackpulse 3s ease-in-out infinite;
}
@keyframes stackpulse {
  0%, 100% { box-shadow: 6px 6px 0 -2px var(--paper), 6px 6px 0 0 var(--maroon), 12px 12px 0 -2px var(--paper), 12px 12px 0 0 var(--maroon), 18px 18px 0 -2px var(--paper), 18px 18px 0 0 var(--maroon); }
  50% { box-shadow: 5px 5px 0 -2px var(--paper), 5px 5px 0 0 var(--maroon), 11px 11px 0 -2px var(--paper), 11px 11px 0 0 var(--maroon), 16px 16px 0 -2px var(--paper), 16px 16px 0 0 var(--maroon); }
}
.skin-b .titlebar { background: var(--orange); justify-content: flex-end; }
.skin-b .xbox {
  width: 14px; height: 14px;
  border: 2px solid var(--maroon); border-radius: 3px;
  background: var(--paper);
  font-size: 9px; font-weight: bold; line-height: 10px;
  text-align: center;
}
.skin-b .msg {
  font-size: 10px; font-weight: bold;
  letter-spacing: 2px;
  margin: 14px 8px 6px;
  min-height: 12px;
}
.skin-b .timer-digits { font-size: 34px; }
.skin-b .sure { background: var(--orange); color: var(--paper); margin: 12px 0 16px; }
```

- [ ] **Step 2: `src/skins/SkinB.tsx`**

```tsx
import { fmt, type SkinProps } from './types';
import './skinB.css';

export function SkinB({ phase, remainingSec, isRunning, onToggle }: SkinProps) {
  return (
    <div className="skin-b" data-tauri-drag-region>
      <div className="retro-win win">
        <div className="titlebar" data-tauri-drag-region>
          <span className="xbox">×</span>
        </div>
        <div className="msg" data-tauri-drag-region>
          {phase === 'work' ? "DON'T THINK OF OTHER THINGS" : 'TEA TIME!'}
        </div>
        <div className="timer-digits" data-tauri-drag-region>{fmt(remainingSec)}</div>
        <div>
          <button className="pill sure" onClick={onToggle}>
            {isRunning ? 'PAUSE' : 'SURE'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx 登録 → 検証+Commit** — `bun run typecheck` → PASS。
  `git commit -am "feat: skin B stacked dialog with breathing afterimages"`

---

### Task 7: スキンC(ローディングバー横型)

**Files:**
- Create: `src/skins/SkinC.tsx`, `src/skins/skinC.css`
- Modify: `src/App.tsx`(skinComponents.C)

**Interfaces:**
- Consumes: `SkinProps`(進捗 = `1 - remainingSec/totalSec`), `fmt`, `TitleDots`
- Produces: `SkinC`。ルート 270×100(BASE.C と一致必須)。本体クリックで onToggle(タイトルバーはドラッグ専用)。copy verbatim: `Focus is Loading` / `TEA TIME` + 点滅 `_`

- [ ] **Step 1: `src/skins/skinC.css`**

```css
.skin-c { position: relative; width: 270px; height: 100px; padding: 2px 8px 8px 2px; }
.skin-c .win { width: 260px; box-shadow: 4px 4px 0 0 var(--maroon); cursor: pointer; }
.skin-c .titlebar { background: var(--mint); cursor: default; }
.skin-c .body { display: flex; align-items: center; gap: 12px; padding: 12px 16px 6px; }
.skin-c .timer-digits { font-size: 22px; }
.skin-c .track {
  flex: 1; height: 18px;
  border: 2px solid var(--maroon); border-radius: 5px;
  padding: 2px;
  overflow: hidden;
}
.skin-c .fill {
  height: 100%;
  background: repeating-linear-gradient(90deg, var(--maroon) 0 8px, transparent 8px 12px);
  transition: width 0.9s steps(3, end);
}
.skin-c .caption { font-size: 9px; padding: 0 16px 8px; font-weight: bold; }
.skin-c .cursor { animation: blink 1s steps(1) infinite; }
```

- [ ] **Step 2: `src/skins/SkinC.tsx`**

```tsx
import { TitleDots } from './shared';
import { fmt, type SkinProps } from './types';
import './skinC.css';

export function SkinC({ phase, remainingSec, totalSec, onToggle }: SkinProps) {
  const progress = totalSec > 0 ? Math.min(100, Math.max(2, (1 - remainingSec / totalSec) * 100)) : 0;
  return (
    <div className="skin-c" data-tauri-drag-region>
      <div className="retro-win win" onClick={onToggle}>
        <div className="titlebar" data-tauri-drag-region>
          <TitleDots />
          <span className="titlebar-text">Retro Pomo</span>
        </div>
        <div className="body">
          <span className="timer-digits">{fmt(remainingSec)}</span>
          <div className="track"><div className="fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="caption">
          {phase === 'work' ? 'Focus is Loading' : 'TEA TIME'}<span className="cursor">_</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx 登録 → 検証+Commit** — `bun run typecheck` → PASS。
  `git commit -am "feat: skin C loading-bar compact widget with segmented progress"`

---

### Task 8: スキンD(砂時計ミニ窓)

**Files:**
- Create: `src/skins/SkinD.tsx`, `src/skins/skinD.css`
- Modify: `src/App.tsx`(skinComponents.D、Placeholder削除)

**Interfaces:**
- Consumes: `SkinProps`, `fmt`, `Sparkle`
- Produces: `SkinD`。ルート 170×190(BASE.D と一致必須)。本体クリックで onToggle。砂時計反転アニメは `isRunning` 時のみ再生

- [ ] **Step 1: `src/skins/skinD.css`**

```css
.skin-d { position: relative; width: 170px; height: 190px; padding: 8px 12px 12px 4px; }
.skin-d .win { width: 150px; box-shadow: 4px 4px 0 0 var(--maroon); cursor: pointer; }
.skin-d .titlebar { background: var(--yellow); justify-content: center; cursor: default; }
.skin-d .titlebar-text { margin: 0; }
.skin-d .hg {
  margin: 14px auto 8px; width: 40px;
  animation: flip 4s ease-in-out infinite;
  animation-play-state: paused;
}
.skin-d .hg.running { animation-play-state: running; }
@keyframes flip {
  0%, 42% { transform: rotate(0deg); }
  50%, 92% { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
}
.skin-d .cap { height: 6px; background: var(--orange); border: 2px solid var(--maroon); border-radius: 3px; }
.skin-d .glass {
  width: 28px; height: 34px; margin: 0 auto;
  background: var(--blue);
  clip-path: polygon(0 0, 100% 0, 58% 50%, 100% 100%, 0 100%, 42% 50%);
}
.skin-d .timer-digits { font-size: 24px; text-align: center; display: block; margin-bottom: 12px; }
```

- [ ] **Step 2: `src/skins/SkinD.tsx`**

```tsx
import { Sparkle } from './shared';
import { fmt, type SkinProps } from './types';
import './skinD.css';

export function SkinD({ remainingSec, isRunning, onToggle }: SkinProps) {
  return (
    <div className="skin-d" data-tauri-drag-region>
      <Sparkle style={{ top: 0, right: 0 }} size={14} delay={0.5} />
      <div className="retro-win win" onClick={onToggle}>
        <div className="titlebar" data-tauri-drag-region>
          <span className="titlebar-text">POMO</span>
        </div>
        <div className={`hg ${isRunning ? 'running' : ''}`}>
          <div className="cap" /><div className="glass" /><div className="cap" />
        </div>
        <span className="timer-digits">{fmt(remainingSec)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx 登録(Placeholder 完全削除)→ 検証+Commit** — `bun run typecheck` → PASS。
  `git commit -am "feat: skin D hourglass mini window with flip animation"`

---

### Task 9: 設定ビュー + App 配線

**Files:**
- Create: `src/settings/SettingsView.tsx`, `src/settings/settingsView.css`
- Modify: `src/App.tsx`(view 切替 state)

**Interfaces:**
- Consumes: `Settings`, `sanitize`
- Produces:
  - `SettingsView({ settings, onSave, onClose }: { settings: Settings; onSave(patch: Partial<Settings>): void; onClose(): void })`
  - App: `openSettings()` を Task 10 のメニューから呼べるよう `useState<'timer'|'settings'>` を保持

- [ ] **Step 1: `src/settings/settingsView.css`**

```css
.settings { position: relative; width: 250px; padding: 2px 8px 8px 2px; }
.settings .win { width: 240px; box-shadow: 4px 4px 0 0 var(--maroon); }
.settings .titlebar { background: var(--blue); }
.settings .rows { padding: 14px 18px; display: grid; gap: 10px; }
.settings .row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
.settings input[type="number"] {
  width: 64px; padding: 4px 8px;
  border: 2px solid var(--maroon); border-radius: 999px;
  background: var(--paper); color: var(--maroon);
  font-family: var(--font); font-weight: bold; font-size: 12px;
  text-align: center; outline: none;
}
.settings .check {
  width: 18px; height: 18px;
  border: 2px solid var(--maroon); border-radius: 4px;
  background: var(--paper);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 12px; font-weight: bold;
}
.settings .check.on { background: var(--mint); }
.settings .btns { display: flex; gap: 10px; justify-content: center; padding-bottom: 14px; }
.settings .save { background: var(--blue); }
```

- [ ] **Step 2: `src/settings/SettingsView.tsx`**

```tsx
import { useState } from 'react';
import { TitleDots } from '../skins/shared';
import { sanitize, type Settings } from '../store/settings';
import './settingsView.css';

export function SettingsView({ settings, onSave, onClose }: {
  settings: Settings;
  onSave(patch: Partial<Settings>): void;
  onClose(): void;
}) {
  const [workMin, setWorkMin] = useState(String(settings.workMin));
  const [breakMin, setBreakMin] = useState(String(settings.breakMin));
  const [sound, setSound] = useState(settings.sound);

  const save = () => {
    const v = sanitize({ ...settings, workMin: Number(workMin), breakMin: Number(breakMin), sound });
    onSave({ workMin: v.workMin, breakMin: v.breakMin, sound: v.sound });
    onClose();
  };

  return (
    <div className="settings" data-tauri-drag-region>
      <div className="retro-win win">
        <div className="titlebar" data-tauri-drag-region>
          <TitleDots />
          <span className="titlebar-text">SETTINGS</span>
        </div>
        <div className="rows">
          <label className="row">WORK MIN
            <input type="number" min={1} max={180} value={workMin} onChange={e => setWorkMin(e.target.value)} />
          </label>
          <label className="row">BREAK MIN
            <input type="number" min={1} max={180} value={breakMin} onChange={e => setBreakMin(e.target.value)} />
          </label>
          <div className="row">SOUND
            <span className={`check ${sound ? 'on' : ''}`} onClick={() => setSound(s => !s)}>
              {sound ? '×' : ''}
            </span>
          </div>
        </div>
        <div className="btns">
          <button className="pill save" onClick={save}>SAVE</button>
          <button className="pill" onClick={onClose}>BACK</button>
        </div>
      </div>
    </div>
  );
}
```

(SOUND ON のチェックマークは `×` でなく塗りつぶし表現: `check on` はミント地。中身テキストは空でも良い — 実装時に見た目確認して `×` か空か決める。どちらも絵文字不使用)

- [ ] **Step 3: App.tsx へ view state と分岐を追加**

```tsx
const [view, setView] = useState<'timer' | 'settings'>('timer');
// return 内:
{view === 'settings' ? (
  <SettingsView settings={settings} onSave={update} onClose={() => setView('timer')} />
) : (
  <SkinComp ... />
)}
```

- [ ] **Step 4: 検証+Commit** — `bun run typecheck` → PASS / `bun test` → 12 pass。
  `git commit -am "feat: retro settings view (work/break minutes, sound toggle)"`

---

### Task 10: ネイティブ右クリックメニュー + ウィンドウ操作

**Files:**
- Create: `src/window/menu.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Settings`, `Skin`
- Produces:
  - `showContextMenu(opts: { settings: Settings; onSkin(skin: Skin): void; onReset(): void; onToggleAot(): void; onSettings(): void }): Promise<void>` — contextmenu イベントごとに Menu を構築して popup(チェック状態を現在値で反映)
  - メニュー構成: リセット / スキン(A ログイン窓・B ダイアログ・C ローディングバー・D 砂時計 のチェック付き)/ 常に最前面(チェック)/ 設定 / 最小化 / 終了
  - App: `contextmenu` で `e.preventDefault()` + `showContextMenu`。AOT切替は `getCurrentWindow().setAlwaysOnTop`、最小化 `minimize()`、終了 `close()`

- [ ] **Step 1: `src/window/menu.ts`**

```ts
import { Menu, MenuItem, CheckMenuItem, Submenu, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Settings, Skin } from '../store/settings';

const SKIN_LABELS: Record<Skin, string> = {
  A: 'A: ログイン窓',
  B: 'B: ダイアログ',
  C: 'C: ローディングバー',
  D: 'D: 砂時計',
};

export async function showContextMenu(opts: {
  settings: Settings;
  onSkin(skin: Skin): void;
  onReset(): void;
  onToggleAot(): void;
  onSettings(): void;
}): Promise<void> {
  const win = getCurrentWindow();
  const skinItems = await Promise.all(
    (Object.keys(SKIN_LABELS) as Skin[]).map(skin =>
      CheckMenuItem.new({
        text: SKIN_LABELS[skin],
        checked: opts.settings.skin === skin,
        action: () => opts.onSkin(skin),
      })),
  );
  const menu = await Menu.new({
    items: [
      await MenuItem.new({ text: 'リセット', action: opts.onReset }),
      await Submenu.new({ text: 'スキン', items: skinItems }),
      await CheckMenuItem.new({
        text: '常に最前面',
        checked: opts.settings.alwaysOnTop,
        action: opts.onToggleAot,
      }),
      await MenuItem.new({ text: '設定', action: opts.onSettings }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await MenuItem.new({ text: '最小化', action: () => void win.minimize() }),
      await MenuItem.new({ text: '終了', action: () => void win.close() }),
    ],
  });
  await menu.popup();
}
```

- [ ] **Step 2: App.tsx に contextmenu ハンドラと AOT 反映を追加**

```tsx
useEffect(() => {
  const handler = (e: MouseEvent) => {
    e.preventDefault();
    void showContextMenu({
      settings: settingsRef.current,
      onSkin: skin => update({ skin }),
      onReset: timerRef.current.reset,
      onToggleAot: () => {
        const next = !settingsRef.current.alwaysOnTop;
        update({ alwaysOnTop: next });
        void getCurrentWindow().setAlwaysOnTop(next);
      },
      onSettings: () => setView('settings'),
    });
  };
  window.addEventListener('contextmenu', handler);
  return () => window.removeEventListener('contextmenu', handler);
}, []);
```

(`settingsRef` / `timerRef` は最新値参照用の `useRef` — stale closure 回避。起動時に `setAlwaysOnTop(settings.alwaysOnTop)` も一度呼ぶ)

- [ ] **Step 3: 手動確認** — `bun run tauri dev` で右クリック→全項目動作(スキン切替はウィンドウサイズ未調整でOK、Task 11 で追随)

- [ ] **Step 4: Commit** — `git commit -am "feat: native context menu (skin/reset/aot/settings/minimize/quit)"`

---

### Task 11: 端ドラッグ拡縮 + スキン別ウィンドウサイズ + 位置/スケール永続化

**Files:**
- Create: `src/window/scale.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Settings`, `Skin`
- Produces:
  - `BASE: Record<Skin, { w: number; h: number }>` = A:280×230 / B:250×180 / C:270×100 / D:170×190(各スキンのルートCSSサイズと一致必須)
  - `applyWindowForSkin(skin: Skin, scale: number): Promise<void>`(setSize LogicalSize)
  - `watchWindow(getSkin: () => Skin, getScale: () => number, onScale(scale: number): void, onMove(pos: {x: number; y: number}): void): Promise<() => void>`
    - onResized: 論理サイズ→ `pickScale` → 0.75〜2 に clamp → `onScale`(CSS即時反映)→ 500ms debounce で `setSize(BASE*scale)` にスナップ(縦横比復元)
    - onMoved: 500ms debounce で `onMove`
  - `pickScale(w: number, h: number, base: {w: number; h: number}, current: number): number` — 現在scaleからの乖離が大きい軸を採用
  - 起動時: `settings.pos` があれば `setPosition`、`applyWindowForSkin(skin, scale)`

- [ ] **Step 1: `src/window/scale.ts`**

```ts
import { getCurrentWindow, LogicalSize, LogicalPosition } from '@tauri-apps/api/window';
import type { Skin } from '../store/settings';

export const BASE: Record<Skin, { w: number; h: number }> = {
  A: { w: 280, h: 230 },
  B: { w: 250, h: 180 },
  C: { w: 270, h: 100 },
  D: { w: 170, h: 190 },
};

const clamp = (v: number) => Math.min(2, Math.max(0.75, v));

export function pickScale(w: number, h: number, base: { w: number; h: number }, current: number): number {
  const sw = w / base.w;
  const sh = h / base.h;
  return clamp(Math.abs(sw - current) >= Math.abs(sh - current) ? sw : sh);
}

export async function applyWindowForSkin(skin: Skin, scale: number): Promise<void> {
  const b = BASE[skin];
  await getCurrentWindow().setSize(new LogicalSize(Math.round(b.w * scale), Math.round(b.h * scale)));
}

export async function restorePosition(pos: { x: number; y: number }): Promise<void> {
  await getCurrentWindow().setPosition(new LogicalPosition(pos.x, pos.y));
}

/** onResized→scale反映+スナップ、onMoved→位置保存。戻り値は解除関数 */
export async function watchWindow(
  getSkin: () => Skin,
  getScale: () => number,
  onScale: (scale: number) => void,
  onMove: (pos: { x: number; y: number }) => void,
): Promise<() => void> {
  const win = getCurrentWindow();
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  let moveTimer: ReturnType<typeof setTimeout> | undefined;
  let snapping = false;

  const unResize = await win.onResized(async ({ payload }) => {
    if (snapping) return;
    const factor = await win.scaleFactor();
    const logical = payload.toLogical(factor);
    const s = pickScale(logical.width, logical.height, BASE[getSkin()], getScale());
    onScale(s);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(async () => {
      snapping = true;
      await applyWindowForSkin(getSkin(), s);
      setTimeout(() => { snapping = false; }, 200);
    }, 500);
  });

  const unMove = await win.onMoved(async ({ payload }) => {
    const factor = await win.scaleFactor();
    const logical = payload.toLogical(factor);
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => onMove({ x: logical.x, y: logical.y }), 500);
  });

  return () => { unResize(); unMove(); };
}
```

- [ ] **Step 2: App.tsx 配線**

```tsx
// 起動時1回
useEffect(() => {
  const s = settingsRef.current;
  if (s.pos) void restorePosition(s.pos);
  void applyWindowForSkin(s.skin, s.scale);
  void getCurrentWindow().setAlwaysOnTop(s.alwaysOnTop);
  let cleanup: (() => void) | undefined;
  void watchWindow(
    () => settingsRef.current.skin,
    () => settingsRef.current.scale,
    scale => update({ scale }),
    pos => update({ pos }),
  ).then(fn => { cleanup = fn; });
  return () => cleanup?.();
}, []);

// スキン変更時にウィンドウサイズ追随(update({skin}) の中 or effect)
useEffect(() => {
  void applyWindowForSkin(settings.skin, settings.scale);
}, [settings.skin]);
```

(設定ビュー表示中は view 用サイズ 250×190 に一時変更し、閉じたらスキンサイズへ戻す)

- [ ] **Step 3: 手動確認** — `bun run tauri dev`:
  - 右端/下端/角ドラッグ → ウィジェット全体が拡縮、離すと縦横比にスナップ
  - 4スキンでウィンドウサイズが余白なく追随
  - 再起動で位置・スケール・スキン復元

- [ ] **Step 4: Commit** — `git commit -am "feat: edge-drag proportional scaling + per-skin window size + persistence"`

---

### Task 12: 最終検証・微調整・リリースビルド

**Files:**
- Modify: 視覚確認で見つかったCSSサイズ・BASE値のズレ修正のみ

- [ ] **Step 1: 全自動検証** — `bun run typecheck` → PASS / `bun test` → 12 pass

- [ ] **Step 2: `bun run tauri dev` で全機能手動確認チェックリスト**
  - 4スキンすべて: 見た目(参考画像の配色/線/影/モチーフ)、アニメーション動作
  - タイマー: START→カウントダウン→フェーズ切替でチャイム(通知が出ないこと)→break表示(A表情/Bメッセージ/Cキャプション+バー/D)
  - 一時停止/再開/リセット
  - ドラッグ移動、端ドラッグ拡縮、最前面切替、最小化⇄タスクバー復帰、設定変更の反映と永続化、終了
  - ウィンドウサイズとスキンの余白ズレがあれば BASE と CSS を同時修正

- [ ] **Step 3: リリースビルド** — `bun run tauri build` → `src-tauri/target/release/retro-pomo.exe` 生成確認、起動確認

- [ ] **Step 4: `CLAUDE.md`(プロジェクト用)を作成** — 起動/検証コマンド、構成、BASE とCSSサイズの一致制約を記載

- [ ] **Step 5: Commit** — `git add -A && git commit -m "chore: final polish, project CLAUDE.md, release build verified"`
