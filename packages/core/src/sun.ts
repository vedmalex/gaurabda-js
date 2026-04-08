// Converted from js/GCSunData.js (494 lines)
// FIX B2: Math.Abs → Math.abs (implicit — no direct occurrences, but kept consistent)
// FIX: Convert.ToInt32 → toInt32
// FIX: GCMath_PI → GC_PI
// FIX: GCHourTime → HourTime

import {
  GC_PI, putIn360, putIn180, putIn24,
  sinDeg, cosDeg, tanDeg, arcSinDeg, arccosDeg,
  toInt32,
} from './math.js';
import { KalaType } from './enums.js';
import { HourTime } from './hour-time.js';
import type { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData, HorizontalCoords } from './earth-data.js';

// ── Lookup tables (mean longitude, perigee) ─────────────────────────

const SUN_LONG: readonly number[] = [
339.226,9.781,39.351,69.906,99.475,130.030,160.585,190.155,220.710,250.279,280.834,311.390,
340.212,10.767,40.337,70.892,100.461,131.016,161.571,191.141,221.696,251.265,281.820,312.375,
341.198,11.753,41.322,71.877,101.447,132.002,162.557,192.126,222.681,252.251,282.806,313.361,
342.183,12.738,42.308,72.863,102.432,132.987,163.542,193.112,223.667,253.236,283.791,314.346,
343.169,13.724,43.293,73.849,103.418,133.973,164.528,194.098,224.653,254.222,284.777,315.332,
344.155,14.710,44.279,74.834,104.404,134.959,165.514,195.083,225.638,255.208,285.763,316.318,
345.140,15.695,45.265,75.820,105.389,135.944,166.499,196.069,226.624,256.193,286.748,317.303,
346.126,16.681,46.250,76.805,106.375,136.930,167.485,197.054,227.610,257.179,287.734,318.289,
347.112,17.667,47.236,77.791,107.361,137.916,168.471,198.040,228.595,258.165,288.720,319.275,
348.097,18.652,48.222,78.777,108.346,138.901,169.456,199.026,229.581,259.150,289.705,320.260,
349.083,19.638,49.207,79.762,109.332,139.887,170.442,200.011,230.566,260.136,290.691,321.246,
350.068,20.624,50.193,80.748,110.317,140.873,171.428,200.997,231.552,261.122,291.677,322.232,
351.054,21.609,51.179,81.734,111.303,141.858,172.413,201.983,232.538,262.107,292.662,323.217,
352.040,22.595,52.164,82.719,112.289,142.844,173.399,202.968,233.523,263.093,293.648,324.203,
353.025,23.581,53.150,83.705,113.274,143.829,174.385,203.954,234.509,264.078,294.634,325.189,
354.011,24.566,54.136,84.691,114.260,144.815,175.370,204.940,235.495,265.064,295.619,326.174,
354.997,25.552,55.121,85.676,115.246,145.801,176.356,205.925,236.480,266.050,296.605,327.160,
355.982,26.537,56.107,86.662,116.231,146.786,177.341,206.911,237.466,267.035,297.590,328.146,
356.968,27.523,57.093,87.648,117.217,147.772,178.327,207.897,238.452,268.021,298.576,329.131,
357.954,28.509,58.078,88.633,118.203,148.758,179.313,208.882,239.437,269.007,299.562,330.117,
358.939,29.494,59.064,89.619,119.188,149.743,180.298,209.868,240.423,269.992,300.547,331.102,
359.925,30.480,60.049,90.605,120.174,150.729,181.284,210.854,241.409,270.978,301.533,332.088,
0.911,31.466,61.035,91.590,121.160,151.715,182.270,211.839,242.394,271.964,302.519,333.074,
1.896,32.451,62.021,92.576,122.145,152.700,183.255,212.825,243.380,272.949,303.504,334.059,
2.882,33.437,63.006,93.561,123.131,153.686,184.241,213.810,244.366,273.935,304.490,335.045,
3.868,34.423,63.992,94.547,124.117,154.672,185.227,214.796,245.351,274.921,305.476,336.031,
4.853,35.408,64.978,95.533,125.102,155.657,186.212,215.782,246.337,275.906,306.461,337.016,
5.839,36.394,65.963,96.518,126.088,156.643,187.198,216.767,247.322,276.892,307.447,338.002,
6.824,37.380,66.949,97.504,127.073,157.629,188.184,217.753,248.308,277.878,308.433,338.988,
7.810,38.365,67.935,98.490,128.059,158.614,189.169,218.739,249.294,278.863,309.418,339.100,
8.796,38.365,68.920,98.490,129.045,159.600,189.169,219.724,249.294,279.849,310.404,339.226,
];

