import { describe, it, expect } from 'vitest';
import { TimeZone } from '../timezone.js';
import { getCountryName, getCountryByISOCode, getContinentName } from '../country.js';
import { Location } from '../location.js';
import { GregorianDateTime } from '../gregorian-date-time.js';
import { DstTypeChange } from '../enums.js';

describe('TimeZone', () => {
  it('findByName returns known timezone', () => {
    const tz = TimeZone.findByName('America/New_York');
    expect(tz.name).toBe('America/New_York');
    expect(tz.offsetMinutes).toBe(-300);
  });

  it('findById returns known timezone', () => {
    const tz = TimeZone.findById(381); // Pacific/Honolulu
    expect(tz.name).toBe('Pacific/Honolulu');
    expect(tz.offsetMinutes).toBe(-600);
  });

  it('getDefault returns UTC', () => {
    const tz = TimeZone.getDefault();
    expect(tz.name).toBe('UTC');
    expect(tz.offsetMinutes).toBe(0);
  });

  it('findByName returns default for unknown', () => {
    const tz = TimeZone.findByName('NonExistent/Zone');
    expect(tz.name).toBe('UTC');
  });

  it('getOffsetText formats correctly', () => {
    expect(TimeZone.getOffsetText(5.5)).toBe('+5:30');
    expect(TimeZone.getOffsetText(-5)).toBe('-5:00');
    expect(TimeZone.getOffsetText(0)).toBe('+0:00');
  });

  it('getBiasMinutesForDay returns 0 for non-DST timezone', () => {
    const tz = TimeZone.findByName('Asia/Calcutta');
    const d = GregorianDateTime.fromComponents(2024, 7, 15);
    expect(tz.getBiasMinutesForDay(d)).toBe(0);
  });

  it('getBiasMinutesForDay returns bias during DST', () => {
    const tz = TimeZone.findByName('America/New_York');
    // July is summer — DST should be active
    const summer = GregorianDateTime.fromComponents(2024, 7, 15);
    expect(tz.getBiasMinutesForDay(summer)).toBe(60);
    // January — no DST
    const winter = GregorianDateTime.fromComponents(2024, 1, 15);
    expect(tz.getBiasMinutesForDay(winter)).toBe(0);
  });

  it('determineDaylightChange returns correct transition', () => {
    const tz = TimeZone.findByName('America/New_York');
    const summer = GregorianDateTime.fromComponents(2024, 7, 15);
    expect(tz.determineDaylightChange(summer)).toBe(DstTypeChange.DstOn);
    const winter = GregorianDateTime.fromComponents(2024, 1, 15);
    expect(tz.determineDaylightChange(winter)).toBe(DstTypeChange.DstOff);
  });

  it('getAll returns many timezones', () => {
    const all = TimeZone.getAll();
    expect(all.length).toBeGreaterThan(400);
  });
});

describe('Country', () => {
  it('getCountryName returns known country', () => {
    const name = getCountryName(16708); // Andorra
    expect(name).toBe('Andorra');
  });

  it('getCountryByISOCode finds country', () => {
    const c = getCountryByISOCode('US');
    expect(c).toBeDefined();
    expect(c!.name).toContain('United States');
  });

  it('getContinentName returns known continent', () => {
    expect(getContinentName(1)).toBe('Europe');
    expect(getContinentName(2)).toBe('Asia');
  });
});

describe('Location', () => {
  it('creates from constructor', () => {
    const loc = new Location('Mayapur', 23.42, 88.39, 'Asia/Calcutta');
    expect(loc.city).toBe('Mayapur');
    expect(loc.latitudeDeg).toBe(23.42);
    expect(loc.longitudeDeg).toBe(88.39);
    expect(loc.timezone.name).toBe('Asia/Calcutta');
  });

  it('offsetUtcHours from timezone', () => {
    const loc = new Location('Mayapur', 23.42, 88.39, 'Asia/Calcutta');
    expect(loc.offsetUtcHours).toBeCloseTo(5.5, 1);
  });

  it('getEarthData returns proper EarthData', () => {
    const loc = new Location('Mayapur', 23.42, 88.39, 'Asia/Calcutta');
    const earth = loc.getEarthData();
    expect(earth.latitudeDeg).toBe(23.42);
    expect(earth.longitudeDeg).toBe(88.39);
    expect(earth.offsetUtcHours).toBeCloseTo(5.5, 1);
  });

  it('fromCoords static factory', () => {
    const loc = Location.fromCoords(23.42, 88.39, 'Asia/Calcutta', 'Mayapur');
    expect(loc.title).toBe('Mayapur');
  });

  it('title falls back to coordinates', () => {
    const loc = new Location('', 23.42, 88.39);
    expect(loc.title).toMatch(/23N/);
    expect(loc.title).toMatch(/88E/);
  });
});
