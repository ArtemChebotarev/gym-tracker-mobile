import { act, renderHook } from '@testing-library/react-native';

import { useMesoCreationMethodSheet } from '@components/useMesoCreationMethodSheet';

// The creation-method sheet's state, shared by the `+` on 08.3 and the two empty states that now
// raise the same sheet (123, and Artem's call on 24.09.2026). What matters is the one thing that
// isn't a boolean: a pick closes it without the slide, a dismissal keeps it.

describe('useMesoCreationMethodSheet', () => {
  test('starts closed', () => {
    const { result } = renderHook(() => useMesoCreationMethodSheet());

    expect(result.current.visible).toBe(false);
  });

  test('open raises it, and it slides in', () => {
    const { result } = renderHook(() => useMesoCreationMethodSheet());

    act(() => result.current.open());

    expect(result.current.visible).toBe(true);
    expect(result.current.animated).toBe(true);
  });

  test('picking a row runs the destination and closes without the slide', () => {
    const go = jest.fn();
    const { result } = renderHook(() => useMesoCreationMethodSheet());
    act(() => result.current.open());

    act(() => result.current.choose(go)());

    expect(go).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(false);
    // The chosen screen is pushing in at the same moment — two transitions at once read as a
    // stutter (task 123).
    expect(result.current.animated).toBe(false);
  });

  test('dismissing it still slides — nothing is arriving to take its place', () => {
    const { result } = renderHook(() => useMesoCreationMethodSheet());
    act(() => result.current.open());

    act(() => result.current.close());

    expect(result.current.visible).toBe(false);
    expect(result.current.animated).toBe(true);
  });

  test('reopening after a pick slides again', () => {
    const { result } = renderHook(() => useMesoCreationMethodSheet());
    act(() => result.current.open());
    act(() => result.current.choose(jest.fn())());

    act(() => result.current.open());

    expect(result.current.visible).toBe(true);
    expect(result.current.animated).toBe(true);
  });
});
