import { describe, it, expect } from 'vitest';
import { ResultEvents, DayEvent } from '../result-events.js';
import { ResultToday } from '../result-today.js';
import { calculateAppDay } from '../result-app.js';
import { Location } from '../location.js';
import { EarthData } from '../earth-data.js';
import { GregorianDateTime } from '../gregorian-date-time.js';
import { CoreEventType } from '../enums.js';
import { DisplaySettings } from '../display-settings.js';

function mayapurLocation(): Location {
  return new Location('Mayapur', 23.42, 88.39, 'Asia/Calcutta');
}

function mayapurEarth(): EarthData {
  return mayapurLocation().getEarthData();
}

describe('ResultEvents', () => {
  it('calculates events for a date range', () => {
    const re = new ResultEvents();
    const loc = mayapurLocation();
    const start = GregorianDateTime.fromComponents(2024, 3, 1);
    const end = GregorianDateTime.fromComponents(2024, 3, 31);
    const settings = new DisplaySettings();
    // Enable sun events and tithi
    settings.setValue(52, 1); // COREEVENTS_SUN
    settings.setValue(53, 1); // COREEVENTS_TITHI

    re.calculateEvents(loc, start, end, settings);

    expect(re.events.length).toBeGreaterThan(50);

    // Should have sunrise events
    const sunriseEvents = re.events.filter(e => e.nType === CoreEventType.CCTYPE_S_RISE);
    expect(sunriseEvents.length).toBeGreaterThan(20); // ~30 days

    // Should have tithi events
    const tithiEvents = re.events.filter(e => e.nType === CoreEventType.CCTYPE_TITHI);
    expect(tithiEvents.length).toBeGreaterThan(20);
  });

  it('DayEvent has typeString', () => {
    const de = new DayEvent();
    de.nType = CoreEventType.CCTYPE_S_RISE;
    de.nData = 0;
    expect(de.typeString).toBe('Sunrise');
  });
});

describe('ResultToday', () => {
  it('calculates today view', () => {
    const rt = new ResultToday();
    const date = GregorianDateTime.fromComponents(2024, 3, 25);
    date.TimezoneHours = 5.5;
    rt.calculate(date, mayapurEarth());

    const day = rt.getCurrentDay();
    expect(day).not.toBeNull();
    expect(day!.astrodata.sunRise.hour).toBeGreaterThanOrEqual(4);
    expect(day!.astrodata.masa).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateAppDay', () => {
  it('returns appearance day data', () => {
    const earth = mayapurEarth();
    const eventDate = GregorianDateTime.fromComponents(2024, 3, 25);
    eventDate.shour = 0.5;
    eventDate.TimezoneHours = 5.5;

    const result = calculateAppDay(earth, eventDate, 2);

    expect(result.details.sunRise.tithi).toBeGreaterThanOrEqual(0);
    expect(result.details.sunRise.tithi).toBeLessThan(30);
    expect(result.details.masa).toBeGreaterThanOrEqual(0);
    expect(result.celebDates.length).toBe(2);
    expect(result.celebYears.length).toBe(2);
    expect(result.celebYears[0]).toBeGreaterThan(537);
  });
});
