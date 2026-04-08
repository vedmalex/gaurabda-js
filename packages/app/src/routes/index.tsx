import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData, todayDate,
  ResultCalendar, getMasaName, getTithiName, getNaksatraName,
  getYogaName, getPaksaName,
  getFastingName, getDSTSignature, GregorianDateTime,
} from '~/components/location-store';
import {
  FastType, getRasiName, calculateSandhyaTimes, calculateBrahmaMuhurta,
  SunData, KalaType, getGrahaPositions,
  getNaksatraChildSyllable, getRasiChildSyllable,
  EarthData,
} from '@gaurabda/core';

interface TodayData {
  date: string;
  weekday: string;
  location: string;
  sunrise: string;
  noon: string;
  sunset: string;
  tithi: string;
  tithiElapse: string;
  naksatra: string;
  naksatraElapse: string;
  sunNaksatra: string;
  sunRasi: string;
  yoga: string;
  yogaElapse: string;
  paksa: string;
  masa: string;
  gaurabdaYear: number;
  dstSig: string;
  fasting: string | null;
  ekadasiName: string | null;
  paranaText: string | null;
  brahmaMuhurta: string;
  gayatri: string;
  savitri: string;
  saraswati: string;
  rahuKala: string;
  yamaGhanti: string;
  guliKala: string;
  ascendant: string;
  childNameNaksatra: string;
  childNameRasi: string;
  grahas: { name: string; nameSanskrit: string; rasi: string; naksatra: string }[];
  events: string[];
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default component$(() => {
  const data = useSignal<TodayData | null>(null);

  useVisibleTask$(() => {
    const stored = loadLocation();
    const earth = toEarthData(stored);
    const today = todayDate(stored);

    const cal = new ResultCalendar();
    cal.calculateCalendar(earth, today, 3);

    const dayIdx = cal.findDate(today);
    const day = cal.getDay(dayIdx);
    if (!day || !day.date) return;

    const astro = day.astrodata;
    const sr = astro.sunRise;

    const events: string[] = [];
    for (const ev of day.dayEvents) {
      events.push(ev.text);
    }

    // Sandhya & Brahma muhurta
    const sandhya = calculateSandhyaTimes(sr.totalDays, astro.sunNoon.totalDays, astro.sunSet.totalDays);
    const [bmStart, bmEnd] = calculateBrahmaMuhurta(sr.totalDays);
    const fmtTime = (frac: number) => {
      const h = Math.floor(frac * 24);
      const m = Math.floor((frac * 24 - h) * 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    data.value = {
      date: `${day.date.day} ${GregorianDateTime.getMonthName(day.date.month)} ${day.date.year}`,
      weekday: WEEKDAYS[day.date.weekday] ?? '',
      location: stored.city,
      sunrise: sr.toLongTimeString(),
      noon: astro.sunNoon.toLongTimeString(),
      sunset: astro.sunSet.toLongTimeString(),
      tithi: getTithiName(sr.tithi),
      tithiElapse: sr.tithiElapse.toFixed(1) + '%',
      naksatra: getNaksatraName(sr.naksatra),
      naksatraElapse: sr.naksatraElapse.toFixed(1) + '%',
      sunNaksatra: getNaksatraName(sr.sunNaksatra),
      sunRasi: getRasiName(sr.rasiOfSun),
      yoga: getYogaName(sr.yoga),
      yogaElapse: sr.yogaElapse.toFixed(1) + '%',
      paksa: getPaksaName(sr.paksa),
      masa: getMasaName(astro.masa),
      gaurabdaYear: astro.gaurabdaYear,
      dstSig: getDSTSignature(day.biasMinutes),
      fasting: day.nFastID !== FastType.FAST_NULL ? getFastingName(day.nFastID) : null,
      ekadasiName: day.ekadasi_vrata_name || null,
      paranaText: day.ekadasi_parana ? 'Break fast today' : null,
      brahmaMuhurta: `${fmtTime(bmStart)} - ${fmtTime(bmEnd)}`,
      gayatri: `${fmtTime(sandhya.gayatriStart)} - ${fmtTime(sandhya.gayatriEnd)}`,
      savitri: `${fmtTime(sandhya.savitriStart)} - ${fmtTime(sandhya.savitriEnd)}`,
      saraswati: `${fmtTime(sandhya.saraswatiStart)} - ${fmtTime(sandhya.saraswatiEnd)}`,
      rahuKala: (() => {
        const [r1, r2] = SunData.calculateKala(sr.totalDays, astro.sunSet.totalDays, day.date!.weekday, KalaType.KT_RAHU_KALAM);
        return r1 >= 0 ? `${fmtTime(r1)} - ${fmtTime(r2)}` : 'N/A';
      })(),
      yamaGhanti: (() => {
        const [r1, r2] = SunData.calculateKala(sr.totalDays, astro.sunSet.totalDays, day.date!.weekday, KalaType.KT_YAMA_GHANTI);
        return r1 >= 0 ? `${fmtTime(r1)} - ${fmtTime(r2)}` : 'N/A';
      })(),
      guliKala: (() => {
        const [r1, r2] = SunData.calculateKala(sr.totalDays, astro.sunSet.totalDays, day.date!.weekday, KalaType.KT_GULI_KALAM);
        return r1 >= 0 ? `${fmtTime(r1)} - ${fmtTime(r2)}` : 'N/A';
      })(),
      ascendant: (() => {
        const e = new EarthData();
        e.longitudeDeg = earth.longitudeDeg;
        e.latitudeDeg = earth.latitudeDeg;
        e.offsetUtcHours = earth.offsetUtcHours;
        const ascDeg = e.getAscendantDegrees(astro.julianDay);
        const ascRasi = Math.floor(ascDeg / 30);
        return getRasiName(ascRasi);
      })(),
      childNameNaksatra: getNaksatraChildSyllable(sr.naksatra, sr.naksatraPada) + '...',
      childNameRasi: getRasiChildSyllable(sr.rasiOfMoon),
      grahas: getGrahaPositions(astro.julianDay, sr.longitude, sr.longitudeMoon).map(g => ({
        name: g.name, nameSanskrit: g.nameSanskrit, rasi: g.rasi, naksatra: g.naksatra,
      })),
      events,
    };
  });

  return (
    <div>
      <h2 class="text-2xl font-bold mb-6">Today</h2>

      {!data.value ? (
        <p class="text-stone-500">Loading...</p>
      ) : (
        <div class="space-y-6">
          {/* Date & Location */}
          <div class="bg-white rounded-lg shadow p-5">
            <p class="text-3xl font-light">{data.value.weekday}</p>
            <p class="text-lg text-stone-600">{data.value.date}</p>
            <p class="text-sm text-stone-400 mt-1">{data.value.location} ({data.value.dstSig})</p>
          </div>

          {/* Fasting / Ekadasi */}
          {data.value.fasting && (
            <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
              <p class="font-semibold text-yellow-800">{data.value.ekadasiName}</p>
              <p class="text-sm text-yellow-700">{data.value.fasting}</p>
              {data.value.paranaText && (
                <p class="text-sm text-yellow-600 mt-1">{data.value.paranaText}</p>
              )}
            </div>
          )}

          {/* Sun times */}
          <div class="bg-white rounded-lg shadow p-5">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Sun Times</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-light text-amber-600">{data.value.sunrise}</p>
                <p class="text-xs text-stone-400">Sunrise</p>
              </div>
              <div>
                <p class="text-2xl font-light text-amber-500">{data.value.noon}</p>
                <p class="text-xs text-stone-400">Noon</p>
              </div>
              <div>
                <p class="text-2xl font-light text-orange-600">{data.value.sunset}</p>
                <p class="text-xs text-stone-400">Sunset</p>
              </div>
            </div>
          </div>

          {/* Vedic info */}
          <div class="bg-white rounded-lg shadow p-5">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Vedic Day</h3>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt class="text-stone-400">Tithi</dt>
              <dd>{data.value.tithi} <span class="text-stone-400">({data.value.tithiElapse})</span></dd>
              <dt class="text-stone-400">Moon Naksatra</dt>
              <dd>{data.value.naksatra} <span class="text-stone-400">({data.value.naksatraElapse})</span></dd>
              <dt class="text-stone-400">Sun Naksatra</dt>
              <dd>{data.value.sunNaksatra}</dd>
              <dt class="text-stone-400">Sun Rasi</dt>
              <dd>{data.value.sunRasi}</dd>
              <dt class="text-stone-400">Yoga</dt>
              <dd>{data.value.yoga} <span class="text-stone-400">({data.value.yogaElapse})</span></dd>
              <dt class="text-stone-400">Paksa</dt>
              <dd>{data.value.paksa}</dd>
              <dt class="text-stone-400">Masa</dt>
              <dd>{data.value.masa}</dd>
              <dt class="text-stone-400">Gaurabda Year</dt>
              <dd>{data.value.gaurabdaYear}</dd>
            </dl>
          </div>

          {/* Muhurta & Sandhya */}
          <div class="bg-white rounded-lg shadow p-5">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Muhurta & Sandhya</h3>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt class="text-stone-400">Brahma Muhurta</dt>
              <dd>{data.value.brahmaMuhurta}</dd>
              <dt class="text-stone-400">Gayatri (sunrise)</dt>
              <dd>{data.value.gayatri}</dd>
              <dt class="text-stone-400">Savitri (noon)</dt>
              <dd>{data.value.savitri}</dd>
              <dt class="text-stone-400">Saraswati (sunset)</dt>
              <dd>{data.value.saraswati}</dd>
            </dl>
          </div>

          {/* Kala (inauspicious periods) */}
          <div class="bg-white rounded-lg shadow p-5">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Kala Periods</h3>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt class="text-red-400">Rahu Kala</dt>
              <dd class="text-red-600">{data.value.rahuKala}</dd>
              <dt class="text-orange-400">Yama Ghanti</dt>
              <dd class="text-orange-600">{data.value.yamaGhanti}</dd>
              <dt class="text-amber-400">Guli Kala</dt>
              <dd class="text-amber-600">{data.value.guliKala}</dd>
            </dl>
          </div>

          {/* Graha positions */}
          <div class="bg-white rounded-lg shadow p-5">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">
              Graha Positions
              <span class="text-stone-300 ml-2 font-normal normal-case">Lagna: {data.value.ascendant}</span>
            </h3>
            <div class="grid grid-cols-3 gap-1 text-xs">
              <span class="text-stone-400 font-medium">Graha</span>
              <span class="text-stone-400 font-medium">Rasi</span>
              <span class="text-stone-400 font-medium">Naksatra</span>
              {data.value.grahas.map((g, i) => (
                <>
                  <span key={`n${i}`} class="font-medium">{g.nameSanskrit} <span class="text-stone-400 font-normal">({g.name})</span></span>
                  <span key={`r${i}`}>{g.rasi}</span>
                  <span key={`k${i}`}>{g.naksatra}</span>
                </>
              ))}
            </div>
          </div>

          {/* Child name suggestions */}
          <div class="bg-white rounded-lg shadow p-5">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Child Name Syllables</h3>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt class="text-stone-400">By Naksatra</dt>
              <dd class="font-medium">{data.value.childNameNaksatra}</dd>
              <dt class="text-stone-400">By Rasi</dt>
              <dd class="font-medium">{data.value.childNameRasi}</dd>
            </dl>
          </div>

          {/* Events */}
          {data.value.events.length > 0 && (
            <div class="bg-white rounded-lg shadow p-5">
              <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Events</h3>
              <ul class="space-y-1 text-sm">
                {data.value.events.map((ev, i) => (
                  <li key={i} class="text-stone-700">{ev}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Today - Gaurabda Calendar',
};
