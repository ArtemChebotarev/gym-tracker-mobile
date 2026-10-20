// Writes the rounds the interval timer goes through (GT-98, 10.1 FR-7 "основной путь") through the
// usecase layer, and re-reads the workout after each, so the card fills in as the timer runs.
//
// The writes go one after another, never side by side: a round is written as its work ends and
// again as its rest does, and the second must not overtake the first.

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import type { IntervalRoundResult } from '@domain/intervalTimer';
import { logTimerRound, type LogRoundResult } from '@usecases/roundLogging';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { useWorkoutStore } from './workoutStore';

/** Where a timer's rounds go: the session and the exercise in it. */
export type TimerRoundTarget = { sessionId: string; sessionExerciseId: string };

/**
 * A function that queues `result` to be written for `target`, and resolves with what the write
 * did — `onOutcome` hears every outcome, a conflict with another running session and a failure
 * included, so the caller can say so.
 */
export function useTimerRoundLogging(
  onOutcome: (outcome: LogRoundResult | { kind: 'failed'; error: unknown }) => void,
): (target: TimerRoundTarget, result: IntervalRoundResult) => void {
  const store = useWorkoutStore();
  const queryClient = useQueryClient();
  const queue = useRef<Promise<void>>(Promise.resolve());

  return useCallback(
    (target, result) => {
      queue.current = queue.current.then(async () => {
        try {
          const outcome = await logTimerRound(
            { ...target, roundNumber: result.roundNumber },
            result,
            store,
          );
          if (outcome.kind === 'logged') {
            await invalidateWorkoutQueries(queryClient);
          }
          onOutcome(outcome);
        } catch (error) {
          onOutcome({ kind: 'failed', error });
        }
      });
    },
    [store, queryClient, onOutcome],
  );
}
