import { buildHowToUrl } from '@domain/exerciseHowTo';

const BASE = 'https://www.youtube.com/results?search_query=';
const SHORTS = '&sp=EgIQCQ%253D%253D';

describe('buildHowToUrl', () => {
  test('adds the equipment word for barbell, dumbbell, machine and cable', () => {
    expect(buildHowToUrl('Bench Press', 'barbell')).toBe(
      `${BASE}Bench+Press+barbell+form${SHORTS}`,
    );
    expect(buildHowToUrl('Curl', 'dumbbell')).toBe(`${BASE}Curl+dumbbell+form${SHORTS}`);
    expect(buildHowToUrl('Pec Deck', 'machine')).toBe(`${BASE}Pec+Deck+machine+form${SHORTS}`);
    expect(buildHowToUrl('Face Pull', 'cable')).toBe(`${BASE}Face+Pull+cable+form${SHORTS}`);
  });

  test('adds nothing for bodyweight and other', () => {
    expect(buildHowToUrl('Push Up', 'bodyweight')).toBe(`${BASE}Push+Up+form${SHORTS}`);
    expect(buildHowToUrl('Sled Push', 'other')).toBe(`${BASE}Sled+Push+form${SHORTS}`);
  });

  test('says weighted for a bodyweight exercise with added weight', () => {
    expect(buildHowToUrl('Dip', 'bodyweight-weighted')).toBe(`${BASE}Dip+weighted+form${SHORTS}`);
  });

  test('works without equipment', () => {
    expect(buildHowToUrl('Bench Press')).toBe(`${BASE}Bench+Press+form${SHORTS}`);
  });

  test('does not repeat an equipment word the name already has', () => {
    expect(buildHowToUrl('Cable Fly', 'cable')).toBe(`${BASE}Cable+Fly+form${SHORTS}`);
    expect(buildHowToUrl('Barbell Row', 'barbell')).toBe(`${BASE}Barbell+Row+form${SHORTS}`);
  });

  test('trims the name and collapses repeated spaces', () => {
    expect(buildHowToUrl('  Bench   Press ', 'barbell')).toBe(
      `${BASE}Bench+Press+barbell+form${SHORTS}`,
    );
  });

  test('encodes &, / and + in a custom name, and keeps non-Latin letters searchable', () => {
    expect(buildHowToUrl('Push & Pull/Hold+', 'dumbbell')).toBe(
      `${BASE}Push+%26+Pull%2FHold%2B+dumbbell+form${SHORTS}`,
    );
    expect(buildHowToUrl('Жим лёжа')).toBe(
      `${BASE}${encodeURIComponent('Жим').concat('+', encodeURIComponent('лёжа'))}+form${SHORTS}`,
    );
  });

  test('carries the Shorts filter exactly as YouTube writes it, without encoding it again', () => {
    expect(buildHowToUrl('Squat', 'barbell').endsWith('&sp=EgIQCQ%253D%253D')).toBe(true);
  });
});
