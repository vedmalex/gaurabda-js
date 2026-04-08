// Converted from js/GCMoonData.js (516 lines)
// FIX B4/B5: Math.Atan2 → Math.atan2, Math.Asin → Math.asin
// FIX: bare radius/rightAscension/declination → this.radius etc.
// FIX: MoonDistance() bare call → MoonData.moonDistance()

import {
  putIn360, sinDeg, cosDeg, tanDeg,
  arcSinDeg, arcTanDeg, arcTan2Deg,
  rad2deg, GC_AU,
} from './math.js';
import { EarthData } from './earth-data.js';
import type { EclipticalCoords } from './earth-data.js';

// ── Coefficient tables (Meeus) ──────────────────────────────────────

const ARG_LR: readonly (readonly number[])[] = [
  [ 0, 0, 1, 0], [ 2, 0,-1, 0], [ 2, 0, 0, 0], [ 0, 0, 2, 0], [ 0, 1, 0, 0],
  [ 0, 0, 0, 2], [ 2, 0,-2, 0], [ 2,-1,-1, 0], [ 2, 0, 1, 0], [ 2,-1, 0, 0],
  [ 0, 1,-1, 0], [ 1, 0, 0, 0], [ 0, 1, 1, 0], [ 2, 0, 0,-2], [ 0, 0, 1, 2],
  [ 0, 0, 1,-2], [ 4, 0,-1, 0], [ 0, 0, 3, 0], [ 4, 0,-2, 0], [ 2, 1,-1, 0],
  [ 2, 1, 0, 0], [ 1, 0,-1, 0], [ 1, 1, 0, 0], [ 2,-1, 1, 0], [ 2, 0, 2, 0],
  [ 4, 0, 0, 0], [ 2, 0,-3, 0], [ 0, 1,-2, 0], [ 2, 0,-1, 2], [ 2,-1,-2, 0],
  [ 1, 0, 1, 0], [ 2,-2, 0, 0], [ 0, 1, 2, 0], [ 0, 2, 0, 0], [ 2,-2,-1, 0],
  [ 2, 0, 1,-2], [ 2, 0, 0, 2], [ 4,-1,-1, 0], [ 0, 0, 2, 2], [ 3, 0,-1, 0],
  [ 2, 1, 1, 0], [ 4,-1,-2, 0], [ 0, 2,-1, 0], [ 2, 2,-1, 0], [ 2, 1,-2, 0],
  [ 2,-1, 0,-2], [ 4, 0, 1, 0], [ 0, 0, 4, 0], [ 4,-1, 0, 0], [ 1, 0,-2, 0],
  [ 2, 1, 0,-2], [ 0, 0, 2,-2], [ 1, 1, 1, 0], [ 3, 0,-2, 0], [ 4, 0,-3, 0],
  [ 2,-1, 2, 0], [ 0, 2, 1, 0], [ 1, 1,-1, 0], [ 2, 0, 3, 0], [ 2, 0,-1,-2],
];

const ARG_B: readonly (readonly number[])[] = [
  [ 0, 0, 0, 1], [ 0, 0, 1, 1], [ 0, 0, 1,-1], [ 2, 0, 0,-1],
  [ 2, 0,-1, 1], [ 2, 0,-1,-1], [ 2, 0, 0, 1], [ 0, 0, 2, 1],
  [ 2, 0, 1,-1], [ 0, 0, 2,-1], [ 2,-1, 0,-1], [ 2, 0,-2,-1],
  [ 2, 0, 1, 1], [ 2, 1, 0,-1], [ 2,-1,-1, 1], [ 2,-1, 0, 1],
  [ 2,-1,-1,-1], [ 0, 1,-1,-1], [ 4, 0,-1,-1], [ 0, 1, 0, 1],
  [ 0, 0, 0, 3], [ 0, 1,-1, 1], [ 1, 0, 0, 1], [ 0, 1, 1, 1],
  [ 0, 1, 1,-1], [ 0, 1, 0,-1], [ 1, 0, 0,-1], [ 0, 0, 3, 1],
  [ 4, 0, 0,-1], [ 4, 0,-1, 1], [ 0, 0, 1,-3], [ 4, 0,-2, 1],
  [ 2, 0, 0,-3], [ 2, 0, 2,-1], [ 2,-1, 1,-1], [ 2, 0,-2, 1],
  [ 0, 0, 3,-1], [ 2, 0, 2, 1], [ 2, 0,-3,-1], [ 2, 1,-1, 1],
  [ 2, 1, 0, 1], [ 4, 0, 0, 1], [ 2,-1, 1, 1], [ 2,-2, 0,-1],
  [ 0, 0, 1, 3], [ 2, 1, 1,-1], [ 1, 1, 0,-1], [ 1, 1, 0, 1],
  [ 0, 1,-2,-1], [ 2, 1,-1,-1], [ 1, 0, 1, 1], [ 2,-1,-2,-1],
  [ 0, 1, 2, 1], [ 4, 0,-2,-1], [ 4,-1,-1,-1], [ 1, 0, 1,-1],
  [ 4, 0, 1,-1], [ 1, 0,-1,-1], [ 4,-1, 0,-1], [ 2,-2, 0, 1],
];

