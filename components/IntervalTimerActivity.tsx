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
  buttonStyle,
  clipShape,
  brightness,
  geometryGroup,
  opacity,
  clipped,
  colorInvert,
  contrast,
  luminanceToAlpha,
  scaleEffect,
  contentTransition,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  resizable,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';

import type {
  IntervalActivityPhase,
  IntervalTimerActivityProps,
} from './IntervalTimerActivityLogic';

// The interval timer on the lock screen and in the Dynamic Island (10.1 FR-6; canvas 2.6, GT-99):
// the app's icon, the exercise in bold over its rounds, the block's time left on the right, a bar
// under them with a cell for each work and rest, and Pause (Resume while paused). No End early: too
// easy to hit by accident (canvas 6.3). A tap on the rest opens the timer.
//
// The block, not the phase (research 10.3, 20.10.2026): behind a locked screen iOS turns down the
// app's updates once it is only playing audio, so a phase view froze on 0:00 of the phase before.
// Everything drawn here runs by itself from the start, the same every time. No Skip rest: the
// activity can't know a rest is running.
//
// The `'widget'` function below is not run in the app. Babel turns it into a string, and the
// widget extension runs that on its own (expo-widgets): nothing from this module's scope reaches
// it — not the design tokens, not a constant. So every colour and size comes in through
// `props.look` (IntervalTimerActivityLogic.ts), and the buttons' targets are written out here —
// keep them in step with `IntervalActivityAction`.
//
// - Running, the time and the cells run by themselves: the app need not wake to move them.
// - Paused, the time is plain text and the cells hold — see `IntervalActivityBlock`. Nothing
//   else changes but the button (Artem, 20.10.2026): the time sits in a fixed, right-aligned frame,
//   so the activity doesn't jump between the two.
// - A button's tap comes back to the app as a user interaction (state/intervalLiveActivity.ts).

