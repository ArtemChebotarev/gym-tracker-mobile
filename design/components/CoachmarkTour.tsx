// CoachmarkTour — a walk through a list of elements, one `Coachmark` at a time (08.11 ·
// Onboarding, "3. Коучмарки": a sequence of steps shown once). Each step names the element it is
// about by a ref; the tour measures that element when the step comes up, so the highlight lands
// where the layout actually put it — not on a position written down beforehand.
//
// `Next` moves on, `Got it` on the last step and `Skip` anywhere end the whole walk: both call
// `onFinish`, once. Deciding that the tour has been seen — and remembering it — is the caller's: it
// is what `onFinish` is for.
//
// A tour is shown once per mount. Finishing hides it at once, without waiting for the caller to say
// `visible={false}`: the caller usually writes a flag first, and for the few milliseconds that
// takes the tour would otherwise still be on screen. Nothing is reset when it goes away — it fades
// out rather than vanishing, and what it draws during the fade must stay the step it was on, where
// it was. A caller that wants to run it again mounts a fresh one (a new `key`).

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { AnchorRect } from '../popoverLayout';
import { Coachmark } from './Coachmark';

export type CoachmarkStep = {
  /** The element the step points at. Measured when the step is shown. */
  targetRef: RefObject<View | null>;
  title: string;
  paragraphs: readonly string[];
  /** The corner radius of the ring and the hole — a `RADII` token. Defaults to a control's. */
  ringRadius?: number;
};

export type CoachmarkTourProps = {
  visible: boolean;
  steps: readonly CoachmarkStep[];
  /** The walk is over — `Got it` on the last step, or `Skip` on any. */
  onFinish: () => void;
};

export function CoachmarkTour({ visible, steps, onFinish }: CoachmarkTourProps) {
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  // Finished — and stays hidden, whatever `visible` says.
  const [finished, setFinished] = useState(false);
  const step = steps[index];

  // Measured whenever a step comes up. The previous anchor is kept until the new one arrives, so
  // the ring moves from one element to the next rather than flashing through the middle.
  const target = step?.targetRef;
  useEffect(() => {
    if (!visible) {
      return;
    }
    target?.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  }, [visible, index, target]);

  function finish() {
    setFinished(true);
    onFinish();
  }

  function next() {
    if (index >= steps.length - 1) {
      finish();
    } else {
      setIndex(index + 1);
    }
  }

  if (step === undefined) {
    return null;
  }

  return (
    <Coachmark
      visible={visible && !finished}
      anchor={anchor}
      {...(step.ringRadius !== undefined ? { ringRadius: step.ringRadius } : {})}
      step={index + 1}
      total={steps.length}
      title={step.title}
      paragraphs={step.paragraphs}
      onNext={next}
      onSkip={finish}
    />
  );
}
