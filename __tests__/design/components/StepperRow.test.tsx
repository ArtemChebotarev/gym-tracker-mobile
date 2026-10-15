import { fireEvent, render, screen } from '@testing-library/react-native';

import { StepperRow } from '@design/components/StepperRow';

describe('StepperRow', () => {
  test('shows the label, its suffix on the same line and the formatted value', () => {
    render(
      <StepperRow
        label="Rest"
        labelSuffix="between sets"
        value={60}
        onChange={() => {}}
        min={0}
        max={600}
        step={5}
        formatValue={(sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`}
      />,
    );

    expect(screen.getByText(/^Rest/)).toHaveTextContent('Rest · between sets');
    expect(screen.getByText('1:00')).toBeTruthy();
  });

  test('steps the value by `step`, within min and max', () => {
    const onChange = jest.fn();
    render(<StepperRow label="Rounds" value={1} onChange={onChange} min={1} max={3} step={1} />);

    fireEvent.press(screen.getByRole('button', { name: 'Increase Rounds' }));
    expect(onChange).toHaveBeenCalledWith(2);

    expect(screen.getByRole('button', { name: 'Decrease Rounds' }).props.accessibilityState.disabled).toBe(true);
  });
});
