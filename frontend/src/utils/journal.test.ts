import { describe, expect, it } from 'vitest';
import { buildJournalPostFormData, formatRelativeDate, formatYearsAgo, parseJournalTab } from './journal';

describe('parseJournalTab', () => {
  it.each(['feed', 'memories', 'bookmarks', 'tags', 'private'])('accepte %s', (tab) => {
    expect(parseJournalTab(tab)).toBe(tab);
  });

  it.each([null, undefined, '', 'autre'])('revient au feed pour %p', (value) => {
    expect(parseJournalTab(value)).toBe('feed');
  });
});

describe('buildJournalPostFormData', () => {
  it('sérialise les tableaux en champ[] et la localisation en JSON', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    const data = buildJournalPostFormData({
      content: 'Bonjour',
      mood: 'happy',
      tagIds: ['a', 'b'],
      isPrivate: true,
      parentId: 'p1',
      location: { name: 'Paris', latitude: 1, longitude: 2 },
      medias: [file],
    });

    expect(data.get('content')).toBe('Bonjour');
    expect(data.get('mood')).toBe('happy');
    expect(data.getAll('tagIds[]')).toEqual(['a', 'b']);
    expect(data.get('isPrivate')).toBe('true');
    expect(data.get('parentId')).toBe('p1');
    expect(JSON.parse(String(data.get('location')))).toEqual({ name: 'Paris', latitude: 1, longitude: 2 });
    expect((data.get('medias[]') as File).name).toBe('photo.png');
  });

  it("n'envoie pas les champs facultatifs absents", () => {
    const data = buildJournalPostFormData({ content: 'Seul' });
    expect([...data.keys()]).toEqual(['content']);
  });
});

describe('formatRelativeDate', () => {
  const now = new Date('2026-11-22T12:00:00Z');

  it.each([
    ['2026-11-22T11:59:40Z', "à l'instant"],
    ['2026-11-22T11:55:00Z', 'il y a 5 minutes'],
    ['2026-11-22T09:00:00Z', 'il y a 3 heures'],
    ['2026-11-21T12:00:00Z', 'hier'],
    ['2025-11-22T12:00:00Z', "l’année dernière"],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelativeDate(iso, now).replace("'", '’')).toBe(expected.replace("'", '’'));
  });
});

describe('formatYearsAgo', () => {
  const now = new Date('2026-11-22T12:00:00Z');

  it('accorde au singulier et au pluriel', () => {
    expect(formatYearsAgo('2025-11-22T08:00:00Z', now)).toBe('Il y a 1 an');
    expect(formatYearsAgo('2024-11-22T08:00:00Z', now)).toBe('Il y a 2 ans');
  });
});
