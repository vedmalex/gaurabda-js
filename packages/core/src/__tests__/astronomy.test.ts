import { describe, it, expect } from 'vitest';
import { EarthData } from '../earth-data.js';
import { SunData } from '../sun.js';
import { MoonData } from '../moon.js';
import { GregorianDateTime } from '../gregorian-date-time.js';
import { getAyanamsa } from '../ayanamsha.js';
import {
  getSunLongitude, getMoonLongitude, getMoonElevation,
  calcSunrise, calcSunset,
} from '../core-astronomy.js';
import {
  isConjunction,
  getNextConjunction, getPrevConjunction,
} from '../conjunction.js';
import { getNextSankranti, getSankrantiType, setSankrantiType, getSankMethodName } from '../sankranti.js';
import { getNextNaksatra, getPrevNaksatra } from '../naksatra.js';
import { getNextYogaStart } from '../yoga.js';

// Helper: create an EarthData for Mayapur, India
function mayapurEarth(): EarthData {
  const e = new EarthData();
  e.longitudeDeg = 88.39;
  e.latitudeDeg = 23.42;
  e.offsetUtcHours = 5.5;
  return e;
}

// Helper: date for 2024-03-25
function testDate2024(): GregorianDateTime {
  return GregorianDateTime.fromComponents(2024, 3, 25);
}

describe('EarthData — nutations', () => {
  it('returns a tuple [nutationLong, obliquity]', () => {
    const jd = 2451545.0; // J2000
    const [nutLong, obliquity] = EarthData.calculateNutations(jd);
    expect(typeof nutLong).toBe('number');
    expect(typeof obliquity).toBe('number');
    // obliquity should be ~23.44° for J2000
    expect(obliquity).toBeCloseTo(23.44, 0);
  });
});

describe('EarthData — sidereal time', () => {
  it('returns value in 0..360', () => {
    const st = EarthData.siderealTimeGreenwich(2451545.0);
    expect(st).toBeGreaterThanOrEqual(0);
    expect(st).toBeLessThan(360);
  });
});

describe('EarthData — coordinate transforms', () => {
  it('eclipticalToEquatorial returns RA and declination', () => {
    const ecc = { latitude: 0, longitude: 90, distance: 1 };
    const eqc = EarthData.eclipticalToEquatorialCoords(ecc, 2451545.0);
    expect(typeof eqc.rightAscension).toBe('number');
    expect(typeof eqc.declination).toBe('number');
  });

  it('equatorialToHorizontal returns azimut and elevation', () => {
    const eqc = { rightAscension: 90, declination: 23 };
    const obs = mayapurEarth();
    const hc = EarthData.equatorialToHorizontalCoords(eqc, obs, 2451545.0);
    expect(typeof hc.azimut).toBe('number');
    expect(typeof hc.elevation).toBe('number');
  });
});

describe('EarthData — text formatters', () => {
  it('getTextLatitude formats N/S', () => {
    expect(EarthData.getTextLatitude(23.42)).toMatch(/23N/);
    expect(EarthData.getTextLatitude(-33.9)).toMatch(/33S/);
  });

  it('getTextLongitude formats E/W', () => {
    expect(EarthData.getTextLongitude(88.39)).toMatch(/88E/);
    expect(EarthData.getTextLongitude(-73.5)).toMatch(/73W/);
  });
});

describe('SunData — mean longitude', () => {
  it('returns valid longitude for 2024-03-25', () => {
    const mel = SunData.sunGetMeanLong(2024, 3, 25);
    expect(mel).toBeGreaterThan(0);
    expect(mel).toBeLessThan(360);
  });

  it('returns -1 for invalid month', () => {
    expect(SunData.sunGetMeanLong(2024, 13, 1)).toBe(-1.0);
  });
});

describe('SunData — sun longitude', () => {
  it('returns ecliptic longitude', () => {
    const d = testDate2024();
    const lon = SunData.getSunLongitude(d);
    // Late March: sun should be ~0-5° Aries
    expect(lon).toBeGreaterThan(0);
    expect(lon).toBeLessThan(20);
  });
});

describe('SunData — sunrise/sunset', () => {
  it('calculates sunrise for Mayapur on 2024-03-25', () => {
    const d = testDate2024();
    const earth = mayapurEarth();
    const rise = SunData.calcSunrise(d, earth);
    // Sunrise in Mayapur ~5:30-6:00 AM IST
    expect(rise.hour).toBeGreaterThanOrEqual(5);
    expect(rise.hour).toBeLessThanOrEqual(6);
  });

  it('calculates sunset for Mayapur on 2024-03-25', () => {
    const d = testDate2024();
    const earth = mayapurEarth();
    const sunset = SunData.calcSunset(d, earth);
    // Sunset in Mayapur ~17:30-18:30 IST
    expect(sunset.hour).toBeGreaterThanOrEqual(17);
    expect(sunset.hour).toBeLessThanOrEqual(18);
  });
});

