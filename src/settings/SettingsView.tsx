import { useState } from 'react';
import { TitleDots } from '../skins/shared';
import { sanitize, type Settings } from '../store/settings';
import './settingsView.css';

export function SettingsView({ settings, onSave, onClose }: {
  settings: Settings;
  onSave(patch: Partial<Settings>): void;
  onClose(): void;
}) {
  const [workMin, setWorkMin] = useState(String(settings.workMin));
  const [breakMin, setBreakMin] = useState(String(settings.breakMin));
  const [sound, setSound] = useState(settings.sound);

  const save = () => {
    const v = sanitize({ ...settings, workMin: Number(workMin), breakMin: Number(breakMin), sound });
    onSave({ workMin: v.workMin, breakMin: v.breakMin, sound: v.sound });
    onClose();
  };

  return (
    <div className="settings" data-tauri-drag-region>
      <div className="retro-win win">
        <div className="titlebar" data-tauri-drag-region>
          <TitleDots />
          <span className="titlebar-text">SETTINGS</span>
        </div>
        <div className="rows">
          <label className="row">WORK MIN
            <input type="number" min={1} max={180} value={workMin} onChange={e => setWorkMin(e.target.value)} />
          </label>
          <label className="row">BREAK MIN
            <input type="number" min={1} max={180} value={breakMin} onChange={e => setBreakMin(e.target.value)} />
          </label>
          <div className="row">SOUND
            <span className="check" onClick={() => setSound(s => !s)}>
              {sound && <span className="mark" />}
            </span>
          </div>
        </div>
        <div className="btns">
          <button className="pill save" onClick={save}>SAVE</button>
          <button className="pill" onClick={onClose}>BACK</button>
        </div>
      </div>
    </div>
  );
}
