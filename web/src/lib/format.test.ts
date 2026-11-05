import { describe, expect, it } from 'vitest';
import { formatDate, toParagraphs } from './format';

describe('toParagraphs', () => {
  it('splits on blank lines and trims', () => {
    expect(toParagraphs('One\nline\n\n  Two  \r\n\r\nThree')).toEqual([
      'One\nline',
      'Two',
      'Three',
    ]);
  });
  it('treats markup as plain text', () => {
    expect(toParagraphs('<script>alert(1)</script>')).toEqual(['<script>alert(1)</script>']);
  });
});

describe('formatDate', () => {
  it('formats in UTC so the date never shifts by time zone', () => {
    expect(formatDate('2026-11-01T00:30:00Z')).toBe('November 1, 2026');
  });
});
