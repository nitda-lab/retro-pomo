import { getCurrentWindow, LogicalPosition, LogicalSize } from '@tauri-apps/api/window';
import type { Skin } from '../store/settings';

/** 各スキンのルート要素CSSサイズ(scale=1)。skinX.css の width/height と一致必須 */
export const BASE: Record<Skin, { w: number; h: number }> = {
  A: { w: 260, h: 212 },
  B: { w: 250, h: 192 },
  C: { w: 270, h: 96 },
  D: { w: 160, h: 142 },
};

/** 設定ビュー表示時のウィンドウサイズ(scale=1) */
export const SETTINGS_SIZE = { w: 250, h: 228 };

/** 終了確認ビュー表示時のウィンドウサイズ(scale=1) */
export const CONFIRM_SIZE = { w: 250, h: 130 };

const clamp = (v: number) => Math.min(2, Math.max(0.75, v));

export async function setWindowSize(base: { w: number; h: number }, scale: number): Promise<void> {
  await getCurrentWindow().setSize(new LogicalSize(Math.round(base.w * scale), Math.round(base.h * scale)));
}

export async function applyWindowForSkin(skin: Skin, scale: number): Promise<void> {
  await setWindowSize(BASE[skin], scale);
}

export async function restorePosition(pos: { x: number; y: number }): Promise<void> {
  await getCurrentWindow().setPosition(new LogicalPosition(pos.x, pos.y));
}

/** ウィンドウ移動を監視して位置を保存する(500ms debounce)。戻り値は解除関数 */
export async function watchWindowMove(onMove: (pos: { x: number; y: number }) => void): Promise<() => void> {
  const win = getCurrentWindow();
  let moveTimer: ReturnType<typeof setTimeout> | undefined;
  const unMove = await win.onMoved(async ({ payload }) => {
    const factor = await win.scaleFactor();
    const logical = payload.toLogical(factor);
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => onMove({ x: logical.x, y: logical.y }), 500);
  });
  return () => { unMove(); };
}

export interface CornerDef { id: 'nw' | 'ne' | 'sw' | 'se'; sx: -1 | 1; sy: -1 | 1; }

export const CORNERS: CornerDef[] = [
  { id: 'nw', sx: -1, sy: -1 },
  { id: 'ne', sx: 1, sy: -1 },
  { id: 'sw', sx: -1, sy: 1 },
  { id: 'se', sx: 1, sy: 1 },
];

/**
 * 四隅グリップからの等比リサイズ。ドラッグした角の対角を固定点にして
 * ウィンドウサイズ・位置を追従させる。CSS側の拡縮は onScale で通知。
 */
export async function beginCornerResize(opts: {
  e: PointerEvent;
  corner: CornerDef;
  skin: Skin;
  startScale: number;
  onScale(s: number): void;
  onDone(s: number): void;
}): Promise<void> {
  const { e, corner, skin, startScale } = opts;
  const win = getCurrentWindow();
  const factor = await win.scaleFactor();
  const startPos = (await win.outerPosition()).toLogical(factor);
  const base = BASE[skin];
  const startW = base.w * startScale;
  const startH = base.h * startScale;
  // 固定点 = ドラッグする角の対角
  const anchorX = startPos.x + (corner.sx === 1 ? 0 : startW);
  const anchorY = startPos.y + (corner.sy === 1 ? 0 : startH);
  const startCx = e.screenX;
  const startCy = e.screenY;
  const target = e.target as HTMLElement;
  target.setPointerCapture(e.pointerId);

  let latest = startScale;
  let pending = false;

  const apply = async (s: number) => {
    const w = Math.round(base.w * s);
    const h = Math.round(base.h * s);
    const x = Math.round(corner.sx === 1 ? anchorX : anchorX - w);
    const y = Math.round(corner.sy === 1 ? anchorY : anchorY - h);
    await win.setSize(new LogicalSize(w, h));
    await win.setPosition(new LogicalPosition(x, y));
  };

  const onMove = (ev: PointerEvent) => {
    const dx = (ev.screenX - startCx) * corner.sx;
    const dy = (ev.screenY - startCy) * corner.sy;
    // 両軸の拡大率の平均 → 対角方向のドラッグが素直に効く
    const s = clamp(((startW + dx) / base.w + (startH + dy) / base.h) / 2);
    latest = s;
    opts.onScale(s);
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        void apply(latest);
      });
    }
  };
  const onUp = () => {
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
    void apply(latest).then(() => opts.onDone(latest));
  };
  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
  target.addEventListener('pointercancel', onUp);
}
