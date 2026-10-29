import type { AudioPlayer } from 'expo-audio';

import { playFrom } from '@state/soundPlayer';

describe('playFrom', () => {
  it('plays only once the seek has landed, never while it is still on the way', async () => {
    const calls: string[] = [];
    let landSeek: () => void = () => undefined;
    const player = {
      seekTo: jest.fn(
        (sec: number) =>
          new Promise<void>((resolve) => {
            calls.push(`seek ${sec}`);
            landSeek = () => {
              calls.push('seek landed');
              resolve();
            };
          }),
      ),
      play: jest.fn(() => calls.push('play')),
    } as unknown as AudioPlayer;

    const playing = playFrom(player, 1.5);
    await Promise.resolve();
    expect(calls).toEqual(['seek 1.5']);

    landSeek();
    await playing;
    expect(calls).toEqual(['seek 1.5', 'seek landed', 'play']);
  });
});
