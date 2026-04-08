// Browser Geolocation API wrapper

export interface GeoCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Use high accuracy GPS (default: true) */
  highAccuracy?: boolean;
}

/** Get current position from browser Geolocation API.
 *  Throws if geolocation is unavailable or user denies permission. */
export async function getCurrentPosition(options?: GeolocationOptions): Promise<GeoCoords> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation API is not available');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(new Error(`Geolocation error: ${err.message}`));
      },
      {
        enableHighAccuracy: options?.highAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: 60000,
      },
    );
  });
}

/** Check if Geolocation API is available in the current environment */
export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}
