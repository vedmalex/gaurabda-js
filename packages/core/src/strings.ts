// Converted from js/GCStrings.js (736 lines)
// FIX: bare Localized() calls → direct string returns
// FIX: FastTypeText imported from enums.ts
// FIX: KalaType / SpecialFestivalId imported from enums.ts

import { KalaType, SpecialFestivalId, FastTypeText } from './enums.js';

// ── String table (localized strings by index) ──────────────────────────

const gstr: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
  7: 'Date', 8: 'Time', 9: 'Location', 10: 'Latitude',
  11: 'Longitude', 12: 'Timezone', 13: 'Tithi',
  14: 'Tithi Elaps.', 15: 'Naksatra', 16: 'Naksatra Elaps.',
  17: 'Child Name', 18: '(according naksatra)', 19: '(according rasi)',
  20: 'Paksa', 21: '(during Purusottama Adhika Masa)', 22: 'Masa',
  23: 'Gaurabda Year', 24: 'Celebrations',
  25: 'Appearance Day Calculation',
  26: 'Day can be only from 1 to 31',
  27: 'Month can be only from 1 to 12',
  28: 'Year can be only from 1500 to 3999',
  29: 'Given date was corrected, since date given by you was nonexisting.',
  30: 'days', 31: 'months', 32: 'years',
  33: 'exactly given date',
  34: 'from begining of the month',
  35: 'align to the start of the Masa',
  36: 'from begining of the year',
  37: 'start from first day of the Gaurabda Year',
  38: '<all mahadvadasis>', 39: 'Masa Listing',
  40: 'Location', 41: 'From', 42: 'To', 43: 'Today',
  44: ' Calendar', 45: ' Appearance Day', 46: ' Core Events',
  48: ' Masa List',
  50: 'Could not create new window.',
  51: 'Sunrise', 52: 'Sunset', 53: 'Moonrise', 54: 'Moonset',
  55: 'Year', 56: 'Sankranti',
  57: 'Please update GCAL to the latest version from http://www.krishnadays.com',
  58: '(not suitable for fasting)', 59: '(suitable for fasting)',
  60: 'Break fast', 61: 'Break fast after',
  62: 'Break fast not calculated', 63: '(DST not considered)',
  65: 'Jan', 66: 'Feb', 67: 'Mar', 68: 'Apr', 69: 'May', 70: 'Jun',
  71: 'Jul', 72: 'Aug', 73: 'Sep', 74: 'Oct', 75: 'Nov', 76: 'Dec',
  78: 'Ganga Sagara Mela',
  79: 'Tulasi Jala Dan begins.', 80: 'Tulasi Jala Dan ends.',
  81: 'First day of Bhisma Pancaka', 82: 'Last day of Bhisma Pancaka',
  83: 'Looking for', 84: 'Start', 85: 'End',
  86: 'Not found in this year.', 87: 'Fasting for',
  88: '(Fasting is done yesterday, today is feast)',
  89: 'Ksaya tithi', 90: '[Second day of Tithi]',
  91: 'First day', 92: 'Last day',
  93: 'of the first month', 94: 'of the second month',
  95: 'of the third month', 96: 'of the fourth month',
  97: 'of Caturmasya-vrata',
  98: 'Arunodaya Tithi', 99: 'Arunodaya at',
  100: 'Sun Longitude', 101: 'Moon Longitude', 102: 'Ayanamsa',
  103: 'Julian day', 104: 'Yoga', 105: 'Rasi',
  106: '(Daylight Saving Time not considered)',
  107: '(Winter Time)', 108: '(Summer Time)', 109: '(Second half)',
  110: 'Event Finder', 111: 'Sun enters',
  112: 'First month of Caturmasya begins',
  113: 'Last day of the first Caturmasya month',
  114: '(green leafy vegetable fast for one month)',
  115: 'First month of Caturmasya continues',
  116: 'Second month of Caturmasya begins',
  117: 'Last day of the second Caturmasya month',
  118: '(yogurt fast for one month)',
  119: 'Second month of Caturmasya continues',
  120: 'Third month of Caturmasya begins',
  121: 'Last day of the third Caturmasya month',
  122: '(milk fast for one month)',
  123: 'Third month of Caturmasya continues',
  124: 'Fourth month of Caturmasya begins',
  125: 'Last day of the fourth Caturmasya month',
  126: '(urad dal fast for one month)',
  127: 'Fourth month of Caturmasya continues',
  128: '(Caturmasya is not observed during Purusottama Adhika Masa.)',
  132: '<all sankrantis>', 133: '<all tithis>',
  134: '<all fasting days>', 135: '(Fasting for Ekadasi)',
  136: 'No Moonrise', 137: 'No Moonset',
  138: 'No Sunrise', 139: 'No Sunset',
  140: 'SUN - MOON CONJUNCTIONS',
  150: 'Su', 151: 'Mo', 152: 'Tu', 153: 'We',
  154: 'Th', 155: 'Fr', 156: 'Sa',
  157: 'DATE', 158: 'SUNRISE', 159: 'MASA',
  160: 'TITHI START', 161: 'NAKSATRA START', 162: 'Page',
  165: '1/3 of daylight', 166: '1/4 of tithi',
  167: 'end of tithi', 168: 'end of naksatra', 169: 'sunrise',
  560: 'Varuthini Ekadasi', 561: 'Mohini Ekadasi',
  562: 'Apara Ekadasi', 563: 'Pandava Nirjala Ekadasi',
  564: 'Yogini Ekadasi', 565: 'Sayana Ekadasi',
  566: 'Kamika Ekadasi', 567: 'Pavitraropana Ekadasi',
  568: 'Annada Ekadasi', 569: 'Parsva Ekadasi',
  570: 'Indira Ekadasi', 571: 'Pasankusa Ekadasi',
  572: 'Rama Ekadasi', 573: 'Utthana Ekadasi',
  574: 'Utpanna Ekadasi', 575: 'Moksada Ekadasi',
  576: 'Saphala Ekadasi', 577: 'Putrada Ekadasi',
  578: 'Sat-tila Ekadasi', 579: 'Bhaimi Ekadasi',
  580: 'Vijaya Ekadasi', 581: 'Amalaki vrata Ekadasi',
  582: 'Papamocani Ekadasi', 583: 'Kamada Ekadasi',
  584: 'Parama Ekadasi', 585: 'Padmini Ekadasi',
  751: '(Fast till noon)', 752: '(Fast till sunset)',
  753: '(Fast till moonrise)', 754: '(Fast till dusk)',
  755: '(Fast till midnight)', 756: '(Fast today)',
  759: 'Srila Prabhupada -- Appearance',
  760: 'January', 761: 'February', 762: 'March', 763: 'April',
  764: 'May', 765: 'June', 766: 'July', 767: 'August',
  768: 'September', 769: 'October', 770: 'November', 771: 'December',
  780: 'First day of', 781: 'Last day of',
  782: 'first', 783: 'second', 784: 'third', 785: 'fourth', 786: 'last',
  787: 'Sunday', 788: 'Monday', 789: 'Tuesday', 790: 'Wednesday',
  791: 'Thursday', 792: 'Friday', 793: 'Saturday',
  807: 'For this location is Daylight Saving Time not observed.',
  808: 'Daylight saving time is observed ',
  850: 'since', 851: 'to', 852: 'on',
  853: 'Yesterday', 854: 'Tomorrow',
  855: 'First day of Daylight Saving Time',
  856: 'Last day of Daylight Saving Time',
  857: 'Noon',
  860: '(Fasting is done yesterday)',
  861: '(Fasting is done yesterday, today is feast)',
  862: '(Fasting till noon, with feast tomorrow)',
};

