import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Popover } from '@design/components/Popover';

const anchor = { x: 180, y: 200, width: 24, height: 24 };

describe('Popover', () => {
  test('shows its title, subtitle, content and footer', () => {
    render(
      <Popover
        visible
        onClose={() => {}}
        anchor={anchor}
        title="Other weight, same load"
        subtitle="Set 1 · target 15 kg × 10"
        footer={<Text>Type the weight you have.</Text>}
      >
        <Text>Close match</Text>
      </Popover>,
    );

    expect(screen.getByText('Other weight, same load')).toBeTruthy();
    expect(screen.getByText('Set 1 · target 15 kg × 10')).toBeTruthy();
    expect(screen.getByText('Close match')).toBeTruthy();
    expect(screen.getByText('Type the weight you have.')).toBeTruthy();
  });

  test('an anchor that could not be measured still opens the plate, without an arrow', () => {
    render(<Popover visible onClose={() => {}} anchor={null} title="Other weight, same load" />);

    expect(screen.getByTestId('popover')).toBeTruthy();
    expect(screen.queryByTestId('popover-arrow')).toBeNull();
  });

  test('a measured anchor gets the arrow, pointing at it', () => {
    render(<Popover visible onClose={() => {}} anchor={anchor} title="Other weight, same load" />);

    expect(screen.getByTestId('popover-arrow')).toBeTruthy();
  });

  test('a tap beside the plate closes it', () => {
    const onClose = jest.fn();
    render(
      <Popover visible onClose={onClose} anchor={anchor} title="Other weight, same load" />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
