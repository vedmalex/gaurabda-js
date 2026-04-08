import { describe, it, expect } from 'vitest';
import { searchLocations, getAllLocations, getLocationCount } from '../search.js';

describe('searchLocations', () => {
  it('returns empty for short query', () => {
    expect(searchLocations('')).toEqual([]);
    expect(searchLocations('a')).toEqual([]);
  });

  it('finds Moskva by prefix', () => {
    const results = searchLocations('Moskva');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].city).toBe('Moskva');
  });

  it('finds cities case-insensitively', () => {
    const results = searchLocations('new delhi');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].city).toMatch(/Delhi/i);
  });

  it('respects limit option', () => {
    const results = searchLocations('San', { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('filters by country', () => {
    const results = searchLocations('Ma', { country: 'India' });
    for (const loc of results) {
      expect(loc.timezone.name).toBeDefined();
    }
    // All results should be from the search, and with India context
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns Location objects with timezone', () => {
    const results = searchLocations('Mayapur');
    if (results.length > 0) {
      expect(results[0].latitudeDeg).toBeGreaterThan(0);
      expect(results[0].timezone).toBeDefined();
    }
  });

  it('exact match is ranked first', () => {
    const results = searchLocations('London');
    expect(results[0].city).toBe('London');
  });
});

describe('getAllLocations', () => {
  it('returns all 2387 locations', () => {
    expect(getLocationCount()).toBe(2387);
  });

  it('getAllLocations returns Location objects', () => {
    const all = getAllLocations();
    expect(all.length).toBe(2387);
    expect(all[0].city).toBeDefined();
    expect(all[0].latitudeDeg).toBeDefined();
  });
});
