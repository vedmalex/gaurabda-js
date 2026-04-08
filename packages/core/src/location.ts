// Converted from js/GCLocation.js (2572 lines) — simplified
// Core functionality: wraps coordinates + timezone into a location
// Deferred: full GCLocation with city search, DST text, encoding

import { EarthData } from './earth-data.js';
import { TimeZone } from './timezone.js';

export class Location {
  city: string = '';
  longitudeDeg: number = 0.0;
  latitudeDeg: number = 0.0;
  countryCode: string = '';
  timezone: TimeZone = TimeZone.getDefault();

  constructor(city?: string, lat?: number, lon?: number, tz?: TimeZone | string) {
    if (city) this.city = city;
    if (lat !== undefined) this.latitudeDeg = lat;
    if (lon !== undefined) this.longitudeDeg = lon;
    if (tz) {
      this.timezone = typeof tz === 'string' ? TimeZone.findByName(tz) : tz;
    }
  }

  get offsetUtcHours(): number {
    return this.timezone.offsetMinutes / 60.0;
  }

  get title(): string {
    return this.city || `${EarthData.getTextLatitude(this.latitudeDeg)}, ${EarthData.getTextLongitude(this.longitudeDeg)}`;
  }

  /** Create an EarthData observation point from this location */
  getEarthData(): EarthData {
    const e = new EarthData();
    e.longitudeDeg = this.longitudeDeg;
    e.latitudeDeg = this.latitudeDeg;
    e.offsetUtcHours = this.offsetUtcHours;
    return e;
  }

  /** Get DST bias for a given date */
  getBiasMinutesForDay(date: import('./gregorian-date-time.js').GregorianDateTime): number {
    return this.timezone.getBiasMinutesForDay(date);
  }

  toString(): string {
    return `${this.title} (${this.timezone})`;
  }

  /** Create a location from coordinates */
  static fromCoords(lat: number, lon: number, timezoneName: string, city?: string): Location {
    return new Location(city ?? '', lat, lon, timezoneName);
  }
}
