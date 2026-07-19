import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Lang, Settings, Skin } from '../store/settings';

const SKIN_LABELS: Record<Skin, string> = {
  A: 'A: Smiley',
  B: 'B: Dialog',
  C: 'C: Loading',
  D: 'D: Hourglass',
};

const T: Record<Lang, {
  reset: string; skin: string; aot: string; settings: string;
  language: string; minimize: string; quit: string;
}> = {
  ja: {
    reset: 'リセット', skin: 'スキン', aot: '常に最前面', settings: '設定',
    language: '言語 / Language', minimize: '最小化', quit: '終了',
  },
  en: {
    reset: 'Reset', skin: 'Skin', aot: 'Always on Top', settings: 'Settings',
    language: 'Language / 言語', minimize: 'Minimize', quit: 'Quit',
  },
};

export async function showContextMenu(opts: {
  settings: Settings;
  onSkin(skin: Skin): void;
  onReset(): void;
  onToggleAot(): void;
  onSettings(): void;
  onLang(lang: Lang): void;
  onQuit(): void;
}): Promise<void> {
  const win = getCurrentWindow();
  const t = T[opts.settings.lang];
  const skinItems = await Promise.all(
    (Object.keys(SKIN_LABELS) as Skin[]).map(skin =>
      CheckMenuItem.new({
        text: SKIN_LABELS[skin],
        checked: opts.settings.skin === skin,
        action: () => opts.onSkin(skin),
      })),
  );
  const langItems = await Promise.all(
    (['ja', 'en'] as Lang[]).map(lang =>
      CheckMenuItem.new({
        text: lang === 'ja' ? '日本語' : 'English',
        checked: opts.settings.lang === lang,
        action: () => opts.onLang(lang),
      })),
  );
  const menu = await Menu.new({
    items: [
      await MenuItem.new({ text: t.reset, action: opts.onReset }),
      await Submenu.new({ text: t.skin, items: skinItems }),
      await CheckMenuItem.new({
        text: t.aot,
        checked: opts.settings.alwaysOnTop,
        action: opts.onToggleAot,
      }),
      await MenuItem.new({ text: t.settings, action: opts.onSettings }),
      await Submenu.new({ text: t.language, items: langItems }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await MenuItem.new({ text: t.minimize, action: () => void win.minimize() }),
      await MenuItem.new({ text: t.quit, action: opts.onQuit }),
    ],
  });
  await menu.popup();
}
