import { TabBar, type TabBarItem } from '@design/components/TabBar';
import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TabCyclesIcon } from '@design/icons/TabCyclesIcon';
import { TabSettingsIcon } from '@design/icons/TabSettingsIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';
import type { IconProps } from '@design/icons/IconFrame';
import { COLORS, ICON_SIZES, SIZES } from '@design/tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

const ITEMS: TabBarItem[] = [
  { key: 'today', label: 'Today', icon: TabTodayIcon },
  { key: 'cycles', label: 'Cycles', icon: TabCyclesIcon },
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
    expect(screen.getByRole('button', { name: 'Cycles' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Library' })).toBeTruthy();
  });

  test('marks the active tab as selected', () => {
    render(<TabBar items={ITEMS} activeKey="cycles" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Cycles' }).props.accessibilityState).toEqual(
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

  test('renders four tabs as readily as three', () => {
    const four: TabBarItem[] = [
      ...ITEMS,
      { key: 'settings', label: 'Settings', icon: TabSettingsIcon },
    ];
    render(<TabBar items={four} activeKey="settings" onChange={() => {}} />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Settings' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  test('gives every tab at least the minimum tap target', () => {
    render(<TabBar items={ITEMS} activeKey="today" onChange={() => {}} />);

    for (const tab of screen.getAllByRole('button')) {
      expect(StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(
        SIZES['size/tap-target'],
      );
    }
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
