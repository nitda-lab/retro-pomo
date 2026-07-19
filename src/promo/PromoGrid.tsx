import { useLayoutEffect, useRef } from 'react';
import { SkinA } from '../skins/SkinA';
import { SkinB } from '../skins/SkinB';
import { SkinC } from '../skins/SkinC';
import { SkinD } from '../skins/SkinD';
import { TitleDots } from '../skins/shared';
import shot from './always-on-top.png';
import './promo.css';

const noop = () => {};

/** 宣伝画像用: 4スキン2x2+最前面訴求ショットの静止ビュー(ブラウザ ?promo=1 専用) */
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
      </div>
    </div>
  );
}
