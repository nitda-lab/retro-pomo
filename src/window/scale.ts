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
export const SETTINGS_SIZE = { w: 250, h: 200 };

const clamp = (v: number) => Math.min(2, Math.max(0.75, v));

export function pickScale(w: number, h: number, base: { w: number; h: number }, current: number): number {
  const sw = w / base.w;
  const sh = h / base.h;
  return clamp(Math.abs(sw - current) >= Math.abs(sh - current) ? sw : sh);
}

export async function setWindowSize(base: { w: number; h: number }, scale: number): Promise<void> {
  await getCurrentWindow().setSize(new LogicalSize(Math.round(base.w * scale), Math.round(base.h * scale)));
}

export async function applyWindowForSkin(skin: Skin, scale: number): Promise<void> {
  await setWindowSize(BASE[skin], scale);
}

export async function restorePosition(pos: { x: number; y: number }): Promise<void> {
  await getCurrentWindow().setPosition(new LogicalPosition(pos.x, pos.y));
}

/** onResized→scale反映+アスペクト比スナップ、onMoved→位置保存。戻り値は解除関数 */
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
    resizeTimer = setTimeout(() => {
      snapping = true;
      void applyWindowForSkin(getSkin(), s).finally(() => {
        setTimeout(() => { snapping = false; }, 200);
      });
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
