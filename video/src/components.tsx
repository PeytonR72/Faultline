import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, MONO, SANS, clamp, ease, enter} from './theme';

// ── Continuous backdrop shared by every scene ────────────────────────────────

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.35) % 80;
  const gx = 50 + Math.sin(frame / 90) * 18;
  const gy = 40 + Math.cos(frame / 110) * 12;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${gx}% ${gy}%, rgba(255,77,94,0.13), transparent 70%),
            radial-gradient(800px 700px at ${100 - gx}% ${100 - gy}%, rgba(92,200,255,0.10), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          inset: -80,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `translate(${drift}px, ${drift}px)`,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.07, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)'}}
      />
    </AbsoluteFill>
  );
};

// ── Scene heading: chapter label + headline + optional subline ───────────────

export const SceneTitle: React.FC<{
  label: string;
  title: React.ReactNode;
  sub?: string;
  accent?: string;
  top?: number;
}> = ({label, title, sub, accent = C.red, top = 86}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center'}}>
      <div
        style={{
          ...enter(frame, 0, 18, 16),
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 4,
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        {label}
      </div>
      <div
        style={{
          ...enter(frame, 5, 24),
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 66,
          letterSpacing: -2,
          color: C.text,
        }}
      >
        {title}
      </div>
      {sub && (
        <div style={{...enter(frame, 12, 24), fontFamily: SANS, fontSize: 28, color: C.dim, marginTop: 14}}>
          {sub}
        </div>
      )}
    </div>
  );
};

// ── macOS-style window chrome for terminal and editor shots ──────────────────

export const Window: React.FC<{
  title: string;
  width: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: string;
}> = ({title, width, children, style, glow = 'rgba(92,200,255,0.18)'}) => (
  <div
    style={{
      width,
      borderRadius: 18,
      background: 'linear-gradient(180deg, rgba(22,25,35,0.96), rgba(12,14,20,0.96))',
      border: `1px solid ${C.border}`,
      boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 80px ${glow}`,
      overflow: 'hidden',
      ...style,
    }}
  >
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 9,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(255,255,255,0.025)',
      }}
    >
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
      ))}
      <div style={{flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 18, color: C.dim, marginRight: 60}}>
        {title}
      </div>
    </div>
    {children}
  </div>
);

// ── The fault-line motif: a jagged crack that splits whatever it crosses ─────

const CRACK = [
  [0, 56], [9, 50], [17, 60], [27, 44], [36, 58], [47, 41],
  [56, 62], [66, 46], [75, 57], [84, 43], [92, 55], [100, 49],
];

export const FaultLogo: React.FC<{size: number; crackAt: number; startAt?: number}> = ({
  size,
  crackAt,
  startAt = 0,
}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [crackAt, crackAt + 14], [0, 1], {...clamp, easing: ease});
  const shift = interpolate(frame, [crackAt + 8, crackAt + 22], [0, 1], {...clamp, easing: ease});
  const shake = frame >= crackAt + 6 && frame < crackAt + 16 ? Math.sin(frame * 2.7) * 6 : 0;
  const pts = CRACK.map(([x, y]) => `${x}% ${y}%`).join(', ');
  const revPts = [...CRACK].reverse().map(([x, y]) => `${x}% ${y}%`).join(', ');
  const word: React.CSSProperties = {
    fontFamily: SANS,
    fontWeight: 800,
    fontSize: size,
    letterSpacing: -size * 0.045,
    lineHeight: 1,
    color: C.text,
    whiteSpace: 'nowrap',
    padding: '0 0.04em',
  };
  return (
    <div style={enter(frame, startAt, 26, 40)}>
    <div style={{position: 'relative', display: 'inline-block', transform: `translateX(${shake}px)`}}>
      <div style={{...word, clipPath: `polygon(0% 0%, 100% 0%, ${revPts})`}}>Faultline</div>
      <div
        style={{
          ...word,
          position: 'absolute',
          inset: 0,
          clipPath: `polygon(${pts}, 100% 100%, 0% 100%)`,
          transform: `translate(${shift * size * 0.06}px, ${shift * size * 0.025}px)`,
          ...{background: `linear-gradient(180deg, ${C.text} 40%, ${C.red})`, WebkitBackgroundClip: 'text', color: 'transparent'},
        }}
      >
        Faultline
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{position: 'absolute', inset: '-4% -3%', width: '106%', height: '108%', overflow: 'visible'}}
      >
        <polyline
          points={CRACK.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke={C.red}
          strokeWidth={4}
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={{filter: `drop-shadow(0 0 10px ${C.red}) drop-shadow(0 0 24px ${C.orange})`}}
          opacity={interpolate(frame, [crackAt + 20, crackAt + 50], [1, 0.55], clamp)}
        />
      </svg>
    </div>
    </div>
  );
};

// Small pill used for badges and tech tags.
export const Pill: React.FC<{color: string; children: React.ReactNode; style?: React.CSSProperties}> = ({
  color,
  children,
  style,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 16px',
      borderRadius: 999,
      fontFamily: MONO,
      fontSize: 20,
      fontWeight: 700,
      color,
      background: `${color}1f`,
      border: `1px solid ${color}55`,
      ...style,
    }}
  >
    {children}
  </span>
);

export const progress = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {...clamp, easing: ease});
