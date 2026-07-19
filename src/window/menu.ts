import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
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
