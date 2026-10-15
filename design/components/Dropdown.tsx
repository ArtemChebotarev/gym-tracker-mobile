// Dropdown — see 08.0 · Design SDK, "Компоненты": closed / open / selected states for choosing
// one value from a long list (08.0: "Для одиночного выбора из длинного списка"). The option list
// floats over the screen directly under the trigger — or over it, when the trigger is low enough
// that a list below would run off the window — instead of opening in the flow and pushing the
// rest of the form down. It is presented through <Modal> (a transparent one, no dimming) so that
// it is above everything else in the window whatever its siblings' stacking is, and so that a tap
// outside closes it; the same measure-then-place approach Popover uses (`measureInWindow`).
// Under Jest `measureInWindow` answers nothing; the list then opens centred rather than not at
// all. The trigger's label/box/error chrome comes from fieldStyles.ts, shared with TextField, so
// the two form fields stay visually identical.
//
// The option list is capped at `size/dropdown-panel` and scrolls internally past that — a
// 12-option list (every muscle group) shown in full would cover the screen.

import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AnchorRect } from '../popoverLayout';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { circle } from '../shapes';
import { fieldStyles } from './fieldStyles';

export type DropdownOption = {
  value: string;
  label: string;
  /** Leading color dot, e.g. a muscle group's family color (03-new-exercise.html). Omit for a
   * plain option row. */
  dotColor?: string;
};

export type DropdownProps = {
  label: string;
  options: readonly DropdownOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

export function Dropdown({ label, options, value, onChange, placeholder, error }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const triggerRef = useRef<View>(null);
  const window = useWindowDimensions();
  const hasError = error !== undefined;
  const selectedOption = options.find((option) => option.value === value);

  function open() {
    triggerRef.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x, y, width, height }),
    );
    setIsOpen(true);
  }

  // Under the trigger unless the window has less room there than the list's own height.
  const placement =
    anchor === null
      ? null
      : window.height - (anchor.y + anchor.height) >= SIZES['size/dropdown-panel']
        ? { left: anchor.x, width: anchor.width, top: anchor.y + anchor.height + SPACING['space/gap-tight'] }
        : { left: anchor.x, width: anchor.width, bottom: window.height - anchor.y + SPACING['space/gap-tight'] };

  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen }}
        onPress={open}
        style={[fieldStyles.box, hasError && fieldStyles.boxError, styles.trigger]}
      >
        <View style={styles.triggerValue}>
          {selectedOption?.dotColor !== undefined && (
            <View style={[styles.dot, { backgroundColor: selectedOption.dotColor }]} />
          )}
          <Text style={selectedOption !== undefined ? styles.value : styles.placeholder}>
            {selectedOption?.label ?? placeholder ?? ''}
          </Text>
        </View>
        <Text style={styles.chevron}>{isOpen ? '︿' : '﹀'}</Text>
      </Pressable>
      {hasError && <Text style={fieldStyles.error}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
        />
        <View
          pointerEvents="box-none"
          style={placement === null ? styles.centered : styles.anchored}
        >
          <ScrollView
            style={[styles.panel, placement ?? styles.panelCentered]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {option.dotColor !== undefined && (
                    <View style={[styles.dot, { backgroundColor: option.dotColor }]} />
                  )}
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/primary'],
  },
  placeholder: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  chevron: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  // The list is placed by `top`/`bottom`/`left`/`width` from the measured trigger; this wrapper
  // only has to let the touches outside it through to the backdrop.
  anchored: {
    ...StyleSheet.absoluteFill,
  },
  centered: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
  },
  panelCentered: {
    position: 'relative',
  },
  panel: {
    position: 'absolute',
    // Roughly 4.5 option rows tall — enough to preview the list without letting it dominate the
    // screen. The half-row is deliberate: a visibly cut-off row is a stronger "there's more,
    // scroll" affordance than a clean break at a whole row boundary.
    maxHeight: SIZES['size/dropdown-panel'],
    ...SHADOWS['shadow/lifted'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
  },
  optionSelected: {
    backgroundColor: COLORS['surface/control-active'],
  },
  optionLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
    flex: 1,
  },
  optionLabelSelected: {
    color: COLORS['text/primary'],
  },
  check: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS.accent,
  },
  dot: {
    ...circle(SIZES['size/dot-large']),
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
