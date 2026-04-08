// Intraday astronomical events: sandhya times, brahma muhurta, muhurta grid
// All times as day fractions (0.0 = midnight, 0.5 = noon, 1.0 = next midnight)

/** Sandhya (twilight prayer) times centered on sun events.
 *  Duration: ±24 minutes from center point. */
export interface SandhyaTimes {
  /** Gayatri: morning sandhya centered on sunrise */
  gayatriStart: number;
  gayatriEnd: number;
  /** Savitri: noon sandhya centered on solar noon */
  savitriStart: number;
  savitriEnd: number;
  /** Saraswati: evening sandhya centered on sunset */
  saraswatiStart: number;
  saraswatiEnd: number;
}

const SANDHYA_HALF_DURATION = 24 / 1440; // 24 minutes in day fraction

/** Calculate Gayatri/Savitri/Saraswati sandhya times from sun events.
 *  All inputs/outputs as day fractions. */
export function calculateSandhyaTimes(sunrise: number, noon: number, sunset: number): SandhyaTimes {
  return {
    gayatriStart: sunrise - SANDHYA_HALF_DURATION,
    gayatriEnd: sunrise + SANDHYA_HALF_DURATION,
    savitriStart: noon - SANDHYA_HALF_DURATION,
    savitriEnd: noon + SANDHYA_HALF_DURATION,
    saraswatiStart: sunset - SANDHYA_HALF_DURATION,
    saraswatiEnd: sunset + SANDHYA_HALF_DURATION,
  };
}

/** Brahma muhurta: 2 muhurtas (96 min) before sunrise.
 *  Returns [start, end] as day fractions. */
export function calculateBrahmaMuhurta(sunrise: number): [start: number, end: number] {
  // Standard: 96 min before sunrise to 48 min before sunrise
  const start = sunrise - 96 / 1440;
  const end = sunrise - 48 / 1440;
  return [start, end];
}

/** Calculate all 30 day muhurtas (15 day + 15 night).
 *  Each muhurta is 1/15 of daytime or nighttime.
 *  Returns array of [start, end] pairs as day fractions. */
export function calculateMuhurtas(sunrise: number, sunset: number): [start: number, end: number][] {
  const dayDuration = sunset - sunrise;
  const nightDuration = 1.0 - dayDuration;
  const dayMuhurta = dayDuration / 15;
  const nightMuhurta = nightDuration / 15;

  const muhurtas: [number, number][] = [];

  // 15 day muhurtas
  for (let i = 0; i < 15; i++) {
    muhurtas.push([sunrise + i * dayMuhurta, sunrise + (i + 1) * dayMuhurta]);
  }

  // 15 night muhurtas
  for (let i = 0; i < 15; i++) {
    muhurtas.push([sunset + i * nightMuhurta, sunset + (i + 1) * nightMuhurta]);
  }

  return muhurtas;
}
