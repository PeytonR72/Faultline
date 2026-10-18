import React, {useState} from 'react';
import {AbsoluteFill, Composition, Easing, continueRender, delayRender, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {Background} from './components';
import {Diagnose, Engineering, Hook, Instrument, Outro, Reveal, Stack, Trace} from './scenes';
import {FPS, HEIGHT, WIDTH} from './theme';

// Scene lengths in frames. Each transition overlaps neighbours by T frames,
// so the timeline totals sum(SCENES) - T * (SCENES.length - 1) = 1800 (60 s).
// Scene i enters at 4.5, 9, 16.5, 27, 38.5, 47 and 51.5 s; scripts/soundtrack.sh relies on that.
export const T = 27;
export const SCENES = {hook: 162, reveal: 162, instrument: 252, trace: 342, diagnose: 372, engineering: 282, stack: 162, outro: 255};
const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0) - T * (Object.keys(SCENES).length - 1);

const FONTS: [string, string, number][] = [
  ['Inter', 'inter-latin-400-normal.woff2', 400],
  ['Inter', 'inter-latin-500-normal.woff2', 500],
  ['Inter', 'inter-latin-600-normal.woff2', 600],
  ['Inter', 'inter-latin-700-normal.woff2', 700],
  ['Inter', 'inter-latin-800-normal.woff2', 800],
  ['JetBrains Mono', 'jetbrains-mono-latin-400-normal.woff2', 400],
  ['JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', 500],
  ['JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', 700],
];

const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useState(() => {
    Promise.all(
      FONTS.map(([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {weight: String(weight)});
        document.fonts.add(face);
        return face.load();
      }),
    ).then(() => continueRender(handle));
  });
};

// Soft dissolve: the outgoing scene recedes and blurs while the incoming one
// drifts a short distance into place and comes into focus.
type DriftProps = {dx: number; dy: number};

const DriftDissolve: React.FC<TransitionPresentationComponentProps<DriftProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps: {dx, dy},
}) => {
  const entering = presentationDirection === 'entering';
  const k = entering ? 1 - p : p; // 0 = settled, 1 = fully away
  const style: React.CSSProperties = entering
    ? {
        opacity: p,
        transform: `translate(${dx * k}px, ${dy * k}px) scale(${1 + 0.03 * k})`,
        filter: `blur(${10 * k}px)`,
      }
    : {
        opacity: 1 - p,
        transform: `translate(${-dx * 0.6 * k}px, ${-dy * 0.6 * k}px) scale(${1 - 0.04 * k})`,
        filter: `blur(${10 * k}px)`,
      };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const drift = (dx: number, dy: number): TransitionPresentation<DriftProps> => ({
  component: DriftDissolve,
  props: {dx, dy},
});

const timing = linearTiming({durationInFrames: T, easing: Easing.inOut(Easing.cubic)});
const still = drift(0, 0);
const fromRight = drift(70, 0);
const fromBottom = drift(0, 50);

export const FaultlineDemo: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES.hook}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={still} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.reveal}>
          <Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fromBottom} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.instrument}>
          <Instrument />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fromRight} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.trace}>
          <Trace />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fromRight} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.diagnose}>
          <Diagnose />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fromBottom} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.engineering}>
          <Engineering />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fromRight} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.stack}>
          <Stack />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={still} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.outro}>
          <Outro durationInFrames={SCENES.outro} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="FaultlineDemo" component={FaultlineDemo} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
);
