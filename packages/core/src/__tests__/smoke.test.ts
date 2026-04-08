import { describe, it, expect } from 'vitest';
import { version } from '../version.js';

describe('@gaurabda/core', () => {
  it('exports version', () => {
    expect(version).toBe('1.0.0');
  });
});