// ── Tithi names (30 tithis: 0–14 Krsna paksa, 15–29 Gaura paksa) ───

const TITHI_NAMES: readonly string[] = [
  'Pratipat', 'Dvitiya', 'Tritiya', 'Caturthi', 'Pancami',
  'Sasti', 'Saptami', 'Astami', 'Navami', 'Dasami',
  'Ekadasi', 'Dvadasi', 'Trayodasi', 'Caturdasi', 'Amavasya',
  'Pratipat', 'Dvitiya', 'Tritiya', 'Caturthi', 'Pancami',
  'Sasti', 'Saptami', 'Astami', 'Navami', 'Dasami',
  'Ekadasi', 'Dvadasi', 'Trayodasi', 'Caturdasi', 'Purnima',
];

// ── Naksatra names (27 naksatras) ───────────────────────────────────

const NAKSATRA_NAMES: readonly string[] = [
  'Asvini', 'Bharani', 'Krittika', 'Rohini', 'Mrigasira',
  'Ardra', 'Punarvasu', 'Pusyami', 'Aslesa', 'Magha',
  'Purva-phalguni', 'Uttara-phalguni', 'Hasta', 'Citra', 'Swati',
  'Visakha', 'Anuradha', 'Jyestha', 'Mula', 'Purva-asadha',
  'Uttara-asadha', 'Sravana', 'Dhanista', 'Satabhisa',
  'Purva-bhadra', 'Uttara-bhadra', 'Revati',
];

