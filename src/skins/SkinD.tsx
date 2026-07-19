import { fmt, type SkinProps } from './types';
import './skinD.css';

export function SkinD({ remainingSec, isRunning, onToggle }: SkinProps) {
  return (
    <div className="skin-d" data-tauri-drag-region>
      <div className="retro-win win" onClick={onToggle}>
        <div className="titlebar" data-tauri-drag-region>
          <span className="titlebar-text">POMO</span>
        </div>
        <div className={`hg ${isRunning ? 'running' : ''}`}>
          <div className="cap" /><div className="glass" /><div className="cap" />
        </div>
        <span className="timer-digits">{fmt(remainingSec)}</span>
      </div>
    </div>
  );
}
