// Converted from js/TTimeZone.js (773 lines)
// FIX: Convert.ToInt32 → toInt32, GCMath.IntFloor → intFloor
// FIX: Convert.FormatD2 → formatD2
// FIX: missing this. on EndDst, StartDst refs
// Data loaded from timezones.json

import { DstTypeChange } from './enums.js';
import { intFloor, toInt32, formatD2 } from './math.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import timezoneData from './data/timezones.json' with { type: 'json' };

// ── DST descriptor ──────────────────────────────────────────────────

export interface DstDescriptor {
  type: number;  // 0=n-th weekday of month, 1=specific date
  month: number; // 1..12
  week: number;  // week number (1-4, 5=last)
  day: number;   // type=0: 0=Sun..6=Sat; type=1: day of month
}

// ── TimeZone JSON shape ─────────────────────────────────────────────

interface TimeZoneRecord {
  name: string;
  offsetMinutes: number;
  biasMinutes: number;
  dstStartType: number;
  dstStartMonth: number;
  dstStartWeek: number;
  dstStartDay: number;
  dstEndType: number;
  dstEndMonth: number;
  dstEndWeek: number;
  dstEndDay: number;
  id: number;
}

const tzList: TimeZoneRecord[] = timezoneData as TimeZoneRecord[];

// ── TimeZone class ──────────────────────────────────────────────────

export class TimeZone {
  name: string = '';
  offsetMinutes: number = 0;
  biasMinutes: number = 0;
  startDst: DstDescriptor = { type: 0, month: 0, week: 0, day: 0 };
  endDst: DstDescriptor = { type: 0, month: 0, week: 0, day: 0 };
  timezoneId: number = 0;

  constructor(rec?: TimeZoneRecord) {
    if (rec) {
      this.name = rec.name;
      this.offsetMinutes = rec.offsetMinutes;
      this.biasMinutes = rec.biasMinutes;
      this.startDst = { type: rec.dstStartType, month: rec.dstStartMonth, week: rec.dstStartWeek, day: rec.dstStartDay };
      this.endDst = { type: rec.dstEndType, month: rec.dstEndMonth, week: rec.dstEndWeek, day: rec.dstEndDay };
      this.timezoneId = rec.id;
    }
  }

  get offsetUtcHours(): number {
    return this.offsetMinutes / 60.0;
  }

  /** Determine DST change type for a given date */
  determineDaylightChange(vc: GregorianDateTime): DstTypeChange {
    const t2 = this.getBiasMinutesForDay(vc);
    const vc3 = vc.clone();
    vc3.previousDay();
    const t1 = this.getBiasMinutesForDay(vc3);

    if (t1 !== 0) {
      return t2 !== 0 ? DstTypeChange.DstOn : DstTypeChange.DstEnd;
    }
    return t2 !== 0 ? DstTypeChange.DstStart : DstTypeChange.DstOff;
  }

  /** Get DST bias in minutes for a given day (0 or biasMinutes) */
  getBiasMinutesForDay(vc: GregorianDateTime): number {
    const biasExists = this.biasMinutes;
    if (biasExists === 0) return 0;

    if (vc.month === this.startDst.month) {
      if (this.startDst.type === 0)
        return this.isEqualOrAfterWeekdayInWeek(vc, this.startDst.week, this.startDst.day) ? biasExists : 0;
      return vc.day >= this.startDst.day ? biasExists : 0;
    }

    if (vc.month === this.endDst.month) {
      if (this.endDst.type === 0)
        return this.isEqualOrAfterWeekdayInWeek(vc, this.endDst.week, this.endDst.day) ? 0 : biasExists;
      return vc.day >= this.endDst.day ? 0 : biasExists;
    }

    if (this.startDst.month > this.endDst.month) {
      // Southern hemisphere (e.g., Australia)
      if (vc.month > this.startDst.month || vc.month < this.endDst.month) return biasExists;
    } else {
      // Northern hemisphere (USA, Europe, Asia)
      if (vc.month > this.startDst.month && vc.month < this.endDst.month) return biasExists;
    }

    return 0;
  }

  /** Check if a date is on or after the n-th weekday of the month */
  private isEqualOrAfterWeekdayInWeek(vc: GregorianDateTime, week: number, weekday: number): boolean {
    const d = vc.clone();
    d.day = 1;
    d.initWeekDay();

    // Find the first occurrence of the weekday
    while (d.weekday !== weekday) {
      d.day++;
      d.dayOfWeek = (d.dayOfWeek + 1) % 7;
    }

    if (week === 5) {
      // "Last" weekday of month
      const maxDays = GregorianDateTime.getMonthMaxDays(d.year, d.month);
      while (d.day + 7 <= maxDays) d.day += 7;
    } else {
      d.day += (week - 1) * 7;
    }

    return vc.day >= d.day;
  }

  toString(): string {
    return `${TimeZone.getOffsetText(this.offsetMinutes / 60.0)} ${this.name}`;
  }

  // ── Static methods ──────────────────────────────────────────────

  static getOffsetText(hours: number): string {
    const sig = hours < 0 ? -1 : 1;
    const d = Math.abs(hours);
    const a4 = intFloor(d);
    const a5 = toInt32((d - a4) * 60);
    return (sig > 0 ? '+' : '-') + a4 + ':' + formatD2(a5);
  }

  static findById(tzid: number): TimeZone {
    const rec = tzList.find(r => r.id === tzid);
    return rec ? new TimeZone(rec) : TimeZone.getDefault();
  }

  static findByName(name: string): TimeZone {
    const rec = tzList.find(r => r.name === name);
    return rec ? new TimeZone(rec) : TimeZone.getDefault();
  }

  static getDefault(): TimeZone {
    const tz = new TimeZone();
    tz.name = 'UTC';
    return tz;
  }

  static getAll(): TimeZone[] {
    return tzList.map(r => new TimeZone(r));
  }
}