describe('SunData — kala calculation', () => {
  it('returns [start, end] for Rahu kalam', () => {
    const [r1, r2] = SunData.calculateKala(0.25, 0.75, 0, 1);
    expect(r1).toBeGreaterThan(0);
    expect(r2).toBeGreaterThan(r1);
  });

  it('returns [-1,-1] when type is unknown', () => {
    const [r1, r2] = SunData.calculateKala(0.25, 0.75, 0, 99);
    expect(r1).toBe(-1);
    expect(r2).toBe(-1);
  });
});

describe('MoonData — ecliptical calculation', () => {
  it('returns ecliptical coords for J2000', () => {
    const coords = MoonData.calculateEcliptical(2451545.0);
    expect(typeof coords.longitude).toBe('number');
    expect(typeof coords.latitude).toBe('number');
    expect(coords.distance).toBeGreaterThan(300000);
    expect(coords.distance).toBeLessThan(420000);
  });
});

describe('MoonData — moon distance', () => {
  it('returns ~385000 km for J2000', () => {
    const dist = MoonData.moonDistance(2451545.0);
    expect(dist).toBeGreaterThan(350000);
    expect(dist).toBeLessThan(410000);
  });
});

describe('MoonData — calculate', () => {
  it('populates all fields', () => {
    const moon = MoonData.from(2451545.0);
    expect(moon.longitude_deg).not.toBe(0);
    expect(moon.rightAscension).not.toBe(0);
    expect(typeof moon.declination).toBe('number');
  });
});

describe('core-astronomy — facade', () => {
  it('getSunLongitude returns a number', () => {
    const d = testDate2024();
    const earth = mayapurEarth();
    expect(typeof getSunLongitude(d, earth)).toBe('number');
  });

  it('getMoonLongitude returns a number', () => {
    const d = testDate2024();
    const earth = mayapurEarth();
    expect(typeof getMoonLongitude(d, earth)).toBe('number');
  });

  it('getMoonElevation returns a number', () => {
    const d = testDate2024();
    d.shour = 0.5;
    const earth = mayapurEarth();
    expect(typeof getMoonElevation(earth, d)).toBe('number');
  });
});

describe('conjunction — isConjunction', () => {
  it('returns true when sun passes moon', () => {
    expect(isConjunction(10, 20, 30, 40)).toBe(true);
  });

  it('returns false when no crossing', () => {
    expect(isConjunction(20, 10, 30, 40)).toBe(false);
  });
});

describe('conjunction — getNextConjunction', () => {
  it('finds next conjunction', () => {
    const d = testDate2024();
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [sunLong, found] = getNextConjunction(d, false, earth);
    expect(typeof sunLong).toBe('number');
    expect(found).toBeInstanceOf(GregorianDateTime);
  });
});

describe('conjunction — getPrevConjunction', () => {
  it('finds previous conjunction', () => {
    const d = testDate2024();
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [sunLong, found] = getPrevConjunction(d, false, earth);
    expect(typeof sunLong).toBe('number');
    expect(found).toBeInstanceOf(GregorianDateTime);
  });
});

describe('sankranti', () => {
  it('get/set sankranti type', () => {
    const orig = getSankrantiType();
    expect(orig).toBe(2);
    const prev = setSankrantiType(1);
    expect(prev).toBe(2);
    expect(getSankrantiType()).toBe(1);
    setSankrantiType(orig);
  });

  it('getSankMethodName', () => {
    expect(getSankMethodName(0)).toBe('midnight to midnight');
    expect(getSankMethodName(2)).toBe('noon to noon');
  });

  it('finds next sankranti', () => {
    const d = testDate2024();
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [date, zodiac] = getNextSankranti(d, earth);
    expect(date).toBeInstanceOf(GregorianDateTime);
    expect(zodiac).toBeGreaterThanOrEqual(0);
    expect(zodiac).toBeLessThan(12);
  });
});

describe('naksatra — calculations', () => {
  it('finds next naksatra', () => {
    const d = testDate2024();
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [idx, date] = getNextNaksatra(earth, d);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(27);
    expect(date).toBeInstanceOf(GregorianDateTime);
  });

  it('finds prev naksatra', () => {
    const d = testDate2024();
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [idx, date] = getPrevNaksatra(earth, d);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(27);
    expect(date).toBeInstanceOf(GregorianDateTime);
  });
});

describe('yoga — calculations', () => {
  it('finds next yoga start', () => {
    const d = testDate2024();
    d.shour = 0.5;
    d.TimezoneHours = 5.5;
    const earth = mayapurEarth();
    const [idx, date] = getNextYogaStart(earth, d);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(27);
    expect(date).toBeInstanceOf(GregorianDateTime);
  });
});
