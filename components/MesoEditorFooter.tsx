// The mesocycle editor's Continue footer, passed as WizardScreen's `footer` slot — a plain
// Continue button plus an optional hint line under it (08.5's step 2 mockup, 02-new-meso-
// days.html: "Every day needs at least one exercise"; step 1 has no such hint). Kept as its own
// component, not built inline in app/meso-editor/new.tsx, purely because it needs a StyleSheet
// for the hint text and route files can't own one (codeStyle/no-inline-screen-styles).
//
// JSX/rendering only — styles live in MesoEditorFooterStyles.ts, per the code-style skill. No
// Logic.ts: nothing here is pure non-JSX logic worth extracting.

import { Text } from 'react-native';

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
      <Button label="Continue" onPress={onContinue} disabled={continueDisabled} />
      {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
    </>
  );
}
