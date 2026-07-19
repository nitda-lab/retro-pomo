import './confirmQuit.css';

/** タイマー動作中に終了しようとしたときのレトロ確認ダイアログ */
export function ConfirmQuit({ onQuit, onCancel }: {
  onQuit(): void;
  onCancel(): void;
}) {
  return (
    <div className="confirm-quit" data-tauri-drag-region>
      <div className="retro-win win">
        <div className="titlebar" data-tauri-drag-region>
          <span className="titlebar-text" style={{ margin: 0 }}>HOLD ON!</span>
        </div>
        <div className="msg">TIMER IS STILL RUNNING. QUIT?</div>
        <div className="btns">
          <button className="pill quit" onClick={onQuit}>SURE</button>
          <button className="pill" onClick={onCancel}>NOPE</button>
        </div>
      </div>
    </div>
  );
}
