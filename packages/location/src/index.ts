// @gaurabda/location — Location services for the Vedic calendar
// Framework-agnostic: pure async functions, works in browser and Node.js

export { searchLocations, getAllLocations, getLocationCount } from './search.js';
export type { SearchOptions } from './search.js';

export { findNearestCity, findNearestCities, haversineDistance } from './nearest.js';
export type { NearestResult } from './nearest.js';

export { getCurrentPosition, isGeolocationAvailable } from './geolocation.js';
export type { GeoCoords, GeolocationOptions } from './geolocation.js';

export { getLocationByIP } from './ip-location.js';
export type { IPLocationResult } from './ip-location.js';

// Re-export core Location for convenience
export { Location, TimeZone, EarthData } from '@gaurabda/core';

// ── Unified location resolver ───────────────────────────────────────

import type { GeoCoords } from './geolocation.js';
import { getCurrentPosition, isGeolocationAvailable } from './geolocation.js';
import { getLocationByIP } from './ip-location.js';
import { findNearestCity } from './nearest.js';
import { Location } from '@gaurabda/core';

export type LocationSource = 'gps' | 'ip' | 'manual' | 'search';

export interface ResolvedLocation {
  location: Location;
  source: LocationSource;
  coords: GeoCoords;
  distanceKm: number;
}

/** Try to resolve user location automatically: GPS first, then IP fallback.
 *  Returns the nearest city from the database. */
export async function resolveLocation(): Promise<ResolvedLocation> {
  // Try GPS first
  if (isGeolocationAvailable()) {
    try {
      const coords = await getCurrentPosition({ timeout: 5000 });
      const nearest = findNearestCity(coords.latitude, coords.longitude);
      return {
        location: nearest.location,
        source: 'gps',
        coords,
        distanceKm: nearest.distanceKm,
      };
    } catch {
      // GPS failed (denied or timeout), fall through to IP
    }
  }

  // Try IP fallback
  try {
    const ipResult = await getLocationByIP();
    const nearest = findNearestCity(ipResult.latitude, ipResult.longitude);
    return {
      location: nearest.location,
      source: 'ip',
      coords: ipResult,
      distanceKm: nearest.distanceKm,
    };
  } catch {
    // IP also failed
  }

  // Default: no location resolved — caller should prompt for manual input
  throw new Error('Could not resolve location automatically. Please enter location manually.');
}
