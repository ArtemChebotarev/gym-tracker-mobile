// SwipeableRow — see 08.0 · Design SDK, "Компоненты": a row whose actions live behind swipes, the
// way iOS Mail does (task 117). The row itself renders as `children`; this only owns the gestures
// and the buttons behind them.
//
// **Two sides, as on iOS.** Swiping right to left reveals `trailingActions` — the secondary and
// destructive ones — as buttons to tap. Pulling left to right runs `leadingAction`, the row's one
// primary thing (`Start`). That split is what let the Mesocycles rows drop their `Start` / `Copy`
// pill and their `⋯` altogether: the right edge no longer carries a button competing with the
// hand that reaches there to swipe (Artem's call).
//
// `ReanimatedSwipeable` from gesture-handler, not `Swipeable`: 3.x dropped the plain one, and this
// is what is left. It needs `GestureHandlerRootView` above it — app/_layout.tsx has it at the very
// top, since a gesture in a subtree without one silently never fires.
//
// The actions sit behind the row and are as tall as it is, so a two-line row gives taller buttons
// than a one-line row — that is what makes them read as part of the row rather than as a floating
// bar. Each is `size/swipe-action` wide; the icon sits over a one-word label.
//
// **The row is painted `surface/page`.** The actions are laid out behind it rather than clipped
// away, so with the transparent row a `ListRow` gives them, they showed through at the right edge
// of every row before it was ever swiped (Artem's screenshot on the device). Painting it here
// rather than at the call site is deliberate: a swipeable row that doesn't cover its own actions
// is broken, and that shouldn't be each caller's job to remember. `surface/page` because these
// rows sit directly on the screen; a row on some other surface would need that surface instead,
// and can have a prop when there is one.
//
// **Swipe actions are filled blocks**, and they are the one place in the app where that is true of
// a destructive action — 08.0's "Danger никогда не заливается" holds everywhere else (Artem's
// call). A swipe action *is* the coloured block it sits in; drawn as text on the card surface it
// read as a gap in the row rather than as a button. The leading action takes `accent`, since it is
// the row's primary one; `Delete` takes `danger/fill`, which is a shade darker than `danger` so
// its 12pt label clears the 4.5:1 the SDK asks of small text.
//
// `overshootRight` is off: the actions are a fixed strip, and letting the row drag past them
// exposes bare background beyond the last button. There is no full-swipe shortcut either — the
// actions here are destructive or navigational, and a gesture that fires one without a deliberate
// tap is how rows get deleted by accident.
//
// **The leading side never stays open.** Pull far enough (`FULL_SWIPE_THRESHOLD`) and the action
// runs; let go short of it and the row springs back having done nothing. One rule — "pull it all
// the way right to start this block" — rather than a revealed button that also full-swipes, which
// is what Mail does but needs the drag distance read from a worklet. Nothing fires without a
// deliberate pull, and `Start` asks for confirmation on top of that (08.3).
//
// Two things about that pull are easy to get wrong, and were:
// - the callback's `direction` is the direction the row *moved*, not the side that opened. The
//   leading actions open by moving right, so they arrive as `'right'`; `'left'` is the trailing
//   side. Checking the wrong one hangs the primary action off the trailing swipe.
// - the threshold is compared against the drag *after* friction, which is also how far the row
//   has visibly travelled. So the leading block has to be at least as wide as the distance the
//   row must cover (`size/swipe-primary`), or the row stops moving long before the threshold and
//   the pull has nothing to show for itself.
//
// Picking a trailing action closes the row first, so the row is never left open behind whatever
// the action raises (a confirmation, another screen). A confirmation belongs in the caller's
// `onPress`, not here: like ActionMenu, this decides nothing about the actions it lists.

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { COLORS, ICON_SIZES, OPACITY, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import type { IconComponent } from '../icons/IconFrame';

export type SwipeAction = {
  /** Identifies the action in the list — never shown. */
  key: string;
  /** One word under the icon: `Edit`, `Delete`, `History`. */
  label: string;
  icon: IconComponent;
  /** Red text and icon — an action that throws something away. */
  destructive?: boolean;
  onPress: () => void;
};

export type SwipeableRowProps = {
  /**
   * What the row is — each action's accessibility label reads `<label> <row>`, so several rows'
   * `Delete` buttons stay apart to a screen reader.
   */
  accessibilityLabel: string;
  /** Revealed by swiping right to left, as buttons to tap. */
  trailingActions: SwipeAction[];
  /** The row's primary action, run by pulling it left to right far enough. */
  leadingAction?: SwipeAction;
  /** Names the row's actions (`<testID>-<action key>`), for a screen carrying several rows. */
  testID?: string;
  children: ReactNode;
};

export function SwipeableRow({
  accessibilityLabel,
  trailingActions,
  leadingAction,
  testID = 'swipeable-row',
  children,
}: SwipeableRowProps) {
  const swipeable = useRef<SwipeableMethods>(null);

  function renderAction(action: SwipeAction, isLeading = false) {
    const { icon: Icon } = action;
    const color = actionContentColor(action, isLeading);
    return (
      <Pressable
        key={action.key}
        testID={`${testID}-${action.key}`}
        accessibilityRole="button"
        accessibilityLabel={`${action.label} ${accessibilityLabel}`}
        onPress={() => {
          swipeable.current?.close();
          action.onPress();
        }}
        style={({ pressed }) => [
          styles.action,
          isLeading ? styles.leadingAction : styles.trailingAction,
          action.destructive === true && styles.destructiveAction,
          pressed && styles.pressed,
        ]}
      >
        <Icon size={ICON_SIZES['icon/button']} color={color} />
        <Text style={[styles.actionLabel, { color }]}>{action.label}</Text>
      </Pressable>
    );
  }

  function renderTrailing() {
    return (
      <View testID={`${testID}-actions`} style={styles.actions}>
        {trailingActions.map((action) => renderAction(action))}
      </View>
    );
  }

  // Drawn while the row is being pulled, as the feedback that says what letting go will do. It is
  // a button like the trailing ones only so a screen reader can reach it at all — the row closes
  // itself the moment the pull passes the threshold, so there is never one sitting there to tap.
  function renderLeading() {
    return leadingAction === undefined ? null : (
      <View testID={`${testID}-leading`} style={styles.actions}>
        {renderAction(leadingAction, true)}
      </View>
    );
  }

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      testID={testID}
      friction={SWIPE_FRICTION}
      rightThreshold={SIZES['size/swipe-action']}
      overshootRight={false}
      overshootLeft={false}
      leftThreshold={FULL_SWIPE_THRESHOLD}
      onSwipeableWillOpen={(direction) => {
        // `'right'` is the row moving right — which is the leading side opening. See the note above.
        if (direction === 'right') {
          swipeable.current?.close();
          leadingAction?.onPress();
        }
      }}
      childrenContainerStyle={styles.row}
      renderRightActions={renderTrailing}
      renderLeftActions={leadingAction === undefined ? undefined : renderLeading}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

/**
 * How much the row lags the finger. Not a design value — a feel constant. 1 tracks the finger
 * exactly and reads as if the row came loose; 2 is the library's own example and what iOS feels
 * like here.
 */
const SWIPE_FRICTION = 2;

/**
 * How far the row has to have travelled before letting go runs the leading action. A gesture
 * threshold, not a design value (08.0, "Не design values"). Most of `size/swipe-primary`, so the
 * pull is plainly deliberate and a stray horizontal nudge while scrolling falls well short — but
 * short of the whole block, so it fires before the row runs out of room to move.
 */
const FULL_SWIPE_THRESHOLD = 110;

/** What an action's icon and label are drawn in, given the block they sit on. */
function actionContentColor(action: SwipeAction, isLeading: boolean) {
  if (action.destructive === true) {
    return COLORS['danger/on'];
  }
  return isLeading ? COLORS['accent/on'] : COLORS['text/secondary'];
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: COLORS['surface/page'],
  },
  actions: {
    flexDirection: 'row',
    // The strip is as tall as whatever the row turned out to be.
    alignItems: 'stretch',
  },
  action: {
    width: SIZES['size/swipe-action'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/xxs'],
  },
  trailingAction: {
    backgroundColor: COLORS['surface/card'],
  },
  destructiveAction: {
    backgroundColor: COLORS['danger/fill'],
  },
  leadingAction: {
    // Wide, and its content by the row's own left edge — the block is pulled across rather than
    // aimed at, so it reads as the row turning into the action.
    width: SIZES['size/swipe-primary'],
    alignItems: 'flex-start',
    paddingLeft: SPACING['space/screen'],
    backgroundColor: COLORS.accent,
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  actionLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
  },
});
