// Shared location state — persisted in localStorage
// Used by all pages that need calendar calculations

import {
  Location, EarthData, TimeZone,
  GregorianDateTime, ResultCalendar, AstroData,
  getMasaName, getTithiName, getNaksatraName, getYogaName,
  getPaksaName, getEkadasiName, getMahadvadasiName,
  getFastingName, getDSTSignature,
} from '@gaurabda/core';

const STORAGE_KEY = 'gaurabda_location';

// Default: Mayapur, India
const DEFAULT_LOCATION = {
  city: 'Mayapur',
  lat: 23.42,
  lon: 88.39,
  tz: 'Asia/Calcutta',
};

export interface StoredLocation {
  city: string;
  lat: number;
  lon: number;
  tz: string;
}

export function loadLocation(): StoredLocation {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
  }
  return DEFAULT_LOCATION;
}

export function saveLocation(loc: StoredLocation): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }
}

export function toLocation(stored: StoredLocation): Location {
  return new Location(stored.city, stored.lat, stored.lon, stored.tz);
}

export function toEarthData(stored: StoredLocation): EarthData {
  return toLocation(stored).getEarthData();
}

/** Get today's date as GregorianDateTime with timezone */
export function todayDate(stored: StoredLocation): GregorianDateTime {
  const now = new Date();
  const d = GregorianDateTime.fromComponents(now.getFullYear(), now.getMonth() + 1, now.getDate());
  d.TimezoneHours = TimeZone.findByName(stored.tz).offsetUtcHours;
  return d;
}

// Re-export commonly used functions for convenience in components
export {
  ResultCalendar, AstroData, GregorianDateTime, Location, EarthData,
  getMasaName, getTithiName, getNaksatraName, getYogaName,
  getPaksaName, getEkadasiName, getMahadvadasiName,
  getFastingName, getDSTSignature,
};
