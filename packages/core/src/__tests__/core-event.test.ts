import { describe, it, expect } from 'vitest';
import { CoreEvent } from '../core-event.js';
import { CoreEventType, DstTypeChange } from '../enums.js';

describe('CoreEvent — construction', () => {
  it('creates with default values', () => {
    const ev = new CoreEvent();
    expect(ev.nType).toBe(0);
    expect(ev.nData).toBe(0);
    expect(ev.Time).toBe(0);
    expect(ev.nDst).toBe(0);
  });

  it('copies from another CoreEvent', () => {
    const src = new CoreEvent();
    src.nType = CoreEventType.CCTYPE_S_RISE;
    src.nData = 5;
    src.Time = 12345;
    src.nDst = 1;

    const copy = new CoreEvent(src);
    expect(copy.nType).toBe(CoreEventType.CCTYPE_S_RISE);
    expect(copy.nData).toBe(5);
    expect(copy.Time).toBe(12345);
    expect(copy.nDst).toBe(1);
  });

  it('creates with withTimeType factory', () => {
    const ev = CoreEvent.withTimeType(5000, CoreEventType.CCTYPE_TITHI);
    expect(ev.Time).toBe(5000);
    expect(ev.nType).toBe(CoreEventType.CCTYPE_TITHI);
  });
});

describe('CoreEvent — daySeconds', () => {
  it('calculates day seconds from utcDayStart', () => {
    const ev = new CoreEvent();
    ev.Time = 86400 + 3600; // 1 day + 1 hour
    const ds = ev.daySeconds(86400); // start of 2nd day
    expect(ds).toBe(3600);
  });

  it('wraps negative differences into 0..86400', () => {
    const ev = new CoreEvent();
    ev.Time = 100;
    const ds = ev.daySeconds(200);
    expect(ds).toBe(86300); // (100 - 200 + 86400) % 86400
  });
});

describe('CoreEvent — getTypeString (group names)', () => {
  it('returns group name for CCTYPE_CONJ', () => {
    expect(CoreEvent.getTypeString(CoreEventType.CCTYPE_CONJ)).toBe('Conjunction');
  });

  it('returns group name for CCTYPE_TITHI', () => {
    expect(CoreEvent.getTypeString(CoreEventType.CCTYPE_TITHI)).toBe('Tithi');
  });

  it('returns Unspecified for unknown type', () => {
    expect(CoreEvent.getTypeString(9999)).toBe('Unspecified event');
  });
});

describe('CoreEvent — getTypeString (with nData)', () => {
  it('CCTYPE_S_RISE returns Sunrise', () => {
    expect(CoreEvent.getTypeString(CoreEventType.CCTYPE_S_RISE, 0)).toBe('Sunrise');
  });

  it('CCTYPE_S_SET returns Sunset', () => {
    expect(CoreEvent.getTypeString(CoreEventType.CCTYPE_S_SET, 0)).toBe('Sunset');
  });

  it('CCTYPE_TITHI returns tithi name', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_TITHI, 0);
    expect(s).toBe('Pratipat Tithi');
  });

  it('CCTYPE_NAKS returns naksatra name', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_NAKS, 0);
    expect(s).toBe('Asvini Naksatra');
  });

  it('CCTYPE_YOGA returns yoga name', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_YOGA, 0);
    expect(s).toBe('Viskumba Yoga');
  });

  it('CCTYPE_CONJ returns conjunction with rasi', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_CONJ, 0);
    expect(s).toBe('Conjunction in Mesa');
  });

  it('CCTYPE_SANK returns sankranti with rasi', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_SANK, 3);
    expect(s).toBe('Karka Sankranti');
  });

  it('CCTYPE_DAY_MUHURTA returns muhurta name', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_DAY_MUHURTA, 0);
    expect(s).toBe('Rudra Muhurta');
  });

  it('CCTYPE_DAY_OF_WEEK returns weekday name', () => {
    const s = CoreEvent.getTypeString(CoreEventType.CCTYPE_DAY_OF_WEEK, 1);
    expect(s).toBe('Monday');
  });
});

describe('CoreEvent — instance methods', () => {
  it('typeString() and groupNameString() delegate correctly', () => {
    const ev = new CoreEvent();
    ev.nType = CoreEventType.CCTYPE_S_RISE;
    ev.nData = 0;
    expect(ev.groupNameString()).toBe('Unspecified event');
    expect(ev.typeString()).toBe('Sunrise');
  });

  it('toString() includes type and time', () => {
    const ev = CoreEvent.withTimeType(42000, CoreEventType.CCTYPE_S_NOON);
    expect(ev.toString()).toBe('Noon 42000');
  });

  it('getTimeString formats time', () => {
    const ev = new CoreEvent();
    ev.Time = 21600; // 6 hours in seconds
    ev.nDst = 0;
    const s = ev.getTimeString(0);
    expect(s).toBe('06:00:00');
  });

  it('getDstTime adds bias when DST is on', () => {
    const ev = new CoreEvent();
    ev.Time = 1000;
    ev.nDst = 1;
    expect(ev.getDstTime(3600)).toBe(4600);
  });

  it('getDstTime returns Time when DST is off', () => {
    const ev = new CoreEvent();
    ev.Time = 1000;
    ev.nDst = 0;
    expect(ev.getDstTime(3600)).toBe(1000);
  });
});

describe('CoreEvent — applyDstType', () => {
  it('DstOff sets nDst=0', () => {
    const ev = new CoreEvent();
    ev.nDst = 1;
    ev.applyDstType(0, DstTypeChange.DstOff);
    expect(ev.nDst).toBe(0);
  });

  it('DstOn sets nDst=1', () => {
    const ev = new CoreEvent();
    ev.applyDstType(0, DstTypeChange.DstOn);
    expect(ev.nDst).toBe(1);
  });

  it('DstStart sets nDst=1 when time >= 2 hours', () => {
    const ev = new CoreEvent();
    ev.Time = 7200; // exactly 2 hours
    ev.applyDstType(0, DstTypeChange.DstStart);
    expect(ev.nDst).toBe(1);
  });

  it('DstStart sets nDst=0 when time < 2 hours', () => {
    const ev = new CoreEvent();
    ev.Time = 3600; // 1 hour
    ev.applyDstType(0, DstTypeChange.DstStart);
    expect(ev.nDst).toBe(0);
  });

  it('DstEnd sets nDst=1 when time <= 2 hours', () => {
    const ev = new CoreEvent();
    ev.Time = 7200;
    ev.applyDstType(0, DstTypeChange.DstEnd);
    expect(ev.nDst).toBe(1);
  });

  it('DstEnd sets nDst=0 when time > 2 hours', () => {
    const ev = new CoreEvent();
    ev.Time = 7201;
    ev.applyDstType(0, DstTypeChange.DstEnd);
    expect(ev.nDst).toBe(0);
  });
});
