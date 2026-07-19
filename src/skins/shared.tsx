import type { CSSProperties } from 'react';
import './shared.css';

export function TitleDots() {
  return (
    <span className="dots">
      <i className="dot t" /><i className="dot b" /><i className="dot r" />
    </span>
  );
}

export function Sparkle({ style, size = 18, delay = 0 }: {
  style?: CSSProperties; size?: number; delay?: number;
}) {
  return (
    <span
      className="sparkle"
      style={{ ...style, width: size, height: size, animationDelay: `${delay}s` }}
    />
  );
}