const SUN_1_COL = [-1.157, -0.386, 0.386, 1.157];
const SUN_1_ROW = [-1.070, 2.015, 5.101, 8.186, 11.271, 14.356, 17.441, 20.526, 23.611, 26.697];
const SUN_2_COL = [0.322, 0.107, -0.107, -0.322];
const SUN_2_ROW = [-0.577,-0.449,-0.320,-0.192, -0.064, 0.064, 0.192, 0.320, 0.449, 0.577];
const SUN_3_ROW = [
  -0.370,-0.339,-0.309,-0.278,-0.247,-0.216,-0.185,-0.154,
  -0.123,-0.093,-0.062,-0.031,+0.000,+0.031,+0.062,+0.093,
  +0.123,+0.154,+0.185,+0.216,+0.247,+0.278,+0.309,+0.339,
  +0.370,
];
const SUN_3_COL = [+0.358, +0.119, -0.119, -0.358];
const SUN_4_ROW = [251.97,258.85,265.73,272.61,279.49, 286.37,293.25,300.14,307.02,313.90];
const SUN_4_COL = [-2.58, -0.86, 0.86, 2.58];
const SUN_5_ROW = [
  -0.83,-0.76,-0.69,-0.62, -0.55,-0.48,-0.41,-0.34,
  -0.28,-0.21,-0.14,-0.07, +0.00,+0.07,+0.14,+0.21,
  +0.28,+0.34,+0.41,+0.48, +0.55,+0.62,+0.69,+0.76,
  +0.83,
];
const SUN_5_COL = [-0.03, -0.01, 0.01, +0.03];

// ── SunData class ───────────────────────────────────────────────────

export class SunData {
  longitudeDeg: number = 0.0;
  declinationDeg: number = 0.0;
  rightAscensionDeg: number = 0.0;
  equationOfTime: number = 0.0;

  /** Mean ecliptic longitude of the sun for given date */
  static sunGetMeanLong(year: number, month: number, day: number): number {
    if (month > 12 || month < 1 || day < 1 || day > 31) return -1.0;
    let mel = SUN_LONG[(day - 1) * 12 + (month + 9) % 12];

    let y: number, yy: number;
    if (month < 3) {
      y = toInt32((year - 1) / 100);
      yy = (year - 1) % 100;
    } else {
      y = toInt32(year / 100);
      yy = year % 100;
    }

    const y4 = toInt32(y / 4);
    const yy4 = toInt32(yy / 4);
    if (y <= 15) {
      mel += SUN_1_COL[y % 4] + SUN_1_ROW[y4];
    } else if (y < 40) {
      mel += SUN_2_COL[y % 4] + SUN_2_ROW[y4];
    }

    mel += SUN_3_COL[yy % 4] + SUN_3_ROW[yy4];
    return mel;
  }

  /** Ecliptic longitude of perigee */
  static sunGetPerigee(year: number, month: number, day: number): number {
    if (month > 12 || month < 1 || day < 1 || day > 31) return -1.0;

    let y: number, yy: number;
    if (month < 3) {
      y = toInt32((year - 1) / 100);
      yy = (year - 1) % 100;
    } else {
      y = toInt32(year / 100);
      yy = year % 100;
    }

    let per = SUN_4_ROW[toInt32(y / 4)] + SUN_4_COL[y % 4];
    per += SUN_5_ROW[toInt32(yy / 4)] + SUN_5_COL[yy % 4];
    return per;
  }

