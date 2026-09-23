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
// **The actions are capsules, not blocks** (iOS 26 Mail). Each one is inset well in from the row's
// top and bottom and separated from its neighbour — and from the row's own edge — by a gap, so the
// row reads as sliding aside to let them through rather than as a strip painted behind it. They
// still take their height from the row, so a two-line row gives taller capsules than a one-line
// row. Each is `size/swipe-action` wide; the icon sits over a one-word label.
//
// **Only the leading capsule stretches, and only once it is a whole button.** For the first part
// of the pull it comes out from under the row at a fixed width, exactly like a trailing one; past
// that its left end stays pinned to the row's left edge and its right end follows the row across,
// so the further the pull goes the longer the capsule gets. That growth is what says the pull has
// somewhere else to go. The trailing capsules never stretch: they are aimed at and tapped, and a
// button that changes size under the thumb is a worse target, not a better one. Stretching needs
// the gesture's own progress, which arrives in `renderLeftActions` as a `SharedValue` — hence
// `LeadingCapsule` below, and the project's first worklet.
//
// The stretch is drawn *inside* a fixed-width track. gesture-handler takes the distance the row
// latches open at from the laid-out width of whatever `renderLeftActions` returns, and it measures
// that once, when the gesture activates — a capsule sized from the drag would hand it whatever the
// last drag happened to end on. So the track is one capsule plus its gap whatever the capsule is
// doing, and the capsule is absolutely positioned inside it, free to grow past it.
//
// **The row lifts and rounds on the side the actions come out of.** Swiped left, its right edge is
// the one left floating mid-screen, so that is the pair of corners that rounds; pulled right, the
// left pair. The other edge is outside the container's `overflow: hidden` by then and never seen.
// For as long as the swipe lasts the row is also painted `surface/card` instead of the page's own
// colour — Mail's move, and not decoration: a row the same colour as what's behind it has no
// visible corner to round (Artem's review on the device). Which side it is comes from the drag's
// own direction rather than from a worklet: the corners only ever have two states, and they settle
// at the first few points of travel either way.
//
// **The row is painted `surface/page`.** The actions are laid out behind it rather than clipped
// away, so with the transparent row a `ListRow` gives them, they showed through at the right edge
// of every row before it was ever swiped (Artem's screenshot on the device). Painting it here
// rather than at the call site is deliberate: a swipeable row that doesn't cover its own actions
// is broken, and that shouldn't be each caller's job to remember. `surface/page` because these
// rows sit directly on the screen; a row on some other surface would need that surface instead,
// and can have a prop when there is one. The fill has to survive the rounding — a transparent row
// with rounded corners hides nothing.
//
// **Swipe actions are filled blocks**, and they are the one place in the app where that is true of
// a destructive action — 08.0's "Danger никогда не заливается" holds everywhere else (Artem's
// call). A swipe action *is* the coloured block it sits in; drawn as text on the card surface it
// read as a gap in the row rather than as a button. The leading action takes `accent`, since it is
// the row's primary one; `Delete` takes `danger/fill`, which is a shade darker than `danger` so
// its 12pt label clears the 4.5:1 the SDK asks of small text.
//
// `overshootRight` is off: the trailing actions are a fixed strip, and letting the row drag past
// them exposes bare background beyond the last button. There is no full-swipe on that side either
// — those actions are destructive or navigational, and a gesture that fires one without a
// deliberate tap is how rows get deleted by accident.
//
// **The leading side both latches and full-swipes, as Mail does.** Let go of a short pull and the
// row stays open with its one button sitting there to tap, exactly as the trailing side does —
// anything else made the primary action the one control on the screen that wouldn't hold still
// (Artem's review). Pull past `FULL_SWIPE_THRESHOLD` and letting go runs it instead of latching.
// Overshoot is left on for that: the row has to be able to travel well past the width it latches
// at, or there is no pull left to mean "run it". `Start` asks for confirmation on top (08.3).
//
// Telling those two apart needs the furthest the drag reached, not where it ended — by the time
// the row reports opening it is already springing back to the latch width. `LeadingCapsule` keeps
// that high-water mark in a shared value while it is drawing the stretch anyway.
//
// Two things about the pull are easy to get wrong, and were:
// - the callback's `direction` is the direction the row *moved*, not the side that opened. The
//   leading actions open by moving right, so they arrive as `'right'`; `'left'` is the trailing
//   side. Checking the wrong one hangs the primary action off the trailing swipe.
// - a threshold is compared against the drag *after* friction, which is also how far the row has
//   visibly travelled — not against the distance the finger covered.
//
// Picking a trailing action closes the row first, so the row is never left open behind whatever
// the action raises (a confirmation, another screen). A confirmation belongs in the caller's
// `onPress`, not here: like ActionMenu, this decides nothing about the actions it lists.

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { COLORS, ICON_SIZES, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
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
  /**
   * The row's primary action. Pulling left to right opens it as a button to tap; pulling all the
   * way runs it without the tap.
   */
  leadingAction?: SwipeAction;
  /** Names the row's actions (`<testID>-<action key>`), for a screen carrying several rows. */
  testID?: string;
  children: ReactNode;
};

