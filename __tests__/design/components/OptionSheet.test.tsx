import { fireEvent, render, screen } from '@testing-library/react-native';
import { Modal } from 'react-native';

import { OptionSheet, type OptionSheetProps } from '@design/components/OptionSheet';
import { COLORS } from '@design/tokens';
import { CopyIcon } from '@design/icons/CopyIcon';
import { PlusIcon } from '@design/icons/PlusIcon';

type Value = 'first' | 'second' | 'off';

function renderSheet(overrides: Partial<OptionSheetProps<Value>> = {}) {
  const props: OptionSheetProps<Value> = {
    visible: true,
    title: 'Pick one',
    subtitle: 'Only one',
    options: [
      { value: 'first', title: 'First', description: 'The first.', icon: PlusIcon },
      { value: 'second', title: 'Second', description: 'The second.', icon: CopyIcon },
      { value: 'off', title: 'Off', description: 'Why not.', icon: CopyIcon, disabled: true },
    ],
    selected: 'first',
    onSelect: jest.fn(),
    onNext: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<OptionSheet {...props} />);
  return props;
}

describe('OptionSheet', () => {
  test('shows its title, its line and every option, the given one selected', () => {
    renderSheet({ selected: 'second' });

    expect(screen.getByText('Pick one')).toBeTruthy();
    expect(screen.getByText('Only one')).toBeTruthy();
    expect(screen.getByText('The first.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Second' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'First' }).props.accessibilityState.checked).toBe(false);
  });

  test('tapping a card reports it, and moving on is a separate Next', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByRole('radio', { name: 'Second' }));
    expect(props.onSelect).toHaveBeenCalledWith('second');
    expect(props.onNext).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  test('a disabled option can not be selected', () => {
    const props = renderSheet();

    expect(screen.getByRole('radio', { name: 'Off' })).toBeDisabled();

    fireEvent.press(screen.getByRole('radio', { name: 'Off' }));
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  test('Cancel and the backdrop close it', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.press(screen.getByLabelText('Close'));

    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(props.onNext).not.toHaveBeenCalled();
  });

  test('only the selected card has an accent icon', () => {
    renderSheet();

    const colors = screen
      .UNSAFE_getAllByType(PlusIcon)
      .concat(screen.UNSAFE_getAllByType(CopyIcon))
      .map((icon) => icon.props.color);
    expect(colors).toEqual([COLORS.accent, COLORS['text/secondary'], COLORS['text/secondary']]);
  });

  test('passes the close animation through', () => {
    renderSheet({ animated: false });

    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');
  });
});
