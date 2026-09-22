import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SwipeableRow, type SwipeAction } from '@design/components/SwipeableRow';
import { EditIcon } from '@design/icons/EditIcon';
import { TrashIcon } from '@design/icons/TrashIcon';
import { COLORS } from '@design/tokens';

import { pressSwipeAction } from '../../fixtures/swipeActions';

// gesture-handler 3.x throws when a gesture renders without a root view, so every render here is
// wrapped — the same way app/_layout.tsx wraps the app.
function renderRow(ui: ReactElement) {
  return render(<GestureHandlerRootView>{ui}</GestureHandlerRootView>);
}

const onEdit = jest.fn();
const onDelete = jest.fn();
const onStart = jest.fn();

function actions(): SwipeAction[] {
  return [
    { key: 'edit', label: 'Edit', icon: EditIcon, onPress: onEdit },
    { key: 'delete', label: 'Delete', icon: TrashIcon, destructive: true, onPress: onDelete },
  ];
}

function renderBlockRow() {
  return renderRow(
    <SwipeableRow
      testID="block-row"
      accessibilityLabel="Push/Pull/Legs"
      leadingAction={{ key: 'start', label: 'Start', icon: EditIcon, onPress: onStart }}
      trailingActions={actions()}
    >
      <Text>Push/Pull/Legs</Text>
    </SwipeableRow>,
  );
}

beforeEach(() => {
  onEdit.mockClear();
  onDelete.mockClear();
  onStart.mockClear();
});

describe('SwipeableRow', () => {
  test('DoD: renders the row with its actions behind it', () => {
    const tree = renderBlockRow();

    expect(screen.getByText('Push/Pull/Legs')).toBeTruthy();
    expect(screen.getByTestId('block-row-edit')).toBeTruthy();
    expect(screen.getByTestId('block-row-delete')).toBeTruthy();
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('every action names the row, so two rows stay apart to a screen reader', () => {
    renderBlockRow();

    expect(screen.getByRole('button', { name: 'Edit Push/Pull/Legs' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete Push/Pull/Legs' })).toBeTruthy();
  });

  test('DoD: the blocks are filled — destructive red, the leading one accent', () => {
    renderBlockRow();

    // The one place danger is a fill rather than text on the card surface (08.0's exception for
    // swipe actions, task 117). A shade darker than `danger`, so the 12pt label clears 4.5:1.
    expect(screen.getByTestId('block-row-delete').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: COLORS['danger/fill'] })]),
    );
    expect(screen.getByText('Delete').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: COLORS['danger/on'] })]),
    );

    expect(screen.getByTestId('block-row-start').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: COLORS.accent })]),
    );
    expect(screen.getByText('Start').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: COLORS['accent/on'] })]),
    );
  });

  test('an ordinary trailing action is a step lighter than the row it comes out from under', () => {
    renderBlockRow();

    // The row itself turns `surface/card` for as long as the swipe lasts, so a capsule drawn in
    // that colour would disappear into it.
    expect(screen.getByTestId('block-row-edit').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: COLORS['surface/control-active'] }),
      ]),
    );
    expect(screen.getByText('Edit').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: COLORS['text/secondary'] })]),
    );
  });

  test('picking an action runs it', () => {
    renderBlockRow();

    pressSwipeAction('block-row-delete');

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  test('the leading action is drawn too — it is what a pull shows before it fires', () => {
    renderBlockRow();

    expect(screen.getByTestId('block-row-start')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Push/Pull/Legs' })).toBeTruthy();
  });

  test('a row with no leading action draws only the trailing ones', () => {
    renderRow(
      <SwipeableRow testID="plain-row" accessibilityLabel="Strength Base" trailingActions={actions()}>
        <Text>Strength Base</Text>
      </SwipeableRow>,
    );

    expect(screen.getByTestId('plain-row-delete')).toBeTruthy();
    expect(screen.queryByTestId('plain-row-leading')).toBeNull();
  });

  test('rows are named apart, so a screen can carry several', () => {
    renderRow(
      <>
        <SwipeableRow testID="row-a" accessibilityLabel="A" trailingActions={actions()}>
          <Text>A</Text>
        </SwipeableRow>
        <SwipeableRow testID="row-b" accessibilityLabel="B" trailingActions={actions()}>
          <Text>B</Text>
        </SwipeableRow>
      </>,
    );

    expect(screen.getByTestId('row-a-delete')).toBeTruthy();
    expect(screen.getByTestId('row-b-delete')).toBeTruthy();
  });
});
