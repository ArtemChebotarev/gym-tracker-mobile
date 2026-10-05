// Creation-method sheet — task 123 (08.8 · Редактор мезоцикла — Flow C, "Лист «Способ создания»").
// Opened by the accent `+` in the Mesocycles header, which used to go straight to Flow A; there
// are two ways to build a block now, so a choice stands between them.
//
// Three rows. `From template` (Flow B, 08.10, GT-6) comes first: it is the way in for a new user,
// who has nothing to copy and no week of their own to build yet. No `New` label on it (08.10).
//
// `Copy a cycle` is the one row that can be present and not work: the feature exists, the data
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
import { GridIcon } from '@design/icons/GridIcon';
import { PlusIcon } from '@design/icons/PlusIcon';

import { copyMethodCaption } from './MesoCreationMethodSheetLogic';

export type MesoCreationMethodSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** False with no finished or stopped mesocycle — `Copy a cycle` is then off. */
  canCopy: boolean;
  onCreateFromTemplate: () => void;
  onCreateFromScratch: () => void;
  onCopyMesocycle: () => void;
  /** False to close instantly — what the caller does when a row was picked. Defaults to sliding. */
  animated?: boolean;
};

export function MesoCreationMethodSheet({
  visible,
  onClose,
  canCopy,
  onCreateFromTemplate,
  onCreateFromScratch,
  onCopyMesocycle,
  animated,
}: MesoCreationMethodSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="New training cycle" animated={animated}>
      <ActionRow
        icon={GridIcon}
        label="From template"
        caption="Start from a ready-made split"
        onPress={onCreateFromTemplate}
      />
      <ActionRow
        icon={PlusIcon}
        label="From scratch"
        caption="Build the week yourself"
        onPress={onCreateFromScratch}
      />
      <ActionRow
        icon={CopyIcon}
        label="Copy a cycle"
        caption={copyMethodCaption(canCopy)}
        onPress={onCopyMesocycle}
        disabled={!canCopy}
      />
    </BottomSheet>
  );
}
