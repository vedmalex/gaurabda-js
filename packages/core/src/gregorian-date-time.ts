// Converted from js/GregorianDateTime.js (591 lines)
// FIX B10: (int)(...) C# cast -> Math.floor()
// Fixed: missing this. in SetDate, ChangeTimeZone, Format, etc.
// Fixed: (double)(yy/100+49) C# cast -> Math.floor(yy/100+49)

import { toInt32, formatD2, formatD4, formatS2 } from './math.js';
import { intFloor } from './math.js';

const MONTHS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS_LEAP = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_ABR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAME = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export class GregorianDateTime {
  day: number;
  month: number;
  year: number;
  dayOfWeek: number;
  shour: number;
  TimezoneHours: number;

  constructor() {
    const d = new Date();
    this.day = d.getDate();
    this.month = d.getMonth() + 1;
    this.year = d.getFullYear();
    this.dayOfWeek = d.getDay();
    this.shour = 0.5;
    this.TimezoneHours = 0.0;
  }

  clone(): GregorianDateTime {
    const dt = new GregorianDateTime();
    dt.set(this);
    return dt;
  }

  get triplet(): string {
    return `${formatD4(this.year)}-${formatD2(this.month)}-${formatD2(this.day)}`;
  }

  static fromTriplet(str: string): GregorianDateTime {
    const parts = str.split('-');
    if (parts.length === 3) {
      return GregorianDateTime.fromComponents(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10),
        parseInt(parts[2], 10),
      );
    }
    return new GregorianDateTime();
  }

  static fromComponents(year: number, month: number, day: number): GregorianDateTime {
    const d = new GregorianDateTime();
    d.year = year;
    d.month = month;
    d.day = day;
    d.shour = 0.5;
    d.TimezoneHours = 0.0;
    d.initWeekDay();
    return d;
  }

  cloneDays(daysOffset: number): GregorianDateTime {
    const d = this.clone();
    d.addDays(daysOffset);
    return d;
  }

  setOffset(offset: number): this {
    this.TimezoneHours = offset;
    return this;
  }

  set(gdt: GregorianDateTime): this {
    this.day = gdt.day;
    this.month = gdt.month;
    this.year = gdt.year;
    this.shour = gdt.shour;
    this.dayOfWeek = gdt.dayOfWeek;
    this.TimezoneHours = gdt.TimezoneHours;
    return this;
  }

  setDate(nYear: number, nMonth: number, nDay: number): void {
    this.day = nDay;
    this.month = nMonth;
    this.year = nYear;
    this.shour = 0.5;
    this.TimezoneHours = 0.0;
    this.initWeekDay();
  }

  toString(): string {
    return this.format('{day} {monthAbr} {year}');
  }

  get weekday(): number {
    return this.dayOfWeek;
  }

  shortTimeString(): string {
    return `${formatD2(this.getHour())}:${formatD2(this.getMinute())}`;
  }

  longTimeString(): string {
    return `${formatD2(this.getHour())}:${formatD2(this.getMinute())}:${formatD2(this.getSecond())}`;
  }

  cStr(): string {
    return `${formatS2(this.day)} ${GregorianDateTime.getMonthAbreviation(this.month)} ${formatD4(this.year)}  ${formatD2(this.getHour())}:${formatD2(this.getMinute())}:${formatD2(this.getSecond())}`;
  }

  fullString(): string {
    return this.cStr();
  }

  // FIX B10: (int)(...) C# cast -> Math.floor()
  static timeSpanToLongString(seconds: number): string {
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);
    return `${formatD2(h)}:${formatD2(m)}:${formatD2(s)}`;
  }

  format(fmt: string): string {
    let sb = fmt;
    if (sb.includes('{day}')) sb = sb.replace('{day}', this.day.toString());
    if (sb.includes('{month}')) sb = sb.replace('{month}', this.month.toString());
    if (sb.includes('{monthAbr}')) sb = sb.replace('{monthAbr}', GregorianDateTime.getMonthAbreviation(this.month));
    if (sb.includes('{monthName}')) sb = sb.replace('{monthName}', GregorianDateTime.getMonthName(this.month));
    if (sb.includes('{hour}')) sb = sb.replace('{hour}', formatD2(this.getHour()));
    if (sb.includes('{min}')) sb = sb.replace('{min}', formatD2(this.getMinute()));
    if (sb.includes('{minRound}')) sb = sb.replace('{minRound}', formatD2(this.getMinuteRound()));
    if (sb.includes('{sec}')) sb = sb.replace('{sec}', formatD2(this.getSecond()));
    if (sb.includes('{year}')) sb = sb.replace('{year}', this.year.toString());
    return sb;
  }

  static getMonthMaxDays(year: number, month: number): number {
    if (GregorianDateTime.isLeapYear(year)) return MONTHS_LEAP[month];
    return MONTHS[month];
  }

  static isLeapYear(year: number): boolean {
    if ((year % 4) === 0) {
      if ((year % 100 === 0) && (year % 400 !== 0)) return false;
      return true;
    }
    return false;
  }

  getJulianInteger(): number {
    const yy = this.year - toInt32((12 - this.month) / 10);
    let mm = this.month + 9;
    if (mm >= 12) mm -= 12;

    const k1 = toInt32(Math.floor(365.25 * (yy + 4712)));
    const k2 = toInt32(Math.floor(30.6 * mm + 0.5));
    const yy100 = intFloor(yy / 100);
    const k3 = toInt32(Math.floor(Math.floor(yy100 + 49) * 0.75)) - 38;
    let j = k1 + k2 + this.day + 59;
    if (j > 2299160) j -= k3;
    return j;
  }

  getJulian(): number {
    return 1.0 * this.getJulianInteger();
  }

  normalizeValues(): void {
    if (this.shour < 0.0) {
      this.day--;
      this.shour += 1.0;
    } else if (this.shour >= 1.0) {
      this.shour -= 1.0;
      this.day++;
    }
    if (this.day < 1) {
      this.month--;
      if (this.month < 1) {
        this.month = 12;
        this.year--;
      }
      this.day = GregorianDateTime.getMonthMaxDays(this.year, this.month);
    } else if (this.day > GregorianDateTime.getMonthMaxDays(this.year, this.month)) {
      this.month++;
      if (this.month > 12) {
        this.month = 1;
        this.year++;
      }
      this.day = 1;
    }
  }

  previousDay(): this {
    this.day--;
    if (this.day < 1) {
      this.month--;
      if (this.month < 1) {
        this.month = 12;
        this.year--;
      }
      this.day = GregorianDateTime.getMonthMaxDays(this.year, this.month);
    }
    this.dayOfWeek = (this.dayOfWeek + 6) % 7;
    return this;
  }

  nextDay(): this {
    this.day++;
    if (this.day > GregorianDateTime.getMonthMaxDays(this.year, this.month)) {
      this.month++;
      if (this.month > 12) {
        this.month = 1;
        this.year++;
      }
      this.day = 1;
    }
    this.dayOfWeek = (this.dayOfWeek + 1) % 7;
    return this;
  }

  addDays(n: number): this {
    if (n < 0) {
      return this.subtractDays(-n);
    }
    for (let i = 0; i < n; i++) {
      this.nextDay();
    }
    return this;
  }

  subtractDays(n: number): this {
    if (n < 0) {
      this.addDays(-n);
    } else {
      for (let i = 0; i < n; i++) {
        this.previousDay();
      }
    }
    return this;
  }

  setFromJulian(julianUtcDate: number): void {
    const z = Math.floor(julianUtcDate + 0.5);
    const f = (julianUtcDate + 0.5) - z;

    let A: number;
    if (z < 2299161.0) {
      A = z;
    } else {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      A = z + 1.0 + alpha - Math.floor(alpha / 4.0);
    }

    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);

    this.day = toInt32(Math.floor(B - D - Math.floor(30.6001 * E) + f));
    this.month = toInt32((E < 14) ? E - 1 : E - 13);
    this.year = toInt32((this.month > 2) ? C - 4716 : C - 4715);
    this.TimezoneHours = 0.0;
    this.shour = julianUtcDate + 0.5 - Math.floor(julianUtcDate + 0.5);
  }

  changeTimeZone(tZone: number): void {
    this.shour += (tZone - this.TimezoneHours) / 24;
    this.normalizeValues();
    this.TimezoneHours = tZone;
  }

  addHours(ndst: number): void {
    this.shour += ndst / 24.0;
    this.normalizeValues();
  }

  timeWithOffset(p: number): GregorianDateTime {
    const dt = this.clone();
    dt.shour += p;
    dt.normalizeValues();
    return dt;
  }

  getJulianDetailed(): number {
    return this.getJulian() - 0.5 + this.shour;
  }

  getJulianComplete(): number {
    return this.getJulian() - 0.5 + this.shour - this.TimezoneHours / 24.0;
  }

  initWeekDay(): this {
    this.dayOfWeek = (this.getJulianInteger() + 1) % 7;
    return this;
  }

  getHour(): number {
    return toInt32(Math.floor(this.shour * 24));
  }

  getMinute(): number {
    return toInt32(Math.floor((this.shour * 24 - Math.floor(this.shour * 24)) * 60));
  }

  getMinuteRound(): number {
    return toInt32(Math.floor((this.shour * 24 - Math.floor(this.shour * 24)) * 60 + 0.5));
  }

  getSecond(): number {
    return toInt32(Math.floor((this.shour * 1440 - Math.floor(this.shour * 1440)) * 60));
  }

  getDayInteger(): number {
    return this.year * 384 + this.month * 32 + this.day;
  }

  compareYMD(v: GregorianDateTime): number {
    return this.getDayInteger() - v.getDayInteger();
  }

  equalDay(v: GregorianDateTime): boolean {
    return this.day === v.day && this.month === v.month && this.year === v.year;
  }

  static compare(a: GregorianDateTime, b: GregorianDateTime): number {
    if (a.year < b.year) return -1;
    if (a.year > b.year) return 1;
    if (a.month < b.month) return -1;
    if (a.month > b.month) return 1;
    if (a.day < b.day) return -1;
    if (a.day > b.day) return 1;
    if (a.shour < b.shour) return -1;
    if (a.shour > b.shour) return 1;
    return 0;
  }

  isLessOrEqualsTo(date: GregorianDateTime): boolean {
    const d1 = this.clone();
    const d2 = date.clone();
    d1.normalizeValues();
    d2.normalizeValues();
    return d1.getDayInteger() <= d2.getDayInteger();
  }

  isLessThan(date: GregorianDateTime): boolean {
    const d1 = this.clone();
    const d2 = date.clone();
    d1.normalizeValues();
    d2.normalizeValues();
    return d1.getDayInteger() < d2.getDayInteger();
  }

  isDateEqual(date: GregorianDateTime): boolean {
    const d1 = this.clone();
    const d2 = date.clone();
    d1.normalizeValues();
    d2.normalizeValues();
    return d1.year === d2.year && d1.month === d2.month && d1.day === d2.day;
  }

  static getMonthAbreviation(month: number): string {
    return MONTH_ABR[month] ?? '';
  }

  static getMonthName(month: number): string {
    return MONTH_NAME[month] ?? '';
  }

  static calculateJulianDay(year: number, month: number, day: number): number {
    const yy = year - toInt32((12 - month) / 10);
    let mm = month + 9;
    if (mm >= 12) mm -= 12;

    const k1 = toInt32(Math.floor(365.25 * (yy + 4712)));
    const k2 = toInt32(Math.floor(30.6 * mm + 0.5));
    const k3 = toInt32(Math.floor(Math.floor(yy / 100 + 49) * 0.75)) - 38;
    let j = k1 + k2 + day + 59;
    if (j > 2299160) j -= k3;
    return j * 1.0;
  }

  isEqualOrAfterWeekdayInWeek(weekNumber: number, dayNumber: number): boolean {
    const xx = [1, 7, 6, 5, 4, 3, 2];
    const dowFirstDay = xx[(7 + this.day - this.dayOfWeek) % 7];
    const firstGivenWeekday = xx[(dowFirstDay - dayNumber + 7) % 7];

    let requiredGivenWeekday: number;
    if (weekNumber < 0 || weekNumber >= 5) {
      requiredGivenWeekday = firstGivenWeekday + 28;
      const lastDayInMonth = GregorianDateTime.getMonthMaxDays(this.year, this.month);
      while (requiredGivenWeekday > lastDayInMonth) {
        requiredGivenWeekday -= 7;
      }
    } else {
      requiredGivenWeekday = toInt32(firstGivenWeekday + (weekNumber - 1) * 7);
    }

    return this.day >= requiredGivenWeekday;
  }

  getEncodedString(): string {
    return `${this.year}|${this.month}|${this.day}|${this.shour}|${this.TimezoneHours}|${this.dayOfWeek}`;
  }

  setEncodedString(value: string): void {
    const a = value.split('|');
    if (a.length >= 6) {
      this.year = parseInt(a[0], 10);
      this.month = parseInt(a[1], 10);
      this.day = parseInt(a[2], 10);
      this.shour = parseFloat(a[3]);
      this.TimezoneHours = parseFloat(a[4]);
      this.dayOfWeek = parseInt(a[5], 10);
    }
  }
}
