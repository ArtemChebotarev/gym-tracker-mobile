import { Modal, View } from 'react-native';
import { Dropdown } from '@design/components/Dropdown';
import { fireEvent, render, screen } from '@testing-library/react-native';

function flatStylesOf(instance: ReturnType<typeof screen.getByRole>) {
  return instance
    .findAllByType(View)
    .map((view) => Object.assign({}, ...(Array.isArray(view.props.style) ? view.props.style : [view.props.style]).filter(Boolean)));
}

const OPTIONS = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
];

describe('Dropdown', () => {
  test('renders the placeholder when no value is selected', () => {
    render(
      <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} placeholder="Select a group" />,
    );

    expect(screen.getByText('Select a group')).toBeTruthy();
  });

  test('renders the selected option label', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value="back" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Back/);
  });

  test('opens the option list and propagates the chosen value outward', () => {
    const onChange = jest.fn();
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onChange).toHaveBeenCalledWith('chest');
  });

  test('closes the option list after selecting an option', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  test('marks the trigger as expanded only while the sheet is open', () => {
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);

    const trigger = screen.getByRole('button', { name: 'Muscle group' });
    expect(trigger.props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));

    fireEvent.press(trigger);

    expect(trigger.props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
  });

  test('renders the error state', () => {
    render(
      <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} error="Pick a group" />,
    );

    expect(screen.getByText('Pick a group')).toBeTruthy();
  });

  test('the option list floats over the screen; a tap outside it closes it without choosing', () => {
    const onChange = jest.fn();
    render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
    expect(screen.getByRole('button', { name: 'Chest' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }), {
      nativeEvent: { pageX: 0, pageY: 0 },
    });
    expect(screen.queryByRole('button', { name: 'Chest' })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('an option with a dotColor renders its color both on the trigger and in the option list', () => {
    const coloredOptions = [
      { value: 'chest', label: 'Chest', dotColor: '#F0A537' },
      { value: 'back', label: 'Back', dotColor: '#5B9CF8' },
    ];
    render(<Dropdown label="Muscle group" options={coloredOptions} value="chest" onChange={() => {}} />);

    fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));

    const backOption = screen.getByRole('button', { name: 'Back' });
    expect(flatStylesOf(backOption).some((style) => style.backgroundColor === '#5B9CF8')).toBe(true);
  });

  describe('placement and switching', () => {
    // `measureInWindow` answers nothing under Jest; each trigger is made to report the rectangle
    // its label says, so the list's placement and the tap-through can be driven.
    const RECTS: Record<string, { x: number; y: number; width: number; height: number }> = {};

    beforeEach(() => {
      jest
        .spyOn(View.prototype as never, 'measureInWindow' as never)
        .mockImplementation(function (this: { props: { accessibilityLabel?: string } }, callback: (...r: number[]) => void) {
          const rect = RECTS[this.props.accessibilityLabel ?? ''];
          if (rect) {
            callback(rect.x, rect.y, rect.width, rect.height);
          }
        } as never);
    });

    afterEach(() => jest.restoreAllMocks());

    function panelStyle() {
      const modal = screen.UNSAFE_getByType(Modal);
      const scroll = modal.findAll((node) => node.props.nestedScrollEnabled === true)[0];
      return Object.assign({}, ...[scroll?.props.style].flat().filter(Boolean));
    }

    test('opens below the field when there is room', () => {
      RECTS['Muscle group'] = { x: 16, y: 100, width: 300, height: 44 };
      render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);

      fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));

      expect(panelStyle()).toMatchObject({ left: 16, width: 300 });
      expect(panelStyle().top).toBeGreaterThan(100 + 44);
      expect(panelStyle().bottom).toBeUndefined();
    });

    test('opens above the field when it is too low for the list to fit below', () => {
      RECTS['Muscle group'] = { x: 16, y: 1200, width: 300, height: 44 };
      render(<Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />);

      fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));

      expect(panelStyle().top).toBeUndefined();
      expect(panelStyle().bottom).toBeGreaterThan(0);
    });

    test('a tap on another dropdown while one is open closes the first and opens the second', () => {
      RECTS.Equipment = { x: 16, y: 100, width: 300, height: 44 };
      RECTS['Muscle group'] = { x: 16, y: 200, width: 300, height: 44 };
      render(
        <>
          <Dropdown label="Equipment" options={[{ value: 'barbell', label: 'Barbell' }]} value={undefined} onChange={() => {}} />
          <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />
        </>,
      );

      fireEvent.press(screen.getByRole('button', { name: 'Equipment' }));
      expect(screen.getByRole('button', { name: 'Barbell' })).toBeTruthy();

      // The tap lands on the open list's backdrop, over the second field's trigger.
      fireEvent.press(screen.getByRole('button', { name: 'Close' }), {
        nativeEvent: { pageX: 100, pageY: 220 },
      });

      expect(screen.queryByRole('button', { name: 'Barbell' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Chest' })).toBeTruthy();
    });

    test('a tap on empty space just closes it', () => {
      RECTS.Equipment = { x: 16, y: 100, width: 300, height: 44 };
      RECTS['Muscle group'] = { x: 16, y: 200, width: 300, height: 44 };
      render(
        <>
          <Dropdown label="Equipment" options={[{ value: 'barbell', label: 'Barbell' }]} value={undefined} onChange={() => {}} />
          <Dropdown label="Muscle group" options={OPTIONS} value={undefined} onChange={() => {}} />
        </>,
      );

      fireEvent.press(screen.getByRole('button', { name: 'Equipment' }));
      fireEvent.press(screen.getByRole('button', { name: 'Close' }), {
        nativeEvent: { pageX: 100, pageY: 600 },
      });

      expect(screen.queryByRole('button', { name: 'Barbell' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Chest' })).toBeNull();
    });
  });
});
