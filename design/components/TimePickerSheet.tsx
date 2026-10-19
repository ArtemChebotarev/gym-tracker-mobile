// TimePickerSheet — see canvas 8.2, "Time picker for a round field": a duration chosen on two
// wheels, minutes and seconds, in a panel that rises from the bottom with the title of what is
// being set, a line under it, and Done. For any field that holds a length of time — a round's work
// or rest, an exercise's defaults — where `−` / `+` by five seconds is too many taps.
//
// Two wheels, minutes and seconds, in a WheelPickerSheet. (iOS's own countdown picker does not do
// seconds, hence two wheels rather than one.)
//
// Controlled: it shows `value` and reports every change through `onChange`, held within
// `[minSec, maxSec]` — what is picked is already what will be kept. Done only closes the panel.

import { joinSeconds, minuteOptions, secondOptions, splitSeconds } from '../timePickerLogic';
import { WheelPickerSheet, type WheelColumn } from './WheelPickerSheet';

export type TimePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** What is being set: `Rest · round 1`. */
  title: string;
  /** A line under the title: what else the change moves. */
  subtitle?: string;
  /** Seconds. */
  value: number;
  onChange: (valueSec: number) => void;
  /** The least and the most the field may hold, seconds. */
  minSec?: number;
  maxSec: number;
  /** Seconds between two positions of the seconds wheel. Defaults to 5. */
  stepSec?: number;
};

const DEFAULT_STEP_SEC = 5;

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function TimePickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onChange,
  minSec = 0,
  maxSec,
  stepSec = DEFAULT_STEP_SEC,
}: TimePickerSheetProps) {
  const { minutes, seconds } = splitSeconds(value);
  // Each wheel offers only what fits the bounds, so a time outside them can't be picked and then
  // quietly put back — the seconds at the minute the other wheel is on.
  const secondValues = secondOptions(stepSec, { minutes, minSec, maxSec });
  // A value that is not on a step (an old 0:07) shows on the nearest position below it.
  const shownSeconds = secondValues.filter((s) => s <= seconds).pop() ?? 0;

  const columns: WheelColumn[] = [
    {
      values: minuteOptions(maxSec, minSec),
      selected: minutes,
      onSelect: (next) => onChange(joinSeconds(next, shownSeconds, minSec, maxSec)),
      unit: 'min',
    },
    {
      values: secondValues,
      selected: shownSeconds,
      onSelect: (next) => onChange(joinSeconds(minutes, next, minSec, maxSec)),
      format: twoDigits,
      unit: 'sec',
    },
  ];

  return (
    <WheelPickerSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      columns={columns}
    />
  );
}
