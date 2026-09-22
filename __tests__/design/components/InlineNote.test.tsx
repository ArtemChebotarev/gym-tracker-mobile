import { render, screen } from '@testing-library/react-native';

import { InlineNote } from '@design/components/InlineNote';

describe('InlineNote', () => {
  test('reads as one line, the lead phrase first', () => {
    render(<InlineNote lead="20 kg is too heavy for 5+ reps." text="Up to 17.5 kg keeps a rep target." />);

    expect(screen.getByTestId('inline-note')).toHaveTextContent(
      '20 kg is too heavy for 5+ reps. Up to 17.5 kg keeps a rep target.',
    );
  });

  test('the lead is optional', () => {
    render(<InlineNote text="Stop at 2 RIR, not at the number." />);

    expect(screen.getByTestId('inline-note')).toHaveTextContent(
      'Stop at 2 RIR, not at the number.',
    );
  });
});
