// Step S of the mesocycle editor, Flow C — copy a week (04 · Meso Creation Flows, "Flow C") —
// see 08.8 · Редактор мезоцикла — Flow C, "Шаг S — Source week". Two dropdowns and a line of
// explanation: which finished block, and which of its weeks.
//
// Both fields open already answered — the newest finished block and its last working week — so
// the ordinary way through this step is one tap on Continue (decided 23.09.2026, replacing a list
// of week rows that had no default and jumped straight to Basics when tapped). The caller owns
// both values, like every other step here: it resolves the defaults and prefills the draft.
//
// Nothing on this step says anything about load — no RIR, no weights, no volume. The source week
// gives the new block its structure and nothing else; week 1's targets are computed at Start from
// each exercise's own history (04, "Расчёт startReps"). A number here would imply that picking a
// different week moves those targets, and it doesn't (08.8, "Чего на этом шаге нет").
//
// Like the other steps this is only the step's own content — the header, progress bar and footer
// belong to the one WizardScreen mounted for the whole flow (components/MesoEditorScreen.tsx).
//
// JSX/rendering only — styles live in MesoSourceWeekStepStyles.ts and the pure option/label
// helpers in MesoSourceWeekStepLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { Dropdown } from '@design/components/Dropdown';
import type { Mesocycle } from '@domain/mesocycle';
import type { SourceWeekOption } from '@domain/sourceWeek';

import {
  NO_SOURCE_WEEKS_HINT,
  SOURCE_WEEK_HINT,
  toMesocycleOptions,
  toWeekOptions,
} from './MesoSourceWeekStepLogic';
import { styles } from './MesoSourceWeekStepStyles';

export type MesoSourceWeekStepProps = {
  /** Finished and stopped blocks, newest end first — `finishedMesocyclesNewestFirst`. */
  mesocycles: readonly Mesocycle[];
  selectedMesoId: string | undefined;
  onChangeMesoId: (mesoId: string) => void;
  /** The selected block's copyable weeks, ascending; `undefined` while they're being read. */
  weeks: readonly SourceWeekOption[] | undefined;
  selectedWeekNumber: number | undefined;
  onChangeWeekNumber: (weekNumber: number) => void;
};

export function MesoSourceWeekStep({
  mesocycles,
  selectedMesoId,
  onChangeMesoId,
  weeks,
  selectedWeekNumber,
  onChangeWeekNumber,
}: MesoSourceWeekStepProps) {
  return (
    <View style={styles.content}>
      <View style={styles.section}>
        <Dropdown
          label="Mesocycle"
          options={toMesocycleOptions(mesocycles)}
          value={selectedMesoId}
          onChange={onChangeMesoId}
          placeholder="Select a mesocycle"
        />
      </View>

      {/* The week field is held back until its options are known rather than shown empty: an
          enabled dropdown that opens onto nothing reads as a bug, and this resolves in a frame
          or two off a local database. */}
      {weeks !== undefined &&
        (weeks.length === 0 ? (
          <Text style={styles.emptyHint}>{NO_SOURCE_WEEKS_HINT}</Text>
        ) : (
          <View style={styles.section}>
            <Dropdown
              label="Week"
              options={toWeekOptions(weeks)}
              value={selectedWeekNumber === undefined ? undefined : String(selectedWeekNumber)}
              onChange={(value) => onChangeWeekNumber(Number(value))}
              placeholder="Select a week"
            />
            <Text style={styles.hint}>{SOURCE_WEEK_HINT}</Text>
          </View>
        ))}
    </View>
  );
}
