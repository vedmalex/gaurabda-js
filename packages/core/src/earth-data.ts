// Converted from js/GCEarthData.js (457 lines)
// FIX B3: construct() → constructor() (lines 3, 10, 18, 130)
// FIX B6: new(Class) → new Class() (lines 252, 274)
// FIX: Math.Atan2 → Math.atan2, Math.Asin → Math.asin
// FIX: Convert.ToInt32 → toInt32, GCMath.IntFloor → intFloor
// FIX: Convert.FormatD2 → formatD2
// Removed TTimeZone dependency (timezone handling deferred to location module)

import {
  putIn360, sinDeg, cosDeg, tanDeg, arcSinDeg,
  arcTan2Deg, rad2deg, intFloor, formatD2,
} from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import type { GregorianDateTime } from './gregorian-date-time.js';

// ── Coordinate types ────────────────────────────────────────────────

export interface HorizontalCoords {
  azimut: number;
  elevation: number;
}

export interface EquatorialCoords {
  rightAscension: number;
  declination: number;
}

export interface EclipticalCoords {
  latitude: number;
  longitude: number;
  distance: number;
}

// ── Nutation coefficient tables (Meeus Ch.21) ───────────────────────

const ARG_MUL: readonly (readonly number[])[] = [
  [ 0, 0, 0, 0, 1], [-2, 0, 0, 2, 2], [ 0, 0, 0, 2, 2], [ 0, 0, 0, 0, 2],
  [ 0, 1, 0, 0, 0], [ 0, 0, 1, 0, 0], [-2, 1, 0, 2, 2], [ 0, 0, 0, 2, 1],
  [ 0, 0, 1, 2, 2], [-2,-1, 0, 2, 2], [-2, 0, 1, 0, 0], [-2, 0, 0, 2, 1],
  [ 0, 0,-1, 2, 2], [ 2, 0, 0, 0, 0], [ 0, 0, 1, 0, 1], [ 2, 0,-1, 2, 2],
  [ 0, 0,-1, 0, 1], [ 0, 0, 1, 2, 1], [-2, 0, 2, 0, 0], [ 0, 0,-2, 2, 1],
  [ 2, 0, 0, 2, 2], [ 0, 0, 2, 2, 2], [ 0, 0, 2, 0, 0], [-2, 0, 1, 2, 2],
  [ 0, 0, 0, 2, 0], [-2, 0, 0, 2, 0], [ 0, 0,-1, 2, 1], [ 0, 2, 0, 0, 0],
  [ 2, 0,-1, 0, 1], [-2, 2, 0, 2, 2], [ 0, 1, 0, 0, 1],
];

const ARG_PHI: readonly (readonly number[])[] = [
  [-171996,-1742], [-13187,  -16], [ -2274,   -2], [  2062,    2],
  [  1426,  -34], [   712,    1], [  -517,   12], [  -386,   -4],
  [  -301,    0], [   217,   -5], [  -158,    0], [   129,    1],
  [   123,    0], [    63,    0], [    63,    1], [   -59,    0],
  [   -58,   -1], [   -51,    0], [    48,    0], [    46,    0],
  [   -38,    0], [   -31,    0], [    29,    0], [    29,    0],
  [    26,    0], [   -22,    0], [    21,    0], [    17,   -1],
  [    16,    0], [   -16,    1], [   -15,    0],
];

const ARG_EPS: readonly (readonly number[])[] = [
  [ 92025,   89], [  5736,  -31], [   977,   -5], [  -895,    5],
  [    54,   -1], [    -7,    0], [   224,   -6], [   200,    0],
  [   129,   -1], [   -95,    3], [     0,    0], [   -70,    0],
  [   -53,    0], [     0,    0], [   -33,    0], [    26,    0],
  [    32,    0], [    27,    0], [     0,    0], [   -24,    0],
  [    16,    0], [    13,    0], [     0,    0], [   -12,    0],
  [     0,    0], [     0,    0], [   -10,    0], [     0,    0],
  [    -8,    0], [     7,    0], [     9,    0],
];

let lowPrecisionNutations = true;

// ── EarthData class (observer on earth) ─────────────────────────────

