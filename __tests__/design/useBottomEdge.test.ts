import { bottomEdge } from '@design/useBottomEdge';

describe('bottomEdge', () => {
  const window = { safeBottom: 34, windowHeight: 956 };

  test('says nothing until the view has been measured', () => {
    expect(bottomEdge({ ...window, frameBottom: null, keyboardTop: 600 })).toEqual({
      keyboardOverlap: 0,
      safeAreaShortfall: 0,
    });
  });

  test('a view running to the bottom of the window reaches the whole safe area', () => {
    expect(bottomEdge({ ...window, frameBottom: 956, keyboardTop: null })).toEqual({
      keyboardOverlap: 0,
      safeAreaShortfall: 34,
    });
  });

  test('a view that already keeps off the home indicator reaches none of it', () => {
    expect(bottomEdge({ ...window, frameBottom: 922, keyboardTop: null }).safeAreaShortfall).toBe(
      0,
    );
  });

  test('the keyboard covers what of the view lies below its top', () => {
    expect(bottomEdge({ ...window, frameBottom: 922, keyboardTop: 610 }).keyboardOverlap).toBe(312);
  });

  test('a keyboard below the view covers none of it', () => {
    expect(bottomEdge({ ...window, frameBottom: 500, keyboardTop: 610 }).keyboardOverlap).toBe(0);
  });
});
