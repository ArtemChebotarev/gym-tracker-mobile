import { fireEvent, render, screen } from '@testing-library/react-native';

import { CancelNextFooter } from '@design/components/CancelNextFooter';

describe('CancelNextFooter', () => {
  test('Cancel and Next each call their own handler', () => {
    const onCancel = jest.fn();
    const onNext = jest.fn();
    render(<CancelNextFooter onCancel={onCancel} onNext={onNext} />);

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  // 08.0: the exception to "primary справа" is the width only.
  test('Cancel comes first, Next on the right', () => {
    render(<CancelNextFooter onCancel={jest.fn()} onNext={jest.fn()} />);

    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveTextContent('Cancel');
    expect(second).toHaveTextContent('Next');
  });
});
