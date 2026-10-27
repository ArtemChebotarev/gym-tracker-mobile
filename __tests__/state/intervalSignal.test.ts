import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

type MockPlayer = { play: jest.Mock; pause: jest.Mock; seekTo: jest.Mock; loop?: boolean };

// The module keeps its players and its timeout between calls, as it does in the app; each test
// loads it afresh.
function loadSignal(): typeof import('@state/intervalSignal') {
  let signal: typeof import('@state/intervalSignal') | undefined;
  jest.isolateModules(() => {
    signal = jest.requireActual('@state/intervalSignal');
  });
  if (signal === undefined) throw new Error('not loaded');
  return signal;
}

/** The players in the order the module makes them: the silent loop, then the countdown. */
function players(): { silence: MockPlayer; countdown: MockPlayer } {
  const made = jest.mocked(createAudioPlayer).mock.results.map((r) => r.value as MockPlayer);
  const [silence, countdown] = made.slice(-2);
  if (silence === undefined || countdown === undefined) throw new Error('no players yet');
  return { silence, countdown };
}

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  jest.mocked(createAudioPlayer).mockImplementation(
    () =>
      ({
        play: jest.fn(),
        pause: jest.fn(),
        seekTo: jest.fn(() => Promise.resolve()),
      }) as unknown as ReturnType<typeof createAudioPlayer>,
  );
});

afterEach(() => {
  jest.useRealTimers();
});

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('intervalSignal', () => {
  it('keeps the app awake with a silent loop that mixes with the music, in silent mode too', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    expect(players().silence.loop).toBe(true);
    expect(players().silence.play).toHaveBeenCalledTimes(1);

    signal.releaseTimer();
    expect(players().silence.pause).toHaveBeenCalledTimes(1);
  });

  it('plays the countdown clip from its start 3 s before the phase ends, once', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();
    signal.scheduleCountdown(Date.now() + 20_000, () => true);

    jest.advanceTimersByTime(16_999);
    await flush();
    expect(players().countdown.play).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flush();
    expect(players().countdown.seekTo).toHaveBeenCalledWith(0);
    expect(players().countdown.play).toHaveBeenCalledTimes(1);
  });

  it('picks up part way into the clip when less than 3 s are left', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();
    signal.scheduleCountdown(Date.now() + 2_000, () => true);

    jest.advanceTimersByTime(0);
    await flush();
    expect(players().countdown.seekTo).toHaveBeenCalledWith(1);
    expect(players().countdown.play).toHaveBeenCalledTimes(1);
  });

  it('a cancelled countdown never sounds, and one already sounding stops', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();
    signal.scheduleCountdown(Date.now() + 10_000, () => true);

    signal.cancelCountdown();
    jest.advanceTimersByTime(60_000);
    await flush();

    expect(players().countdown.play).not.toHaveBeenCalled();
    expect(players().countdown.pause).toHaveBeenCalled();
  });

  it('a new phase replaces the countdown of the one before', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();
    signal.scheduleCountdown(Date.now() + 10_000, () => true);
    signal.scheduleCountdown(Date.now() + 30_000, () => true);

    jest.advanceTimersByTime(10_000);
    await flush();
    expect(players().countdown.play).not.toHaveBeenCalled();

    jest.advanceTimersByTime(17_000);
    await flush();
    expect(players().countdown.play).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the sound is off as the countdown comes due (GT-172)', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();
    let soundOn = true;
    signal.scheduleCountdown(Date.now() + 20_000, () => soundOn);

    // Switched off after the phase began: what counts is the switch when the countdown is due.
    soundOn = false;
    jest.advanceTimersByTime(20_000);
    await flush();

    expect(players().countdown.play).not.toHaveBeenCalled();
    expect(players().silence.pause).not.toHaveBeenCalled();
  });

  it('sets nothing off for a phase that is already over', async () => {
    const signal = loadSignal();
    await signal.keepAwakeForTimer();
    signal.scheduleCountdown(Date.now() - 1, () => true);

    jest.advanceTimersByTime(60_000);
    await flush();
    expect(players().countdown.play).not.toHaveBeenCalled();
  });
});
