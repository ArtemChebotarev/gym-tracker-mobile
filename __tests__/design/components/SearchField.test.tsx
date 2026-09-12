import { SearchField } from '@design/components/SearchField';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('SearchField', () => {
  test('renders the empty state with a placeholder', () => {
    render(<SearchField value="" onChangeText={() => {}} placeholder="Search exercises" />);
    expect(screen.getByPlaceholderText('Search exercises')).toBeTruthy();
  });

  test('propagates input to onChangeText', () => {
    const onChangeText = jest.fn();
    render(<SearchField value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByLabelText('Search'), 'row');

    expect(onChangeText).toHaveBeenCalledWith('row');
  });

  test('does not render a clear button when empty', () => {
    render(<SearchField value="" onChangeText={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  test('clearing calls onChangeText with an empty string', () => {
    const onChangeText = jest.fn();
    render(<SearchField value="row" onChangeText={onChangeText} />);

    fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
