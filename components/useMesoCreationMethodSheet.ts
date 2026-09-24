// The creation-method sheet's own state, shared by everything that opens it (123; 08.8 · Редактор
// мезоцикла — Flow C, "Лист «Способ создания»"). Three places raise the same sheet — the accent `+`
// on 08.3, that screen's empty state, and the Today tab's — and they must not each keep their own
// copy of how it opens and closes.
//
// Only one thing about it is non-obvious, and it is why this is a state machine rather than a
// boolean: picking a row closes the sheet *without* its slide, because the chosen screen is pushing
// in at the same moment and two transitions at once read as a stutter (Artem's call, task 123).
// Dismissing it by backdrop or grabber still slides — nothing is arriving to take its place.
//
// A hook rather than a wrapper component, so the sheet stays where its screen renders it and each
// caller keeps passing its own destinations — same shape as components/useSecretTaps.ts.

import { useCallback, useState } from 'react';

type SheetState = 'closed' | 'open' | 'chosen';

export type MesoCreationMethodSheetState = {
  /** Raises the sheet — the `+` button, or an empty state's action. */
  open: () => void;
  visible: boolean;
  /** False while closing after a pick: see the note above. */
  animated: boolean;
  close: () => void;
  /** Wraps a destination so picking it closes the sheet before navigating. */
  choose: (go: () => void) => () => void;
};

export function useMesoCreationMethodSheet(): MesoCreationMethodSheetState {
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
