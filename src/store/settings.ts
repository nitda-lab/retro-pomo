export type Skin = 'A' | 'B' | 'C' | 'D';
export type Lang = 'ja' | 'en';

export interface Settings {
  workMin: number;
  breakMin: number;
  sound: boolean;
  skin: Skin;
  scale: number;
  alwaysOnTop: boolean;
  pos: { x: number; y: number } | null;
  lang: Lang;
}

export const DEFAULTS: Settings = {
  workMin: 25, breakMin: 5, sound: true, skin: 'A', scale: 1, alwaysOnTop: true, pos: null, lang: 'ja',
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
    lang: r.lang === 'en' || r.lang === 'ja' ? r.lang : DEFAULTS.lang,
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
