import { useEffect, useRef, useState, type ComponentType } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTimer } from './hooks/useTimer';
import { showContextMenu } from './window/menu';
import { loadSettings, saveSettings, type Settings, type Skin } from './store/settings';
import type { SkinProps } from './skins/types';
import { SkinA } from './skins/SkinA';
import { SkinB } from './skins/SkinB';
import { SkinC } from './skins/SkinC';
import { SkinD } from './skins/SkinD';
import { SettingsView } from './settings/SettingsView';

export const skinComponents: Record<Skin, ComponentType<SkinProps>> = {
  A: SkinA, B: SkinB, C: SkinC, D: SkinD,
};

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [view, setView] = useState<'timer' | 'settings'>('timer');
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
      });
    };
    window.addEventListener('contextmenu', handler);
    return () => window.removeEventListener('contextmenu', handler);
  }, []);

  return (
    <div className="scale-root" style={{ transform: `scale(${settings.scale})` }}>
      {view === 'settings' ? (
        <SettingsView settings={settings} onSave={update} onClose={() => setView('timer')} />
      ) : (
        <SkinComp
          phase={timer.phase}
          remainingSec={timer.remainingSec}
          totalSec={timer.totalSec}
          isRunning={timer.isRunning}
          onToggle={timer.toggle}
        />
      )}
    </div>
  );
}
