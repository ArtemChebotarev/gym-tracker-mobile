import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RangeTrack, RangeTrackSwatch } from '@design/components/RangeTrack';
import { COLORS } from '@design/tokens';

const TRACK_WIDTH = 300;

function renderTrack() {
  render(
    <RangeTrack
      outer={{ min: 4, max: 17.5 }}
      inner={{ min: 12, max: 17.5 }}
      marker={15}
      labels={[
        { value: 4, text: '4' },
        { value: 12, text: '12' },
        { value: 15, text: '15' },
        { value: 17.5, text: '17.5' },
      ]}
      accessibilityLabel="Weights with a rep target"
    />,
  );
}

function layOutTrack() {
  fireEvent(screen.getByTestId('range-track'), 'layout', {
    nativeEvent: { layout: { width: TRACK_WIDTH, height: 10 } },
  });
}

const LABEL_WIDTHS = { '4': 8, '12': 16, '15': 16, '17.5': 28 } as const;

function layOutLabels() {
  for (const [text, width] of Object.entries(LABEL_WIDTHS)) {
    fireEvent(screen.getByText(text), 'layout', {
      nativeEvent: { layout: { width, height: 16 } },
    });
  }
}

function styleOf(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style);
}

describe('RangeTrack', () => {
  test('the inner span is placed by its share of the outer one', () => {
    renderTrack();

    // 12 of 4..17.5 is 59.3% along; the far end of both spans is the same, so nothing is cut off
    // the right.
    expect(styleOf('range-track-inner')).toMatchObject({
      left: `${((12 - 4) / 13.5) * 100}%`,
      right: '0%',
    });
  });

  test('the inner span and its legend swatch are drawn in the accent', () => {
    renderTrack();
    expect(styleOf('range-track-inner').backgroundColor).toBe(COLORS.accent);

    render(<RangeTrackSwatch span="inner" />);
    const swatchFill = screen.getByTestId('range-track-swatch-inner').props.children;
    expect(StyleSheet.flatten(swatchFill.props.style).backgroundColor).toBe(COLORS.accent);
  });

  test('the marker sits over its own value', () => {
    renderTrack();

    expect(styleOf('range-track-marker')).toMatchObject({
      left: `${((15 - 4) / 13.5) * 100}%`,
    });
  });

  test('labels stay hidden until the track and each label are measured, then centre on their values', () => {
    renderTrack();

    expect(StyleSheet.flatten(screen.getByText('15').props.style)).toMatchObject({ opacity: 0 });

    layOutTrack();
    layOutLabels();

    const placed = StyleSheet.flatten(screen.getByText('15').props.style);
    expect(placed.opacity).toBeUndefined();
    // Pulled in by half the "4" label, then the label's own centre put on 15.
    expect(placed.left).toBe(
      LABEL_WIDTHS['4'] / 2 + ((15 - 4) / 13.5) * TRACK_WIDTH - LABEL_WIDTHS['15'] / 2,
    );
  });

  test('the end labels pull the track in so their outer edges meet the row edges', () => {
    renderTrack();
    layOutTrack();
    layOutLabels();

    expect(styleOf('range-track')).toMatchObject({
      marginLeft: LABEL_WIDTHS['4'] / 2,
      marginRight: LABEL_WIDTHS['17.5'] / 2,
    });
    expect(StyleSheet.flatten(screen.getByText('4').props.style).left).toBe(0);
    const last = StyleSheet.flatten(screen.getByText('17.5').props.style);
    expect(last.left + LABEL_WIDTHS['17.5']).toBe(
      LABEL_WIDTHS['4'] / 2 + TRACK_WIDTH + LABEL_WIDTHS['17.5'] / 2,
    );
  });

  test('a span with no width puts everything at the start instead of dividing by zero', () => {
    render(
      <RangeTrack
        outer={{ min: 5, max: 5 }}
        inner={{ min: 5, max: 5 }}
        marker={5}
        labels={[{ value: 5, text: '5' }]}
        accessibilityLabel="Weights with a rep target"
      />,
    );

    expect(styleOf('range-track-marker')).toMatchObject({ left: '0%' });
  });
});
