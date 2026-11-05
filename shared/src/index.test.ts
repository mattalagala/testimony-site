import { describe, expect, it } from 'vitest';
import { makeExcerpt, resolveDisplayName } from './index.js';

describe('resolveDisplayName', () => {
  it('hides names for anonymous submissions', () => {
    expect(resolveDisplayName('anonymous', 'Jane Doe')).toBe('Anonymous');
  });
  it('falls back to Anonymous for blank names', () => {
    expect(resolveDisplayName('full', '  ')).toBe('Anonymous');
    expect(resolveDisplayName('first', null)).toBe('Anonymous');
  });
  it('uses the stored display name otherwise', () => {
    expect(resolveDisplayName('first', ' Jane ')).toBe('Jane');
  });
});

describe('makeExcerpt', () => {
  it('returns short text unchanged, collapsing whitespace', () => {
    expect(makeExcerpt('Hello\n\n  world')).toBe('Hello world');
  });
  it('cuts long text on a word boundary with an ellipsis', () => {
    const text = 'word '.repeat(100);
    const excerpt = makeExcerpt(text, 50);
    expect(excerpt.length).toBeLessThanOrEqual(51);
    expect(excerpt.endsWith('word…')).toBe(true);
  });
});
