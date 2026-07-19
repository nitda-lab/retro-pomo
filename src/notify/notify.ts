import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import type { Phase } from '../timer/engine';
import type { Lang } from '../store/settings';

const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * フェーズ切替のWindows通知(設定でONのときのみ呼ばれる)。enteredPhase=今から始まるフェーズ
 * @returns 'sent' | 'denied' | 'error:...'(呼び出し側は通常無視してよい)
 */
export async function notifyPhase(enteredPhase: Phase, lang: Lang, minutes: number): Promise<string> {
  if (!inTauri) return 'skipped';
  try {
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === 'granted';
    if (!granted) return 'denied';
    const title = enteredPhase === 'break' ? 'TEA TIME!' : 'FOCUS TIME!';
    const body = lang === 'ja'
      ? (enteredPhase === 'break' ? `おつかれさま。${minutes}分休憩しよう` : `休憩おわり。${minutes}分集中しよう`)
      : (enteredPhase === 'break' ? `Nice work. Take a ${minutes}-minute break.` : `Break is over. Focus for ${minutes} minutes.`);
    sendNotification({ title, body });
    return 'sent';
  } catch (err) {
    console.error('notification failed:', err);
    return `error:${String(err)}`;
  }
}
