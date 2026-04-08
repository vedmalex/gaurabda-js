// Converted from js/GCMasa.js (102 lines)
// FIX: removed gds.getValue(49) global → format is a parameter with default

import { format } from './strings.js';

const MASA_GAUDIYA_NAMES: readonly string[] = [
  'Madhusudana', 'Trivikrama', 'Vamana', 'Sridhara',
  'Hrsikesa', 'Padmanabha', 'Damodara', 'Kesava',
  'Narayana', 'Madhava', 'Govinda', 'Visnu',
  'Purusottama-adhika',
];

const MASA_VEDIC_NAMES: readonly string[] = [
  'Vaisakha', 'Jyestha', 'Asadha', 'Sravana',
  'Bhadra', 'Asvina', 'Kartika', 'Margasirsa',
  'Pausa', 'Magha', 'Phalguna', 'Caitra',
  'Adhika',
];

export function getMasaGaudiyaName(masaID: number): string {
  return MASA_GAUDIYA_NAMES[masaID % 13];
}

export function getMasaVedicName(masaID: number): string {
  return MASA_VEDIC_NAMES[masaID % 13];
}

/** Get masa name with format control.
 *  formatIndex: 0=Gaudiya, 1=Gaudiya(Vedic), 2=Vedic, 3=Vedic(Gaudiya) */
export function getMasaName(masaIndex: number, formatIndex: number = 0): string {
  switch (formatIndex) {
    case 0: return getMasaGaudiyaName(masaIndex);
    case 1: return format('{0} ({1})', getMasaGaudiyaName(masaIndex), getMasaVedicName(masaIndex));
    case 2: return getMasaVedicName(masaIndex);
    case 3: return format('{0} ({1})', getMasaVedicName(masaIndex), getMasaGaudiyaName(masaIndex));
    default: return getMasaGaudiyaName(masaIndex);
  }
}

export function prevMasa(nMasa: number): number {
  return (nMasa + 11) % 12;
}

export function nextMasa(nMasa: number): number {
  return (nMasa + 1) % 12;
}

export function isExtraMasa(nMasa: number): boolean {
  return nMasa === 12;
}

export function masaDist(nMasa: number, nMasa2: number): number {
  let a = nMasa - nMasa2;
  while (a < -6) a += 12;
  return a;
}
