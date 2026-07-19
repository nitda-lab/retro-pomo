import { Sparkle, TitleDots } from './shared';
import { fmt, type SkinProps } from './types';
import './skinA.css';

export function SkinA({ phase, remainingSec, isRunning, onToggle }: SkinProps) {
  return (
    <div className="skin-a" data-tauri-drag-region>
      <Sparkle style={{ top: 0, left: 34 }} delay={0} />
      <Sparkle style={{ bottom: 4, right: 6 }} size={12} delay={0.9} />
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
        <div className="strip" />
      </div>
    </div>
  );
}
