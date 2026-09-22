// Runs before the test framework, for the one corner of the app that uses gestures
// (`design/components/SwipeableRow.tsx`, task 117). Two things are needed and neither is optional:
//
// 1. `react-native-worklets` reaches for its native module the moment it is imported — reanimated
//    imports it, gesture-handler's `ReanimatedSwipeable` imports reanimated, so merely importing
//    the row threw before any test ran. The package ships `src/mock` for exactly this. It is
//    spread rather than used as-is because the mock omits `isWorkletRuntime`, which reanimated 4
//    calls while initialising.
// 2. `react-native-gesture-handler/jestSetup` stubs the handlers themselves, so a gesture
//    component renders as plain views.
//
// The import sits above the mock only because `import/first` asks for it; Babel hoists `jest.mock`
// above every import in the file, so the mock is installed before gesture-handler's setup pulls
// reanimated in.
//
// A swipe is not simulated in tests: the mocked reanimated never advances the progress value, so
// the revealed actions stay behind gesture-handler's own `pointerEvents: 'none'`, and
// `fireEvent.press` on them does nothing however the row is driven. Tests therefore assert what a
// row *renders* and drive the handlers through the pure builders that produce them
// (`plannedRowActions`, `completedRowActions`); the gesture itself is checked on the device.
//
// Rendering a `SwipeableRow` also needs a `GestureHandlerRootView` above it — gesture-handler 3.x
// throws without one rather than failing quietly.

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets/src/mock'),
  isWorkletRuntime: () => false,
}));
