// Converted from js/GCCoreAstronomy.js (88 lines)
// Removed global mutable state (AstronomySystem_System, CoreEventsMap cache)
// Simplified: only Meeus system supported

import { SunData } from './sun.js';
import { MoonData } from './moon.js';
import type { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

export function getSunLongitude(vct: GregorianDateTime, _earth: EarthData): number {
  return SunData.getSunLongitude(vct);
}

export function calcSunrise(vct: GregorianDateTime, earth: EarthData): import('./hour-time.js').HourTime {
  return SunData.calcSunrise(vct, earth);
}

export function calcSunset(vct: GregorianDateTime, earth: EarthData): import('./hour-time.js').HourTime {
  return SunData.calcSunset(vct, earth);
}

export function getMoonLongitude(vct: GregorianDateTime, _earth: EarthData): number {
  const moon = new MoonData();
  moon.calculate(vct.getJulianComplete());
  return moon.longitude_deg;
}

export function getMoonElevation(e: EarthData, vc: GregorianDateTime): number {
  const moon = new MoonData();
  const d = vc.getJulianComplete();
  moon.calculate(d);
  moon.correctEquatorialWithParallax(d, e.latitudeDeg, e.longitudeDeg, 0);
  moon.calcHorizontal(d, e.longitudeDeg, e.latitudeDeg);
  return moon.elevation;
}