const IntervalTimerActivity = (
  props: IntervalTimerActivityProps,
  environment: LiveActivityEnvironment,
) => {
  'widget';
  const look = props.look;
  const paused = props.block.pausedLabel !== undefined;
  const barColor = environment.isLuminanceReduced ? look.barColorDimmed : look.barColor;
  const block = props.block;
  const interval = { lower: new Date(block.startedAt), upper: new Date(block.endsAt) };
  // Changes swap in place: the system would otherwise morph one text into the next, and the
  // activity stretched like rubber between running and paused (Artem, 20.10.2026).
  const still = contentTransition('identity');
  // Paused and running swap with no animation of their own: the system springs the activity on
  // each update, and a morph between the two bars stretched it like rubber (Artem, 20.10.2026).
  const noAnimation =
    typeof Animation === 'undefined' ? [] : [animation(Animation.linear({ duration: 0 }), paused)];
  // One frame for both: a live timer takes all the width it may need, plain text only its own.
  const clockLook = (size: number, width?: number) => [
    font({ size }),
    monospacedDigit(),
    foregroundStyle(look.clockColor),
    multilineTextAlignment('trailing'),
    still,
    ...(width === undefined ? [] : [frame({ width, alignment: 'trailing' })]),
  ];
  const clock = (size: number, width?: number) =>
    paused ? (
      <Text modifiers={clockLook(size, width)}>{block.pausedLabel}</Text>
    ) : (
      <Text timerInterval={interval} modifiers={clockLook(size, width)} />
    );
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
  // SPIKE — the phase, right with no update (GT-180): one layer per phase still to come, each
  // shown only from its start to its end, by the system's clock alone. The gate: the layer is drawn
  // white on black, with two black bars stretched over it — one full until the phase starts and
  // empty from then on (`ProgressView(timerInterval: start…start+step, countsDown: true)`), one
  // empty until the phase ends and full from then on. `luminanceToAlpha` then turns the black clear
  // and the white opaque: a view mask made of what the widget has. Found on the simulator, 26.10.2026:
  // - `geometryGroup()` first, or the widget filters each child on its own and a black bar on top
  //   turns clear instead of hiding what is under it;
  // - `brightness` + `contrast` before it hide the empty bars' grey track;
  // - white comes out at ~75% opacity — the text reads grey (a zero-radius white `shadow` to
  //   thicken it made the whole layer vanish);
  // - a button inside a gate, or wrapping one, is drawn but does not tap (the tap opens the app).
  const step = 100;
  const black = look.maskClear;
  const white = look.maskSolid;
  const during = (startsAt: number, endsAt: number, height: number, content: ReactNode) => {
    const cover = (from: number, countsDown: boolean) => (
      <ProgressView
        timerInterval={{ lower: new Date(from), upper: new Date(from + step) }}
        countsDown={countsDown}
        modifiers={[
          tint(black),
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
        <Rectangle modifiers={[foregroundStyle(black)]} />
        {content}
        {cover(startsAt, true)}
        {cover(endsAt, false)}
      </ZStack>
    );
  };
  const phaseStack = (
    width: number,
    height: number,
    layer: (phase: IntervalActivityPhase) => ReactNode,
  ) => (
    <ZStack modifiers={[frame({ maxWidth: width, height })]}>
      {props.phases.map((phase, index) => (
        <ZStack key={index} modifiers={[frame({ maxWidth: width, height })]}>
          {during(phase.startsAt, phase.endsAt, height, layer(phase))}
        </ZStack>
      ))}
    </ZStack>
  );
  const phaseTime = (phase: IntervalActivityPhase, size: number) => (
    <Text
      timerInterval={{ lower: new Date(phase.startsAt), upper: new Date(phase.endsAt) }}
      modifiers={[font({ size, weight: 'semibold' }), monospacedDigit(), foregroundStyle(white)]}
    />
  );
  const phasePanel = phaseStack(Infinity, look.phaseHeight, (phase) => (
    <HStack modifiers={[padding({ horizontal: look.gap })]}>
      <VStack alignment="leading">
        <Text modifiers={[font({ weight: 'bold', size: look.titleSize }), foregroundStyle(white)]}>
          {phase.label}
        </Text>
        <Text modifiers={[font({ size: look.captionSize }), foregroundStyle(white)]}>
          {phase.detail}
        </Text>
      </VStack>
      <Spacer />
      {phaseTime(phase, look.clockSize)}
    </HStack>
  ));
  // Skip rest: the button is always there, on top of the gates and outside them, with a near-clear
  // face of its own. Only its look is gated, shown in a rest; a tap on its spot outside a rest
  // reaches the app, which ignores it (IntervalLockScreenDriver).
  const skipRest = (
    <ZStack modifiers={[frame({ maxWidth: Infinity, height: look.buttonHeight })]}>
      {phaseStack(Infinity, look.buttonHeight, (phase) =>
        phase.rest ? (
          <HStack
            modifiers={[
              frame({ maxWidth: Infinity, minHeight: look.buttonHeight }),
              background(white),
              clipShape('capsule'),
            ]}
          >
            <Text
              modifiers={[
                font({ weight: 'medium', size: look.captionSize }),
                foregroundStyle(black),
              ]}
            >
              Skip rest
            </Text>
          </HStack>
        ) : null,
      )}
      <Button target="skipRest" onPress={() => props} modifiers={[buttonStyle('plain')]}>
        <Rectangle
          modifiers={[
            foregroundStyle(white),
            opacity(0.01),
            frame({ maxWidth: Infinity, height: look.buttonHeight }),
          ]}
        />
      </Button>
    </ZStack>
  );
  const compactPhaseTime = (size: number, width: number, height: number) =>
    phaseStack(width, height, (phase) => phaseTime(phase, size));
  const spike = props.phases.length > 0;

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
          <VStack alignment="leading">
            <Text modifiers={[font({ weight: 'semibold', size: look.titleSize }), still]}>
              {block.title}
            </Text>
            <Text modifiers={[font({ size: look.captionSize }), still]}>{block.detail}</Text>
          </VStack>
          <Spacer />
          {spike ? null : clock(look.clockSize, look.clockWidth)}
        </HStack>
        {spike ? phasePanel : null}
        {segmentBar}
        <HStack spacing={look.gap}>
          {paused ? button('pause', 'Resume', 'play.fill') : button('pause', 'Pause', 'pause.fill')}
          {spike ? skipRest : null}
        </HStack>
      </VStack>
    ),
    compactLeading: <Text>{block.title}</Text>,
    compactTrailing: spike
      ? compactPhaseTime(look.clockSizeCompact, look.clockWidthCompact, look.clockHeightCompact)
      : clock(look.clockSizeCompact),
    minimal: spike
      ? compactPhaseTime(look.clockSizeMinimal, look.clockWidthMinimal, look.clockHeightMinimal)
      : clock(look.clockSizeMinimal),
    expandedLeading: <Text>{block.title}</Text>,
    expandedTrailing: clock(look.clockSizeExpanded),
    expandedBottom: segmentBar,
  };
};

export default createLiveActivity('IntervalTimerActivity', IntervalTimerActivity);
