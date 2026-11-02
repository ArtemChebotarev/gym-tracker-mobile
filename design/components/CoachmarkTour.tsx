// CoachmarkTour — a walk through a list of elements, one `Coachmark` at a time (08.11 ·
// Onboarding, "3. Коучмарки": a sequence of steps shown once). Each step names the element it is
// about by a ref; the tour measures that element when the step comes up, so the highlight lands
// where the layout actually put it — not on a position written down beforehand. A step whose
// element may be off screen says so (`scrolls`), and the caller's `reveal` brings it in first.
//
// `Next` moves on, `Got it` on the last step and `Skip` anywhere end the whole walk: both call
// `onFinish`, once, and say which it was. Deciding what has been seen — and remembering it — is the
// caller's: it is what `onFinish` is for.
//
// A tour is shown once per mount. Finishing hides it at once, without waiting for the caller to say
// `visible={false}`: the caller usually writes a flag first, and for the few milliseconds that
// takes the tour would otherwise still be on screen. Nothing is reset when it goes away — it fades
// out rather than vanishing, and what it draws during the fade must stay the step it was on, where
// it was, even if the caller's list has lost that step by then. A caller that wants to run it again
// mounts a fresh one (a new `key`).

import { useEffect, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { View } from 'react-native';

import type { AnchorRect } from '../popoverLayout';
import { Coachmark } from './Coachmark';
import type { PlateTextPart } from './PlateText';

export type CoachmarkStep = {
  /** The element the step points at. Measured when the step is shown. */
  targetRef: RefObject<View | null>;
  title: string;
  paragraphs?: readonly (string | readonly PlateTextPart[])[];
  /** Shown under the title instead of the paragraphs — a picture and a few rows. */
  content?: ReactNode;
  /** The corner radius of the ring and the hole — a `RADII` token. Defaults to a control's. */
  ringRadius?: number;
  /** The element scrolls with its screen: `reveal` runs before it is measured. */
  scrolls?: boolean;
};

/** How the walk ended: `Got it` on the last step, or `Skip` on any. */
export type CoachmarkTourEnd = 'completed' | 'skipped';

export type CoachmarkTourProps = {
  visible: boolean;
  steps: readonly CoachmarkStep[];
  onFinish: (end: CoachmarkTourEnd) => void;
  /** Brings a `scrolls` step's element into view; resolves when it has stopped moving. */
  reveal?: (target: RefObject<View | null>) => Promise<void>;
};

export function CoachmarkTour({ visible, steps, onFinish, reveal }: CoachmarkTourProps) {
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  // Finished — and stays hidden, whatever `visible` says, on the step it ended on.
  const [ended, setEnded] = useState<{ step: CoachmarkStep; total: number } | null>(null);
  const step = ended?.step ?? steps[index];
  const total = ended?.total ?? steps.length;

  // Measured whenever a step comes up. The previous anchor is kept until the new one arrives, so
  // the ring moves from one element to the next rather than flashing through the middle.
  const target = step?.targetRef;
  const scrolls = step?.scrolls === true;
  useEffect(() => {
    if (!visible || target === undefined) {
      return;
    }
    let cancelled = false;
    const measure = () => {
      if (!cancelled) {
        target.current?.measureInWindow((x, y, width, height) =>
          setAnchor({ x, y, width, height }),
        );
      }
    };
    if (scrolls && reveal !== undefined) {
      void reveal(target).then(measure);
    } else {
      measure();
    }
    return () => {
      cancelled = true;
    };
  }, [visible, index, target, scrolls, reveal]);

  function finish(end: CoachmarkTourEnd) {
    if (step !== undefined) {
      setEnded({ step, total });
    }
    onFinish(end);
  }

  function next() {
    if (index >= steps.length - 1) {
      finish('completed');
    } else {
      setIndex(index + 1);
    }
  }

  if (step === undefined) {
    return null;
  }

  return (
    <Coachmark
      visible={visible && ended === null}
      anchor={anchor}
      {...(step.ringRadius !== undefined ? { ringRadius: step.ringRadius } : {})}
      step={index + 1}
      total={total}
      title={step.title}
      {...(step.paragraphs !== undefined ? { paragraphs: step.paragraphs } : {})}
      {...(step.content !== undefined ? { content: step.content } : {})}
      onNext={next}
      onSkip={() => finish('skipped')}
    />
  );
}
