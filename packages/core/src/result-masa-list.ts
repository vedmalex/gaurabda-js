// Converted from js/TResultMasaList.js (87 lines)
// Replaced: GCLocation → EarthData

import { AstroData } from './astro-data.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

export interface MasaEntry {
  masa: number;
  year: number;
  vcStart: GregorianDateTime;
  vcEnd: GregorianDateTime;
}

export class ResultMasaList {
  entries: MasaEntry[] = [];
  vcStart: GregorianDateTime = new GregorianDateTime();
  vcEnd: GregorianDateTime = new GregorianDateTime();
  startYear: number = 0;
  countYears: number = 0;

  /** Calculate masa list for a range of years */
  calculateMasaList(earth: EarthData, nYear: number, nCount: number): number {
    const day = new AstroData();
    const d = new GregorianDateTime();
    const de = new GregorianDateTime();

    this.startYear = nYear;
    this.countYears = nCount;
    this.vcStart = AstroData.getFirstDayOfYear(earth, nYear);
    this.vcEnd = AstroData.getFirstDayOfYear(earth, nYear + nCount);
    this.entries = [];

    d.set(this.vcStart);
    de.set(this.vcEnd);

    let prevPaksa = -1;
    let lastMasa = -1;
    let current = -1;

    while (d.isLessThan(de)) {
      day.dayCalc(d, earth);

      if (prevPaksa !== day.sunRise.paksa) {
        day.masaCalc(d, earth);

        if (lastMasa !== day.masa) {
          // close previous entry
          if (current >= 0) {
            const t = d.clone();
            t.previousDay();
            this.entries[current].vcEnd = t;
          }

          // open new entry
          current++;
          lastMasa = day.masa;
          this.entries.push({
            masa: day.masa,
            year: day.gaurabdaYear,
            vcStart: d.clone(),
            vcEnd: d.clone(), // will be overwritten
          });
        }
      }

      prevPaksa = day.sunRise.paksa;
      d.nextDay();
    }

    // close last entry
    if (current >= 0) {
      this.entries[current].vcEnd = d.clone();
    }

    return 1;
  }
}
