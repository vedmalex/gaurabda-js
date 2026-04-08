// IP-based geolocation fallback

import type { GeoCoords } from './geolocation.js';

export interface IPLocationResult extends GeoCoords {
  city?: string;
  country?: string;
  timezone?: string;
}

/** Get approximate location from IP address using a public API.
 *  Uses ip-api.com (free, no API key required, 45 req/min).
 *  Throws on network error or rate limiting. */
export async function getLocationByIP(): Promise<IPLocationResult> {
  const response = await fetch('http://ip-api.com/json/?fields=status,message,country,city,lat,lon,timezone');

  if (!response.ok) {
    throw new Error(`IP location request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error(`IP location failed: ${data.message ?? 'unknown error'}`);
  }

  return {
    latitude: data.lat,
    longitude: data.lon,
    accuracy: 50000, // IP geolocation is ~50km accurate
    city: data.city,
    country: data.country,
    timezone: data.timezone,
  };
}
