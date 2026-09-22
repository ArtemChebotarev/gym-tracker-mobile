// ActionMenu — see 08.0 · Design SDK, "Компоненты": a `⋯` button whose actions open as a native
// context menu (task 117), in place of the bottom sheet the `⋯` buttons used to raise.
//
// On iOS the trigger *is* the menu: a SwiftUI `Menu` hosted in the same 36pt circle an IconButton
// draws, so the header's `⋯` sits next to the grid button unchanged, and iOS animates the plate
// out of it, dims the screen behind and closes it on a tap outside — none of which is ours to
// build. The items are native `Button`s, so they get the system's own row metrics, SF Symbols on
// the right, and red text for a destructive one (`role`), which is why an item carries an SF
// Symbol name as well as the icon component the sheet draws.
//
// Three details keep the hosted menu from fighting its own layout (task 117, first attempt):
// - the label is a native SF Symbol, never a hosted RN glyph. A hosted label measures as nothing,
//   the menu lays out at zero size, and it never opens.
// - the Host gets an explicit 36pt square rather than stretching or `matchContents`. Stretched, the
//   plate is drawn over its own button and the tap meant to dismiss it hits the first item;
//   `matchContents` collapses the host and nothing opens at all.
// - `menuStyle('button')` + `buttonStyle('plain')` + `menuIndicator('hidden')` render the label as
//   the whole trigger, with no button chrome and no disclosure chevron around the dots.
//
// `@expo/ui` is pinned to an exact 57.0.13 in package.json, not a `~` range: 57.0.19 calls
// `ShadowNodeProxy.clearContentOrigin`, which expo-modules-core only grows in a later SDK patch
// line, and the iOS build fails to compile its own `RNHostView.swift`. Move it when Expo moves.
//
// Off iOS there is no SwiftUI: the trigger falls back to the IconButton and BottomSheet pairing
// this replaced, with one ActionRow per item — same actions, same order, same destructive
// treatment. The sheet's open state lives here rather than in the caller, so a screen wires the
// actions once and doesn't carry a flag that only one platform ever reads.
//
// An item's `onPress` runs after the menu has closed. A confirmation belongs inside it (the
// caller's), not here: this component decides nothing about the actions it lists.

import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button as NativeMenuButton, Host, Image, Menu } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  frame,
  menuIndicator,
  menuStyle,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import { square } from '../shapes';
import { COLORS, ICON_SIZES, SIZES } from '../tokens';
import type { IconComponent } from '../icons/IconFrame';
import { MoreIcon } from '../icons/MoreIcon';
import { ActionRow } from './ActionRow';
import { BottomSheet } from './BottomSheet';
import { IconButton, iconButtonFrame } from './IconButton';

export type ActionMenuItem = {
  /** Identifies the item in the list — never shown. */
  key: string;
  label: string;
  /** The icon the fallback sheet draws. */
  icon: IconComponent;
  /** The SF Symbol iOS puts next to the label in the native menu. */
  systemImage: SFSymbol;
  /** Red, and grouped last by iOS — an action that throws something away. */
  destructive?: boolean;
  onPress: () => void;
};

export type ActionMenuProps = {
  /** What the `⋯` button is called, e.g. `Workout menu`. */
  accessibilityLabel: string;
  /** The fallback sheet's title. iOS titles nothing — the menu opens out of the button itself. */
  title: string;
  /** A line under that title. */
  subtitle?: string;
  items: ActionMenuItem[];
};

/** The SF Symbol for the `⋯` trigger — the system's own dots, matching MoreIcon. */
const TRIGGER_SYMBOL: SFSymbol = 'ellipsis';

export function ActionMenu({ accessibilityLabel, title, subtitle, items }: ActionMenuProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View testID="action-menu" accessibilityLabel={accessibilityLabel} style={iconButtonFrame()}>
        <Host style={styles.host}>
          <Menu
            label={
              // A native SwiftUI Image, never an RN glyph hosted back inside SwiftUI: a hosted
              // label measures as nothing, so the menu lays out at zero size and never opens.
              <Image
                systemName={TRIGGER_SYMBOL}
                size={ICON_SIZES['icon/button']}
                color={COLORS['text/secondary']}
                modifiers={[
                  // The label *is* the trigger, and `buttonStyle('plain')` hit-tests exactly what
                  // the label draws — the dots are a few points tall, so a tap a little off centre
                  // lands on nothing and four in five do nothing at all. The frame gives the label
                  // the host's whole 36pt and the content shape makes that area hit-testable
                  // rather than just the glyph inside it. On the label, not on the Menu: outside
                  // the button these never reach the region SwiftUI actually tests.
                  frame({
                    width: SIZES['size/icon-button'],
                    height: SIZES['size/icon-button'],
                  }),
                  contentShape(shapes.rectangle()),
                ]}
              />
            }
            modifiers={[menuStyle('button'), buttonStyle('plain'), menuIndicator('hidden')]}
          >
            {items.map((item) => (
              <NativeMenuButton
                key={item.key}
                testID={`action-menu-${item.key}`}
                label={item.label}
                systemImage={item.systemImage}
                role={item.destructive === true ? 'destructive' : 'default'}
                onPress={item.onPress}
              />
            ))}
          </Menu>
        </Host>
      </View>
    );
  }

  return (
    <>
      <IconButton accessibilityLabel={accessibilityLabel} onPress={() => setIsSheetOpen(true)}>
        <MoreIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
      </IconButton>
      <BottomSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={title}
        subtitle={subtitle}
        presentation="overlay"
      >
        {items.map((item) => (
          <ActionRow
            key={item.key}
            icon={item.icon}
            label={item.label}
            variant={item.destructive === true ? 'danger' : 'default'}
            onPress={() => {
              setIsSheetOpen(false);
              item.onPress();
            }}
          />
        ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  // An explicit square, never stretched and never `matchContents` — see the note at the top.
  host: square(SIZES['size/icon-button']),
});
