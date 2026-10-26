import {
  Button,
  HStack,
  Image,
  ProgressView,
  Rectangle,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  animation,
  Animation,
  background,
  brightness,
  buttonStyle,
  clipped,
  clipShape,
  colorInvert,
  contentTransition,
  contrast,
  font,
  foregroundStyle,
  frame,
  geometryGroup,
  labelsHidden,
  luminanceToAlpha,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  resizable,
  scaleEffect,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';

import type {
  IntervalActivityPhase,
  IntervalTimerActivityProps,
} from './IntervalTimerActivityLogic';

// The interval timer on the lock screen and in the Dynamic Island (10.1 FR-6; canvas 2.6, GT-99,
// GT-180): the app's icon, the phase in bold over the exercise and round — or the next round in a
// rest — the phase's time left on the right, the block's bar under them, and Pause (Resume while
// paused). No End early: too easy to hit by accident (canvas 6.3); no Skip rest — that is the app's
// (Artem, 26.10.2026). A tap on the rest opens the timer.
//
// Right with no update. Behind a locked screen iOS turns down the app's updates once it is only
// playing audio (research 10.3), so the activity is laid out once, at the start, for the whole
// block, and the system's clock does the rest:
// - the bar: a cell per work and rest, each filling over its own time;
// - the phase: one layer per phase still to come, stacked, each shown only from its start to its
//   end — by a gate (`during`), see below. Its time is a live timer over that phase.
// A pause or a resume comes from the app or the activity's own button, and an update from either
// gets through: the activity is then laid out anew. Each update redraws the whole activity, and a
// gate is the heaviest thing on it — so there are as few stacks of them as can be: the phase row,
// and the Dynamic Island's compact time.
//
// The `'widget'` function below is not run in the app. Babel turns it into a string, and the
// widget extension runs that on its own (expo-widgets): nothing from this module's scope reaches
// it — not the design tokens, not a constant. So every colour and size comes in through
// `props.look` (IntervalTimerActivityLogic.ts), and the buttons' targets are written out here —
// keep them in step with `IntervalActivityAction`.
//
// Paused, the time is plain text and the cells hold. Nothing else changes but the button (Artem,
// 20.10.2026): the phase row and the time sit in the same fixed frames running and paused, so the
// activity doesn't jump between the two — it sprang like rubber when their heights differed.
// A button's tap comes back to the app as a user interaction (state/intervalLiveActivity.ts).

const IntervalTimerActivity = (
  props: IntervalTimerActivityProps,
  environment: LiveActivityEnvironment,
) => {
  'widget';
  const look = props.look;
  const held = props.held;
  const paused = held !== undefined;
  const barColor = environment.isLuminanceReduced ? look.barColorDimmed : look.barColor;
  const block = props.block;
  // Changes swap in place: the system would otherwise morph one text into the next, and the
  // activity stretched like rubber between running and paused (Artem, 20.10.2026).
  const still = contentTransition('identity');
  // Paused and running swap with no animation of their own: the system springs the activity on
  // each update, and a morph between the two stretched it like rubber (Artem, 20.10.2026).
  const noAnimation =
    typeof Animation === 'undefined' ? [] : [animation(Animation.linear({ duration: 0 }), paused)];

  // The gate: what is drawn inside it shows from `startsAt` to `endsAt` only, by the system's clock.
  // Drawn white on black, two black bars stretched over all of it — one full until the phase
  // starts and empty from then on, one empty until it ends and full from then on — and then
  // `luminanceToAlpha` turns black clear and white opaque: a mask made of what the widget has
  // (a view mask is not in @expo/ui). Found on the simulator (GT-180 spike, 26.10.2026):
  // - `geometryGroup()` first, or each child is filtered on its own and a black bar turns clear
  //   instead of hiding what is under it;
  // - `brightness` and `contrast` before it hide the empty bars' grey track;
  // - a button inside a gate is drawn but does not tap — the tap opens the app: no button in one.
  const step = 100;
  const during = (startsAt: number, endsAt: number, height: number, content: ReactNode) => {
    const cover = (from: number, countsDown: boolean) => (
      <ProgressView
        timerInterval={{ lower: new Date(from), upper: new Date(from + step) }}
        countsDown={countsDown}
        modifiers={[
          tint(look.maskClear),
          labelsHidden(),
          frame({ maxWidth: Infinity }),
          scaleEffect({ x: 1.2, y: 30 }),
        ]}
      />
    );
    return (
      <ZStack
        modifiers={[
          frame({ maxWidth: Infinity, height }),
          clipped(),
          geometryGroup(),
          brightness(-0.15),
          contrast(3),
          luminanceToAlpha(),
          colorInvert(),
        ]}
      >
        <Rectangle modifiers={[foregroundStyle(look.maskClear)]} />
        {content}
        {cover(startsAt, true)}
        {cover(endsAt, false)}
      </ZStack>
    );
  };
  // One layer per phase still to come, each in its own time — paused, the one phase held, its gate
  // open throughout (IntervalTimerActivityLogic.ts): running and paused are drawn the same way, the
  // same size, so the activity doesn't spring between them. Drawn otherwise, the paused row stood
  // 4 pt lower and the activity sprang on every Pause and Resume (simulator, frame by frame).
  const layers = held !== undefined ? [held] : props.phases;
  const phased = (
    width: number,
    height: number,
    layer: (phase: IntervalActivityPhase) => ReactNode,
  ) => (
    <ZStack modifiers={[frame({ maxWidth: width, height })]}>
      {layers.map((phase, index) => (
        <ZStack key={index} modifiers={[frame({ maxWidth: width, height })]}>
          {during(phase.startsAt, phase.endsAt, height, layer(phase))}
        </ZStack>
      ))}
    </ZStack>
  );

  // The time: running, a live timer over the phase; paused, plain text.
  const clockLook = (size: number, color: string, width?: number) => [
    font({ size }),
    monospacedDigit(),
    foregroundStyle(color),
    multilineTextAlignment('trailing'),
    still,
    ...(width === undefined ? [] : [frame({ width, alignment: 'trailing' })]),
  ];
  const phaseClock = (phase: IntervalActivityPhase, size: number, width?: number) =>
    held !== undefined ? (
      <Text modifiers={clockLook(size, look.maskSolid, width)}>{held.timeLabel}</Text>
    ) : (
      <Text
        timerInterval={{ lower: new Date(phase.startsAt), upper: new Date(phase.endsAt) }}
        modifiers={clockLook(size, look.maskSolid, width)}
      />
    );
  // The Dynamic Island: compact, the phase's time, gated; minimal and expanded, the block's time
  // left — one live timer, no gates.
  const islandClock = (size: number, width: number, height: number) =>
    phased(width, height, (phase) => phaseClock(phase, size, width));
  const blockClock = (size: number) =>
    held !== undefined ? (
      <Text modifiers={clockLook(size, look.clockColor)}>{held.timeLabel}</Text>
    ) : (
      <Text
        timerInterval={{ lower: new Date(block.startedAt), upper: new Date(block.endsAt) }}
        modifiers={clockLook(size, look.clockColor)}
      />
    );

  // The phase in bold, the line under it, its time on the right.
  const phaseView = phased(Infinity, look.phaseHeight, (phase) => (
    <HStack spacing={look.gap}>
      <VStack alignment="leading">
        <Text
          modifiers={[
            font({ weight: 'semibold', size: look.titleSize }),
            foregroundStyle(look.maskSolid),
            still,
          ]}
        >
          {phase.label}
        </Text>
        <Text
          modifiers={[font({ size: look.captionSize }), foregroundStyle(look.detailColor), still]}
        >
          {phase.detail}
        </Text>
      </VStack>
      <Spacer />
      {phaseClock(phase, look.clockSize, look.clockWidth)}
    </HStack>
  ));

  // The same height both ways: the running bar stood 6 pt taller, and the activity sprang between
  // the two on every Pause and Resume — what read as rubber (Artem, 20.10.2026).
  const barFrame = frame({ height: look.barHeight });
  // A cell for each work and rest: done ones full, the one running filling, those ahead empty —
  // each filling over its own time by itself.
  const segmentBar = (
    <HStack spacing={look.segmentGap}>
      {block.segments.map((segment, index) => {
        const segmentLook = [
          tint(segment.work ? barColor : look.restBarColor),
          labelsHidden(),
          still,
          barFrame,
        ];
        return segment.startsAt !== undefined && segment.endsAt !== undefined ? (
          <ProgressView
            key={index}
            timerInterval={{ lower: new Date(segment.startsAt), upper: new Date(segment.endsAt) }}
            countsDown={false}
            modifiers={segmentLook}
          />
        ) : (
          <ProgressView key={index} value={segment.value ?? 0} modifiers={segmentLook} />
        );
      })}
    </HStack>
  );

  // Drawn here rather than left to a button style: the system paints a Live Activity's styled
  // buttons its own way — a grey capsule, full width, with a white icon and label (canvas 2.6).
  const button = (target: string, label: string, systemImage: 'play.fill' | 'pause.fill') => (
    <Button target={target} onPress={() => props} modifiers={[buttonStyle('plain')]}>
      <HStack
        spacing={look.gap}
        modifiers={[
          frame({ maxWidth: Infinity, minHeight: look.buttonHeight }),
          background(look.buttonColor),
          clipShape('capsule'),
        ]}
      >
        <Image systemName={systemImage} size={look.buttonIconSize} color={look.buttonLabelColor} />
        <Text
          modifiers={[
            font({ weight: 'medium', size: look.captionSize }),
            foregroundStyle(look.buttonLabelColor),
            still,
          ]}
        >
          {label}
        </Text>
      </HStack>
    </Button>
  );

  return {
    banner: (
      <VStack
        spacing={look.gap}
        modifiers={[
          padding({ all: look.padding }),
          activityBackgroundTint(look.backgroundColor),
          ...noAnimation,
        ]}
      >
        <HStack spacing={look.gap}>
          {props.iconUri !== undefined ? (
            <Image
              uiImage={props.iconUri}
              modifiers={[
                resizable(),
                frame({ width: look.iconSize, height: look.iconSize }),
                clipShape('roundedRectangle', look.iconRadius),
              ]}
            />
          ) : null}
          {phaseView}
        </HStack>
        {segmentBar}
        {paused ? button('pause', 'Resume', 'play.fill') : button('pause', 'Pause', 'pause.fill')}
      </VStack>
    ),
    compactLeading: <Text>{block.title}</Text>,
    compactTrailing: islandClock(
      look.clockSizeCompact,
      look.islandCompactWidth,
      look.islandCompactHeight,
    ),
    minimal: blockClock(look.clockSizeMinimal),
    expandedLeading: <Text>{block.title}</Text>,
    expandedTrailing: blockClock(look.clockSizeExpanded),
    expandedBottom: segmentBar,
  };
};

export default createLiveActivity('IntervalTimerActivity', IntervalTimerActivity);