export class EarthData {
  longitudeDeg: number = 0.0;
  latitudeDeg: number = 0.0;
  /** 0=center of sun, 1=civil, 2=nautical, 3=astronomical twilight */
  obs: number = 0;
  offsetUtcHours: number = 0.0;

  /** Nutation of longitude and obliquity (Meeus Ch.21) */
  static calculateNutations(julianDateUTC: number): [nutationLongitude: number, obliquity: number] {
    const t = (julianDateUTC - 2451545.0) / 36525;
    const omega = putIn360(125.04452 + (-1934.136261 + (0.0020708 + 1.0 / 450000 * t) * t) * t);

    let nutationLongitude: number;
    let nutationObliquity: number;

    if (lowPrecisionNutations) {
      const l = 280.4665 + 36000.7698 * t;
      const ls = 218.3165 + 481267.8813 * t;
      nutationObliquity = 9.20 * cosDeg(omega) + 0.57 * cosDeg(2 * l) + 0.10 * cosDeg(2 * ls) - 0.09 * cosDeg(2 * omega);
      nutationLongitude = (-17.20 * sinDeg(omega) - 1.32 * sinDeg(2 * l) - 0.23 * sinDeg(2 * ls) + 0.21 * sinDeg(2 * omega)) / 3600;
    } else {
      const d = putIn360(297.85036 + (445267.111480 + (-0.0019142 + t / 189474) * t) * t);
      const m = putIn360(357.52772 + (35999.050340 + (-0.0001603 - t / 300000) * t) * t);
      const ms = putIn360(134.96298 + (477198.867398 + (0.0086972 + t / 56250) * t) * t);
      const f = putIn360(93.27191 + (483202.017538 + (-0.0036825 + t / 327270) * t) * t);

      nutationLongitude = 0;
      nutationObliquity = 0;

      for (let i = 0; i < 31; i++) {
        const s = ARG_MUL[i][0] * d + ARG_MUL[i][1] * m + ARG_MUL[i][2] * ms + ARG_MUL[i][3] * f + ARG_MUL[i][4] * omega;
        nutationLongitude += (ARG_PHI[i][0] + ARG_PHI[i][1] * t * 0.1) * sinDeg(s);
        nutationObliquity += (ARG_EPS[i][0] + ARG_EPS[i][1] * t * 0.1) * cosDeg(s);
      }

      nutationLongitude = nutationLongitude * 0.0001 / 3600;
      nutationObliquity = nutationObliquity * 0.0001;
    }

    const meanObliquity = 84381.448 + (-46.8150 + (-0.00059 + 0.001813 * t) * t) * t;
    const obliquity = (meanObliquity + nutationObliquity) / 3600;

    return [nutationLongitude, obliquity];
  }

  /** Ecliptical → equatorial coordinate transformation (Meeus Ch.12) */
  static eclipticalToEquatorialCoords(ecc: EclipticalCoords, date: number): EquatorialCoords {
    const [nutationLongitude, epsilon] = EarthData.calculateNutations(date);
    ecc.longitude = putIn360(ecc.longitude + nutationLongitude);

    return {
      rightAscension: arcTan2Deg(
        sinDeg(ecc.longitude) * cosDeg(epsilon) - tanDeg(ecc.latitude) * sinDeg(epsilon),
        cosDeg(ecc.longitude),
      ),
      declination: arcSinDeg(
        sinDeg(ecc.latitude) * cosDeg(epsilon) +
        cosDeg(ecc.latitude) * sinDeg(epsilon) * sinDeg(ecc.longitude),
      ),
    };
  }

  /** Equatorial → horizontal coordinate transformation */
  static equatorialToHorizontalCoords(eqc: EquatorialCoords, obs: EarthData, date: number): HorizontalCoords {
    const localHourAngle = putIn360(
      EarthData.siderealTimeGreenwich(date) - eqc.rightAscension + obs.longitudeDeg,
    );

    // FIX: Math.Atan2 → Math.atan2, Math.Asin → Math.asin
    return {
      azimut: rad2deg(Math.atan2(
        sinDeg(localHourAngle),
        cosDeg(localHourAngle) * sinDeg(obs.latitudeDeg) - tanDeg(eqc.declination) * cosDeg(obs.latitudeDeg),
      )),
      elevation: rad2deg(Math.asin(
        sinDeg(obs.latitudeDeg) * sinDeg(eqc.declination) +
        cosDeg(obs.latitudeDeg) * cosDeg(eqc.declination) * cosDeg(localHourAngle),
      )),
    };
  }

