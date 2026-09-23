// Creation-method sheet — task 123 (08.8 · Редактор мезоцикла — Flow C, "Лист «Способ создания»").
// Opened by the accent `+` in the Mesocycles header, which used to go straight to Flow A; there
// are two ways to build a block now, so a choice stands between them.
//
// Two rows, not three. Templates (Flow B) don't exist in this version at all (04 · Meso Creation
// Flows, "Каталожные и пользовательские шаблоны"), so there is no row for them — a disabled one
// would promise a feature that isn't there. They arrive with task 043.
//
// `Copy a mesocycle` is the one row that can be present and not work: the feature exists, the data
// may not. With no finished or stopped block to copy from it is disabled and its caption says so
// (`copyMethodCaption`).
//
// Presentational and fully controlled, like the other sheets: both destinations arrive as props,
// and so does whether the close slides — picking a row hands off to a screen, and a slide-down
// under a screen pushing in reads as a stutter rather than one deliberate motion (the same reason
// ExercisePickerSheet's Filters handoff turns it off, task 079).
// JSX/rendering only — pure helpers live in MesoCreationMethodSheetLogic.ts, per the code-style
// skill. No styles of its own: BottomSheet and ActionRow carry the whole layout.

import { BottomSheet } from '@design/components/BottomSheet';
import { ActionRow } from '@design/components/ActionRow';
import { CopyIcon } from '@design/icons/CopyIcon';
import { PlusIcon } from '@design/icons/PlusIcon';

import { copyMethodCaption } from './MesoCreationMethodSheetLogic';

export type MesoCreationMethodSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** False with no finished or stopped mesocycle — `Copy a mesocycle` is then off. */
  canCopy: boolean;
  onCreateFromScratch: () => void;
  onCopyMesocycle: () => void;
  /** False to close instantly — what the caller does when a row was picked. Defaults to sliding. */
  animated?: boolean;
};

export function MesoCreationMethodSheet({
  visible,
  onClose,
  canCopy,
  onCreateFromScratch,
  onCopyMesocycle,
  animated,
}: MesoCreationMethodSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="New mesocycle" animated={animated}>
      <ActionRow
        icon={PlusIcon}
        label="From scratch"
        caption="Build the week yourself"
        onPress={onCreateFromScratch}
      />
      <ActionRow
        icon={CopyIcon}
        label="Copy a mesocycle"
        caption={copyMethodCaption(canCopy)}
        onPress={onCopyMesocycle}
        disabled={!canCopy}
      />
    </BottomSheet>
  );
}
