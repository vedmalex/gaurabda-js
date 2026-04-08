import { describe, it, expect } from 'vitest';
import { ResultCoreEvents } from '../result-core-events.js';
import { ResultMasaList } from '../result-masa-list.js';
import { ResultCalendar } from '../result-calendar.js';
import { EarthData } from '../earth-data.js';
import { CoreEventType, FastType } from '../enums.js';

function mayapurEarth(): EarthData {
  const e = new EarthData();
  e.longitudeDeg = 88.39;
  e.latitudeDeg = 23.42;
  e.offsetUtcHours = 5.5;
  return e;
}

describe('ResultCoreEvents', () => {
  it('calculates events for a month', () => {
    const rce = new ResultCoreEvents();
    rce.full = true;
    rce.calculateEvents(mayapurEarth(), 2024, 3);
    expect(rce.events.length).toBeGreaterThan(20);
    // Should have tithi, naksatra, yoga, sankranti events
    const types = new Set(rce.events.map(e => e.nType));
    expect(types.has(CoreEventType.CCTYPE_TITHI)).toBe(true);
    expect(types.has(CoreEventType.CCTYPE_NAKS)).toBe(true);
  });

  it('getCoreEvents filters by time range', () => {
    const rce = new ResultCoreEvents();
    rce.full = true;
    rce.calculateEvents(mayapurEarth(), 2024, 3);
    // Get events for a ~1 day range
    const dayStart = rce.events[0].Time;
    const dayEnd = dayStart + 86400;
    const dayEvents = rce.getCoreEvents(dayStart, dayEnd);
    expect(dayEvents.length).toBeGreaterThan(0);
    expect(dayEvents.length).toBeLessThan(rce.events.length);
  });
});

describe('ResultMasaList', () => {
  it('calculates masa list for 1 year', () => {
    const rml = new ResultMasaList();
    rml.calculateMasaList(mayapurEarth(), 2024, 1);
    // A year should have 12-13 masas
    expect(rml.entries.length).toBeGreaterThanOrEqual(12);
    expect(rml.entries.length).toBeLessThanOrEqual(14);
    // Each entry should have valid masa and dates
    for (const entry of rml.entries) {
      expect(entry.masa).toBeGreaterThanOrEqual(0);
      expect(entry.masa).toBeLessThanOrEqual(12);
      expect(entry.year).toBeGreaterThan(530);
    }
  });
});

describe('ResultCalendar', () => {
  it('calculates calendar for a month', () => {
    const rc = new ResultCalendar();
    rc.calculateMonth(mayapurEarth(), 2024, 3);
    // 31 days + 2*8 buffer days = 47
    expect(rc.days.length).toBe(31 + 16);
    expect(rc.pureCount).toBe(31);
  });

  it('each day has astro data populated', () => {
    const rc = new ResultCalendar();
    rc.calculateMonth(mayapurEarth(), 2024, 3);
    for (let i = rc.BEFORE_DAYS; i < rc.BEFORE_DAYS + 5; i++) {
      const day = rc.days[i];
      expect(day.astrodata.sunRise.hour).toBeGreaterThanOrEqual(4);
      expect(day.astrodata.sunRise.hour).toBeLessThanOrEqual(7);
      expect(day.astrodata.masa).toBeGreaterThanOrEqual(0);
      expect(day.astrodata.masa).toBeLessThanOrEqual(12);
    }
  });

  it('days have core events', () => {
    const rc = new ResultCalendar();
    rc.calculateMonth(mayapurEarth(), 2024, 3);
    const day = rc.days[rc.BEFORE_DAYS + 5]; // 6th day of month
    expect(day.coreEvents.length).toBeGreaterThan(0);
    // Should at least have sunrise/sunset events
    const types = new Set(day.coreEvents.map(e => e.nType));
    expect(types.has(CoreEventType.CCTYPE_S_RISE)).toBe(true);
    expect(types.has(CoreEventType.CCTYPE_S_SET)).toBe(true);
  });

  it('ekadasi fasting is detected', () => {
    const rc = new ResultCalendar();
    rc.calculateMonth(mayapurEarth(), 2024, 3);
    const fastingDays = rc.days.filter(d => d.nFastID === FastType.FAST_EKADASI);
    // March 2024 should have at least 1-2 ekadasi days
    expect(fastingDays.length).toBeGreaterThanOrEqual(1);
  });

  it('findDate locates a day', () => {
    const rc = new ResultCalendar();
    rc.calculateMonth(mayapurEarth(), 2024, 3);
    const idx = rc.findDate(rc.days[rc.BEFORE_DAYS].date!);
    expect(idx).toBe(rc.BEFORE_DAYS);
  });

  it('ekadasiOnly mode skips festivals', () => {
    const rc = new ResultCalendar();
    rc.ekadasiOnly = true;
    rc.calculateMonth(mayapurEarth(), 2024, 3);
    // Should still have ekadasi data
    const fastingDays = rc.days.filter(d => d.nFastID === FastType.FAST_EKADASI);
    expect(fastingDays.length).toBeGreaterThanOrEqual(1);
  });
});
