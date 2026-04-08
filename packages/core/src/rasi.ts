// Converted from js/GCRasi.js

import { intFloor, putIn360 } from './math.js';

const RASI_NAMES = [
  'Mesa', 'Vrsabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrscika', 'Dhanus', 'Makara', 'Kumbha', 'Mina',
];

const RASI_NAMES_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export function getRasi(sunLongitude: number, ayanamsa: number): number {
  return intFloor(putIn360(sunLongitude - ayanamsa) / 30.0);
}

export function getRasiName(i: number): string {
  return RASI_NAMES[i % 12];
}

export function getRasiNameEn(i: number): string {
  return RASI_NAMES_EN[i % 12];
}
