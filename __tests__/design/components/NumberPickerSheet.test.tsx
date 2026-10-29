import { fireEvent, render, screen } from '@testing-library/react-native';

import { NumberPickerSheet } from '@design/components/NumberPickerSheet';

describe('NumberPickerSheet', () => {
  test('shows what is being set and Done, and Done only closes it', () => {
    const onClose = jest.fn();
    const onChange = jest.fn();
    render(
      <NumberPickerSheet
        visible
        onClose={onClose}
        title="Rounds"
        value={3}
        onChange={onChange}
        min={1}
        max={30}
        unit="rounds"
      />,
    );

    expect(screen.getByText('Rounds')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('renders nothing while not visible', () => {
    render(
      <NumberPickerSheet visible={false} onClose={() => {}} title="Rounds" value={3} onChange={() => {}} min={1} max={9} />,
    );

    expect(screen.queryByText('Rounds')).toBeNull();
  });
});