/** Which side of the row the current swipe is opening — the side that rounds. */
type SwipeSide = 'leading' | 'trailing' | null;

export function SwipeableRow({
  accessibilityLabel,
  trailingActions,
  leadingAction,
  testID = 'swipeable-row',
  children,
}: SwipeableRowProps) {
  const swipeable = useRef<SwipeableMethods>(null);
  const [openingSide, setOpeningSide] = useState<SwipeSide>(null);
  /** Whether this pull went far enough to run the leading action — see `LeadingCapsule`. */
  const pulledPast = useRef(false);

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
        {/*
          The icon and label sit in a block of their own, one capsule wide, kept at the capsule's
          trailing end. On the leading side that means they travel with the row's edge as the
          capsule stretches instead of being re-centred — and, because the block's own width never
          changes, the label can't reflow or wrap while the capsule is still narrow.
        */}
        <View style={styles.actionContent}>
          <Icon size={ICON_SIZES['icon/button']} color={color} />
          <Text style={[styles.actionLabel, { color }]}>{action.label}</Text>
        </View>
      </Pressable>
    );
  }

  function renderTrailing() {
    return (
      <View testID={`${testID}-actions`} style={styles.trailingActions}>
        {trailingActions.map((action) => renderAction(action))}
      </View>
    );
  }

  function renderLeading(_progress: SharedValue<number>, translation: SharedValue<number>) {
    return leadingAction === undefined ? null : (
      <View testID={`${testID}-leading`} style={styles.leadingTrack}>
        <LeadingCapsule
          translation={translation}
          onPulledPastChange={(past) => {
            pulledPast.current = past;
          }}
        >
          {renderAction(leadingAction, true)}
        </LeadingCapsule>
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
      leftThreshold={LEADING_LATCH_THRESHOLD}
      onSwipeableOpenStartDrag={(direction) => {
        // Same convention as `onSwipeableWillOpen` below: `'right'` is the row moving right.
        setOpeningSide(direction === 'right' ? 'leading' : 'trailing');
      }}
      onSwipeableClose={() => setOpeningSide(null)}
      onSwipeableWillOpen={(direction) => {
        // `'right'` is the row moving right — which is the leading side opening. See the note
        // above. A short pull just leaves the button open; only one that went the distance runs it.
        if (direction === 'right' && pulledPast.current) {
          swipeable.current?.close();
          leadingAction?.onPress();
        }
      }}
      childrenContainerStyle={[
        styles.row,
        openingSide !== null && styles.rowOpening,
        openingSide === 'leading' && styles.rowOpeningLeading,
        openingSide === 'trailing' && styles.rowOpeningTrailing,
      ]}
      renderRightActions={renderTrailing}
      renderLeftActions={leadingAction === undefined ? undefined : renderLeading}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

/**
 * The leading capsule. `translation` is how far the row has moved from closed — positive while the
 * leading side is being pulled open — and the capsule's right end stays one gap behind the row's
 * left edge, so the pull draws it out of the row.
 *
 * **Two states, as in Mail** (Artem's review on the device). Open the row a little and the capsule
 * is a plain button, `size/swipe-action` wide like the trailing ones, coming out from under the
 * row exactly as they do — the floor under the width is what holds it there, and it is the width
 * the row latches at. Keep pulling and the right end follows the row on its own, with no ceiling:
 * whatever the overshoot lets the row reach, the capsule is right behind it. A capsule that
 * stretched from nothing was never a button at any point of the pull, and its label was clipped
 * for the first half of it.
 *
 * It also reports when the pull crosses `FULL_SWIPE_THRESHOLD`, which is the only way to tell a
 * pull that meant "run this" from one that meant "show me the button" — by the time the row
 * reports opening it is already springing back to the latch width and the drag is gone. The flag
 * is raised on the way out and dropped again when the row comes home, so the row itself only ever
 * has to look at the answer.
 */
function LeadingCapsule({
  translation,
  onPulledPastChange,
  children,
}: {
  translation: SharedValue<number>;
  onPulledPastChange: (pulledPast: boolean) => void;
  children: ReactNode;
}) {
  const pulledPast = useSharedValue(false);

  useAnimatedReaction(
    () => translation.value,
    (travelled) => {
      if (travelled > FULL_SWIPE_THRESHOLD && !pulledPast.value) {
        pulledPast.value = true;
        runOnJS(onPulledPastChange)(true);
      } else if (travelled <= 0 && pulledPast.value) {
        pulledPast.value = false;
        runOnJS(onPulledPastChange)(false);
      }
    },
  );

  const stretch = useAnimatedStyle(() => ({
    width: Math.max(translation.value - SWIPE_CAPSULE_GAP, SIZES['size/swipe-action']),
  }));

  return <Animated.View style={[styles.leadingCapsule, stretch]}>{children}</Animated.View>;
}

/**
 * How much the row lags the finger. Not a design value — a feel constant. 1 tracks the finger
 * exactly and reads as if the row came loose; 2 is the library's own example and what iOS feels
 * like here.
 */
const SWIPE_FRICTION = 2;

/**
 * How far the row has to have travelled at some point in the drag before letting go *runs* the
 * leading action rather than leaving its button sitting there. A gesture threshold, not a design
 * value (08.0, "Не design values"). Comfortably past the width the row latches at, so a pull that
 * only meant to reveal the button never fires it, and well past a stray horizontal nudge while
 * scrolling.
 */
const FULL_SWIPE_THRESHOLD = 110;

/**
 * How far the row has to have travelled on release to stay open on its leading side. Half the
 * track, which is what the library would pick anyway — named here because the other threshold on
 * this component means something quite different.
 */
const LEADING_LATCH_THRESHOLD = 36;

/** Between one capsule and the next, and between the nearest capsule and the row's own edge. */
const SWIPE_CAPSULE_GAP = SPACING['space/gap-tight'];

/**
 * How far a capsule is held off the row's top and bottom. Generous on purpose: a capsule that
 * nearly fills the row's height reads as a block with rounded corners, and the point of the shape
 * is that it plainly doesn't fill it (Artem's review on the device).
 */
const SWIPE_CAPSULE_INSET = SPACING['space/gap-tight'];

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
    // So a rounded corner actually cuts the ListRow's divider rather than letting it run past.
    overflow: 'hidden',
  },
  /**
   * Lifted off the page for as long as the swipe lasts, the way Mail does it. At rest the row is
   * the page's own colour and its corners are square, so rounding them alone changed nothing
   * anyone could see; against a lighter fill the corner is the whole point (Artem's review).
   * `surface/card` and not something lighter: lighter fills were tried on the device and this one
   * is the one that reads as the row being lifted rather than as the row changing (Artem's call).
   */
  rowOpening: {
    backgroundColor: COLORS['surface/card'],
  },
  // Each rounded edge is padded to match: the row's own content runs to its edges, and against a
  // square edge flush with the screen's margin that was right, but a title sitting in the mouth of
  // a rounded corner is not (Artem's review). Only the edge that rounds moves, and only while the
  // swipe lasts.
  rowOpeningLeading: {
    borderTopLeftRadius: RADII['radius/control'],
    borderBottomLeftRadius: RADII['radius/control'],
    paddingLeft: SPACING['space/row'],
  },
  rowOpeningTrailing: {
    borderTopRightRadius: RADII['radius/control'],
    borderBottomRightRadius: RADII['radius/control'],
    paddingRight: SPACING['space/row'],
  },
  trailingActions: {
    flexDirection: 'row',
    // The strip is as tall as whatever the row turned out to be; each capsule insets itself.
    alignItems: 'stretch',
    // The row's edge stops here, so the first capsule needs its gap on that side. The last one
    // ends flush with the row's own right edge, which is already inset from the screen.
    paddingLeft: SWIPE_CAPSULE_GAP,
    gap: SWIPE_CAPSULE_GAP,
  },
  /**
   * How far the row travels when the leading side latches open: one capsule and the gap between it
   * and the row. Fixed whatever the capsule inside has stretched to — see the note on measuring,
   * above.
   */
  leadingTrack: {
    width: SIZES['size/swipe-action'] + SWIPE_CAPSULE_GAP,
  },
  leadingCapsule: {
    position: 'absolute',
    left: 0,
    top: SWIPE_CAPSULE_INSET,
    bottom: SWIPE_CAPSULE_INSET,
    flexDirection: 'row',
  },
  action: {
    flexDirection: 'row',
    // Content kept at the capsule's trailing end — the end nearest the row.
    justifyContent: 'flex-end',
    borderRadius: RADII['radius/capsule'],
    overflow: 'hidden',
  },
  actionContent: {
    width: SIZES['size/swipe-action'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/xxs'],
  },
  trailingAction: {
    width: SIZES['size/swipe-action'],
    marginVertical: SWIPE_CAPSULE_INSET,
    // A step lighter than the row it comes out from under, which is `surface/card` by the time
    // these are visible — on `surface/card` itself the capsule and the row read as one block.
    backgroundColor: COLORS['surface/control-active'],
  },
  destructiveAction: {
    backgroundColor: COLORS['danger/fill'],
  },
  leadingAction: {
    // Fills the capsule its wrapper sized — the whole stretched pill is the button.
    flex: 1,
    backgroundColor: COLORS.accent,
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  actionLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
  },
});
