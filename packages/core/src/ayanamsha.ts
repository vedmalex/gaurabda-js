// Converted from js/GCAyanamsha.js
// Removed global mutable GCAyanamsha_ayamashaType — now a parameter

export const AyanamshaType = {
  FAGAN_BRADLEY: 0,
  LAHIRI: 1,
  KRISHNAMURTI: 2,
  RAMAN: 3,
} as const;
export type AyanamshaType = (typeof AyanamshaType)[keyof typeof AyanamshaType];

const AYANAMSHA_NAMES = [
  'Fagan/Bradley',
  'Lahiri',
  'Krishnamurti',
  'Raman',
];

// Lahiri reference data: [julianDay, ayanamshaValue] pairs
const LAHIRI_TABLE: number[] = [
  2415259.0, 22.475,         // 27.8.1900  22-27-54
  2433486.0, 23.16472,       // 23.7.1950  23-09-53
  2451791.0, 23.870277778,   // 3.9.2000   23-52-13
  2455437.0, 24.001111111,   // 28.8.2010  24-00-04
  2469979.0, 24.558055556,   // 21.6.2050  24-33-29
  2488234.0, 25.258055556,   // 14.6.2100  25-15-29
];

export function getAyanamsa(jdate: number, type: AyanamshaType = AyanamshaType.LAHIRI): number {
  const t = (jdate - 2451545.0) / 36525.0;
  const d = (5028.796195 - 1.1054348 * t) * t / 3600.0;

  switch (type) {
    case AyanamshaType.FAGAN_BRADLEY:
      return 24.8361111111 - 0.095268987143399 + d;
    case AyanamshaType.LAHIRI:
      return 23.85305555555 + d;
    case AyanamshaType.KRISHNAMURTI:
      return 23.8561111111 - 0.095268987143399 + d;
    case AyanamshaType.RAMAN:
      return 22.5066666666 - 0.095268987143399 + d;
    default:
      return 21.0;
  }
}

export function getAyanamsaName(type: AyanamshaType): string {
  if (type > 3) return '';
  return AYANAMSHA_NAMES[type];
}

export function getLahiriAyanamsa(jdate: number): number {
  const h = LAHIRI_TABLE;

  if (jdate > h[10]) {
    return (jdate - h[10]) * ((h[11] - h[9]) / (h[10] - h[8])) + h[11];
  } else if (jdate > h[8]) {
    return (jdate - h[8]) * ((h[11] - h[9]) / (h[10] - h[8])) + h[9];
  } else if (jdate > h[6]) {
    return (jdate - h[6]) * ((h[9] - h[7]) / (h[8] - h[6])) + h[7];
  } else if (jdate > h[4]) {
    return (jdate - h[4]) * ((h[7] - h[5]) / (h[6] - h[4])) + h[5];
  } else if (jdate > h[2]) {
    return (jdate - h[2]) * ((h[5] - h[3]) / (h[4] - h[2])) + h[3];
  } else {
    return (jdate - h[0]) * ((h[3] - h[1]) / (h[2] - h[0])) + h[1];
  }
}
