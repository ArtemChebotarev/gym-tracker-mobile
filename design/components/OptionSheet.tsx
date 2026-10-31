// OptionSheet — a sheet that asks one thing: a title, a line under it, a group of OptionCards, and
// Cancel / Next in the footer (08.0, "Формы и шаги визарда"). A card only selects; moving on is Next.
// New exercise's type and the creation-method sheet are both this, with their own options.
//
// Controlled and domain-agnostic: the options and the selected value arrive as props, and what Next
// leads to is the caller's.

import { BottomSheet } from './BottomSheet';
import { CancelNextFooter } from './CancelNextFooter';
import { OptionCard, OptionCardGroup } from './OptionCard';
import type { IconComponent } from '../icons/IconFrame';
import { COLORS, ICON_SIZES } from '../tokens';

export type OptionSheetOption<T extends string> = {
  value: T;
  title: string;
  description: string;
  icon: IconComponent;
  /** The option exists but can't be chosen now; the description should say why. */
  disabled?: boolean;
};

export type OptionSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  subtitle: string;
  options: readonly OptionSheetOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onNext: () => void;
  onClose: () => void;
  /** False while closing for Next — the next screen opens at the same moment (see useHandoffSheet). */
  animated?: boolean;
};

export function OptionSheet<T extends string>({
  visible,
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onNext,
  onClose,
  animated,
}: OptionSheetProps<T>) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      animated={animated}
      title={title}
      subtitle={subtitle}
      footer={<CancelNextFooter onCancel={onClose} onNext={onNext} />}
    >
      <OptionCardGroup>
        {options.map((option) => {
          const isSelected = option.value === selected;
          const Icon = option.icon;
          return (
            <OptionCard
              key={option.value}
              title={option.title}
              description={option.description}
              selected={isSelected}
              disabled={option.disabled}
              onPress={() => onSelect(option.value)}
              icon={
                <Icon
                  size={ICON_SIZES['icon/button']}
                  color={isSelected ? COLORS.accent : COLORS['text/secondary']}
                />
              }
            />
          );
        })}
      </OptionCardGroup>
    </BottomSheet>
  );
}
