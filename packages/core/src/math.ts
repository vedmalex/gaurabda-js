// Converted from js/GCMath.js
// FIX B1: Math.Abs -> Math.abs

// Constants (were global vars)
export const GC_PI = 3.1415926535897932385;
export const GC_PI2 = 6.2831853071795864769;
export const GC_RADS = 0.0174532925199432958;
export const GC_AU = 149597869.0;
export const GC_EARTH_RADIUS = 6378.15;
export const GC_MOON_RADIUS = 1737.4;
export const GC_SUN_RADIUS = 695500;
export const GC_J1999 = 2451180.0;
export const GC_J2000 = 2451545.0;

// Convert utilities (were static methods of Convert class)
export function toInt32(a: number): number {
  return parseInt(String(a), 10);
}

export function toDouble(a: number): number {
  return a * 1.0;
}

export function formatS2(a: number): string {
  if (a < 10) return ' ' + a.toString();
  return a.toString();
}

export function formatD2(a: number): string {
  return String(a).padStart(2, '0');
}

export function formatD4(a: number): string {
  return String(a).padStart(4, '0');
}

// Math utilities (were static methods of GCMath class)

export function floor(d: number): number {
  return Math.floor(d);
}

export function intFloor(d: number): number {
  return toInt32(Math.floor(d));
}

export function intRound(d: number): number {
  return toInt32(Math.floor(d + 0.5));
}

export function cosDeg(x: number): number {
  return Math.cos(x * GC_RADS);
}

export function sinDeg(x: number): number {
  return Math.sin(x * GC_RADS);
}

export function arccosDeg(x: number): number {
  return Math.acos(x) / GC_RADS;
}

// FIX B1: was Math.Abs (C# casing), now Math.abs
export function abs(d: number): number {
  return Math.abs(d);
}

export function arcTan2Deg(y: number, x: number): number {
  return Math.atan2(y, x) / GC_RADS;
}

export function tanDeg(x: number): number {
  return Math.tan(x * GC_RADS);
}

export function arcSinDeg(x: number): number {
  return Math.asin(x) / GC_RADS;
}

export function arcTanDeg(x: number): number {
  return Math.atan(x) / GC_RADS;
}

export function putIn1(v: number): number {
  let v2 = v - Math.floor(v);
  while (v2 < 0.0) v2 += 1.0;
  while (v2 > 1.0) v2 -= 1.0;
  return v2;
}

export function putIn24(id: number): number {
  let d = id;
  while (d >= 24.0) d -= 24.0;
  while (d < 0.0) d += 24.0;
  return d;
}

export function putIn360(id: number): number {
  let d = id;
  while (d >= 360.0) d -= 360.0;
  while (d < 0.0) d += 360.0;
  return d;
}

export function putIn180(inD: number): number {
  let d = inD;
  while (d < -180.0) d += 360.0;
  while (d > 180.0) d -= 360.0;
  return d;
}

export function getSign(d: number): number {
  if (d > 0.0) return 1;
  if (d < 0.0) return -1;
  return 0;
}

export function deg2rad(x: number): number {
  return x * GC_RADS;
}

export function rad2deg(x: number): number {
  return x / GC_RADS;
}

export function getFraction(x: number): number {
  return x - Math.floor(x);
}

export function max(a: number, b: number): number {
  return a > b ? a : b;
}

export function min(a: number, b: number): number {
  return a < b ? a : b;
}

export function arcDistanceDeg(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const lat1r = GC_PI / 2 - deg2rad(lat1);
  const lat2r = GC_PI / 2 - deg2rad(lat2);
  const lon1r = deg2rad(lon1);
  const lon2r = deg2rad(lon2);
  const cosD = Math.cos(lat1r) * Math.cos(lat2r) +
    Math.sin(lat1r) * Math.sin(lat2r) * Math.cos(lon1r - lon2r);
  return rad2deg(Math.acos(cosD));
}

export function daytimeToHourMin(shour: number): [number, number] {
  let s = shour * 24.0;
  const hour = intFloor(s);
  s = (s - hour) * 60;
  const minute = intRound(s);
  return [hour, minute];
}

export function daytimeToHourMinSec(shour: number): [number, number, number] {
  let s = shour * 24.0;
  const hour = intFloor(s);
  s = (s - hour) * 60;
  const minute = intFloor(s);
  s = (s - minute) * 60;
  const sec = intRound(s);
  return [hour, minute, sec];
}
