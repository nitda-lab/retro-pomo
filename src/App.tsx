import { useEffect, useRef, useState, type ComponentType } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTimer } from './hooks/useTimer';
import { showContextMenu } from './window/menu';
import {
  applyWindowForSkin, beginCornerResize, CONFIRM_SIZE, CORNERS, restorePosition,
  setWindowSize, SETTINGS_SIZE, watchWindowMove,
} from './window/scale';
import { ConfirmQuit } from './quit/ConfirmQuit';
import { loadSettings, saveSettings, type Settings, type Skin } from './store/settings';
import type { SkinProps } from './skins/types';
import { SkinA } from './skins/SkinA';
import { SkinB } from './skins/SkinB';
import { SkinC } from './skins/SkinC';
import { SkinD } from './skins/SkinD';
import { SettingsView } from './settings/SettingsView';
import { Promo45, PromoGrid, PromoX } from './promo/PromoGrid';

export const skinComponents: Record<Skin, ComponentType<SkinProps>> = {
  A: SkinA, B: SkinB, C: SkinC, D: SkinD,
};

/** Tauri外(ブラウザでのUI確認)ではウィンドウ操作をスキップ */
const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** 宣伝画像生成用: ブラウザで ?promo=1 (縦長) / ?promo=x (X向け16:9) */
const promoMode = !inTauri && typeof window !== 'undefined'
  ? new URLSearchParams(location.search).get('promo')
  : null;

type View = 'timer' | 'settings' | 'confirm-quit';

/** ブラウザ確認用: ?skin=B / ?view=settings|confirm で初期表示を切替(Tauri内では無視) */
function devOverrides(): { skin?: Skin; view?: View } {
  if (inTauri) return {};
  const p = new URLSearchParams(location.search);
  const skin = p.get('skin');
  const view = p.get('view');
  return {
    skin: skin && ['A', 'B', 'C', 'D'].includes(skin) ? (skin as Skin) : undefined,
    view: view === 'settings' ? 'settings' : view === 'confirm' ? 'confirm-quit' : undefined,
  };
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const s = loadSettings();
    const o = devOverrides();
    return o.skin ? { ...s, skin: o.skin } : s;
  });
  const [view, setView] = useState<View>(() => devOverrides().view ?? 'timer');
  /** 四隅ドラッグ中の一時スケール(確定時に settings.scale へ保存) */
  const [liveScale, setLiveScale] = useState<number | null>(null);
  const timer = useTimer(settings);
  const SkinComp = skinComponents[settings.skin];

  const update = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  // メニューのstale closure回避用の最新値参照
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    if (!inTauri) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      void showContextMenu({
        settings: settingsRef.current,
        onSkin: skin => updateRef.current({ skin }),
        onReset: () => timerRef.current.reset(),
        onToggleAot: () => {
          const next = !settingsRef.current.alwaysOnTop;
          updateRef.current({ alwaysOnTop: next });
          void getCurrentWindow().setAlwaysOnTop(next);
        },
        onSettings: () => setView('settings'),
        onLang: lang => updateRef.current({ lang }),
        // close() は CloseRequested を発火するので、動作中の確認は下のインターセプタに集約される
        onQuit: () => void getCurrentWindow().close(),
      });
    };
    window.addEventListener('contextmenu', handler);
    return () => window.removeEventListener('contextmenu', handler);
  }, []);

  // どこから閉じられても(タスクバー含む)タイマー動作中は確認を挟む
  useEffect(() => {
    if (!inTauri) return;
    const win = getCurrentWindow();
    let un: (() => void) | undefined;
    void win.onCloseRequested(e => {
      if (timerRef.current.isRunning) {
        e.preventDefault();
        void win.unminimize();
        void win.setFocus();
        setView('confirm-quit');
      }
    }).then(f => { un = f; });
    return () => un?.();
  }, []);

  // 起動時: 位置/最前面/サイズ復元 + 移動の監視
  useEffect(() => {
    if (!inTauri) return;
    const s = settingsRef.current;
    if (s.pos) void restorePosition(s.pos);
    void applyWindowForSkin(s.skin, s.scale);
    void getCurrentWindow().setAlwaysOnTop(s.alwaysOnTop);
    let cleanup: (() => void) | undefined;
    void watchWindowMove(pos => updateRef.current({ pos })).then(fn => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  // スキン変更・ビュー切替でウィンドウサイズ追随
  useEffect(() => {
    if (!inTauri) return;
    if (view === 'settings') {
      void setWindowSize(SETTINGS_SIZE, settings.scale);
    } else if (view === 'confirm-quit') {
      void setWindowSize(CONFIRM_SIZE, settings.scale);
    } else {
      void applyWindowForSkin(settings.skin, settings.scale);
    }
  }, [settings.skin, view]);

  if (promoMode === 'x') return <PromoX />;
  if (promoMode === '45') return <Promo45 />;
  if (promoMode === '1') return <PromoGrid />;

  return (
    <div className="scale-root" style={{ transform: `scale(${liveScale ?? settings.scale})` }}>
      {view === 'confirm-quit' ? (
        <ConfirmQuit
          onQuit={() => void getCurrentWindow().destroy()}
          onCancel={() => setView('timer')}
        />
      ) : view === 'settings' ? (
        <SettingsView settings={settings} onSave={update} onClose={() => setView('timer')} />
      ) : (
        <div className="widget-wrap">
          <SkinComp
            phase={timer.phase}
            remainingSec={timer.remainingSec}
            totalSec={timer.totalSec}
            isRunning={timer.isRunning}
            onToggle={timer.toggle}
          />
          {inTauri && CORNERS.map(c => (
            <div
              key={c.id}
              className={`grip grip-${c.id}`}
              onPointerDown={e => {
                e.preventDefault();
                e.stopPropagation();
                void beginCornerResize({
                  e: e.nativeEvent,
                  corner: c,
                  skin: settingsRef.current.skin,
                  startScale: settingsRef.current.scale,
                  onScale: s => setLiveScale(s),
                  onDone: s => {
                    setLiveScale(null);
                    updateRef.current({ scale: s });
                  },
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
