import { View } from 'react-native';
import { Dropdown } from '@design/components/Dropdown';
import { fireEvent, render, screen } from '@testing-library/react-native';

function flatStylesOf(instance: ReturnType<typeof screen.getByRole>) {
  return instance
    .findAllByType(View)
    .map((view) => Object.assign({}, ...(Array.isArray(view.props.style) ? view.props.style : [view.props.style]).filter(Boolean)));
}

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

    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Back/);
  });

  test('opens the option list and propagates the chosen value outward', () => {
    const onChange = jest.fn();
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onChange).toHaveBeenCalledWith('chest');
  });

  test('closes the option list after selecting an option', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  test('marks the trigger as expanded only while the sheet is open', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);

    const trigger = screen.getByRole('button', { name: 'Muscle group' });
    expect(trigger.props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));

    fireEvent.press(trigger);

    expect(trigger.props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
  });

  test('renders the error state', () => {
    render(
      <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} error="Pick a group" />,
    );

    expect(screen.getByText('Pick a group')).toBeTruthy();
  });

  test('the option list expands inline, not in a separate overlay — pressing the trigger again collapses it', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Muscle group' });

    fireEvent.press(trigger);
    expect(screen.getByRole('button', { name: 'Chest' })).toBeTruthy();

    fireEvent.press(trigger);
    expect(screen.queryByRole('button', { name: 'Chest' })).toBeNull();
  });

  test('an option with a dotColor renders its color both on the trigger and in the option list', () => {
    const coloredOptions = [
      { value: 'chest', label: 'Chest', dotColor: '#F0A537' },
      { value: 'back', label: 'Back', dotColor: '#5B9CF8' },
    ];
    render(<Dropdown label="Muscle group" options={coloredOptions} value="chest" onChange={() => {}} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));

    const backOption = screen.getByRole('button', { name: 'Back' });
    expect(flatStylesOf(backOption).some((style) => style.backgroundColor === '#5B9CF8')).toBe(true);
  });
});
