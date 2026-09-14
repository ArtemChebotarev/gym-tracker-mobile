// Stepper — see 08.0 · Design SDK, "Компоненты" (added by task 073: the mesocycle editor uses a
// stepper three times — meso length 3–8, days per week 1–7, sets per exercise — but no such
// component existed in the SDK yet). The default `field` variant matches 08.5's own stepper-row
// mockup: a bordered card row with the current value (formatted by the caller, e.g. "6 weeks")
// and an optional caption stacked on the left, and the two circular controls grouped together on
// the right — corrected in task 075 after the mesocycle editor (08.5's own target screen for
// this component) revealed the original centered button/value/button guess didn't match the
// mockup's actual layout.
//
// `variant="inline"` (added by task 076, for 08.5's "Шаг 2" exercise row's sets stepper —
// 02-new-meso-days.html's `.sets-stepper` — the third of the three usages this component was
// built for) is a genuinely different layout, not just a smaller version of `field`: the two
// buttons flank a centered value+caption block (− then value/caption then +) instead of sitting
// grouped together on one side, since here the "original centered button/value/button" shape
// task 075 moved away from for the standalone field is exactly what this embedded, no-card-chrome
// context wants. `label` is still required in this variant: it's not shown, but still feeds the
// "Decrease {label}" / "Increase {label}" accessibility labels.
//
// Each button disables itself at its own end of the [min, max] range rather than relying on a
// single `disabled` prop, since that boundary behavior is the point of the component.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';
import { fieldStyles } from './fieldStyles';

export type StepperVariant = 'field' | 'inline';

export type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Formats the displayed value, e.g. `(v) => \`${v} weeks\``. Defaults to the bare number. */
  formatValue?: (value: number) => string;
  /** Optional second line under the value, e.g. "Includes a deload week" / "sets". */
  caption?: string;
  /** `field` (default): bordered card row with a label above. `inline`: centered, no card chrome. */
  variant?: StepperVariant;
};

// No dedicated size token exists yet — same exception as IconButton's DIAMETER.
const BUTTON_DIAMETER = 30;
const INLINE_BUTTON_DIAMETER = 24;
// Mockup (08.5's stepper-row): asymmetric row padding (10px top/bottom/right, 14px left — the
// left edge lines up with the field/label above it) and a 2px gap between the value and its
// caption. No token exists for either.
const ROW_PADDING_RIGHT = 10;
const CAPTION_MARGIN_TOP = 2;

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  caption,
  variant = 'field',
}: StepperProps) {
  const decrementDisabled = value <= min;
  const incrementDisabled = value >= max;
  const displayValue = formatValue ? formatValue(value) : String(value);
  const isInline = variant === 'inline';

  const decrementButton = (
    <StepperButton
      accessibilityLabel={`Decrease ${label}`}
      disabled={decrementDisabled}
      inline={isInline}
      onPress={() => onChange(Math.max(min, value - step))}
    >
      −
    </StepperButton>
  );
  const incrementButton = (
    <StepperButton
      accessibilityLabel={`Increase ${label}`}
      disabled={incrementDisabled}
      inline={isInline}
      onPress={() => onChange(Math.min(max, value + step))}
    >
      +
    </StepperButton>
  );

  if (isInline) {
    return (
      <View style={styles.inlineRow}>
        {decrementButton}
        <View>
          <Text style={styles.valueInline}>{displayValue}</Text>
          {caption !== undefined && <Text style={styles.captionInline}>{caption}</Text>}
        </View>
        {incrementButton}
      </View>
    );
  }

  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.value}>{displayValue}</Text>
          {caption !== undefined && <Text style={styles.caption}>{caption}</Text>}
        </View>
        <View style={styles.controls}>
          {decrementButton}
          {incrementButton}
        </View>
      </View>
    </View>
  );
}

type StepperButtonProps = {
  accessibilityLabel: string;
  disabled: boolean;
  inline: boolean;
  onPress: () => void;
  children: ReactNode;
};

function StepperButton({ accessibilityLabel, disabled, inline, onPress, children }: StepperButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        inline ? styles.buttonInline : styles.button,
        pressed && styles.pressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[inline ? styles.glyphInline : styles.glyph, disabled && styles.glyphDisabled]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS['surface/card'],
    borderWidth: 1,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingLeft: SPACING['space/screen'],
    paddingRight: ROW_PADDING_RIGHT,
    paddingVertical: SPACING['space/row'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
  caption: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/faint'],
    marginTop: CAPTION_MARGIN_TOP,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
  },
  button: {
    width: BUTTON_DIAMETER,
    height: BUTTON_DIAMETER,
    borderRadius: BUTTON_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/control-active'],
  },
  pressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  glyph: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  glyphDisabled: {
    color: COLORS['text/disabled'],
  },
  // --- inline variant (02-new-meso-days.html's .sets-stepper) ---------------------------------
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  valueInline: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
    textAlign: 'center',
  },
  captionInline: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
    textAlign: 'center',
    marginTop: CAPTION_MARGIN_TOP,
  },
  buttonInline: {
    width: INLINE_BUTTON_DIAMETER,
    height: INLINE_BUTTON_DIAMETER,
    borderRadius: INLINE_BUTTON_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/control-active'],
  },
  glyphInline: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
});
