import { fmt, type SkinProps } from './types';
import './skinB.css';

export function SkinB({ phase, remainingSec, isRunning, onToggle }: SkinProps) {
  return (
    <div className="skin-b" data-tauri-drag-region>
      <div className="retro-win win">
        <div className="titlebar" data-tauri-drag-region>
          <span className="xbox">×</span>
        </div>
        <div className="msg" data-tauri-drag-region>
          {phase === 'work' ? "DON'T THINK OF OTHER THINGS" : 'TEA TIME!'}
        </div>
        <div className="timer-digits" data-tauri-drag-region>{fmt(remainingSec)}</div>
        <div>
          <button className="pill sure" onClick={onToggle}>
            {isRunning ? 'PAUSE' : 'SURE'}
          </button>
        </div>
      </div>
    </div>
  );
}
