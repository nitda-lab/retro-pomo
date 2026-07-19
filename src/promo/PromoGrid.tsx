import { useLayoutEffect, useRef } from 'react';
import { SkinA } from '../skins/SkinA';
import { SkinB } from '../skins/SkinB';
import { SkinC } from '../skins/SkinC';
import { SkinD } from '../skins/SkinD';
import { TitleDots } from '../skins/shared';
import shot from './always-on-top.png';
import './promo.css';

const noop = () => {};

function SkinCells() {
  return (
    <>
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
    </>
  );
}

function AlwaysOnTopShot() {
  return (
    <figure className="promo-shot">
      <div className="retro-win shot-win">
        <div className="titlebar">
          <TitleDots />
          <span className="titlebar-text">YOU CAN SEE IT ANYTIME</span>
        </div>
        <img src={shot} alt="Unityでの作業中も最前面に表示されるretro-pomo" />
      </div>
      <figcaption className="promo-tag">ALWAYS ON TOP</figcaption>
    </figure>
  );
}

/** 宣伝画像用(縦長・README/リリース向け): ブラウザ ?promo=1 */
export function PromoGrid() {
  const innerRef = useRef<HTMLDivElement>(null);
  // scale(2)は親要素の高さに反映されないため、実高さを測ってキャンバス高さに伝える
  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner || !inner.parentElement) return;
    const setH = () => inner.parentElement!.style.setProperty('--promo-inner-h', `${inner.offsetHeight}px`);
    setH();
    const img = inner.querySelector('img');
    img?.addEventListener('load', setH);
    return () => img?.removeEventListener('load', setH);
  }, []);

  return (
    <div className="promo">
      <div className="promo-inner" ref={innerRef}>
        <span className="promo-star" style={{ top: 20, right: 36, width: 22, height: 22 }} />
        <span className="promo-star" style={{ top: 250, left: 8, width: 14, height: 14 }} />
        <span className="promo-star" style={{ bottom: 14, right: 90, width: 16, height: 16 }} />
        <div className="promo-head">
          <span className="promo-title">RETRO-POMO</span>
          <span className="promo-sub">pomodoro timer for your desktop</span>
        </div>
        <div className="promo-grid">
          <SkinCells />
        </div>
        <AlwaysOnTopShot />
      </div>
    </div>
  );
}

/** 宣伝画像用(4:5・ショット上/スキン一覧下): ブラウザ ?promo=45 */
export function Promo45() {
  return (
    <div className="promo promo-45">
      <div className="promo-inner promo-45-inner">
        <span className="promo-star" style={{ top: 14, right: 26, width: 20, height: 20 }} />
        <span className="promo-star" style={{ top: 400, left: 10, width: 12, height: 12 }} />
        <span className="promo-star" style={{ bottom: 18, right: 60, width: 14, height: 14 }} />
        <div className="promo-head">
          <span className="promo-title">RETRO-POMO</span>
          <span className="promo-sub">pomodoro timer for your desktop</span>
        </div>
        <AlwaysOnTopShot />
        <div className="promo-45-gridwrap">
          <div className="promo-grid promo-45-grid">
            <SkinCells />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 宣伝画像用(16:9・X投稿向け、クロップされない): ブラウザ ?promo=x */
export function PromoX() {
  return (
    <div className="promo promo-x">
      <div className="promo-inner promo-x-inner">
        <span className="promo-star" style={{ top: 12, right: 20, width: 18, height: 18 }} />
        <span className="promo-star" style={{ bottom: 16, left: 10, width: 12, height: 12 }} />
        <div className="promo-head">
          <span className="promo-title">RETRO-POMO</span>
          <span className="promo-sub">pomodoro timer for your desktop</span>
        </div>
        <div className="promo-x-main">
          <div className="promo-x-gridwrap">
            <div className="promo-grid promo-x-grid">
              <SkinCells />
            </div>
          </div>
          <AlwaysOnTopShot />
        </div>
      </div>
    </div>
  );
}
