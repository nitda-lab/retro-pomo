import { useState, type ComponentType } from 'react';
import { useTimer } from './hooks/useTimer';
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
