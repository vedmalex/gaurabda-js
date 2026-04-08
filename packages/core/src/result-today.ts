// Converted from js/TResultToday.js (35 lines)
// Simplified: uses EarthData instead of GCLocation

import { ResultCalendar } from './result-calendar.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import { VaisnavaDay } from './vaisnava-day.js';
import type { EarthData } from './earth-data.js';

export class ResultToday {
  calendar: ResultCalendar = new ResultCalendar();
  currentDay: GregorianDateTime = new GregorianDateTime();

  /** Calculate calendar around the given date (4 days before, 4 after) */
  calculate(dateTime: GregorianDateTime, earth: EarthData): void {
    this.currentDay = dateTime.clone();
    this.currentDay.initWeekDay();

    const vc2 = dateTime.clone();
    vc2.TimezoneHours = earth.offsetUtcHours;
    vc2.subtractDays(4);

    this.calendar = new ResultCalendar();
    this.calendar.calculateCalendar(earth, vc2, 9);
  }

  /** Get the VaisnavaDay for the current date */
  getCurrentDay(): VaisnavaDay | null {
    const i = this.calendar.findDate(this.currentDay);
    return this.calendar.getDay(i);
  }
}
