import {Easing, interpolate} from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const C = {
  bg: '#07080c',
  panel: '#0e1016',
  panel2: '#141722',
  border: 'rgba(255,255,255,0.09)',
  text: '#eef0f6',
  dim: '#8b91a5',
  faint: '#4a5063',
  red: '#ff4d5e',
  orange: '#ff8a3d',
  green: '#3ddc97',
  cyan: '#5cc8ff',
  violet: '#a78bfa',
  yellow: '#ffd166',
};

export const SANS = 'Inter, sans-serif';
export const MONO = '"JetBrains Mono", monospace';

export const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Fade + rise entrance used by most text and cards.
export const enter = (frame: number, start: number, dur = 22, dist = 34) => {
  const p = interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: ease});
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * dist}px)`,
    filter: `blur(${(1 - p) * 8}px)`,
  };
};

// Number of characters revealed for a typewriter effect.
export const typed = (frame: number, start: number, cps: number, len: number) =>
  Math.max(0, Math.min(len, Math.floor(((frame - start) / FPS) * cps)));

export const gradientText = (from: string, to: string) => ({
  background: `linear-gradient(92deg, ${from}, ${to})`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
});