  /** Calculate sun position (declination, RA, equation of time) */
  sunPosition(vct: GregorianDateTime, _ed: EarthData, dayHours: number): void {
    const DG = GC_PI / 180;
    const RAD = 180 / GC_PI;

    const meanLongitudeOfSun = SunData.sunGetMeanLong(vct.year, vct.month, vct.day) + (360 / 365.25) * dayHours / 360.0;
    const elp = SunData.sunGetPerigee(vct.year, vct.month, vct.day);
    const mas = meanLongitudeOfSun - elp;

    this.longitudeDeg = meanLongitudeOfSun + 1.915 * Math.sin(mas * DG) + 0.02 * Math.sin(2 * DG * mas);
    this.declinationDeg = RAD * Math.asin(0.39777 * Math.sin(this.longitudeDeg * DG));
    this.rightAscensionDeg = this.longitudeDeg - RAD * Math.atan2(Math.sin(2 * this.longitudeDeg * DG), 23.2377 + Math.cos(2 * DG * this.longitudeDeg));
    this.equationOfTime = this.rightAscensionDeg - meanLongitudeOfSun;
  }

  /** Sun ecliptic longitude for given GregorianDateTime */
  static getSunLongitude(vct: GregorianDateTime): number {
    const DG = GC_PI / 180;

    const mel = SunData.sunGetMeanLong(vct.year, vct.month, vct.day) + (360 / 365.25) * (vct.shour - 0.5 - vct.TimezoneHours / 24.0);
    const elp = SunData.sunGetPerigee(vct.year, vct.month, vct.day);
    const mas = mel - elp;

    return mel + 1.915 * Math.sin(mas * DG) + 0.02 * Math.sin(2 * DG * mas);
  }

  /** Rise angle event definition (center of the sun at horizon) */
  static riseAngleLevel(): number {
    return 0.01454;
  }

  /** Calculate sunrise time (iterative, 3 passes) */
  static calcSunrise(vct: GregorianDateTime, earth: EarthData): HourTime {
    let tempSunrise = 180.0;
    const sun = new SunData();

    for (let i = 0; i < 3; i++) {
      sun.sunPosition(vct, earth, tempSunrise - 180.0);

      let eventdef = 0.01454;
      eventdef = (eventdef / cosDeg(earth.latitudeDeg)) / cosDeg(sun.declinationDeg);
      const x = tanDeg(earth.latitudeDeg) * tanDeg(sun.declinationDeg) + eventdef;

      if (x >= -1.0 && x <= 1.0) {
        tempSunrise = 90.0 - earth.longitudeDeg - arcSinDeg(x) + sun.equationOfTime;
      } else {
        tempSunrise = -360.0;
        break;
      }
    }

    const result = new HourTime();
    result.longitude = sun.longitudeDeg;
    result.setDegTime(tempSunrise + earth.offsetUtcHours * 15.0);
    return result;
  }

  /** Calculate sunset time (iterative, 3 passes) */
  static calcSunset(vct: GregorianDateTime, earth: EarthData): HourTime {
    let tempSunset = 180.0;
    const sun = new SunData();

    for (let i = 0; i < 3; i++) {
      sun.sunPosition(vct, earth, tempSunset - 180.0);

      let eventdef = SunData.riseAngleLevel();
      eventdef = (eventdef / cosDeg(earth.latitudeDeg)) / cosDeg(sun.declinationDeg);
      const x = tanDeg(earth.latitudeDeg) * tanDeg(sun.declinationDeg) + eventdef;

      if (x >= -1.0 && x <= 1.0) {
        tempSunset = 270.0 - earth.longitudeDeg + arcSinDeg(x) + sun.equationOfTime;
      } else {
        tempSunset = -360.0;
        break;
      }
    }

    const result = new HourTime();
    result.longitude = sun.longitudeDeg;
    result.setDegTime(tempSunset + earth.offsetUtcHours * 15.0);
    return result;
  }

