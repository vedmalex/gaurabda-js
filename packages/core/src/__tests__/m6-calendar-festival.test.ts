import { describe, it, expect } from 'vitest';
import { GCDS, DisplaySettings, DisplayPriorities } from '../display-settings.js';
import {
  PeriodUnit, getWeekdayAbbr, getCalWeekdayName,
  getGaurabdaYear, gregorianToVaisnava, vaisnavaToGregorian,
  comboMasaToMasa, masaToComboMasa,
} from '../calendar.js';
import {
  testFestivalTithiMasa, isFestivalEkadasi, isFestivalSankranti,
} from '../festival.js';
import { VaisnavaDay, VaisnavEvent, insertByTime } from '../vaisnava-day.js';
import { CoreEvent } from '../core-event.js';
import { CoreEventType } from '../enums.js';
import { EarthData } from '../earth-data.js';
import { GregorianDateTime } from '../gregorian-date-time.js';

function mayapurEarth(): EarthData {
  const e = new EarthData();
  e.longitudeDeg = 88.39;
  e.latitudeDeg = 23.42;
  e.offsetUtcHours = 5.5;
  return e;
}

// ── Display Settings ────────────────────────────────────────────────

describe('DisplaySettings', () => {
  it('GCDS constants are defined', () => {
    expect(GCDS.CAL_SUN_RISE).toBe(2);
    expect(GCDS.DISP_ALWAYS).toBe(-1);
    expect(GCDS.CAL_ECLIPSE).toBe(71);
  });

  it('DisplayPriorities are defined', () => {
    expect(DisplayPriorities.PRIO_EKADASI).toBe(20);
    expect(DisplayPriorities.PRIO_ASTRO).toBe(1000);
  });

  it('getValue returns default values', () => {
    const ds = new DisplaySettings();
    expect(ds.getValue(0)).toBe(0); // arun tithi off by default
    expect(ds.getValue(6)).toBe(1); // festivals on by default
  });

  it('setValue changes value', () => {
    const ds = new DisplaySettings();
    ds.setValue(0, 1);
    expect(ds.getValue(0)).toBe(1);
  });

  it('getBoolValue returns boolean', () => {
    const ds = new DisplaySettings();
    expect(ds.getBoolValue(6)).toBe(true);
    expect(ds.getBoolValue(0)).toBe(false);
  });

  it('getText returns description', () => {
    const ds = new DisplaySettings();
    expect(ds.getText(0)).toBe('Tithi at arunodaya');
  });
});

// ── Calendar utilities ──────────────────────────────────────────────

describe('calendar utilities', () => {
  it('getWeekdayAbbr', () => {
    expect(getWeekdayAbbr(0)).toBe('Su');
    expect(getWeekdayAbbr(6)).toBe('Sa');
    expect(getWeekdayAbbr(-1)).toBe('');
  });

  it('getCalWeekdayName', () => {
    expect(getCalWeekdayName(0)).toBe('Sunday');
    expect(getCalWeekdayName(6)).toBe('Saturday');
  });

  it('PeriodUnit constants', () => {
    expect(PeriodUnit.Days).toBe(1);
    expect(PeriodUnit.Gaurabda).toBe(7);
  });

  it('comboMasaToMasa / masaToComboMasa roundtrip', () => {
    for (let m = 0; m < 12; m++) {
      expect(comboMasaToMasa(masaToComboMasa(m))).toBe(m);
    }
    expect(comboMasaToMasa(12)).toBe(12);
    expect(masaToComboMasa(12)).toBe(12);
  });

  it('getGaurabdaYear returns valid year', () => {
    const d = GregorianDateTime.fromComponents(2024, 6, 15);
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const gy = getGaurabdaYear(d, earth);
    expect(gy).toBeGreaterThan(530);
    expect(gy).toBeLessThan(540);
  });

  it('gregorianToVaisnava returns valid GaurabdaDate', () => {
    const d = GregorianDateTime.fromComponents(2024, 6, 15);
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const va = gregorianToVaisnava(d, earth);
    expect(va.gyear).toBeGreaterThan(530);
    expect(va.masa).toBeGreaterThanOrEqual(0);
    expect(va.masa).toBeLessThanOrEqual(12);
    expect(va.tithi).toBeGreaterThanOrEqual(0);
    expect(va.tithi).toBeLessThan(30);
  });
});

// ── VaisnavaDay ─────────────────────────────────────────────────────

describe('VaisnavaDay', () => {
  it('creates with default values', () => {
    const day = new VaisnavaDay();
    expect(day.nFastID).toBe(0);
    expect(day.nMahadvadasiID).toBe(0x100);
    expect(day.coreEvents).toEqual([]);
    expect(day.dayEvents).toEqual([]);
  });

  it('addEvent adds to dayEvents', () => {
    const day = new VaisnavaDay();
    const ev = day.addEvent(100, 2, 'Test event');
    expect(day.dayEvents).toHaveLength(1);
    expect(ev.prio).toBe(100);
    expect(ev.text).toBe('Test event');
  });

  it('sortDayEvents sorts by priority', () => {
    const day = new VaisnavaDay();
    day.addEvent(300, 1, 'Third');
    day.addEvent(100, 1, 'First');
    day.addEvent(200, 1, 'Second');
    day.sortDayEvents();
    expect(day.dayEvents[0].text).toBe('First');
    expect(day.dayEvents[1].text).toBe('Second');
    expect(day.dayEvents[2].text).toBe('Third');
  });

  it('findCoreEvent finds by type', () => {
    const day = new VaisnavaDay();
    const ce = CoreEvent.withTimeType(1000, CoreEventType.CCTYPE_S_RISE);
    day.coreEvents.push(ce);
    expect(day.findCoreEvent(CoreEventType.CCTYPE_S_RISE)).toBe(ce);
    expect(day.findCoreEvent(CoreEventType.CCTYPE_S_SET)).toBeNull();
  });

  it('hasEventsOfDisplayIndex checks display index', () => {
    const day = new VaisnavaDay();
    day.addEvent(100, 5, 'Test');
    expect(day.hasEventsOfDisplayIndex(5)).toBe(true);
    expect(day.hasEventsOfDisplayIndex(6)).toBe(false);
  });

  it('findEventsText searches case-insensitively', () => {
    const day = new VaisnavaDay();
    day.addEvent(100, 1, 'Appearance of Lord Krsna');
    expect(day.findEventsText('krsna')).not.toBeNull();
    expect(day.findEventsText('shiva')).toBeNull();
  });
});

describe('insertByTime', () => {
  it('inserts in sorted order', () => {
    const list: CoreEvent[] = [];
    insertByTime(list, CoreEvent.withTimeType(300, 1));
    insertByTime(list, CoreEvent.withTimeType(100, 1));
    insertByTime(list, CoreEvent.withTimeType(200, 1));
    expect(list[0].Time).toBe(100);
    expect(list[1].Time).toBe(200);
    expect(list[2].Time).toBe(300);
  });
});
