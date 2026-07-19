import { TitleDots } from './shared';
import { fmt, type SkinProps } from './types';
import './skinC.css';

export function SkinC({ phase, remainingSec, totalSec, onToggle }: SkinProps) {
  const progress = totalSec > 0 ? Math.min(100, Math.max(2, (1 - remainingSec / totalSec) * 100)) : 0;
  return (
    <div className="skin-c" data-tauri-drag-region>
      <div className="retro-win win" onClick={onToggle}>
        <div className="titlebar" data-tauri-drag-region>
          <TitleDots />
          <span className="titlebar-text">Retro Pomo</span>
        </div>
        <div className="body">
          <span className="timer-digits">{fmt(remainingSec)}</span>
          <div className="track"><div className="fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="caption">
          {phase === 'work' ? 'Focus is Loading' : 'TEA TIME'}<span className="cursor">_</span>
        </div>
      </div>
    </div>
  );
}
