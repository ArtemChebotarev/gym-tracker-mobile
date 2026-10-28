// A performance's rows inside an ExerciseDetailCard — its sets or its rounds, read by
// `exerciseLogRows` — one session of the History tab, whatever the type (10.1 FR-12).

import type { Equipment } from '@domain/catalog';
import type { RoundLog, SetLog } from '@domain/execution';
import type { PowerLoad } from '@domain/exerciseConfig';

import { ExerciseDetailCardRow } from './ExerciseDetailCard';
import { exerciseLogRows } from './ExerciseDetailScreenLogic';

export type ExerciseLogRowsProps = {
  setLogs: readonly SetLog[];
  roundLogs: readonly RoundLog[];
  /** The exercise's equipment — a `bodyweight-weighted` set reads back split (task 105). */
  equipment?: Equipment;
  /** Set for a power exercise: its sets read in its own load, with no RIR (GT-110). */
  powerLoad?: PowerLoad;
};

export function ExerciseLogRows({
  setLogs,
  roundLogs,
  equipment,
  powerLoad,
}: ExerciseLogRowsProps) {
  const rows = exerciseLogRows({ setLogs, roundLogs }, equipment, powerLoad);
  return (
    <>
      {rows.map((row, index) => (
        <ExerciseDetailCardRow
          key={row.key}
          label={row.label}
          value={row.value}
          tail={row.tail}
          isLast={index === rows.length - 1}
        />
      ))}
    </>
  );
}
