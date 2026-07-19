import { SkinA } from '../skins/SkinA';
import { SkinB } from '../skins/SkinB';
import { SkinC } from '../skins/SkinC';
import { SkinD } from '../skins/SkinD';
import './promo.css';

const noop = () => {};

/** 宣伝画像用: 4スキンを2x2で並べた静止ビュー(ブラウザ ?promo=1 専用) */
export function PromoGrid() {
  return (
    <div className="promo">
      <div className="promo-inner">
        <span className="promo-star" style={{ top: 20, right: 36, width: 22, height: 22 }} />
        <span className="promo-star" style={{ top: 250, left: 8, width: 14, height: 14 }} />
        <span className="promo-star" style={{ bottom: 14, right: 90, width: 16, height: 16 }} />
        <div className="promo-head">
          <span className="promo-title">RETRO-POMO</span>
          <span className="promo-sub">pomodoro timer for your desktop</span>
        </div>
        <div className="promo-grid">
          <figure>
            <SkinA phase="break" remainingSec={201} totalSec={300} isRunning onToggle={noop} />
            <figcaption className="promo-tag">SMILEY</figcaption>
          </figure>
          <figure>
            <SkinB phase="work" remainingSec={754} totalSec={1500} isRunning={false} onToggle={noop} />
            <figcaption className="promo-tag">DIALOG</figcaption>
          </figure>
          <figure>
            <SkinC phase="work" remainingSec={581} totalSec={1500} isRunning onToggle={noop} />
            <figcaption className="promo-tag">LOADING</figcaption>
          </figure>
          <figure>
            <SkinD phase="work" remainingSec={1500} totalSec={1500} isRunning={false} onToggle={noop} />
            <figcaption className="promo-tag">HOURGLASS</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
