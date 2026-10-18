import React, {useState} from 'react';
import {AbsoluteFill, Composition, continueRender, delayRender, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {Background} from './components';
import {Diagnose, Engineering, Hook, Instrument, Outro, Reveal, Stack, Trace} from './scenes';
import {FPS, HEIGHT, WIDTH} from './theme';

// Scene lengths in frames. Each transition overlaps neighbours by T frames,
// so the timeline totals sum(SCENES) - T * (SCENES.length - 1) = 1800 (60 s).
export const T = 15;
export const SCENES = {hook: 150, reveal: 150, instrument: 240, trace: 330, diagnose: 360, engineering: 270, stack: 150, outro: 255};
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

const timing = linearTiming({durationInFrames: T});
const fromRight = slide({direction: 'from-right'});
const fromBottom = slide({direction: 'from-bottom'});

export const FaultlineDemo: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES.hook}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
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
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
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
