import { TitleDots } from './shared';
import { fmt, type SkinProps } from './types';
import './skinA.css';

export function SkinA({ phase, remainingSec, totalSec, isRunning, onToggle }: SkinProps) {
  const progress = totalSec > 0 ? Math.max(4, (1 - remainingSec / totalSec) * 100) : 4;
  return (
    <div className="skin-a" data-tauri-drag-region>
      <div className="retro-win win" data-tauri-drag-region>
        <div className="titlebar" data-tauri-drag-region>
          <TitleDots />
          <span className="titlebar-text">POMO TIMER</span>
        </div>
        <div className={`face ${phase}`} data-tauri-drag-region>
          <span className="eye l" /><span className="eye r" /><span className="mouth" />
        </div>
        <div className="field" data-tauri-drag-region>
          <span className="timer-digits">{fmt(remainingSec)}</span>
        </div>
        <div className="btn-row">
          <button className="pill start" onClick={onToggle}>
            {isRunning ? 'PAUSE' : 'START'}
          </button>
        </div>
        <div className="strip" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