const NAKSATRA_PADA_TEXT: readonly string[] = [
  '1st Pada', '2nd Pada', '3rd Pada', '4th Pada',
];

// ── Yoga names (27 yogas) ───────────────────────────────────────────

const YOGA_NAMES: readonly string[] = [
  'Viskumba', 'Priti', 'Ayusmana', 'Saubhagya', 'Sobana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Sula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyagata', 'Harsana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Siva',
  'Siddha', 'Sadhya', 'Subha', 'Sukla', 'Brahma',
  'Indra', 'Vaidhriti',
];

// ── Muhurta names (30 muhurtas) ─────────────────────────────────────

const MUHURTA_NAMES: readonly string[] = [
  'Rudra', 'Ahi', 'Mitra', 'Pitri', 'Vasu',
  'Varaha', 'Visvedeva', 'Vidhi', 'Sutamukhi', 'Puruhuta',
  'Vahini', 'Naktanakara', 'Varuna', 'Aryaman', 'Bhaga',
  'Girisha', 'Ajapada', 'Ahir-Budhnya', 'Pusya', 'Asvini',
  'Yama', 'Agni', 'Vidhatri', 'Kanda', 'Aditi',
  'Jiva/Amrta', 'Visnu', 'Dyumadgadyuti', 'Brahma', 'Samudram',
];

// ── Planet names ────────────────────────────────────────────────────

const PLANET_NAMES_EN: readonly string[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter',
  'Venus', 'Saturn', 'Rahu', 'Ketu', 'Ascendent',
];

const PLANET_NAMES: readonly string[] = [
  'Surya', 'Chandra', 'Mangala', 'Buddha', 'Guru',
  'Sukra', 'Sani', 'Rahu', 'Ketu', 'Lagna',
];

// ── Child syllables (108 naksatra syllables, 12 rasi syllables) ─────

const CHILD_SYLLABLES: readonly string[] = [
  'chu', 'che', 'cho', 'la',    // asvini
  'li', 'lu', 'le', 'lo',       // bharani
  'a', 'i', 'u', 'e',           // krtika
  'o', 'va', 'vi', 'vo',        // rohini
  've', 'vo', 'ka', 'ke',       // mrgasira
  'ku', 'gha', 'ng', 'chha',    // ardra
  'ke', 'ko', 'ha', 'hi',       // punarvasu
  'hu', 'he', 'ho', 'da',       // pushya
  'di', 'du', 'de', 'do',       // aslesa
  'ma', 'mi', 'mu', 'me',       // magha
  'mo', 'ta', 'ti', 'tu',       // purvaphalguni
  'te', 'to', 'pa', 'pi',       // uttaraphalguni
  'pu', 'sha', 'na', 'tha',     // hasta
  'pe', 'po', 'ra', 'ri',       // chitra
  'ru', 're', 'ra', 'ta',       // svati
  'ti', 'tu', 'te', 'to',       // visakha
  'na', 'ni', 'nu', 'ne',       // anuradha
  'no', 'ya', 'yi', 'yu',       // jyestha
  'ye', 'yo', 'ba', 'bi',       // mula
  'bu', 'dha', 'bha', 'dha',    // purvasada
  'be', 'bo', 'ja', 'ji',       // uttarasada
  'ju', 'je', 'jo', 'gha',      // sravana
  'ga', 'gi', 'gu', 'ge',       // dhanistha
  'go', 'sa', 'si', 'su',       // satabhisda
  'se', 'so', 'da', 'di',       // purvabhadra
  'du', 'tha', 'jna', 'da',     // uttarabhadra
  'de', 'do', 'cha', 'chi',     // revati
];

const CHILD_SYLLABLES_RASI: readonly string[] = [
  'a.. e.. la..', 'u.. ba.. va..', 'ka.. gha..', 'da.. ha..',
  'ma..', 'pa..', 'ra.. ta..', 'na.. ya..',
  'dha.. bha... pha..', 'kha.. ja..', 'ga.. sa.. sha..',
  'da.. ca.. tha.. jha..',
];

// ── Public API ──────────────────────────────────────────────────────

export function getString(i: number): string {
  return gstr[i] ?? '';
}

export function setString(i: number, str: string): void {
  gstr[i] = str;
}

export function getTithiName(n: number): string {
  return TITHI_NAMES[n % 30];
}

