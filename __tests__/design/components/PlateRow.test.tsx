import { render, screen } from '@testing-library/react-native';

import { PlateRow } from '@design/components/PlateRow';
import { StopIcon } from '@design/icons/StopIcon';

describe('PlateRow', () => {
  test('puts its text beside a round mark: an icon, or a step number', () => {
    const { rerender } = render(<PlateRow leading={{ icon: StopIcon }} text={['Stop a set.']} />);
    expect(screen.getByTestId('plate-row-mark')).toBeTruthy();
    expect(screen.getByText('Stop a set.')).toBeTruthy();

    rerender(<PlateRow leading={{ number: 2 }} text={['Log this workout.']} />);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Log this workout.')).toBeTruthy();
  });

  test('marks the strong words in a stronger weight and says all of it as one sentence', () => {
    render(
      <PlateRow
        leading={{ number: 1 }}
        text={['Stop when ', { strong: 'about 3 reps are left' }, '.']}
      />,
    );

    // One sentence to read out and to find...
    expect(screen.getByText('Stop when about 3 reps are left.')).toBeTruthy();
    // ...with its strong words a piece of their own.
    expect(screen.getByText('about 3 reps are left')).toBeTruthy();
  });
});