const SIGMA_R: readonly number[] = [
  -20905355, -3699111, -2955968, -569925, 48888, -3149, 246158,
  -152138, -170733, -204586, -129620, 108743, 104755, 10321,
  0, 79661, -34782, -23210, -21636, 24208, 30824,
  -8379, -16675, -12831, -10445, -11650, 14403, -7003,
  0, 10056, 6322, -9884, 5751, 0, -4950,
  4130, 0, -3958, 0, 3258, 2616, -1897,
  -2117, 2354, 0, 0, -1423, -1117, -1571,
  -1739, 0, -4421, 0, 0, 0, 0,
  1165, 0, 0, 8752,
];

const SIGMA_L: readonly number[] = [
  6288774, 1274027, 658314, 213618,
  -185116, -114332, 58793, 57066,
  53322, 45758, -40923, -34720,
  -30383, 15327, -12528, 10980,
  10675, 10034, 8548, -7888,
  -6766, -5163, 4987, 4036,
  3994, 3861, 3665, -2689,
  -2602, 2390, -2348, 2236,
  -2120, -2069, 2048, -1773,
  -1595, 1215, -1110, -892,
  -810, 759, -713, -700,
  691, 596, 549, 537,
  520, -487, -399, -381,
  351, -340, 330, 327,
  -323, 299, 294, 0,
];

const SIGMA_B: readonly number[] = [
  5128122, 280602, 277693, 173237,
  55413, 46271, 32573, 17198,
  9266, 8822, 8216, 4324,
  4200, -3359, 2463, 2211,
  2065, -1870, 1828, -1794,
  -1749, -1565, -1491, -1475,
  -1410, -1344, -1335, 1107,
  1021, 833, 777, 671,
  607, 596, 491, -451,
  439, 422, 421, -366,
  -351, 331, 315, 302,
  -283, -229, 223, 223,
  -220, -220, -185, 181,
  -177, 176, 166, -164,
  132, -119, 115, 107,
];

// ── MoonData class ──────────────────────────────────────────────────

export class MoonData {
  latitude_deg: number = 0.0;
  longitude_deg: number = 0.0;
  radius: number = 0.0;
  rightAscension: number = 0.0;
  declination: number = 0.0;
  parallax: number = 0.0;
  elevation: number = 0.0;
  azimuth: number = 0.0;

  /** Calculate moon position from Julian date */
  calculate(jdate: number): void {
    const crd = MoonData.calculateEcliptical(jdate);
    const eqc = EarthData.eclipticalToEquatorialCoords(crd, jdate);

    this.radius = crd.distance;
    this.longitude_deg = crd.longitude;
    this.latitude_deg = crd.latitude;
    this.rightAscension = eqc.rightAscension;
    this.declination = eqc.declination;
  }

  /** Factory: create and calculate */
  static from(jd: number): MoonData {
    const md = new MoonData();
    md.calculate(jd);
    return md;
  }

  /** Calculate horizontal coords (azimuth, elevation) */
  calcHorizontal(date: number, longitude: number, latitude: number): void {
    const h = putIn360(EarthData.siderealTimeGreenwich(date) - this.rightAscension + longitude);

    // FIX B4/B5: Math.Atan2 → Math.atan2, Math.Asin → Math.asin
    this.azimuth = rad2deg(Math.atan2(
      sinDeg(h),
      cosDeg(h) * sinDeg(latitude) - tanDeg(this.declination) * cosDeg(latitude),
    ));

    this.elevation = rad2deg(Math.asin(
      sinDeg(latitude) * sinDeg(this.declination) +
      cosDeg(latitude) * cosDeg(this.declination) * cosDeg(h),
    ));
  }

  /** Correct equatorial coordinates with parallax */
  correctEquatorialWithParallax(jdate: number, latitude: number, longitude: number, height: number): void {
    const b_a = 0.99664719;

    const u = arcTanDeg(b_a * b_a * tanDeg(latitude));
    const rho_sin = b_a * sinDeg(u) + height / 6378140.0 * sinDeg(latitude);
    const rho_cos = cosDeg(u) + height / 6378140.0 * cosDeg(latitude);

    // FIX: bare MoonDistance() → MoonData.moonDistance()
    this.parallax = arcSinDeg(sinDeg(8.794 / 3600) / (MoonData.moonDistance(jdate) / GC_AU));

    const hourAngleBody = EarthData.siderealTimeGreenwich(jdate) + longitude - this.rightAscension;
    const delta_alpha = arcTan2Deg(
      -rho_cos * sinDeg(this.parallax) * sinDeg(hourAngleBody),
      cosDeg(this.declination) - rho_cos * sinDeg(this.parallax) * cosDeg(hourAngleBody),
    );
    this.rightAscension += delta_alpha;
    this.declination += arcTan2Deg(
      (sinDeg(this.declination) - rho_sin * sinDeg(this.parallax)) * cosDeg(delta_alpha),
      cosDeg(this.declination) - rho_cos * sinDeg(this.parallax) * cosDeg(hourAngleBody),
    );
  }

