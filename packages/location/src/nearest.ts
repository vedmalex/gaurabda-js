// Nearest city finder using haversine distance

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

const DEG2RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/** Haversine distance in km between two lat/lon points */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG2RAD;
  const dLon = (lon2 - lon1) * DEG2RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG2RAD) * Math.cos(lat2 * DEG2RAD) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NearestResult {
  location: Location;
  distanceKm: number;
}

/** Find the nearest city to given coordinates.
 *  Returns the closest Location from the 2387-city database. */
export function findNearestCity(latitude: number, longitude: number): NearestResult {
  let bestDist = Infinity;
  let bestRec = locations[0];

  for (const rec of locations) {
    const d = haversineDistance(latitude, longitude, rec.latitude, rec.longitude);
    if (d < bestDist) {
      bestDist = d;
      bestRec = rec;
    }
  }

  const tz = TimeZone.findById(bestRec.timezoneId);
  return {
    location: new Location(bestRec.city, bestRec.latitude, bestRec.longitude, tz),
    distanceKm: bestDist,
  };
}

/** Find N nearest cities to given coordinates */
export function findNearestCities(latitude: number, longitude: number, count: number = 5): NearestResult[] {
  const results: { rec: LocationRecord; dist: number }[] = [];

  for (const rec of locations) {
    const d = haversineDistance(latitude, longitude, rec.latitude, rec.longitude);
    results.push({ rec, dist: d });
  }

  results.sort((a, b) => a.dist - b.dist);

  return results.slice(0, count).map(r => {
    const tz = TimeZone.findById(r.rec.timezoneId);
    return {
      location: new Location(r.rec.city, r.rec.latitude, r.rec.longitude, tz),
      distanceKm: r.dist,
    };
  });
}
