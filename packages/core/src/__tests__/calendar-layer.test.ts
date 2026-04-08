import { describe, it, expect } from 'vitest';
import {
  getMahadvadasiName, getEkadasiName, getParanaReasonText,
} from '../ekadasi.js';
import {
  getMasaGaudiyaName, getMasaVedicName, getMasaName,
  prevMasa, nextMasa, isExtraMasa, masaDist,
} from '../masa.js';
import {
  getNextTithiStart, getPrevTithiStart, getTithiTimes,
  tithiIsEkadasi, tithiIsDvadasi, tithiIsTrayodasi,
  tithiIsFullNewMoon, prevTithi, nextTithi, tithiDist,
} from '../tithi.js';
import { AstroData } from '../astro-data.js';
import { EarthData } from '../earth-data.js';
import { GregorianDateTime } from '../gregorian-date-time.js';
import { MahadvadasiType, CoreEventType } from '../enums.js';

function mayapurEarth(): EarthData {
  const e = new EarthData();
  e.longitudeDeg = 88.39;
  e.latitudeDeg = 23.42;
  e.offsetUtcHours = 5.5;
  return e;
}

// ── Ekadasi ─────────────────────────────────────────────────────────

describe('ekadasi', () => {
  it('getMahadvadasiName returns null for EV_NULL', () => {
    expect(getMahadvadasiName(MahadvadasiType.EV_NULL)).toBeNull();
  });

  it('getMahadvadasiName returns name for EV_UNMILANI', () => {
    expect(getMahadvadasiName(MahadvadasiType.EV_UNMILANI)).toBe('Unmilani Mahadvadasi');
  });

  it('getEkadasiName returns Varuthini for masa=0, paksa=0', () => {
    expect(getEkadasiName(0, 0)).toBe('Varuthini Ekadasi');
  });

  it('getEkadasiName wraps around', () => {
    expect(getEkadasiName(13, 0)).toBe('Varuthini Ekadasi');
  });

  it('getParanaReasonText returns text for known types', () => {
    expect(getParanaReasonText(CoreEventType.CCTYPE_THIRD_OF_DAY)).toBe('1/3 of daylight');
    expect(getParanaReasonText(CoreEventType.CCTYPE_S_RISE)).toBe('sunrise');
    expect(getParanaReasonText(999)).toBe('');
  });
});

// ── Masa ────────────────────────────────────────────────────────────

describe('masa', () => {
  it('getMasaGaudiyaName returns Madhusudana for 0', () => {
    expect(getMasaGaudiyaName(0)).toBe('Madhusudana');
  });

  it('getMasaVedicName returns Vaisakha for 0', () => {
    expect(getMasaVedicName(0)).toBe('Vaisakha');
  });

  it('getMasaName format 0 = Gaudiya', () => {
    expect(getMasaName(0, 0)).toBe('Madhusudana');
  });

  it('getMasaName format 1 = Gaudiya (Vedic)', () => {
    expect(getMasaName(0, 1)).toBe('Madhusudana (Vaisakha)');
  });

  it('getMasaName format 2 = Vedic', () => {
    expect(getMasaName(0, 2)).toBe('Vaisakha');
  });

  it('prevMasa/nextMasa', () => {
    expect(prevMasa(0)).toBe(11);
    expect(nextMasa(11)).toBe(0);
  });

  it('isExtraMasa', () => {
    expect(isExtraMasa(12)).toBe(true);
    expect(isExtraMasa(5)).toBe(false);
  });

  it('masaDist', () => {
    expect(masaDist(5, 3)).toBe(2);
    expect(masaDist(1, 10)).toBe(3); // 1-10 = -9, +12 = 3
  });
});

// ── Tithi helpers ───────────────────────────────────────────────────

describe('tithi helpers', () => {
  it('tithiIsEkadasi', () => {
    expect(tithiIsEkadasi(10)).toBe(true);
    expect(tithiIsEkadasi(25)).toBe(true);
    expect(tithiIsEkadasi(11)).toBe(false);
  });

  it('tithiIsDvadasi', () => {
    expect(tithiIsDvadasi(11)).toBe(true);
    expect(tithiIsDvadasi(26)).toBe(true);
  });

  it('tithiIsTrayodasi', () => {
    expect(tithiIsTrayodasi(12)).toBe(true);
    expect(tithiIsTrayodasi(27)).toBe(true);
  });

  it('tithiIsFullNewMoon', () => {
    expect(tithiIsFullNewMoon(14)).toBe(true);
    expect(tithiIsFullNewMoon(29)).toBe(true);
    expect(tithiIsFullNewMoon(0)).toBe(false);
  });

  it('prevTithi/nextTithi', () => {
    expect(prevTithi(0)).toBe(29);
    expect(nextTithi(29)).toBe(0);
  });

  it('tithiDist', () => {
    expect(tithiDist(5, 3)).toBe(2);
    expect(tithiDist(1, 28)).toBe(3); // 1-28=-27, +30=3
  });
});

// ── Tithi calculations ──────────────────────────────────────────────

describe('tithi calculations', () => {
  it('getNextTithiStart returns valid tithi', () => {
    const d = GregorianDateTime.fromComponents(2024, 3, 25);
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [idx, date] = getNextTithiStart(earth, d);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(30);
    expect(date).toBeInstanceOf(GregorianDateTime);
  });

  it('getPrevTithiStart returns valid tithi', () => {
    const d = GregorianDateTime.fromComponents(2024, 3, 25);
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [idx, date] = getPrevTithiStart(earth, d);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(30);
    expect(date).toBeInstanceOf(GregorianDateTime);
  });
});

// ── AstroData ───────────────────────────────────────────────────────

describe('AstroData', () => {
  it('dayCalc populates sunrise/sunset', () => {
    const d = GregorianDateTime.fromComponents(2024, 3, 25);
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const day = new AstroData();
    day.dayCalc(d, earth);

    expect(day.sunRise.hour).toBeGreaterThanOrEqual(5);
    expect(day.sunRise.hour).toBeLessThanOrEqual(6);
    expect(day.sunSet.hour).toBeGreaterThanOrEqual(17);
    expect(day.sunSet.hour).toBeLessThanOrEqual(18);
    expect(day.ayanamsa).toBeGreaterThan(20);
    expect(day.tithi).toBeGreaterThanOrEqual(0);
    expect(day.tithi).toBeLessThan(30);
  });

  it('masaCalc returns valid masa', () => {
    const d = GregorianDateTime.fromComponents(2024, 3, 25);
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const day = new AstroData();
    day.dayCalc(d, earth);
    const masa = day.masaCalc(d, earth);

    expect(masa).toBeGreaterThanOrEqual(0);
    expect(masa).toBeLessThanOrEqual(12);
    expect(day.gaurabdaYear).toBeGreaterThan(500);
  });

  it('getFirstDayOfYear returns valid date for 2024', () => {
    const earth = mayapurEarth();
    const d = AstroData.getFirstDayOfYear(earth, 2024);
    expect(d.year).toBe(2024);
    // First day of Gaurabda year is around March-April
    expect(d.month).toBeGreaterThanOrEqual(2);
    expect(d.month).toBeLessThanOrEqual(4);
  });
});
