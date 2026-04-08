// Converted from js/GCHourTime.js (335 lines)
// FIX B8: Math.Floor -> Math.floor (lines 50, 69, 89)
// Fixed: TotalHours used bare `min` instead of `this.min` (line 114)
// Fixed: GetDayTime() used bare `TotalDays` instead of `this.totalDays`
// Fixed: duplicate GetDayTime methods merged

import { putIn360, intFloor, toInt32, formatD2 } from './math.js';
import { getRasi } from './rasi.js';

export class HourTime {
  hour: number = 0;
  min: number = 0;
  sec: number = 0;
  mili: number = 0;
  longitude: number = 0.0;
  longitudeMoon: number = 0.0;
  ayanamsa: number = 0.0;

  static fromObject(obj: HourTime): HourTime {
    const ht = new HourTime();
    ht.setFrom(obj);
    return ht;
  }

  setFrom(rise: HourTime): void {
    this.hour = rise.hour;
    this.min = rise.min;
    this.sec = rise.sec;
    this.mili = rise.mili;
    this.longitude = 0.0;
    this.longitudeMoon = 0.0;
    this.ayanamsa = rise.ayanamsa;
  }

  static create(rise: HourTime, minuteOffset: number): HourTime {
    const nt = new HourTime();
    nt.setFrom(rise);
    nt.addMinutes(minuteOffset);
    return nt;
  }

  get tithi(): number {
    const d = putIn360(this.longitudeMoon - this.longitude - 180.0) / 12.0;
    return intFloor(d);
  }

  // FIX B8: was Math.Floor (C# casing)
  get tithiElapse(): number {
    const d = putIn360(this.longitudeMoon - this.longitude - 180.0) / 12.0;
    return (d - Math.floor(d)) * 100.0;
  }

  get paksa(): number {
    return this.tithi >= 15 ? 1 : 0;
  }

  get naksatra(): number {
    let d = putIn360(this.longitudeMoon - this.ayanamsa);
    d = (d * 3.0) / 40.0;
    return intFloor(d);
  }

  // FIX B8: was Math.Floor (C# casing)
  get naksatraElapse(): number {
    let d = putIn360(this.longitudeMoon - this.ayanamsa);
    d = (d * 3.0) / 40.0;
    return (d - Math.floor(d)) * 100.0;
  }

  get naksatraPada(): number {
    return intFloor(this.naksatraElapse / 25.0);
  }

  get yoga(): number {
    let d = putIn360(this.longitudeMoon + this.longitude - 2 * this.ayanamsa);
    d = (d * 3.0) / 40.0;
    return intFloor(d);
  }

  // FIX B8: was Math.Floor (C# casing)
  get yogaElapse(): number {
    let d = putIn360(this.longitudeMoon + this.longitude - 2 * this.ayanamsa);
    d = (d * 3.0) / 40.0;
    return (d - Math.floor(d)) * 100.0;
  }

  /** Naksatra of the Sun (0..26) */
  get sunNaksatra(): number {
    let d = putIn360(this.longitude - this.ayanamsa);
    d = (d * 3.0) / 40.0;
    return intFloor(d);
  }

  get sunNaksatraElapse(): number {
    let d = putIn360(this.longitude - this.ayanamsa);
    d = (d * 3.0) / 40.0;
    return (d - Math.floor(d)) * 100.0;
  }

  get sunNaksatraPada(): number {
    return intFloor(this.sunNaksatraElapse / 25.0);
  }

  get rasiOfSun(): number {
    return getRasi(this.longitude, this.ayanamsa);
  }

  get rasiOfMoon(): number {
    return getRasi(this.longitudeMoon, this.ayanamsa);
  }

  get totalDays(): number {
    return this.hour / 24.0 + this.min / 1440.0 + this.sec / 86400.0 + this.mili / 86400000.0;
  }

  set totalDays(value: number) {
    this.setDayTime(value);
  }

  // Fixed: was bare `min` without this.
  get totalHours(): number {
    return this.hour + this.min / 60.0 + this.sec / 3600.0 + this.mili / 3600000.0;
  }

  get totalMinutes(): number {
    return this.hour * 60.0 + this.min + this.sec / 60.0 + this.mili / 60000.0;
  }

  get totalSeconds(): number {
    return this.hour * 3600.0 + this.min * 60.0 + this.sec + this.mili / 1000.0;
  }

  isGreaterThan(dt: HourTime): boolean {
    if (this.hour !== dt.hour) return this.hour > dt.hour;
    if (this.min !== dt.min) return this.min > dt.min;
    if (this.sec !== dt.sec) return this.sec > dt.sec;
    return this.mili > dt.mili;
  }

  isLessThan(dt: HourTime): boolean {
    if (this.hour !== dt.hour) return this.hour < dt.hour;
    if (this.min !== dt.min) return this.min < dt.min;
    if (this.sec !== dt.sec) return this.sec < dt.sec;
    return this.mili < dt.mili;
  }

  isGreaterOrEqualThan(dt: HourTime): boolean {
    return !this.isLessThan(dt);
  }

  isLessOrEqualThan(dt: HourTime): boolean {
    return !this.isGreaterThan(dt);
  }

  addMinutes(mn: number): void {
    this.min += toInt32(Math.floor(mn));
    while (this.min < 0) { this.min += 60; this.hour--; }
    while (this.min > 59) { this.min -= 60; this.hour++; }
  }

  // Merged: two GetDayTime overloads -> getDayTime with optional param
  getDayTime(dstOffsetHours?: number): number {
    if (dstOffsetHours !== undefined) {
      return (((this.hour + dstOffsetHours) * 60.0 + this.min) * 60.0 + this.sec) / 86400.0;
    }
    return this.totalDays;
  }

  setValue(i: number): void {
    this.hour = this.min = this.sec = this.mili = i;
  }

  setDayTime(d: number): this {
    let timeHr = d * 24.0;
    this.hour = toInt32(Math.floor(timeHr));

    timeHr -= this.hour;
    timeHr *= 60;
    this.min = toInt32(Math.floor(timeHr));

    timeHr -= this.min;
    timeHr *= 60;
    this.sec = toInt32(Math.floor(timeHr));

    timeHr -= this.sec;
    timeHr *= 1000;
    this.mili = toInt32(Math.floor(timeHr));

    return this;
  }

  setDegTime(timeDeg: number): void {
    timeDeg = putIn360(timeDeg);

    let timeHr = timeDeg / 360 * 24;
    this.hour = toInt32(Math.floor(timeHr));

    timeHr -= this.hour;
    timeHr *= 60;
    this.min = toInt32(Math.floor(timeHr));

    timeHr -= this.min;
    timeHr *= 60;
    this.sec = toInt32(Math.floor(timeHr));

    timeHr -= this.sec;
    timeHr *= 1000;
    this.mili = toInt32(Math.floor(timeHr));
  }

  toLongTimeString(): string {
    return `${formatD2(this.hour)}:${formatD2(this.min)}:${formatD2(this.sec)}`;
  }

  toShortTimeString(): string {
    return `${formatD2(this.hour)}:${formatD2(this.min)}`;
  }

  toString(): string {
    return `${formatD2(this.hour)}:${formatD2(this.min)}`;
  }
}