  /** Calculate kala periods (Rahu Kalam, Yama Ghanti, Guli Kalam, Abhijit) */
  static calculateKala(sunRise: number, sunSet: number, dayWeek: number, type: number): [start: number, end: number] {
    let r1 = -1;
    let r2 = -1;

    if (type === KalaType.KT_RAHU_KALAM) {
      const a = [7, 1, 6, 4, 5, 3, 2];
      const period = (sunSet - sunRise) / 8.0;
      r1 = sunRise + a[dayWeek] * period;
      r2 = r1 + period;
    } else if (type === KalaType.KT_YAMA_GHANTI) {
      const a = [4, 3, 2, 1, 0, 6, 5];
      const period = (sunSet - sunRise) / 8.0;
      r1 = sunRise + a[dayWeek] * period;
      r2 = r1 + period;
    } else if (type === KalaType.KT_GULI_KALAM) {
      const a = [6, 5, 4, 3, 2, 1, 0];
      const period = (sunSet - sunRise) / 8.0;
      r1 = sunRise + a[dayWeek] * period;
      r2 = r1 + period;
    } else if (type === KalaType.KT_ABHIJIT) {
      const period = (sunSet - sunRise) / 15.0;
      r1 = sunRise + 7 * period;
      r2 = r1 + period;
      if (dayWeek === 3) {
        r1 = r2 = -1;
      }
    }

    return [r1, r2];
  }

  /** Alternative sun position calculator (horizontal coords) */
  static sunPosition(year: number, month: number, day: number, hour: number, min: number, sec: number, lat: number, longi: number): HorizontalCoords {
    const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30];
    let dayOfYear = day;
    for (let y2 = 0; y2 < month; y2++) dayOfYear += monthDays[y2];
    if ((year % 4 === 0) && ((year % 400 === 0) || (year % 100 !== 0)) && (dayOfYear >= 60) && !(month === 2 && dayOfYear === 60))
      dayOfYear++;

    const hourd = hour + min / 60.0 + sec / 3600.0;
    const delta = year - 1949;
    const leap = Math.floor(delta / 4);
    const jd = 32916.5 + delta * 365 + leap + dayOfYear + hourd / 24.0;
    const time = jd - 51545.0;

    const mnlong = putIn360(280.460 + .9856474 * time);
    const mnanom = putIn360(357.528 + .9856003 * time);
    let eclong = putIn360(mnlong + 1.915 * sinDeg(mnanom) + 0.020 * sinDeg(2 * mnanom));
    const oblqec = 23.439 - 0.0000004 * time;

    const num = cosDeg(oblqec) * sinDeg(eclong);
    const den = cosDeg(eclong);
    let ra = arcSinDeg(num / Math.sqrt(num * num + den * den));
    // fix quadrant
    ra = Math.atan2(num, den) * 180 / GC_PI;
    if (ra < 0) ra += 360;

    const dec = arcSinDeg(sinDeg(oblqec) * sinDeg(eclong));

    const gmst = putIn24(6.697375 + .0657098242 * time + hourd);
    let lmst = putIn24(gmst + longi / 15.0) * 15.0;
    const ha = putIn180(lmst - ra);

    const zenithAngle = arccosDeg(sinDeg(lat) * sinDeg(dec) + cosDeg(lat) * cosDeg(dec) * cosDeg(ha));
    let az = arccosDeg(((sinDeg(lat) * cosDeg(zenithAngle)) - sinDeg(dec)) / (cosDeg(lat) * sinDeg(zenithAngle)));
    const el = arcSinDeg(sinDeg(dec) * sinDeg(lat) + cosDeg(dec) * cosDeg(lat) * cosDeg(ha));

    if (ha > 0) az += 180;
    else az = 540 - az;
    az = putIn360(az);

    return { azimut: az, elevation: el };
  }
}