export function getNaksatraName(n: number): string {
  return NAKSATRA_NAMES[n % 27];
}

export function getNaksatraPadaText(i: number): string {
  return NAKSATRA_PADA_TEXT[i % 4];
}

export function getYogaName(n: number): string {
  return YOGA_NAMES[n % 27];
}

export function getWeekdayName(n: number): string {
  return gstr[n % 7] ?? '';
}

export function getMuhurtaName(i: number): string {
  return MUHURTA_NAMES[i % 30];
}

export function getSandhyaName(i: number): string {
  switch (i) {
    case 0: return 'Sunrise';
    case 1: return 'Noon';
    case 2: return 'Sunset';
    case 3: return 'Midnight';
    default: return '';
  }
}

export function getKalaName(i: number): string {
  switch (i) {
    case KalaType.KT_RAHU_KALAM: return 'Rahu kalam';
    case KalaType.KT_YAMA_GHANTI: return 'Yama ghanti';
    case KalaType.KT_GULI_KALAM: return 'Guli kalam';
    case KalaType.KT_ABHIJIT: return 'Abhijit muhurta';
    case KalaType.KT_SANDHYA_MIDNIGHT: return 'Midnight sandhya';
    case KalaType.KT_SANDHYA_NOON: return 'Noon sandhya';
    case KalaType.KT_SANDHYA_SUNRISE: return 'Sunrise sandhya';
    case KalaType.KT_SANDHYA_SUNSET: return 'Sunset sandhya';
    default: return 'Special interval';
  }
}

export function getDayPartName(i: number): string {
  return i === 0 ? 'Day' : 'Night';
}

export function getMoonTimesName(i: number): string {
  return i === 0 ? 'Moonrise' : 'Moonset';
}

export function getLongitudeDirectionName(d: number): string {
  return d < 0.0 ? 'West' : 'East';
}

export function getLatitudeDirectionName(d: number): string {
  return d < 0.0 ? 'South' : 'North';
}

export function getPlanetNameEn(i: number): string {
  return PLANET_NAMES_EN[i % 10];
}

export function getPlanetName(i: number): string {
  return PLANET_NAMES[i % 10];
}

export function getNaksatraChildSyllable(n: number, pada: number): string {
  return CHILD_SYLLABLES[(n * 4 + pada) % 108];
}

export function getRasiChildSyllable(n: number): string {
  return CHILD_SYLLABLES_RASI[n % 12];
}

export function getDSTSignature(nDST: number): string {
  return nDST !== 0 ? 'DST' : 'LT';
}

export function getFastingName(fastingID: number): string {
  return FastTypeText[fastingID] ?? '';
}

export function getSpecFestivalName(i: number): string {
  switch (i) {
    case SpecialFestivalId.SPEC_JANMASTAMI:
      return 'Sri Krsna Janmastami: Appearance of Lord Sri Krsna';
    case SpecialFestivalId.SPEC_GAURAPURNIMA:
      return 'Gaura Purnima: Appearance of Sri Caitanya Mahaprabhu';
    case SpecialFestivalId.SPEC_RETURNRATHA:
      return 'Return Ratha (8 days after Ratha Yatra)';
    case SpecialFestivalId.SPEC_HERAPANCAMI:
      return 'Hera Pancami (4 days after Ratha Yatra)';
    case SpecialFestivalId.SPEC_GUNDICAMARJANA:
      return 'Gundica Marjana';
    case SpecialFestivalId.SPEC_GOVARDHANPUJA:
      return 'Go Puja. Go Krda. Govardhana Puja';
    case SpecialFestivalId.SPEC_RAMANAVAMI:
      return 'Rama Navami: Appearance of Lord Sri Ramacandra';
    case SpecialFestivalId.SPEC_RATHAYATRA:
      return 'Ratha Yatra';
    case SpecialFestivalId.SPEC_NANDAUTSAVA:
      return 'Nandotsava';
    case SpecialFestivalId.SPEC_PRABHAPP:
      return 'Srila Prabhupada -- Appearance';
    case SpecialFestivalId.SPEC_MISRAFESTIVAL:
      return 'Festival of Jagannatha Misra';
    default:
      return '';
  }
}

/** printf-style format: replaces {0}, {1}, ... with args */
export function format(fmt: string, ...args: unknown[]): string {
  return fmt.replace(/{(\d+)}/g, (_match, num: string) => {
    const idx = parseInt(num, 10);
    return args[idx] !== undefined ? String(args[idx]) : _match;
  });
}
