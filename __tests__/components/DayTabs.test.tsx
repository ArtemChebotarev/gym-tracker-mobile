import { fireEvent, render, screen } from '@testing-library/react-native';

import { DayTabs } from '@components/DayTabs';

describe('DayTabs', () => {
  test('draws a tab per day and marks the active one selected', () => {
    render(<DayTabs dayNumbers={[1, 2, 3]} activeDay={2} onChangeDay={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Day 1' }).props.accessibilityState).toEqual({
      selected: false,
    });
    expect(screen.getByRole('button', { name: 'Day 2' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole('button', { name: 'Day 3' })).toBeTruthy();
  });

  test('reports the tapped day', () => {
    const onChangeDay = jest.fn();
    render(<DayTabs dayNumbers={[1, 2, 3]} activeDay={1} onChangeDay={onChangeDay} />);

    fireEvent.press(screen.getByRole('button', { name: 'Day 3' }));

    expect(onChangeDay).toHaveBeenCalledWith(3);
  });
});
