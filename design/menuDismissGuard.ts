// The tap that closes a native `ActionMenu` belongs to the menu, not to what happens to be drawn
// under it (task 117, found on the device: closing a Mesocycles row's `⋯` also opened the row).
// iOS hosts a SwiftUI `Menu` inside the app's own window and does not swallow that tap the way it
// does for a UIKit menu of its own — it arrives as an ordinary press on whatever is beneath.
//
// So the menu says when it opens (`arm`), and the first press after that is treated as the one
// that closed it and goes nowhere (`consumeDismissPress`). Module state rather than a prop or a
// context: only one menu can be open at a time on iOS, and the press it swallows may land on any
// row of the screen, not just the one the menu came out of.
//
// Why the *first press* and not "while the menu is open": `Menu` has no open-state prop, and of
// the two SwiftUI lifecycle callbacks its content can carry, only `onAppear` actually fires —
// menu items are built into UIKit menu elements, and `onDisappear` never arrives when the plate
// goes away (checked on the simulator). A menu closed by picking an item disarms the guard itself
// (`disarm`), so the next press is the user's own. What is left over is a menu dismissed by a tap
// on something that isn't a row at all: the guard then eats the next row press, once. A dead tap
// is a smaller price than a tap that navigates while the user meant to close a menu.

let isArmed = false;

/** A menu has opened: the next press is the one that will close it. */
export function armMenuDismissGuard(): void {
  isArmed = true;
}

/** The menu closed on its own terms — picking an item, or unmounting with the screen. */
export function disarmMenuDismissGuard(): void {
  isArmed = false;
}

/**
 * True when this press is the one that closed a menu — the caller should do nothing with it.
 * Consumes the guard, so only the first press after a menu opened is swallowed.
 */
export function consumeMenuDismissPress(): boolean {
  if (!isArmed) {
    return false;
  }
  isArmed = false;
  return true;
}
