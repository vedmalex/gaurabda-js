// Converted from js/GCCalendar.js (198 lines)
// FIX: "return false,null" / "return true,vcEnd" → proper return types
// FIX: bare VCTIMEtoVATIME/LimitForPeriodUnit → this-qualified

import { MasaId } from './enums.js';
import { format } from './strings.js';
import { getTithiName } from './strings.js';
import { getPaksaName } from './paksa.js';
import { getMasaName } from './masa.js';
import { calcTithiDate, AstroData } from './astro-data.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import { GaurabdaDate } from './gaurabda-date.js';
import type { EarthData } from './earth-data.js';

export const PeriodUnit = {
  Days: 1,
  Weeks: 2,
  Months: 3,
  Years: 4,
  Tithis: 5,
  Masas: 6,
  Gaurabda: 7,
} as const;
export type PeriodUnit = (typeof PeriodUnit)[keyof typeof PeriodUnit];

const WEEKDAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getWeekdayAbbr(dow: number): string {
  return (dow >= 0 && dow < 7) ? WEEKDAY_ABBR[dow] : '';
}

export function getCalWeekdayName(dow: number): string {
  return (dow >= 0 && dow < 7) ? WEEKDAY_NAME[dow] : '';
}

export function getGaurabdaYear(vc: GregorianDateTime, earth: EarthData): number {
  const day = new AstroData();
  day.dayCalc(vc, earth);
  day.masaCalc(vc, earth);
  return day.gaurabdaYear;
}

export function formatDate(vc: GregorianDateTime, va: GaurabdaDate): string {
  return format('{0} {1} {2}\r\n{3}, {4} Paksa, {5} Masa, {6}',
    vc.day, GregorianDateTime.getMonthAbreviation(vc.month), vc.year,
    getTithiName(va.tithi % 15), getPaksaName(Math.floor(va.tithi / 15)), getMasaName(va.masa), va.gyear);
}

export function vaisnavaToGregorian(va: GaurabdaDate, earth: EarthData): GregorianDateTime {
  return calcTithiDate(va.gyear, va.masa, Math.floor(va.tithi / 15), va.tithi % 15, earth);
}

export function gregorianToVaisnava(vc: GregorianDateTime, earth: EarthData): GaurabdaDate {
  const day = new AstroData();
  day.dayCalc(vc, earth);
  const va = new GaurabdaDate();
  va.masa = day.masaCalc(vc, earth);
  va.tithi = day.sunRise.tithi;
  va.gyear = day.gaurabdaYear;
  return va;
}

function limitForPeriodUnit(pu: number): number {
  switch (pu) {
    case PeriodUnit.Days:
    case PeriodUnit.Tithis:
      return 36500;
    case PeriodUnit.Weeks:
      return 520;
    case PeriodUnit.Months:
    case PeriodUnit.Masas:
      return 1200;
    default:
      return 100;
  }
}

export function comboMasaToMasa(nComboMasa: number): number {
  return nComboMasa === 12 ? 12 : (nComboMasa + 11) % 12;
}

export function masaToComboMasa(nMasa: number): number {
  return nMasa === 12 ? 12 : (nMasa + 1) % 12;
}

/** Calculate end date for a given period from start date */
export function calcEndDate(
  earth: EarthData, vcStart: GregorianDateTime, nType: number, nCount: number,
): GregorianDateTime | null {
  const vaStart = gregorianToVaisnava(vcStart, earth);
  const vcEnd = new GregorianDateTime();
  const vaEnd = new GaurabdaDate();

  if (nCount > limitForPeriodUnit(nType)) nCount = limitForPeriodUnit(nType);

  switch (nType) {
    case PeriodUnit.Days:
      vcEnd.set(vcStart);
      vcEnd.addDays(nCount);
      return vcEnd;

    case PeriodUnit.Weeks:
      vcEnd.set(vcStart);
      vcEnd.addDays(nCount * 7);
      return vcEnd;

    case PeriodUnit.Months:
      vcEnd.set(vcStart);
      vcEnd.month += nCount;
      while (vcEnd.month > 12) { vcEnd.year++; vcEnd.month -= 12; }
      return vcEnd;

    case PeriodUnit.Years:
      vcEnd.set(vcStart);
      vcEnd.year += nCount;
      return vcEnd;

    case PeriodUnit.Tithis:
      vaEnd.set(vaStart);
      vaEnd.tithi += nCount;
      while (vaEnd.tithi >= 30) { vaEnd.tithi -= 30; vaEnd.masa++; }
      while (vaEnd.masa >= 12) { vaEnd.masa -= 12; vaEnd.gyear++; }
      return vaisnavaToGregorian(vaEnd, earth);

    case PeriodUnit.Masas:
      vaEnd.set(vaStart);
      vaEnd.masa = masaToComboMasa(vaEnd.masa);
      if (vaEnd.masa === MasaId.ADHIKA_MASA) {
        vcEnd.set(vcStart);
        vcEnd.month += nCount;
        while (vcEnd.month > 12) { vcEnd.year++; vcEnd.month -= 12; }
        const tmp = gregorianToVaisnava(vcEnd, earth);
        tmp.tithi = vaStart.tithi;
        return vaisnavaToGregorian(tmp, earth);
      }
      vaEnd.masa += nCount;
      while (vaEnd.masa >= 12) { vaEnd.masa -= 12; vaEnd.gyear++; }
      vaEnd.masa = comboMasaToMasa(vaEnd.masa);
      return vaisnavaToGregorian(vaEnd, earth);

    case PeriodUnit.Gaurabda:
      vaEnd.set(vaStart);
      vaEnd.gyear += nCount;
      return vaisnavaToGregorian(vaEnd, earth);

    default:
      return null;
  }
}
