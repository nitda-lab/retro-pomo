import { describe, expect, test } from 'bun:test';
import { sanitize, DEFAULTS } from './settings';

describe('sanitize', () => {
  test('null/ゴミはDEFAULTSへ', () => {
    expect(sanitize(null)).toEqual(DEFAULTS);
    expect(sanitize('garbage')).toEqual(DEFAULTS);
  });
  test('正常値は通す', () => {
    const v = { workMin: 50, breakMin: 10, sound: false, skin: 'C', scale: 1.5, alwaysOnTop: false, pos: { x: 10, y: 20 }, lang: 'en' };
    expect(sanitize(v)).toEqual(v as never);
  });
  test('範囲外はclamp、不正skin/langはデフォルトへ', () => {
    const v = sanitize({ ...DEFAULTS, workMin: 0, breakMin: 999, scale: 9, skin: 'Z', lang: 'fr' });
    expect(v.workMin).toBe(1);
    expect(v.breakMin).toBe(180);
    expect(v.scale).toBe(2);
    expect(v.skin).toBe('A');
    expect(v.lang).toBe('ja');
  });
});
