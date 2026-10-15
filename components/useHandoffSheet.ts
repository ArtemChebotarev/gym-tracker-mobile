// The state of a sheet whose pick hands over to another screen — the creation-method sheet (123;
// 08.8 · Редактор мезоцикла — Flow C, "Лист «Способ создания»"), raised from three places that
// must not each keep their own copy of how it opens and closes, and the New exercise type sheet
// (GT-74).
//
// Only one thing about it is non-obvious, and it is why this is a state machine rather than a
// boolean: picking closes the sheet *without* its slide, because the chosen screen is pushing in at
// the same moment and two transitions at once read as a stutter (Artem's call, task 123).
// Dismissing it by backdrop or grabber still slides — nothing is arriving to take its place.
//
// A hook rather than a wrapper component, so the sheet stays where its screen renders it and each
// caller keeps passing its own destinations — same shape as components/useSecretTaps.ts.

import { useCallback, useState } from 'react';

type SheetState = 'closed' | 'open' | 'chosen';

export type HandoffSheetState = {
  /** Raises the sheet — a `+` button, or an empty state's action. */
  open: () => void;
  visible: boolean;
  /** False while closing after a pick: see the note above. */
  animated: boolean;
  close: () => void;
  /** Wraps a destination so picking it closes the sheet before navigating. */
  choose: (go: () => void) => () => void;
};

export function useHandoffSheet(): HandoffSheetState {
  const [state, setState] = useState<SheetState>('closed');

  const choose = useCallback(
    (go: () => void) => () => {
      setState('chosen');
      go();
    },
    [],
  );

  return {
    open: useCallback(() => setState('open'), []),
    visible: state === 'open',
    animated: state !== 'chosen',
    close: useCallback(() => setState('closed'), []),
    choose,
  };
}
