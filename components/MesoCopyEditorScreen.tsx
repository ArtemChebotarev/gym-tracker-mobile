// The mesocycle editor, Flow C — copy a week of a finished block (04 · Meso Creation Flows,
// "Flow C"; 08.8 · Редактор мезоцикла — Flow C, task 124). Owns step S: which block, which week,
// and prefilling the draft from it. Everything after that is the ordinary editor — this renders
// MesoEditorScreen with step S as its `leadStep`, so all four steps share one mounted wizard and
// no chrome is recreated between them.
//
// Every entry point lands here (04, "Точки входа"): `+` → `Copy a mesocycle` knows nothing,
// `Copy` on a Completed row knows the block. The difference is `initialMesoId` and nothing else —
// the step is never skipped, it just opens with that block already chosen, and the week is
// resolved by the same default either way.
//
// The defaults are resolved here rather than by the step, which stays presentational: the newest
// finished block, and its last working week with sessions. Both are held as "not chosen yet"
// (`undefined`) until the data they'd be chosen from arrives, so the first render doesn't commit
// to a value it would then have to correct.
//
// JSX/rendering only — the pure helpers live in MesoSourceWeekStepLogic.ts, shared with the step
// itself. No styles of its own: MesoEditorScreen and the step carry them.

import { useState } from 'react';

import { MesoEditorScreen } from '@components/MesoEditorScreen';
import { MesoSourceWeekStep } from '@components/MesoSourceWeekStep';
import { sourceWeekKey } from '@components/MesoSourceWeekStepLogic';
import { finishedMesocyclesNewestFirst } from '@domain/mesocycleLifecycle';
import { defaultSourceWeekNumber } from '@domain/sourceWeekBuilders';
import { toCopiedMesoBuilderDraft, useDraftStore } from '@state/draftStore';
import { useConfirmCopyWeekDraft } from '@state/useConfirmCopyWeekDraft';
import { useMesocycles } from '@state/useMesocycles';
import { useSourceWeekPlan, useSourceWeeks } from '@state/useSourceWeeks';

export type MesoCopyEditorScreenProps = {
  /** The block `Copy` was pressed on, when the entry point knows one. */
  initialMesoId?: string;
};

export function MesoCopyEditorScreen({ initialMesoId }: MesoCopyEditorScreenProps) {
  const setDraft = useDraftStore((state) => state.setMesoBuilder);
  const confirmCopyWeekDraft = useConfirmCopyWeekDraft();

  const mesocyclesQuery = useMesocycles();
  const sources = finishedMesocyclesNewestFirst(mesocyclesQuery.data ?? []);

  // `null` means "the user hasn't picked one" — distinct from "picked nothing", so the default
  // can keep applying until they do and stop the moment they choose. Reading the default on
  // every render rather than writing it into state on arrival keeps the two in one place and
  // avoids an effect that fires as each query resolves.
  const [pickedMesoId, setPickedMesoId] = useState<string | null>(initialMesoId ?? null);
  const mesoId = pickedMesoId ?? sources[0]?.id;

  const weeksQuery = useSourceWeeks(mesoId);
  const [pickedWeek, setPickedWeek] = useState<{ mesoId: string; weekNumber: number } | null>(null);
  // A week picked under one block doesn't carry over to another: switching the block resets the
  // week to that block's own default (08.8, "Смена мезоцикла сбрасывает неделю").
  const weekNumber =
    pickedWeek !== null && pickedWeek.mesoId === mesoId
      ? pickedWeek.weekNumber
      : defaultSourceWeekNumber(weeksQuery.data ?? []);

  const weekPlanQuery = useSourceWeekPlan(mesoId, weekNumber);
  const source = sources.find((mesocycle) => mesocycle.id === mesoId);

  // What has already been copied into the draft. Stepping back to step S and pressing Continue
  // again without changing anything must not wipe whatever was edited on steps 1–2, while an
  // actually different selection must replace it (see `sourceWeekKey`).
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleContinue() {
    if (source === undefined || weekNumber === undefined || weekPlanQuery.data === undefined) {
      return;
    }
    const key = sourceWeekKey(source.id, weekNumber);
    if (key === copiedKey) {
      return;
    }
    setDraft(toCopiedMesoBuilderDraft(source, weekPlanQuery.data, weekNumber));
    setCopiedKey(key);
  }

  return (
    <MesoEditorScreen
      title="New mesocycle"
      saveMutation={confirmCopyWeekDraft}
      leadStep={{
        title: 'Select a week to copy',
        // Continue is meant to be always available (08.8) and effectively is: it only waits on
        // the extracted week, which is what it copies, and that is a local read of one week's
        // sessions. Without it there is nothing to prefill, so the button would do nothing.
        canContinue: source !== undefined && weekPlanQuery.data !== undefined,
        onContinue: handleContinue,
        content: (
          <MesoSourceWeekStep
            mesocycles={sources}
            selectedMesoId={mesoId}
            onChangeMesoId={setPickedMesoId}
            weeks={weeksQuery.data}
            selectedWeekNumber={weekNumber}
            onChangeWeekNumber={(picked) =>
              mesoId !== undefined && setPickedWeek({ mesoId, weekNumber: picked })
            }
          />
        ),
      }}
    />
  );
}
