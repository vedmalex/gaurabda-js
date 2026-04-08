import { describe, it, expect } from 'vitest';
import { getAyanamsa, getLahiriAyanamsa, getAyanamsaName, AyanamshaType } from '../ayanamsha.js';

describe('getAyanamsa', () => {
  it('returns Lahiri ayanamsha for J2000', () => {
    // J2000 = JD 2451545.0, expected Lahiri ~23.853
    const result = getAyanamsa(2451545.0, AyanamshaType.LAHIRI);
    expect(result).toBeCloseTo(23.853, 1);
  });

  it('returns ~24.0 for 2010 (Meeus test 5 from CAR-009)', () => {
    // JDE 2455437.0 (28.8.2010), expected Lahiri ~24.0
    const result = getAyanamsa(2455437.0, AyanamshaType.LAHIRI);
    expect(result).toBeCloseTo(24.0, 0);
  });

  it('Fagan-Bradley differs from Lahiri', () => {
    const lahiri = getAyanamsa(2451545.0, AyanamshaType.LAHIRI);
    const fagan = getAyanamsa(2451545.0, AyanamshaType.FAGAN_BRADLEY);
    expect(fagan).not.toBeCloseTo(lahiri, 0);
  });
});

describe('getLahiriAyanamsa', () => {
  it('interpolates for 2010', () => {
    const result = getLahiriAyanamsa(2455437.0);
    expect(result).toBeCloseTo(24.001, 2);
  });

  it('interpolates for 2000', () => {
    const result = getLahiriAyanamsa(2451791.0);
    expect(result).toBeCloseTo(23.870, 2);
  });
});

describe('getAyanamsaName', () => {
  it('returns Lahiri', () => {
    expect(getAyanamsaName(AyanamshaType.LAHIRI)).toBe('Lahiri');
  });
  it('returns empty for invalid', () => {
    expect(getAyanamsaName(99 as AyanamshaType)).toBe('');
  });
});
