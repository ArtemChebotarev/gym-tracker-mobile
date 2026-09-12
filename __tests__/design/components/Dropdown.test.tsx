import { Dropdown } from '@design/components/Dropdown';
import { fireEvent, render, screen } from '@testing-library/react-native';

const OPTIONS = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
];

describe('Dropdown', () => {
  test('renders the placeholder when no value is selected', () => {
    render(
      <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} placeholder="Select a group" />,
    );

    expect(screen.getByText('Select a group')).toBeTruthy();
  });

  test('renders the selected option label', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value="back" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent('Back');
  });

  test('opens the option list and propagates the chosen value outward', () => {
    const onChange = jest.fn();
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onChange).toHaveBeenCalledWith('chest');
  });

  test('renders the error state', () => {
    render(
      <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} error="Pick a group" />,
    );

    expect(screen.getByText('Pick a group')).toBeTruthy();
  });
});
