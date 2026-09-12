import { TextField } from '@design/components/TextField';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('TextField', () => {
  test('renders the label and value', () => {
    render(<TextField label="Weight" value="80" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Weight')).toHaveDisplayValue('80');
  });

  test('propagates input to onChangeText', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Weight" value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByLabelText('Weight'), '80');

    expect(onChangeText).toHaveBeenCalledWith('80');
  });

  test('does not render an error by default', () => {
    render(<TextField label="Weight" value="" onChangeText={() => {}} />);
    expect(screen.queryByText(/required/i)).toBeNull();
  });

  test('renders the error state', () => {
    render(<TextField label="Weight" value="" onChangeText={() => {}} error="Weight is required" />);
    expect(screen.getByText('Weight is required')).toBeTruthy();
  });
});
