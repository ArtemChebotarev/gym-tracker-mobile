import { WizardHeader } from '@design/components/WizardHeader';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('WizardHeader', () => {
  test('renders the title, step label, and progress', () => {
    render(<WizardHeader title="New mesocycle" currentStep={1} totalSteps={3} onClose={() => {}} />);

    expect(screen.getByText('New mesocycle')).toBeTruthy();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  test('shows Close and calls onClose when given onClose', () => {
    const onClose = jest.fn();
    render(<WizardHeader title="New mesocycle" currentStep={1} totalSteps={3} onClose={onClose} />);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  test('shows Back and calls onBack when given onBack', () => {
    const onBack = jest.fn();
    render(<WizardHeader title="Days & exercises" currentStep={2} totalSteps={3} onBack={onBack} />);

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});

// An unnumbered step — Flow C's Source week, which comes before the steps Flow A numbers and so
// has no number of its own (08.8, task 124).
describe('WizardHeader — titlePlacement="bar"', () => {
  test('puts the title in the bar and drops the step counter', () => {
    render(
      <WizardHeader
        title="Select a week to copy"
        titlePlacement="bar"
        currentStep={1}
        totalSteps={4}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Select a week to copy')).toBeTruthy();
    expect(screen.queryByText(/^Step /)).toBeNull();
  });

  test('renders the title once — in the bar, not also as a heading', () => {
    render(
      <WizardHeader
        title="Select a week to copy"
        titlePlacement="bar"
        currentStep={1}
        totalSteps={4}
        onClose={() => {}}
      />,
    );

    expect(screen.getAllByText('Select a week to copy')).toHaveLength(1);
  });

  test('still shows Close, and the step still has a place in the bar', () => {
    const onClose = jest.fn();
    render(
      <WizardHeader
        title="Select a week to copy"
        titlePlacement="bar"
        currentStep={1}
        totalSteps={4}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  test('defaults to the heading placement', () => {
    render(<WizardHeader title="Basics" currentStep={2} totalSteps={4} onBack={() => {}} />);

    expect(screen.getByText('Step 2 of 4')).toBeTruthy();
    expect(screen.getByText('Basics')).toBeTruthy();
  });
});
