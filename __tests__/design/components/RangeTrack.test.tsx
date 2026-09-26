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

  test('labels wait for the track to be measured, then shift onto their values', () => {
    renderTrack();

    expect(screen.queryByText('12')).toBeNull();

    layOutTrack();

    expect(screen.getByText('4')).toBeTruthy();
    // A label is a full-width centred line, so its shift is measured from the middle of the track.
    expect(screen.getByText('15').props.style).toEqual(
      expect.arrayContaining([
        { transform: [{ translateX: ((15 - 4) / 13.5) * TRACK_WIDTH - TRACK_WIDTH / 2 }] },
      ]),
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
