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
