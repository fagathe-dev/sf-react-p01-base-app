import { iconNames } from 'core-react/icons';
import { describe, expect, it } from 'vitest';

/**
 * Le kit n'affiche rien (sans erreur) pour un nom d'icône inconnu : ce test vérifie que chaque nom littéral
 * utilisé dans l'app (`name="…"`, `icon="…"`, `icon: '…'`) existe dans `core-react/icons`.
 */
const sources = import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ICON_PATTERNS = [
  /<(?:Icon|IconButton)\b[^>]*?\bname="([a-z0-9-]+)"/g,
  /\bicon="([a-z0-9-]+)"/g,
  /\bicon:\s*'([a-z0-9-]+)'/g,
  // Ternaires : name={cond ? 'a' : 'b'} / icon: cond ? 'a' : 'b' (les deux branches)
  /\b(?:name|icon)(?:=\{|:\s*)[^?\n]*\?\s*'([a-z0-9-]+)'/g,
  /\b(?:name|icon)(?:=\{|:\s*)[^?\n]*\?\s*'[a-z0-9-]+'\s*:\s*'([a-z0-9-]+)'/g,
];

describe('icônes du Design System', () => {
  it('chaque icône utilisée existe dans core-react/icons', () => {
    const known = new Set<string>(iconNames);
    const unknown: string[] = [];

    for (const [file, content] of Object.entries(sources)) {
      for (const pattern of ICON_PATTERNS) {
        for (const [, name] of content.matchAll(pattern)) {
          if (name && !known.has(name)) unknown.push(`${file} : ${name}`);
        }
      }
    }

    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(unknown).toEqual([]);
  });
});
