import { describe, it, expect } from 'vitest';
import { GregorianDateTime } from '../gregorian-date-time.js';

describe('GregorianDateTime', () => {
  describe('isLeapYear', () => {
    it('2000 is leap', () => expect(GregorianDateTime.isLeapYear(2000)).toBe(true));
    it('1900 is not leap', () => expect(GregorianDateTime.isLeapYear(1900)).toBe(false));
    it('2024 is leap', () => expect(GregorianDateTime.isLeapYear(2024)).toBe(true));
    it('2023 is not leap', () => expect(GregorianDateTime.isLeapYear(2023)).toBe(false));
  });

  describe('Julian day calculation (Meeus tests)', () => {
    it('J2000 epoch: 2000-Jan-1.5 = JD 2451545.0', () => {
      const jd = GregorianDateTime.calculateJulianDay(2000, 1, 1);
      // calculateJulianDay returns integer JD for noon
      expect(jd).toBeCloseTo(2451545, 0);
    });

    it('1957 Oct 4 = JD 2436116', () => {
      const jd = GregorianDateTime.calculateJulianDay(1957, 10, 4);
      expect(jd).toBeCloseTo(2436116, 0);
    });
  });

  describe('fromComponents', () => {
    it('creates correct date', () => {
      const d = GregorianDateTime.fromComponents(2024, 3, 25);
      expect(d.year).toBe(2024);
      expect(d.month).toBe(3);
      expect(d.day).toBe(25);
      expect(d.shour).toBe(0.5);
    });
  });

  describe('triplet', () => {
    it('formats as YYYY-MM-DD', () => {
      const d = GregorianDateTime.fromComponents(2024, 3, 5);
      expect(d.triplet).toBe('2024-03-05');
    });
  });

  describe('fromTriplet', () => {
    it('parses YYYY-MM-DD', () => {
      const d = GregorianDateTime.fromTriplet('2024-03-25');
      expect(d.year).toBe(2024);
      expect(d.month).toBe(3);
      expect(d.day).toBe(25);
    });
  });

  describe('nextDay / previousDay', () => {
    it('advances across month boundary', () => {
      const d = GregorianDateTime.fromComponents(2024, 1, 31);
      d.nextDay();
      expect(d.month).toBe(2);
      expect(d.day).toBe(1);
    });

    it('goes back across month boundary', () => {
      const d = GregorianDateTime.fromComponents(2024, 2, 1);
      d.previousDay();
      expect(d.month).toBe(1);
      expect(d.day).toBe(31);
    });

    it('handles leap year Feb', () => {
      const d = GregorianDateTime.fromComponents(2024, 2, 29);
      d.nextDay();
      expect(d.month).toBe(3);
      expect(d.day).toBe(1);
    });
  });

  describe('setFromJulian', () => {
    it('converts JD 2451545.0 back to 2000-01-01', () => {
      const d = new GregorianDateTime();
      d.setFromJulian(2451545.0);
      expect(d.year).toBe(2000);
      expect(d.month).toBe(1);
      expect(d.day).toBe(1);
    });
  });

  describe('clone', () => {
    it('creates independent copy', () => {
      const d = GregorianDateTime.fromComponents(2024, 6, 15);
      const c = d.clone();
      c.nextDay();
      expect(d.day).toBe(15);
      expect(c.day).toBe(16);
    });
  });

  describe('compare', () => {
    it('earlier < later', () => {
      const a = GregorianDateTime.fromComponents(2024, 1, 1);
      const b = GregorianDateTime.fromComponents(2024, 1, 2);
      expect(GregorianDateTime.compare(a, b)).toBe(-1);
    });
    it('same = 0', () => {
      const a = GregorianDateTime.fromComponents(2024, 1, 1);
      const b = GregorianDateTime.fromComponents(2024, 1, 1);
      expect(GregorianDateTime.compare(a, b)).toBe(0);
    });
  });

  describe('timeSpanToLongString (FIX B10)', () => {
    it('formats seconds correctly', () => {
      expect(GregorianDateTime.timeSpanToLongString(3661)).toBe('01:01:01');
    });
  });

  describe('getHour/getMinute', () => {
    it('0.5 shour = 12:00', () => {
      const d = GregorianDateTime.fromComponents(2024, 1, 1);
      d.shour = 0.5;
      expect(d.getHour()).toBe(12);
      expect(d.getMinute()).toBe(0);
    });
    it('0.25 shour = 06:00', () => {
      const d = GregorianDateTime.fromComponents(2024, 1, 1);
      d.shour = 0.25;
      expect(d.getHour()).toBe(6);
      expect(d.getMinute()).toBe(0);
    });
  });
});
