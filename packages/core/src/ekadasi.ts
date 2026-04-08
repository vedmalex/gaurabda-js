// Converted from js/GCEkadasi.js (82 lines)

import { MahadvadasiType, CoreEventType } from './enums.js';

const EKADASI_NAMES: readonly string[] = [
  'Varuthini Ekadasi', 'Mohini Ekadasi',
  'Apara Ekadasi', 'Pandava Nirjala Ekadasi',
  'Yogini Ekadasi', 'Sayana Ekadasi',
  'Kamika Ekadasi', 'Pavitraropana Ekadasi',
  'Annada Ekadasi', 'Parsva Ekadasi',
  'Indira Ekadasi', 'Pasankusa Ekadasi',
  'Rama Ekadasi', 'Utthana Ekadasi',
  'Utpanna Ekadasi', 'Moksada Ekadasi',
  'Saphala Ekadasi', 'Putrada Ekadasi',
  'Sat-tila Ekadasi', 'Bhaimi Ekadasi',
  'Vijaya Ekadasi', 'Amalaki vrata Ekadasi',
  'Papamocani Ekadasi', 'Kamada Ekadasi',
  'Parama Ekadasi', 'Padmini Ekadasi',
];

export function getMahadvadasiName(i: number): string | null {
  switch (i) {
    case MahadvadasiType.EV_NULL:
    case MahadvadasiType.EV_SUDDHA:
      return null;
    case MahadvadasiType.EV_UNMILANI:
      return 'Unmilani Mahadvadasi';
    case MahadvadasiType.EV_TRISPRSA:
    case MahadvadasiType.EV_UNMILANI_TRISPRSA:
      return 'Trisprsa Mahadvadasi';
    case MahadvadasiType.EV_PAKSAVARDHINI:
      return 'Paksa vardhini Mahadvadasi';
    case MahadvadasiType.EV_JAYA:
      return 'Jaya Mahadvadasi';
    case MahadvadasiType.EV_VIJAYA:
      return 'Vijaya Mahadvadasi';
    case MahadvadasiType.EV_PAPA_NASINI:
      return 'Papa Nasini Mahadvadasi';
    case MahadvadasiType.EV_JAYANTI:
      return 'Jayanti Mahadvadasi';
    case MahadvadasiType.EV_VYANJULI:
      return 'Vyanjuli Mahadvadasi';
    default:
      return '(Unknown Mahadvadasi)';
  }
}

export function getEkadasiName(nMasa: number, nPaksa: number): string {
  return EKADASI_NAMES[(nMasa * 2 + nPaksa) % 26];
}

export function getParanaReasonText(eparanaType: number): string {
  switch (eparanaType) {
    case CoreEventType.CCTYPE_THIRD_OF_DAY: return '1/3 of daylight';
    case CoreEventType.CCTYPE_TITHI_QUARTER: return '1/4 of tithi';
    case CoreEventType.CCTYPE_S_RISE: return 'sunrise';
    case CoreEventType.CCTYPE_TITHI_END: return 'end of tithi';
    case CoreEventType.CCTYPE_NAKS_END: return 'end of naksatra';
    default: return '';
  }
}
