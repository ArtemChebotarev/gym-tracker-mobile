import { fireEvent, render, screen } from '@testing-library/react-native';

import { MesoEditorFooter } from '@components/MesoEditorFooter';

describe('MesoEditorFooter', () => {
  test('renders Continue and calls onContinue when pressed', () => {
    const onContinue = jest.fn();
    render(<MesoEditorFooter onContinue={onContinue} continueDisabled={false} />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalled();
  });

  test('disables Continue when continueDisabled is true', () => {
    render(<MesoEditorFooter onContinue={() => {}} continueDisabled={true} />);

    expect(
      screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled,
    ).toBe(true);
  });

  test('renders the hint when given', () => {
    render(
      <MesoEditorFooter
        onContinue={() => {}}
        continueDisabled={false}
        hint="Every day needs at least one exercise"
      />,
    );

    expect(screen.getByText('Every day needs at least one exercise')).toBeTruthy();
    expect(screen.queryByTestId('meso-editor-footer-hint-placeholder')).toBeNull();
  });

  test('reserves the hint\'s space with a placeholder when no hint is given', () => {
    render(<MesoEditorFooter onContinue={() => {}} continueDisabled={false} />);

    expect(screen.getByTestId('meso-editor-footer-hint-placeholder')).toBeTruthy();
  });

  test('renders a custom continue label', () => {
    const onContinue = jest.fn();
    render(
      <MesoEditorFooter onContinue={onContinue} continueDisabled={false} continueLabel="Save mesocycle" />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Save mesocycle' }));

    expect(onContinue).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });
});
