import { TabBar, type TabBarItem } from '@design/components/TabBar';
import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TabMesocyclesIcon } from '@design/icons/TabMesocyclesIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';
import type { IconProps } from '@design/icons/IconFrame';
import { COLORS, ICON_SIZES } from '@design/tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

const ITEMS: TabBarItem[] = [
  { key: 'today', label: 'Today', icon: TabTodayIcon },
  { key: 'mesocycles', label: 'Mesocycles', icon: TabMesocyclesIcon },
  { key: 'library', label: 'Library', icon: TabLibraryIcon },
];

// Stand-in icon that prints the props TabBar hands it, so the size/color contract can be
// asserted without digging through the SVG tree.
function ProbeIcon({ size, color }: IconProps) {
  return <Text>{`${size} ${String(color)}`}</Text>;
}

describe('TabBar', () => {
  test('renders every tab label', () => {
    render(<TabBar items={ITEMS} activeKey="today" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mesocycles' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Library' })).toBeTruthy();
  });

  test('marks the active tab as selected', () => {
    render(<TabBar items={ITEMS} activeKey="mesocycles" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Mesocycles' }).props.accessibilityState).toEqual(
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

  test('renders each icon at the tab size, in accent when active and text/faint when not', () => {
    const items: TabBarItem[] = [
      { key: 'today', label: 'Today', icon: ProbeIcon },
      { key: 'library', label: 'Library', icon: ProbeIcon },
    ];
    render(<TabBar items={items} activeKey="today" onChange={() => {}} />);

    expect(screen.getByText(`${ICON_SIZES['icon/tab']} ${COLORS.accent}`)).toBeTruthy();
    expect(screen.getByText(`${ICON_SIZES['icon/tab']} ${COLORS['text/faint']}`)).toBeTruthy();
  });

  test('matches the snapshot with Today active', () => {
    const { toJSON } = render(<TabBar items={ITEMS} activeKey="today" onChange={() => {}} />);

    expect(toJSON()).toMatchSnapshot();
  });

  test('matches the snapshot with Library active', () => {
    const { toJSON } = render(<TabBar items={ITEMS} activeKey="library" onChange={() => {}} />);

    expect(toJSON()).toMatchSnapshot();
  });
});
