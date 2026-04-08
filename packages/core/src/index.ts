// @gaurabda/core — Vedic/Vaishnava calendar calculation library
// Public API barrel export

export { version } from './version.js';

// Enums
export * from './enums.js';

// Math utilities
export {
  putIn360, putIn180, putIn24, putIn1,
  sinDeg, cosDeg, arccosDeg, arcSinDeg, tanDeg, arcTan2Deg, arcTanDeg,
  deg2rad, rad2deg, abs, intFloor, intRound,
  daytimeToHourMin, daytimeToHourMinSec,
  GC_PI, GC_PI2, GC_RADS, GC_J2000,
  formatD2, formatD4, formatS2,
} from './math.js';

// Core types
export { DayTime } from './day-time.js';
export { GregorianDateTime } from './gregorian-date-time.js';
export { GaurabdaDate } from './gaurabda-date.js';

// Astronomy
export { getAyanamsa, getLahiriAyanamsa, getAyanamsaName, AyanamshaType } from './ayanamsha.js';
export { getRasi, getRasiName, getRasiNameEn } from './rasi.js';
export { getPaksaName, getPaksaAbbr } from './paksa.js';
export { HourTime } from './hour-time.js';

// Strings & name lookups
export {
  getString, setString, format,
  getTithiName, getNaksatraName, getNaksatraPadaText, getYogaName,
  getWeekdayName, getMuhurtaName, getSandhyaName, getKalaName,
  getDayPartName, getMoonTimesName,
  getLongitudeDirectionName, getLatitudeDirectionName,
  getPlanetNameEn, getPlanetName,
  getNaksatraChildSyllable, getRasiChildSyllable,
  getDSTSignature, getFastingName, getSpecFestivalName,
} from './strings.js';

// Core event
export { CoreEvent } from './core-event.js';

// Earth & coordinates
export { EarthData } from './earth-data.js';
export type { HorizontalCoords, EquatorialCoords, EclipticalCoords } from './earth-data.js';

// Sun
export { SunData } from './sun.js';

// Moon
export { MoonData } from './moon.js';

// Core astronomy facade
export { getSunLongitude, getMoonLongitude, getMoonElevation, calcSunrise, calcSunset } from './core-astronomy.js';

// Conjunction
export { isConjunction, getPrevConjunctionX, getNextConjunctionX, getPrevConjunction, getNextConjunction } from './conjunction.js';

// Sankranti
export { getNextSankranti, getSankrantiType, setSankrantiType, getSankMethodName } from './sankranti.js';

// Naksatra (calculations)
export { getNextNaksatra, getPrevNaksatra } from './naksatra.js';

// Yoga (calculations)
export { getNextYogaStart } from './yoga.js';

// Ekadasi
export { getMahadvadasiName, getEkadasiName, getParanaReasonText } from './ekadasi.js';

// Masa
export {
  getMasaGaudiyaName, getMasaVedicName, getMasaName,
  prevMasa, nextMasa, isExtraMasa, masaDist,
} from './masa.js';

// Tithi (calculations)
export {
  getNextTithiStart, getPrevTithiStart, getTithiTimes,
  tithiIsEkadasi, tithiIsDvadasi, tithiIsTrayodasi, tithiIsCaturdasi, tithiIsFullNewMoon,
  tithiLessEkadasi, tithiLessDvadasi, tithiLessTrayodasi,
  prevTithi, nextTithi, prevPrevTithi, nextNextTithi,
  tithiLessThan, tithiGreaterThan, tithiTransit, tithiDist,
} from './tithi.js';

// Astro data (day aggregator)
export { AstroData, calcTithiDate, calcTithiEnd, calcTithiEndEx } from './astro-data.js';

// Display settings
export { GCDS, DisplayPriorities, DisplaySettings } from './display-settings.js';

// Calendar utilities
export {
  PeriodUnit, getWeekdayAbbr, getCalWeekdayName,
  getGaurabdaYear, formatDate, vaisnavaToGregorian, gregorianToVaisnava,
  calcEndDate, comboMasaToMasa, masaToComboMasa,
} from './calendar.js';

// Festival detection
export type { FestivalDescriptor, FestivalDayLike } from './festival.js';
export {
  testFestivalTithiMasa, isFestivalTithiMasa, isFestivalMasaDay,
  isFestivalEkadasi, isFestivalSankranti, isFestivalSpecial,
} from './festival.js';

// Vaisnava day (calendar day structure)
export { VaisnavEvent, VaisnavaDay, CoreEventFindRec, insertByTime } from './vaisnava-day.js';

// Result modules (calculators)
export { ResultCoreEvents } from './result-core-events.js';
export { ResultMasaList } from './result-masa-list.js';
export type { MasaEntry } from './result-masa-list.js';
export { ResultCalendar } from './result-calendar.js';

// Timezone
export { TimeZone } from './timezone.js';
export type { DstDescriptor } from './timezone.js';

// Country
export { getCountryName, getCountryContinentName, getCountryByISOCode, getCountryByName, getAllCountries, getContinentName } from './country.js';

// Location
export { Location } from './location.js';
