// Rated/Auspicious Events — scoring system for time slots
// Evaluates auspiciousness of each period of the day based on
// tithi, naksatra, yoga, weekday, kala, and muhurta ratings.

/** Default auspiciousness ratings (1=inauspicious, 3=neutral, 5=very auspicious) */

export const DEFAULT_TITHI_RATINGS: readonly number[] = [
  // Krsna paksa: Pratipat..Amavasya (0-14)
  3, 3, 3, 2, 4, 3, 3, 3, 2, 3, 5, 4, 3, 2, 1,
  // Gaura paksa: Pratipat..Purnima (15-29)
  3, 4, 4, 3, 4, 3, 3, 3, 3, 3, 5, 4, 3, 3, 5,
];

export const DEFAULT_NAKSATRA_RATINGS: readonly number[] = [
  // 27 naksatras: Asvini..Revati
  4, 2, 3, 5, 3, 1, 4, 5, 2, 3, 3, 4, 5, 3, 3,
  3, 4, 2, 2, 3, 4, 5, 3, 3, 3, 4, 4,
];

export const DEFAULT_YOGA_RATINGS: readonly number[] = [
  // 27 yogas: Viskumba..Vaidhriti
  1, 5, 5, 5, 4, 1, 5, 4, 1, 1, 4, 4, 1, 4, 2,
  5, 1, 4, 2, 5, 4, 4, 4, 4, 5, 4, 1,
];

export const DEFAULT_WEEKDAY_RATINGS: readonly number[] = [
  // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  3, 4, 2, 4, 5, 4, 2,
];

export const DEFAULT_MUHURTA_RATINGS: readonly number[] = [
  // 30 muhurtas: Rudra..Samudram (15 day + 15 night)
  1, 2, 4, 3, 4, 3, 4, 5, 3, 4, 3, 2, 3, 4, 3,
  2, 3, 2, 4, 4, 1, 2, 4, 3, 4, 5, 4, 3, 5, 3,
];

export interface RatingConfig {
  tithiRatings: number[];
  naksatraRatings: number[];
  yogaRatings: number[];
  weekdayRatings: number[];
  muhurtaRatings: number[];
  /** Kala penalty (subtracted during Rahu/Yama/Guli kala) */
  kalaPenalty: number;
  /** Minimum score to consider "auspicious" */
  acceptThreshold: number;
}

export function defaultRatingConfig(): RatingConfig {
  return {
    tithiRatings: [...DEFAULT_TITHI_RATINGS],
    naksatraRatings: [...DEFAULT_NAKSATRA_RATINGS],
    yogaRatings: [...DEFAULT_YOGA_RATINGS],
    weekdayRatings: [...DEFAULT_WEEKDAY_RATINGS],
    muhurtaRatings: [...DEFAULT_MUHURTA_RATINGS],
    kalaPenalty: 2,
    acceptThreshold: 15,
  };
}

export interface TimeSlotRating {
  /** Start time as day fraction */
  start: number;
  /** End time as day fraction */
  end: number;
  /** Total score (sum of component ratings) */
  score: number;
  /** Max possible score */
  maxScore: number;
  /** Score as percentage (0-100) */
  percent: number;
  /** Whether this slot meets the accept threshold */
  isAuspicious: boolean;
  /** Label: e.g. "06:00-06:48" */
  label: string;
  /** Muhurta name */
  muhurtaName: string;
  /** Breakdown */
  tithiScore: number;
  naksatraScore: number;
  yogaScore: number;
  weekdayScore: number;
  muhurtaScore: number;
  kalaPenalty: number;
}

/** Calculate auspiciousness ratings for each muhurta of a day.
 *  Returns 30 time slots (15 day + 15 night) with scores. */
export function calculateRatedSlots(
  tithi: number,
  naksatra: number,
  yoga: number,
  weekday: number,
  sunrise: number,
  sunset: number,
  rahuKalaStart: number,
  rahuKalaEnd: number,
  yamaGhantiStart: number,
  yamaGhantiEnd: number,
  guliKalaStart: number,
  guliKalaEnd: number,
  config?: RatingConfig,
): TimeSlotRating[] {
  const cfg = config ?? defaultRatingConfig();
  const MUHURTA_NAMES = [
    'Rudra', 'Ahi', 'Mitra', 'Pitri', 'Vasu',
    'Varaha', 'Visvedeva', 'Vidhi', 'Sutamukhi', 'Puruhuta',
    'Vahini', 'Naktanakara', 'Varuna', 'Aryaman', 'Bhaga',
    'Girisha', 'Ajapada', 'Ahir-Budhnya', 'Pusya', 'Asvini',
    'Yama', 'Agni', 'Vidhatri', 'Kanda', 'Aditi',
    'Jiva/Amrta', 'Visnu', 'Dyumadgadyuti', 'Brahma', 'Samudram',
  ];

  const dayDuration = sunset - sunrise;
  const nightDuration = 1.0 - dayDuration;
  const dayMuhurta = dayDuration / 15;
  const nightMuhurta = nightDuration / 15;

  const tithiScore = cfg.tithiRatings[tithi % 30] ?? 3;
  const naksatraScore = cfg.naksatraRatings[naksatra % 27] ?? 3;
  const yogaScore = cfg.yogaRatings[yoga % 27] ?? 3;
  const weekdayScore = cfg.weekdayRatings[weekday % 7] ?? 3;
  const maxScore = 5 * 5; // 5 components, max 5 each

  const fmtTime = (frac: number) => {
    const h = Math.floor(frac * 24);
    const m = Math.floor((frac * 24 - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const isInKala = (t: number) =>
    (t >= rahuKalaStart && t <= rahuKalaEnd) ||
    (t >= yamaGhantiStart && t <= yamaGhantiEnd) ||
    (t >= guliKalaStart && t <= guliKalaEnd);

  const slots: TimeSlotRating[] = [];

  for (let i = 0; i < 30; i++) {
    const start = i < 15
      ? sunrise + i * dayMuhurta
      : sunset + (i - 15) * nightMuhurta;
    const end = i < 15
      ? sunrise + (i + 1) * dayMuhurta
      : sunset + (i - 14) * nightMuhurta;

    const mid = (start + end) / 2;
    const muhurtaScore = cfg.muhurtaRatings[i % 30] ?? 3;
    const kala = isInKala(mid) ? cfg.kalaPenalty : 0;

    const score = tithiScore + naksatraScore + yogaScore + weekdayScore + muhurtaScore - kala;
    const clampedScore = Math.max(0, score);
    const percent = Math.round((clampedScore / maxScore) * 100);

    slots.push({
      start, end, score: clampedScore, maxScore, percent,
      isAuspicious: clampedScore >= cfg.acceptThreshold,
      label: `${fmtTime(start)}-${fmtTime(end)}`,
      muhurtaName: MUHURTA_NAMES[i] ?? `Muhurta ${i + 1}`,
      tithiScore, naksatraScore, yogaScore, weekdayScore,
      muhurtaScore, kalaPenalty: kala,
    });
  }

  return slots;
}
