// What `N RIR` means, in the words 08.11 · Onboarding gives it — the one text behind the RIR badge's
// popover (GT-40) and, later, the first coachmark of the first workout (GT-42), so the two cannot
// drift apart. Working text, reworded after the TestFlight feedback.

export type RirExplanation = {
  title: string;
  paragraphs: string[];
};

export type RirExplanationInput = {
  /** The exercise's target RIR this week. */
  targetRir: number;
  /** A deload session: lighter on purpose, so the text says not to push rather than what RIR is. */
  isDeload: boolean;
  /**
   * Whether the set next to do has target reps. Without them (week 1, or an exercise with no
   * history) the user is told how to find the reps themselves.
   */
  hasRepTarget: boolean;
};

export function rirExplanation({
  targetRir,
  isDeload,
  hasRepTarget,
}: RirExplanationInput): RirExplanation {
  if (isDeload) {
    return {
      title: 'Deload week',
      paragraphs: [`Don't push: aim to finish each set with about ${targetRir} reps left.`],
    };
  }

  const paragraphs =
    targetRir === 0
      ? ["Stop a set when you can't do another rep. The number drops each week, and this is the last."]
      : [
          `Stop a set when you could do about ${targetRir} more. The number drops each week, and in the last one you go to failure.`,
        ];
  if (!hasRepTarget) {
    paragraphs.push(
      `There is no rep target yet. Do as many reps as it takes to reach ${targetRir} RIR and enter them.`,
    );
  }

  return {
    title:
      targetRir === 0
        ? '0 RIR means no reps in reserve'
        : `${targetRir} RIR means ${targetRir} ${targetRir === 1 ? 'rep' : 'reps'} in reserve`,
    paragraphs,
  };
}
