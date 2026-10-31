// Creation-method sheet — task 123 (08.8 · Редактор мезоцикла — Flow C, "Лист «Способ создания»").
// Opened by the accent `+` in the Mesocycles header, which used to go straight to Flow A; there
// are several ways to build a block now, so a choice stands between them.
//
// An OptionSheet, like New exercise's type sheet (GT-152): a card only selects, and moving on is
// Next in the footer. `From template` (Flow B, 08.10, GT-6) comes first and is selected on every
// opening: it is the way in for a new user, who has nothing to copy and no week of their own to
// build yet. No `New` label on it (08.10).
//
// `Copy a cycle` is the one card that can be present and not work: the feature exists, the data
// may not. With no finished or stopped block to copy from it is disabled and its caption says so
// (`copyMethodCaption`).
//
// The selection lives here rather than with the caller, unlike ExerciseTypeSheet: this sheet is
// raised from two screens and nothing outside it cares what is selected until Next. The
// destinations arrive as props, and so does whether the close slides — Next hands off to a screen,
// and a slide-down under a screen pushing in reads as a stutter rather than one deliberate motion
// (the same reason ExercisePickerSheet's Filters handoff turns it off, task 079).
// JSX/rendering only — pure helpers live in MesoCreationMethodSheetLogic.ts, per the code-style
// skill. No styles of its own: OptionSheet carries the whole layout.

import { useState } from 'react';

import { OptionSheet, type OptionSheetOption } from '@design/components/OptionSheet';
import { CopyIcon } from '@design/icons/CopyIcon';
import { GridIcon } from '@design/icons/GridIcon';
import { PlusIcon } from '@design/icons/PlusIcon';

import {
  copyMethodCaption,
  DEFAULT_CREATION_METHOD,
  type CreationMethod,
} from './MesoCreationMethodSheetLogic';

export type MesoCreationMethodSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** False with no finished or stopped mesocycle — `Copy a cycle` is then off. */
  canCopy: boolean;
  onCreateFromTemplate: () => void;
  onCreateFromScratch: () => void;
  onCopyMesocycle: () => void;
  /** False to close instantly — what the caller does on Next. Defaults to sliding. */
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
  const [method, setMethod] = useState<CreationMethod>(DEFAULT_CREATION_METHOD);
  const [wasVisible, setWasVisible] = useState(visible);

  // Back to the default on every opening, not on closing: the sheet is still on screen through its
  // slide-down, and the selection jumping there would show. It also means `copy` can't be carried
  // into an opening where there is no longer anything to copy.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setMethod(DEFAULT_CREATION_METHOD);
    }
  }

  const destinations: Record<CreationMethod, () => void> = {
    template: onCreateFromTemplate,
    scratch: onCreateFromScratch,
    copy: onCopyMesocycle,
  };

  const options: OptionSheetOption<CreationMethod>[] = [
    {
      value: 'template',
      title: 'From template',
      description: 'Start from a ready-made split',
      icon: GridIcon,
    },
    {
      value: 'scratch',
      title: 'From scratch',
      description: 'Build the week yourself',
      icon: PlusIcon,
    },
    {
      value: 'copy',
      title: 'Copy a cycle',
      description: copyMethodCaption(canCopy),
      icon: CopyIcon,
      disabled: !canCopy,
    },
  ];

  return (
    <OptionSheet
      visible={visible}
      title="New cycle"
      subtitle="How do you want to start?"
      options={options}
      selected={method}
      onSelect={setMethod}
      onNext={() => destinations[method]()}
      onClose={onClose}
      animated={animated}
    />
  );
}
