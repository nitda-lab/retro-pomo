import { TitleDots } from './shared';
import { fmt, type SkinProps } from './types';
import './skinC.css';

export function SkinC({ phase, remainingSec, totalSec, isRunning, onToggle }: SkinProps) {
  const progress = totalSec > 0 ? Math.min(100, Math.max(2, (1 - remainingSec / totalSec) * 100)) : 0;
  const caption = !isRunning ? 'Click for Focus' : phase === 'work' ? 'Focus is Loading' : 'TEA TIME';
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
          {caption}<span className={isRunning ? 'cursor blinking' : 'cursor'}>_</span>
        </div>
      </div>
    </div>
  );
}
