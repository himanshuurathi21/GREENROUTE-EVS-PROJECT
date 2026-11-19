import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../utils/sanitize';

describe('escapeHtml', () => {
  it('neutralises every HTML-significant character', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands and single quotes', () => {
    expect(escapeHtml("A & B's place")).toBe('A &amp; B&#39;s place');
  });

  it('leaves ordinary place names unchanged', () => {
    expect(escapeHtml('India Gate, New Delhi')).toBe('India Gate, New Delhi');
  });

  it('does not double-escape already escaped ampersands beyond one pass', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
