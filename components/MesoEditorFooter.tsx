// The mesocycle editor's Continue footer, passed as WizardScreen's `footer` slot — a hint line
// above a Continue button (08.5's step 2 mockup, 02-new-meso-days.html: "Every day needs at
// least one exercise"; step 1 has no such hint). Kept as its own component, not built inline in
// app/meso-editor/new.tsx, purely because it needs a StyleSheet for the hint text and route
// files can't own one (codeStyle/no-inline-screen-styles).
//
// The hint sits above the button, not below (caller review: "Лучше валидацию писать над
// кнопкой"), and — whether or not a given step passes one — always reserves the same height via
// `hintPlaceholder` when it doesn't. Without that reserved slot, the button's own position would
// shift between step 1 (no hint) and step 2 (has one), which is exactly the kind of jump the
// widget refactor (design/components/WizardScreen.tsx) was meant to eliminate everywhere else.
//
// JSX/rendering only — styles live in MesoEditorFooterStyles.ts, per the code-style skill. No
// Logic.ts: nothing here is pure non-JSX logic worth extracting.

import { Text, View } from 'react-native';

import { Button } from '@design/components/Button';

import { styles } from './MesoEditorFooterStyles';

export type MesoEditorFooterProps = {
  onContinue: () => void;
  continueDisabled: boolean;
  hint?: string;
};

export function MesoEditorFooter({ onContinue, continueDisabled, hint }: MesoEditorFooterProps) {
  return (
    <>
      {hint !== undefined ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : (
        <View testID="meso-editor-footer-hint-placeholder" style={styles.hintPlaceholder} />
      )}
      <Button label="Continue" onPress={onContinue} disabled={continueDisabled} />
    </>
  );
}
