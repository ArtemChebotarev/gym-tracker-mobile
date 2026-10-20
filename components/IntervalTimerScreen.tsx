// The interval timer, full screen over the workout (10.1 FR-6; canvas 2.1–2.4, 6.1, 6.3; GT-96):
// the exercise and its round, one bar per round, the phase, the dial with the time left, what comes
// next, and the controls — Pause / Resume, Skip rest in a rest, End early with a confirmation.
// Once the last round is done it turns into the summary, which stays until Back to workout.
//
// Orange is the running time only (FR-6): the dial. A rest runs grey (canvas 2.2), a paused timer
// goes faint; the bars of the rounds are lime, the one being worked filling up (Artem, 20.10.2026).
// The dial runs down smoothly by itself (ProgressRing's `runsOutAt`).
//
// Paused is the running screen held (Artem, 20.10.2026 — the canvas drew it differently): the same
// round button, now Play, labelled Resume, and End early as text as before.
//
// Its own SafeAreaProvider, as WizardScreen has: the app's root one is an ancestor of the
// full-screen modal, not inside its presentation, and gave it no insets — the header went under
// the status bar and Back to workout down to the home indicator (Artem, 20.10.2026).
//
// JSX only — what it shows is worked out in IntervalTimerScreenLogic.ts, styles live in
// IntervalTimerScreenStyles.ts.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@design/components/Button';
import { Dialog } from '@design/components/Dialog';
import { ProgressRing } from '@design/components/ProgressRing';
import { SegmentBar } from '@design/components/SegmentBar';
import { CheckIcon } from '@design/icons/CheckIcon';
import { PauseIcon } from '@design/icons/PauseIcon';
import { PlayIcon } from '@design/icons/PlayIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, SIZES } from '@design/tokens';

import type { IntervalSummaryView, IntervalTimerView } from './IntervalTimerScreenLogic';
import { RING_COLOR, SEGMENT_COLOR, styles } from './IntervalTimerScreenStyles';

export type IntervalTimerScreenProps = {
  /** The running or paused timer; absent once the block is done. */
  view?: IntervalTimerView;
  /** The summary once the block is done. */
  summary?: IntervalSummaryView;
  onPause: () => void;
  onResume: () => void;
  onSkipRest: () => void;
  /** What End early's confirmation says goes into the log, worked out when it opens. */
  endEarlyMessage: () => string;
  /** End early, confirmed. */
  onEndEarly: () => void;
  onBackToWorkout: () => void;
};

export function IntervalTimerScreen(props: IntervalTimerScreenProps) {
  return (
    <SafeAreaProvider>
      <TimerBody {...props} />
    </SafeAreaProvider>
  );
}

function TimerBody({
  view,
  summary,
  onPause,
  onResume,
  onSkipRest,
  endEarlyMessage,
  onEndEarly,
  onBackToWorkout,
}: IntervalTimerScreenProps) {
  const [confirm, setConfirm] = useState<string | null>(null);

  if (summary !== undefined) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{summary.title}</Text>
          <Text style={styles.subtitle}>All rounds done</Text>
        </View>
        <View style={styles.summary}>
          <View style={styles.doneMark}>
            <CheckIcon size={ICON_SIZES['icon/button']} color={COLORS['accent/on']} />
          </View>
          <Text style={styles.summaryRounds}>{summary.rounds}</Text>
          <Text style={styles.next}>{summary.totals}</Text>
        </View>
        <View style={styles.controls}>
          <Button label="Back to workout" onPress={onBackToWorkout} />
        </View>
      </SafeAreaView>
    );
  }

  if (view === undefined) {
    return <SafeAreaView style={styles.screen} edges={['top', 'bottom']} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{view.title}</Text>
        <Text style={styles.subtitle}>{view.subtitle}</Text>
      </View>
      <SegmentBar
        accessibilityLabel={view.subtitle}
        segments={view.segments.map((segment) => ({
          fill: segment.fill,
          color: SEGMENT_COLOR[segment.tone],
          // The round being worked fills up smoothly by the end of its work, as the dial runs down.
          ...(segment.tone === 'running' && view.runsOutAt !== undefined
            ? { fullAt: view.runsOutAt }
            : {}),
        }))}
      />
      <Text style={[styles.phase, view.paused && styles.phasePaused]}>{view.phase}</Text>
      {view.pill !== undefined && <Text style={styles.pill}>{view.pill}</Text>}
      <View style={styles.dial}>
        <ProgressRing
          size={SIZES['size/timer-dial']}
          strokeWidth={BORDER_WIDTHS['border/timer-dial']}
          progress={view.progress}
          {...(view.runsOutAt !== undefined ? { runsOutAt: view.runsOutAt } : {})}
          color={RING_COLOR[view.tone]}
          trackColor={COLORS['border/divider']}
          arcTestID="interval-timer-arc"
        >
          <Text accessibilityRole="timer" style={[styles.time, view.paused && styles.timePaused]}>
            {view.time}
          </Text>
          <Text style={styles.of}>{view.of}</Text>
        </ProgressRing>
      </View>
      <Text style={styles.next}>{view.next}</Text>

      <View style={styles.controls}>
        <View style={styles.roundControls}>
          <View style={styles.roundButton}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={view.paused ? 'Resume' : 'Pause'}
              onPress={view.paused ? onResume : onPause}
              style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
            >
              {view.paused ? (
                <PlayIcon size={ICON_SIZES['icon/button']} color={COLORS['text/primary']} />
              ) : (
                <PauseIcon size={ICON_SIZES['icon/button']} color={COLORS['text/primary']} />
              )}
            </Pressable>
            <Text style={styles.buttonLabel}>{view.paused ? 'Resume' : 'Pause'}</Text>
          </View>
          {view.canSkipRest && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip rest"
              onPress={onSkipRest}
              style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
            >
              <SkipIcon size={ICON_SIZES['icon/button']} color={COLORS['text/primary']} />
              <Text style={styles.skipLabel}>Skip rest</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End early"
          onPress={() => setConfirm(endEarlyMessage())}
          style={({ pressed }) => [styles.endEarly, pressed && styles.pressed]}
        >
          <Text style={styles.endEarlyLabel}>End early</Text>
        </Pressable>
      </View>

      <Dialog visible={confirm !== null}>
        <Text style={styles.dialogTitle}>End the timer?</Text>
        <Text style={styles.dialogText}>{confirm}</Text>
        <View style={styles.dialogActions}>
          <Button
            label="End timer"
            variant="danger"
            onPress={() => {
              setConfirm(null);
              onEndEarly();
            }}
          />
          <Button label="Keep going" onPress={() => setConfirm(null)} />
        </View>
      </Dialog>
    </SafeAreaView>
  );
}
