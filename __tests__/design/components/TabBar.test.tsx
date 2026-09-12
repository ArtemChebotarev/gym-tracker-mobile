import { TabBar, type TabBarItem } from '@design/components/TabBar';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

const ITEMS: TabBarItem[] = [
  { key: 'today', label: 'Today', icon: (active) => <Text>{active ? '●' : '○'}</Text> },
  { key: 'history', label: 'History', icon: (active) => <Text>{active ? '●' : '○'}</Text> },
  { key: 'library', label: 'Library', icon: (active) => <Text>{active ? '●' : '○'}</Text> },
];

describe('TabBar', () => {
  test('renders every tab label', () => {
    render(<TabBar items={ITEMS} activeKey="today" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'History' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Library' })).toBeTruthy();
  });

  test('marks the active tab as selected', () => {
    render(<TabBar items={ITEMS} activeKey="history" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'History' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByRole('button', { name: 'Today' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  test('calls onChange with the pressed tab key', () => {
    const onChange = jest.fn();
    render(<TabBar items={ITEMS} activeKey="today" onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'Library' }));

    expect(onChange).toHaveBeenCalledWith('library');
  });

  test('accepts a plain icon that does not vary with active state', () => {
    const items: TabBarItem[] = [
      { key: 'today', label: 'Today', icon: <Text>●</Text> },
      { key: 'history', label: 'History', icon: <Text>●</Text> },
    ];
    render(<TabBar items={items} activeKey="today" onChange={() => {}} />);

    expect(screen.getAllByText('●')).toHaveLength(2);
  });
});
