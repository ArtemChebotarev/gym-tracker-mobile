// NumberPickerSheet — a whole number chosen on one wheel, in a WheelPickerSheet: for a count that
// `−` / `+` by one reaches slowly, like the rounds of an interval. The sister of TimePickerSheet;
// both are opened the same way, by a tap on the value.
//
// Controlled: it shows `value` and reports every change through `onChange`, within `[min, max]`.
// Done only closes the panel.

import { clampSeconds } from '../timePickerLogic';
import { WheelPickerSheet } from './WheelPickerSheet';

export type NumberPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** A word after the wheel: `rounds`. */
  unit?: string;
};

export function NumberPickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onChange,
  min,
  max,
  unit,
}: NumberPickerSheetProps) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <WheelPickerSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      columns={[
        {
          values,
          // A value outside the range (an old stored one) shows at the nearest end.
          selected: clampSeconds(value, min, max),
          onSelect: onChange,
          unit,
        },
      ]}
    />
  );
}
