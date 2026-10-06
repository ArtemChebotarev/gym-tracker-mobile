import { createRef, type RefObject } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { View } from 'react-native';

import { CoachmarkTour, type CoachmarkStep } from '@design/components/CoachmarkTour';

// `measureInWindow` answers nothing under Jest, so each target is a stand-in that answers the way
// the device does, and records how often it was asked.
function target(x: number, y: number): { ref: RefObject<View | null>; measured: jest.Mock } {
  const measured = jest.fn();
  const ref = createRef<View>() as { current: View | null };
  ref.current = {
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => {
      measured();
      callback(x, y, 40, 20);
    },
  } as unknown as View;
  return { ref: ref as RefObject<View | null>, measured };
}

function steps() {
  const first = target(20, 100);
  const second = target(200, 300);
  const third = target(100, 500);
  const list: CoachmarkStep[] = [
    { targetRef: first.ref, title: 'First', paragraphs: ['one'] },
    { targetRef: second.ref, title: 'Second', paragraphs: ['two'] },
    { targetRef: third.ref, title: 'Third', paragraphs: ['three'] },
  ];
  return { list, first, second, third };
}

describe('CoachmarkTour', () => {
  test('DoD: starts on the first step and highlights the element that step names', () => {
    const { list, first } = steps();
    render(<CoachmarkTour visible steps={list} onFinish={() => {}} />);

    expect(screen.getByText('1 of 3')).toBeTruthy();
    expect(screen.getByText('First')).toBeTruthy();
    expect(first.measured).toHaveBeenCalled();
    // The ring is drawn round the measured element: (20, 100) grown by 6, its stroke 1 inside.
    expect(screen.getByTestId('coachmark-ring').props.x).toBe(15);
    expect(screen.getByTestId('coachmark-ring').props.y).toBe(95);
  });

  test('DoD: Next walks the list, measuring each step’s own element', () => {
    const { list, second, third } = steps();
    render(<CoachmarkTour visible steps={list} onFinish={() => {}} />);

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('2 of 3')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(second.measured).toHaveBeenCalled();
    expect(screen.getByTestId('coachmark-ring').props.x).toBe(195);

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('3 of 3')).toBeTruthy();
    expect(third.measured).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy();
  });

  test('Got it on the last step finishes the tour — once', () => {
    const onFinish = jest.fn();
    const { list } = steps();
    render(<CoachmarkTour visible steps={list} onFinish={onFinish} />);
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    fireEvent.press(screen.getByRole('button', { name: 'Got it' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('DoD: Skip on any step ends the whole tour', () => {
    const onFinish = jest.fn();
    const { list } = steps();
    render(<CoachmarkTour visible steps={list} onFinish={onFinish} />);
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    fireEvent.press(screen.getByRole('button', { name: 'Skip' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('after it has finished it starts from the first step the next time it is shown', () => {
    const { list } = steps();
    const { rerender } = render(<CoachmarkTour visible steps={list} onFinish={() => {}} />);
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    fireEvent.press(screen.getByRole('button', { name: 'Skip' }));

    rerender(<CoachmarkTour visible={false} steps={list} onFinish={() => {}} />);
    rerender(<CoachmarkTour visible steps={list} onFinish={() => {}} />);

    expect(screen.getByText('1 of 3')).toBeTruthy();
  });

  test('shows nothing while hidden, and nothing for an empty list', () => {
    const { list } = steps();
    const { rerender } = render(<CoachmarkTour visible={false} steps={list} onFinish={() => {}} />);
    expect(screen.queryByText('1 of 3')).toBeNull();

    rerender(<CoachmarkTour visible steps={[]} onFinish={() => {}} />);
    expect(screen.queryByTestId('coachmark')).toBeNull();
  });
});
