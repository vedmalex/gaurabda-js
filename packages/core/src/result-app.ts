// Converted from js/TResultApp.js (158 lines)
// FIX: .Add() → .push(); bare b_adhika → this.bAdhika; MainInfo → this.mainInfo
// Simplified: pure data output, no DOM/display formatting

import { MasaId } from './enums.js';
import { getAyanamsa } from './ayanamsha.js';
import { getSunLongitude, getMoonLongitude } from './core-astronomy.js';
import { HourTime } from './hour-time.js';
import { AstroData } from './astro-data.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import { GaurabdaDate } from './gaurabda-date.js';
import { getGaurabdaYear, vaisnavaToGregorian } from './calendar.js';
import type { EarthData } from './earth-data.js';

/** Result of appearance day calculation */
export interface AppDayResult {
  details: AstroData;
  eventTime: GregorianDateTime;
  bAdhika: boolean;
  celebDates: GregorianDateTime[];
  celebYears: number[];
}

/** Calculate appearance day data for a given date and location */
export function calculateAppDay(earth: EarthData, eventDate: GregorianDateTime, celebCount: number = 3): AppDayResult {
  const d = new AstroData();
  const vc = eventDate.clone();
  const vcsun = eventDate.clone();

  let bAdhika = false;

  // Calculate sun/moon positions at event time (UTC)
  vcsun.shour -= vcsun.TimezoneHours / 24.0;
  vcsun.normalizeValues();
  vcsun.TimezoneHours = 0.0;

  d.sunRise = new HourTime();
  d.sunRise.totalDays = vc.shour;
  d.sunRise.longitude = getSunLongitude(vcsun, earth);
  d.sunRise.longitudeMoon = getMoonLongitude(vcsun, earth);
  d.ayanamsa = getAyanamsa(vc.getJulianComplete());
  d.sunRise.ayanamsa = d.ayanamsa;

  // Determine masa
  d.masa = d.masaCalc(vc, earth);
  if (d.masa === MasaId.ADHIKA_MASA) {
    d.masa = d.sunRise.rasiOfSun;
    bAdhika = true;
  }

  // Calculate celebration dates
  const today = new GregorianDateTime();
  today.year = eventDate.year;
  today.month = eventDate.month;
  today.day = eventDate.day;
  today.TimezoneHours = earth.offsetUtcHours;

  const va = new GaurabdaDate();
  va.tithi = d.sunRise.tithi;
  va.masa = d.masa;
  va.gyear = getGaurabdaYear(today, earth);
  if (va.gyear < d.gaurabdaYear) va.gyear = d.gaurabdaYear;

  const celebDates: GregorianDateTime[] = [];
  const celebYears: number[] = [];

  for (let i = 0; i < celebCount + 3 && celebDates.length < celebCount; i++) {
    const vctemp = vaisnavaToGregorian(va, earth);
    if (va.gyear > d.gaurabdaYear) {
      celebDates.push(vctemp);
      celebYears.push(va.gyear);
    }
    va.gyear++;
  }

  return { details: d, eventTime: eventDate.clone(), bAdhika, celebDates, celebYears };
}
