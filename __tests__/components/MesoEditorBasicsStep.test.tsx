import { fireEvent, render, screen } from '@testing-library/react-native';

import { MesoEditorBasicsStep, type MesoEditorBasicsStepProps } from '@components/MesoEditorBasicsStep';

const BASE_PROPS: MesoEditorBasicsStepProps = {
  name: 'Upper/Lower — Block 6',
  lengthWeeks: 6,
  daysPerWeek: 4,
  onChangeName: jest.fn(),
  onChangeLengthWeeks: jest.fn(),
  onChangeDaysPerWeek: jest.fn(),
};

describe('MesoEditorBasicsStep', () => {
  test('matches the step 1 content snapshot', () => {
    const tree = render(<MesoEditorBasicsStep {...BASE_PROPS} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('renders the fields', () => {
    render(<MesoEditorBasicsStep {...BASE_PROPS} />);

    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Cycle length')).toBeTruthy();
    expect(screen.getByText('6 weeks')).toBeTruthy();
    expect(screen.getByText('The last week is lighter')).toBeTruthy();
    expect(screen.queryByText(/deload/i)).toBeNull();
    expect(screen.getByText('Days per week')).toBeTruthy();
    expect(screen.getByText('4 days')).toBeTruthy();
    expect(screen.getByText("Next, you'll pick exercises for each day.")).toBeTruthy();
  });

  test('with the days already filled (a template or a copied week) it does not promise to pick exercises next (GT-51)', () => {
    render(<MesoEditorBasicsStep {...BASE_PROPS} exercisesPrefilled />);

    expect(screen.getByText('4 days')).toBeTruthy();
    expect(screen.queryByText("Next, you'll pick exercises for each day.")).toBeNull();
  });

  test('typing a name calls onChangeName', () => {
    const onChangeName = jest.fn();
    render(<MesoEditorBasicsStep {...BASE_PROPS} onChangeName={onChangeName} />);

    fireEvent.changeText(screen.getByDisplayValue('Upper/Lower — Block 6'), 'New name');

    expect(onChangeName).toHaveBeenCalledWith('New name');
  });

  describe('stepper boundaries', () => {
    test('Cycle length decrement is disabled at the minimum (3)', () => {
      render(<MesoEditorBasicsStep {...BASE_PROPS} lengthWeeks={3} />);

      expect(
        screen.getByRole('button', { name: 'Decrease Cycle length' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    test('Cycle length increment is disabled at the maximum (8)', () => {
      render(<MesoEditorBasicsStep {...BASE_PROPS} lengthWeeks={8} />);

      expect(
        screen.getByRole('button', { name: 'Increase Cycle length' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    test('Days per week decrement is disabled at the minimum (1)', () => {
      render(<MesoEditorBasicsStep {...BASE_PROPS} daysPerWeek={1} />);

      expect(
        screen.getByRole('button', { name: 'Decrease Days per week' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    test('Days per week increment is disabled at the maximum (7)', () => {
      render(<MesoEditorBasicsStep {...BASE_PROPS} daysPerWeek={7} />);

      expect(
        screen.getByRole('button', { name: 'Increase Days per week' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });
  });
});