  /** Moon distance in km */
  static moonDistance(jdate: number): number {
    const t = (jdate - 2451545.0) / 36525.0;
    const d = 297.8502042 + (445267.1115168 + (-0.0016300 + (1.0 / 545868 - 1.0 / 113065000 * t) * t) * t) * t;
    const m = 357.5291092 + (35999.0502909 + (-0.0001536 + 1.0 / 24490000 * t) * t) * t;
    const ms = 134.9634114 + (477198.8676313 + (0.0089970 + (1.0 / 69699 - 1.0 / 1471200 * t) * t) * t) * t;
    const f = 93.2720993 + (483202.0175273 + (-0.0034029 + (-1.0 / 3526000 + 1.0 / 863310000 * t) * t) * t) * t;
    const e = 1.0 + (-0.002516 - 0.0000074 * t) * t;

    let sr = 0;
    for (let i = 0; i < 60; i++) {
      let temp = SIGMA_R[i] * cosDeg(ARG_LR[i][0] * d + ARG_LR[i][1] * m + ARG_LR[i][2] * ms + ARG_LR[i][3] * f);
      if (Math.abs(ARG_LR[i][1]) === 1) temp *= e;
      if (Math.abs(ARG_LR[i][1]) === 2) temp *= e * e;
      sr += temp;
    }

    return 385000.56 + sr / 1000;
  }

  /** Full ecliptical position calculation */
  static calculateEcliptical(jdate: number): EclipticalCoords {
    const t = (jdate - 2451545.0) / 36525.0;
    const d = 297.8502042 + (445267.1115168 + (-0.0016300 + (1.0 / 545868 - 1.0 / 113065000 * t) * t) * t) * t;
    const m = 357.5291092 + (35999.0502909 + (-0.0001536 + 1.0 / 24490000 * t) * t) * t;
    const ms = 134.9634114 + (477198.8676313 + (0.0089970 + (1.0 / 69699 - 1.0 / 1471200 * t) * t) * t) * t;
    const f = 93.2720993 + (483202.0175273 + (-0.0034029 + (-1.0 / 3526000 + 1.0 / 863310000 * t) * t) * t) * t;
    const e = 1.0 + (-0.002516 - 0.0000074 * t) * t;
    const ls = 218.3164591 + (481267.88134236 + (-0.0013268 + (1.0 / 538841 - 1.0 / 65194000 * t) * t) * t) * t;
    const a1 = 119.75 + 131.849 * t;
    const a2 = 53.09 + 479264.290 * t;
    const a3 = 313.45 + 481266.484 * t;

    let sr = 0;
    for (let i = 0; i < 60; i++) {
      let temp = SIGMA_R[i] * cosDeg(ARG_LR[i][0] * d + ARG_LR[i][1] * m + ARG_LR[i][2] * ms + ARG_LR[i][3] * f);
      if (Math.abs(ARG_LR[i][1]) === 1) temp *= e;
      if (Math.abs(ARG_LR[i][1]) === 2) temp *= e * e;
      sr += temp;
    }

    let sl = 0;
    for (let i = 0; i < 60; i++) {
      let temp = SIGMA_L[i] * sinDeg(ARG_LR[i][0] * d + ARG_LR[i][1] * m + ARG_LR[i][2] * ms + ARG_LR[i][3] * f);
      if (Math.abs(ARG_LR[i][1]) === 1) temp *= e;
      if (Math.abs(ARG_LR[i][1]) === 2) temp *= e * e;
      sl += temp;
    }
    sl += 3958 * sinDeg(a1) + 1962 * sinDeg(ls - f) + 318 * sinDeg(a2);

    let sb = 0;
    for (let i = 0; i < 60; i++) {
      let temp = SIGMA_B[i] * sinDeg(ARG_B[i][0] * d + ARG_B[i][1] * m + ARG_B[i][2] * ms + ARG_B[i][3] * f);
      if (Math.abs(ARG_B[i][1]) === 1) temp *= e;
      if (Math.abs(ARG_B[i][1]) === 2) temp *= e * e;
      sb += temp;
    }
    sb += -2235 * sinDeg(ls) + 382 * sinDeg(a3) + 175 * sinDeg(a1 - f)
        + 175 * sinDeg(a1 + f) + 127 * sinDeg(ls - ms) - 115 * sinDeg(ls + ms);

    return {
      longitude: ls + sl / 1000000,
      latitude: sb / 1000000,
      distance: 385000.56 + sr / 1000,
    };
  }
}
