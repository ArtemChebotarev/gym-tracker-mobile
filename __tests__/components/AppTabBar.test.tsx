import { AppTabBar } from '@components/AppTabBar';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const ROUTES = [
  { key: 'index-1', name: 'index' },
  { key: 'mesocycles-1', name: 'mesocycles' },
  { key: 'library-1', name: 'library' },
];
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function setup(index: number, defaultPrevented = false) {
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented })),
    navigate: jest.fn(),
  };
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AppTabBar state={{ index, routes: ROUTES }} navigation={navigation} />
    </SafeAreaProvider>,
  );
  return navigation;
}

describe('AppTabBar', () => {
  test('shows Today, Cycles and Library, no Settings yet', () => {
    setup(0);

    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Today',
      'Cycles',
      'Library',
    ]);
  });

  test('announces tabPress, then switches to the pressed tab', () => {
    const navigation = setup(0);

    fireEvent.press(screen.getByRole('button', { name: 'Library' }));

    expect(navigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'library-1',
      canPreventDefault: true,
    });
    expect(navigation.navigate).toHaveBeenCalledWith('library');
  });

  test('does not switch when a listener prevented the press', () => {
    const navigation = setup(0, true);

    fireEvent.press(screen.getByRole('button', { name: 'Library' }));

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test('pressing the focused tab announces tabPress but does not navigate', () => {
    const navigation = setup(0);

    fireEvent.press(screen.getByRole('button', { name: 'Today' }));

    expect(navigation.emit).toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
