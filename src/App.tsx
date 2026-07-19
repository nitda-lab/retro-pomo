import { useState, type ComponentType } from 'react';
import { useTimer } from './hooks/useTimer';
import { loadSettings, saveSettings, type Settings, type Skin } from './store/settings';
import type { SkinProps } from './skins/types';

const Placeholder = ({ remainingSec }: SkinProps) => <div>{remainingSec}</div>;

export const skinComponents: Record<Skin, ComponentType<SkinProps>> = {
  A: Placeholder, B: Placeholder, C: Placeholder, D: Placeholder,
};

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const timer = useTimer(settings);
  const SkinComp = skinComponents[settings.skin];

  const update = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };
  void update; // Task 9/10 で配線

  return (
    <div className="scale-root" style={{ transform: `scale(${settings.scale})` }}>
      <SkinComp
        phase={timer.phase}
        remainingSec={timer.remainingSec}
        totalSec={timer.totalSec}
        isRunning={timer.isRunning}
        onToggle={timer.toggle}
      />
    </div>
  );
}
