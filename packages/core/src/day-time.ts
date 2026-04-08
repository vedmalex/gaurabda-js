// Converted from js/GCDayHours.js (DAYTIME class)
// Fixed: ScalarValue() used this.milli/this.minute instead of this.mili/this.min
// Fixed: SetDegTime() missing this. on hour, min, sec
// Fixed: GetDayTime() used double() C# cast

import { putIn360 } from './math.js';
import { formatD2 } from './math.js';

export class DayTime {
  hour: number = 0;
  min: number = 0;
  sec: number = 0;
  mili: number = 0;

  setDayTime(d: number): void {
    let timeHr: number;

    timeHr = d * 24;
    this.hour = Math.floor(timeHr);

    timeHr -= this.hour;
    timeHr *= 60;
    this.min = Math.floor(timeHr);

    timeHr -= this.min;
    timeHr *= 60;
    this.sec = Math.floor(timeHr);

    timeHr -= this.sec;
    timeHr *= 1000;
    this.mili = Math.floor(timeHr);
  }

  setValue(i: number): void {
    this.hour = this.min = this.sec = this.mili = i;
  }

  set(d: DayTime): void {
    this.hour = d.hour;
    this.min = d.min;
    this.sec = d.sec;
    this.mili = d.mili;
  }

  scalarValue(): number {
    // Fixed: was this.milli/this.minute (wrong field names)
    return this.mili / 1000 + this.sec + this.min * 60 + this.hour * 3600;
  }

  isGreaterThan(dt: DayTime): boolean {
    return this.scalarValue() > dt.scalarValue();
  }

  isLessThan(dt: DayTime): boolean {
    return this.scalarValue() < dt.scalarValue();
  }

  isGreaterOrEqualThan(dt: DayTime): boolean {
    return this.scalarValue() >= dt.scalarValue();
  }

  isLessOrEqualThan(dt: DayTime): boolean {
    return this.scalarValue() <= dt.scalarValue();
  }

  addMinutes(mn: number): void {
    this.min += mn;
    while (this.min < 0) { this.min += 60; this.hour--; }
    while (this.min > 59) { this.min -= 60; this.hour++; }
  }

  getDayTime(): number {
    // Fixed: was double() C# cast
    return ((this.hour * 60.0 + this.min) * 60.0 + this.sec) / 86400.0;
  }

  setDegTime(timeDeg: number): void {
    let timeHr: number;
    timeDeg = putIn360(timeDeg);

    timeHr = timeDeg / 360 * 24;
    this.hour = Math.floor(timeHr);

    // Fixed: was missing this. on hour, min, sec
    timeHr -= this.hour;
    timeHr *= 60;
    this.min = Math.floor(timeHr);

    timeHr -= this.min;
    timeHr *= 60;
    this.sec = Math.floor(timeHr);

    timeHr -= this.sec;
    timeHr *= 1000;
    this.mili = Math.floor(timeHr);
  }

  toLongTimeString(): string {
    return `${formatD2(this.hour)}:${formatD2(this.min)}:${formatD2(this.sec)}`;
  }

  toShortTimeString(): string {
    return `${formatD2(this.hour)}:${formatD2(this.min)}`;
  }
}