  /** Greenwich Mean Sidereal Time in degrees */
  static siderealTimeGreenwich(date: number): number {
    const t = (date - 2451545.0) / 36525.0;
    const [deltaPhi, epsilon] = EarthData.calculateNutations(date);
    return putIn360(
      280.46061837 + 360.98564736629 * (date - 2451545.0) +
      t * t * (0.000387933 - t / 38710000) +
      deltaPhi * cosDeg(epsilon),
    );
  }

  /** Local Sidereal Time in degrees */
  static siderealTimeLocal(julianDateUTC: number, longitudeDegrees: number, timezoneDegrees: number): number {
    const julianDate2000 = julianDateUTC - 2451545.0;
    const julianMillenium = julianDate2000 / 36525.0;
    const [deltaPhi, epsilon] = EarthData.calculateNutations(julianDateUTC);
    return putIn360(
      280.46061837 + 360.98564736629 * julianDate2000 +
      julianMillenium * julianMillenium * (0.000387933 - julianMillenium / 38710000) +
      deltaPhi * cosDeg(epsilon) + longitudeDegrees - timezoneDegrees,
    );
  }

  /** Format latitude as "DDN/SMM" */
  static getTextLatitude(d: number): string {
    const c0 = d < 0.0 ? 'S' : 'N';
    d = Math.abs(d);
    const a0 = intFloor(d);
    const a1 = intFloor((d - a0) * 60 + 0.5);
    return a0.toString() + c0 + formatD2(a1);
  }

  /** Format longitude as "DDW/EMM" */
  static getTextLongitude(d: number): string {
    const c0 = d < 0.0 ? 'W' : 'E';
    d = Math.abs(d);
    const a0 = intFloor(d);
    const a1 = intFloor((d - a0) * 60 + 0.5);
    return a0.toString() + c0 + formatD2(a1);
  }

  /** Ascendant degree for this observer */
  getAscendantDegrees(julianDateUTC: number): number {
    const A = EarthData.siderealTimeLocal(julianDateUTC, this.longitudeDeg, this.offsetUtcHours * 15.0);
    const E = 23.4392911;
    let ascendant = arcTan2Deg(
      -cosDeg(A),
      sinDeg(A) * cosDeg(E) + tanDeg(this.latitudeDeg) * sinDeg(E),
    );
    ascendant = ascendant < 180 ? ascendant + 180 : ascendant - 180;
    return putIn360(ascendant - getAyanamsa(julianDateUTC));
  }

  /** Find next ascendant sign change (binary search, 20 iterations) */
  getNextAscendentStart(startDate: GregorianDateTime): [zodiacIndex: number, nextDate: GregorianDateTime] {
    const phi = 360.0 / 12;
    let jday = startDate.getJulianDetailed();
    const d = startDate.clone();
    d.shour -= startDate.TimezoneHours / 24.0;
    d.TimezoneHours = 0.0;
    const xd = startDate.clone();
    let scanStep = 1.0 / 48.0;

    const l1 = this.getAscendantDegrees(jday);
    let prevTit = intFloor(l1 / phi);
    let newTit = -1;

    let counter = 0;
    while (counter < 20) {
      xd.set(d);
      const xj = jday;

      jday += scanStep;
      d.shour += scanStep;
      if (d.shour > 1.0) {
        d.shour -= 1.0;
        d.nextDay();
      }

      const l2 = this.getAscendantDegrees(jday);
      newTit = intFloor(l2 / phi);

      if (prevTit !== newTit) {
        jday = xj;
        d.set(xd);
        scanStep *= 0.5;
        counter++;
      }
    }

    const nextDate = d.clone();
    nextDate.shour += startDate.TimezoneHours / 24.0;
    nextDate.TimezoneHours = startDate.TimezoneHours;
    nextDate.normalizeValues();

    return [newTit, nextDate];
  }

  toString(): string {
    return `Latitude: ${EarthData.getTextLatitude(this.latitudeDeg)}, Longitude: ${EarthData.getTextLongitude(this.longitudeDeg)}`;
  }
}
