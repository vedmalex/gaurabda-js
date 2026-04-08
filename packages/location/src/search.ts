// Location search — city lookup by name with prefix/fuzzy matching

import { Location, TimeZone } from '@gaurabda/core';
import locationsData from '../../core/src/data/locations.json' with { type: 'json' };

interface LocationRecord {
  city: string;
  country: string;
  longitude: number;
  latitude: number;
  utcOffset: number;
  timezoneId: number;
}

const locations: LocationRecord[] = locationsData as LocationRecord[];

// Pre-built lowercase index for fast search
let _index: { lower: string; rec: LocationRecord }[] | null = null;

function getIndex(): { lower: string; rec: LocationRecord }[] {
  if (!_index) {
    _index = locations.map(rec => ({
      lower: `${rec.city} ${rec.country}`.toLowerCase(),
      rec,
    }));
  }
  return _index;
}

export interface SearchOptions {
  /** Max results to return (default: 20) */
  limit?: number;
  /** Filter by country name (case-insensitive) */
  country?: string;
}

/** Convert a location record to a @gaurabda/core Location */
function recordToLocation(rec: LocationRecord): Location {
  const tz = TimeZone.findById(rec.timezoneId);
  return new Location(rec.city, rec.latitude, rec.longitude, tz);
}

/** Search locations by city name (prefix match, case-insensitive).
 *  Returns up to `limit` results sorted by relevance (exact > prefix > contains). */
export function searchLocations(query: string, options?: SearchOptions): Location[] {
  if (!query || query.length < 2) return [];

  const limit = options?.limit ?? 20;
  const countryFilter = options?.country?.toLowerCase();
  const q = query.toLowerCase();

  const exact: LocationRecord[] = [];
  const prefix: LocationRecord[] = [];
  const contains: LocationRecord[] = [];

  for (const entry of getIndex()) {
    if (countryFilter && !entry.lower.includes(countryFilter)) continue;

    const cityLower = entry.rec.city.toLowerCase();
    if (cityLower === q) {
      exact.push(entry.rec);
    } else if (cityLower.startsWith(q)) {
      prefix.push(entry.rec);
    } else if (entry.lower.includes(q)) {
      contains.push(entry.rec);
    }
  }

  const merged = [...exact, ...prefix, ...contains];
  return merged.slice(0, limit).map(recordToLocation);
}

/** Get all available locations (2387 cities) */
export function getAllLocations(): Location[] {
  return locations.map(recordToLocation);
}

/** Get location count */
export function getLocationCount(): number {
  return locations.length;
}
