import { component$, useSignal, useVisibleTask$, useComputed$, $ } from '@builder.io/qwik';
import { type DocumentHead, useLocation, Link } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData,
  ResultCalendar, GregorianDateTime, getMasaName, getTithiName,
  getNaksatraName, getYogaName, getPaksaName, getFastingName,
  getDSTSignature,
} from '~/components/location-store';
import {
  FastType, matchFestivals, calculateSandhyaTimes, calculateBrahmaMuhurta,
  SunData, KalaType, getGrahaPositions, getRasiName, EarthData,
  getNaksatraChildSyllable, getRasiChildSyllable,
} from '@gaurabda/core';

interface CalDay {
  day: number;
  month: number;
  year: number;
  weekday: number;
  tithi: string;
  tithiIdx: number;
  paksa: string;
  paksaIdx: number;
  masa: string;
  masaIdx: number;
  naksatra: string;
  yoga: string;
  sunrise: string;
  sunset: string;
  isFasting: boolean;
  isParana: boolean;
  isCurrentMonth: boolean;
  festivals: string[];
  fastName: string;
  ekadasiName: string;
  sankrantiZodiac: number;
  // detail panel (today-level)
  noon: string;
  sunNaksatra: string;
  sunRasi: string;
  yogaElapse: string;
  tithiElapse: string;
  naksatraElapse: string;
  gaurabdaYear: number;
  brahmaMuhurta: string;
  gayatri: string;
  savitri: string;
  saraswati: string;
  rahuKala: string;
  yamaGhanti: string;
  guliKala: string;
  grahas: { name: string; skt: string; rasi: string; naksatra: string }[];
  childNaksatra: string;
  childRasi: string;
  dstSig: string;
  ascendant: string;
}

interface SelectedDay {
  d: CalDay;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default component$(() => {
  const loc = useLocation();

  const now = new Date();
  const year = useSignal(parseInt(loc.url.searchParams.get('y') ?? '') || now.getFullYear());
  const month = useSignal(parseInt(loc.url.searchParams.get('m') ?? '') || (now.getMonth() + 1));
  const highlightDay = parseInt(loc.url.searchParams.get('d') ?? '') || 0;
  const datePickerValue = useSignal('');

  const days = useSignal<CalDay[]>([]);
  const masaLabel = useSignal('');
  const selected = useSignal<SelectedDay | null>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const y = track(() => year.value);
    const m = track(() => month.value);

    const stored = loadLocation();
    const earth = toEarthData(stored);
    const cal = new ResultCalendar();
    cal.calculateMonth(earth, y, m);

    const result: CalDay[] = [];
    let mainMasa = '';

    const fmtTime = (frac: number) => {
      const h = Math.floor(frac * 24);
      const mn = Math.floor((frac * 24 - h) * 60);
      return `${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;
    };

    const buildDay = (vd: (typeof cal.days)[0], isCurrent: boolean): CalDay | null => {
      if (!vd?.date) return null;
      const a = vd.astrodata;
      const sr = a.sunRise;

      // Match festivals
      const festivals = matchFestivals(sr.tithi, a.masa, sr.paksa, vd.sankranti_zodiac);
      const festNames = festivals.map(f => f.name);

      const sandhya = calculateSandhyaTimes(sr.totalDays, a.sunNoon.totalDays, a.sunSet.totalDays);
      const [bmS, bmE] = calculateBrahmaMuhurta(sr.totalDays);

      return {
        day: vd.date.day, month: vd.date.month, year: vd.date.year,
        weekday: vd.date.weekday,
        tithi: getTithiName(sr.tithi), tithiIdx: sr.tithi,
        paksa: getPaksaName(sr.paksa), paksaIdx: sr.paksa,
        masa: getMasaName(a.masa), masaIdx: a.masa,
        naksatra: getNaksatraName(sr.naksatra),
        yoga: getYogaName(sr.yoga),
        sunrise: sr.toLongTimeString(),
        sunset: a.sunSet.toLongTimeString(),
        isFasting: vd.nFastID === FastType.FAST_EKADASI,
        isParana: vd.ekadasi_parana,
        isCurrentMonth: isCurrent,
        festivals: festNames,
        fastName: vd.nFastID !== FastType.FAST_NULL ? getFastingName(vd.nFastID) : '',
        ekadasiName: vd.ekadasi_vrata_name || '',
        sankrantiZodiac: vd.sankranti_zodiac,
        noon: a.sunNoon.toLongTimeString(),
        sunNaksatra: getNaksatraName(sr.sunNaksatra),
        sunRasi: getRasiName(sr.rasiOfSun),
        yogaElapse: sr.yogaElapse.toFixed(1) + '%',
        tithiElapse: sr.tithiElapse.toFixed(1) + '%',
        naksatraElapse: sr.naksatraElapse.toFixed(1) + '%',
        gaurabdaYear: a.gaurabdaYear,
        brahmaMuhurta: `${fmtTime(bmS)} - ${fmtTime(bmE)}`,
        gayatri: `${fmtTime(sandhya.gayatriStart)} - ${fmtTime(sandhya.gayatriEnd)}`,
        savitri: `${fmtTime(sandhya.savitriStart)} - ${fmtTime(sandhya.savitriEnd)}`,
        saraswati: `${fmtTime(sandhya.saraswatiStart)} - ${fmtTime(sandhya.saraswatiEnd)}`,
        rahuKala: (() => { const [r1, r2] = SunData.calculateKala(sr.totalDays, a.sunSet.totalDays, vd.date!.weekday, KalaType.KT_RAHU_KALAM); return r1 >= 0 ? `${fmtTime(r1)}-${fmtTime(r2)}` : ''; })(),
        yamaGhanti: (() => { const [r1, r2] = SunData.calculateKala(sr.totalDays, a.sunSet.totalDays, vd.date!.weekday, KalaType.KT_YAMA_GHANTI); return r1 >= 0 ? `${fmtTime(r1)}-${fmtTime(r2)}` : ''; })(),
        guliKala: (() => { const [r1, r2] = SunData.calculateKala(sr.totalDays, a.sunSet.totalDays, vd.date!.weekday, KalaType.KT_GULI_KALAM); return r1 >= 0 ? `${fmtTime(r1)}-${fmtTime(r2)}` : ''; })(),
        grahas: getGrahaPositions(a.julianDay, sr.longitude, sr.longitudeMoon).map(g => ({ name: g.name, skt: g.nameSanskrit, rasi: g.rasi, naksatra: g.naksatra })),
        childNaksatra: getNaksatraChildSyllable(sr.naksatra, sr.naksatraPada) + '...',
        childRasi: getRasiChildSyllable(sr.rasiOfMoon),
        dstSig: getDSTSignature(vd.biasMinutes),
        ascendant: (() => { const e = new EarthData(); e.longitudeDeg = earth.longitudeDeg; e.latitudeDeg = earth.latitudeDeg; e.offsetUtcHours = earth.offsetUtcHours; return getRasiName(Math.floor(e.getAscendantDegrees(a.julianDay) / 30)); })(),
      };
    };

    // Pad start
    const firstDay = cal.days[cal.BEFORE_DAYS];
    if (!firstDay?.date) return;
    const startWd = firstDay.date.weekday;
    const padBefore = startWd === 0 ? 6 : startWd - 1;

    for (let i = 0; i < padBefore; i++) {
      const d = buildDay(cal.days[cal.BEFORE_DAYS - padBefore + i], false);
      if (d) result.push(d);
    }

    // Month days
    for (let i = 0; i < cal.pureCount; i++) {
      const vd = cal.days[cal.BEFORE_DAYS + i];
      const d = buildDay(vd, true);
      if (d) {
        if (!mainMasa) mainMasa = d.masa;
        result.push(d);
      }
    }

    // Pad end
    const remaining = (7 - (result.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      const d = buildDay(cal.days[cal.BEFORE_DAYS + cal.pureCount + i], false);
      if (d) result.push(d);
    }

    days.value = result;
    masaLabel.value = mainMasa;
    // Auto-select day from URL param ?d=
    if (highlightDay > 0) {
      const found = result.find(d => d.day === highlightDay && d.isCurrentMonth);
      selected.value = found ? { d: found } : null;
    } else {
      selected.value = null;
    }
  });

  const monthName = useComputed$(() => GregorianDateTime.getMonthName(month.value) + ' ' + year.value);

  const goPrev = $((): void => {
    let m = month.value - 1; let y = year.value;
    if (m < 1) { m = 12; y--; }
    month.value = m; year.value = y;
  });

  const goNext = $((): void => {
    let m = month.value + 1; let y = year.value;
    if (m > 12) { m = 1; y++; }
    month.value = m; year.value = y;
  });

  const selectDay = $((d: CalDay) => { selected.value = { d }; });
  const closeDetail = $(() => { selected.value = null; });

  const goToDate = $(() => {
    const val = datePickerValue.value;
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    if (y && m) { year.value = y; month.value = m; }
  });

  const exportPDF = $(async () => {
    const { exportMonthToPDF } = await import('~/components/export-pdf');
    const stored = loadLocation();
    const earth = toEarthData(stored);
    await exportMonthToPDF(earth, year.value, month.value);
  });

  return (
    <div class="flex gap-6">
      {/* Calendar */}
      <div class="flex-1">
        <div class="flex items-center justify-between mb-4">
          <button onClick$={goPrev} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&larr;</button>
          <div class="text-center">
            <h2 class="text-2xl font-bold">{monthName.value}</h2>
            {masaLabel.value && <p class="text-sm text-stone-500">{masaLabel.value} Masa</p>}
          </div>
          <div class="flex gap-2 items-center">
            <input
              type="month"
              class="border rounded px-2 py-1 text-xs text-stone-600"
              bind:value={datePickerValue}
              onChange$={goToDate}
            />
            <button onClick$={exportPDF} class="px-3 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs">PDF</button>
            <button onClick$={goNext} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&rarr;</button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="grid grid-cols-7 text-center text-xs font-semibold text-stone-400 border-b">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} class="py-2">{d}</div>
            ))}
          </div>

          <div class="grid grid-cols-7">
            {days.value.map((d, i) => (
              <button
                key={i}
                onClick$={() => selectDay(d)}
                class={[
                  'border-b border-r p-1.5 min-h-[72px] text-xs text-left transition-colors hover:bg-amber-50 cursor-pointer',
                  !d.isCurrentMonth && 'bg-stone-50 text-stone-400',
                  d.isFasting && 'bg-yellow-50',
                  d.isParana && 'bg-green-50',
                  selected.value?.d.day === d.day && selected.value?.d.month === d.month && 'ring-2 ring-amber-400 ring-inset',
                ]}
              >
                <div class="flex justify-between items-start">
                  <span class={['font-semibold text-sm', d.isCurrentMonth ? 'text-stone-700' : 'text-stone-400']}>
                    {d.day}
                  </span>
                  {d.isFasting && <span class="text-yellow-600 text-[9px] font-bold">EK</span>}
                  {d.isParana && <span class="text-green-600 text-[9px] font-bold">P</span>}
                </div>
                <p class="text-stone-500 leading-tight">{d.tithi}</p>
                {d.festivals.length > 0 && (
                  <p class="text-amber-700 text-[9px] leading-tight mt-0.5 truncate" title={d.festivals.join(', ')}>
                    {d.festivals[0]}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel — full Today-level info */}
      {selected.value && (() => { const s = selected.value.d; return (
        <div class="w-96 shrink-0">
          <div class="bg-white rounded-lg shadow p-5 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4">
            {/* Header + close */}
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xl font-bold">{s.day} {GregorianDateTime.getMonthName(s.month)} {s.year}</p>
                <p class="text-sm text-stone-500">{WEEKDAYS[s.weekday]}</p>
                <Link href="/settings/" class="text-xs text-amber-600 hover:underline">{loadLocation().city} &rarr;</Link>
              </div>
              <button onClick$={closeDetail} class="text-stone-400 hover:text-stone-600 text-xl leading-none">&times;</button>
            </div>

            {/* Fasting */}
            {s.isFasting && (
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p class="font-semibold text-yellow-800 text-sm">{s.ekadasiName}</p>
                <p class="text-xs text-yellow-700">{s.fastName}</p>
              </div>
            )}

            {/* Festivals */}
            {s.festivals.length > 0 && (
              <div>
                <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Festivals</h4>
                <ul class="space-y-0.5">
                  {s.festivals.map((f, i) => (
                    <li key={i} class="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sun times */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Sun Times ({s.dstSig})</h4>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div><p class="text-lg font-light text-amber-600">{s.sunrise}</p><p class="text-[10px] text-stone-400">Sunrise</p></div>
                <div><p class="text-lg font-light text-amber-500">{s.noon}</p><p class="text-[10px] text-stone-400">Noon</p></div>
                <div><p class="text-lg font-light text-orange-600">{s.sunset}</p><p class="text-[10px] text-stone-400">Sunset</p></div>
              </div>
            </div>

            {/* Vedic Day */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Vedic Day</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span class="text-stone-400">Tithi</span><span>{s.tithi} <span class="text-stone-300">({s.tithiElapse})</span></span>
                <span class="text-stone-400">Moon Naksatra</span><span>{s.naksatra} <span class="text-stone-300">({s.naksatraElapse})</span></span>
                <span class="text-stone-400">Sun Naksatra</span><span>{s.sunNaksatra}</span>
                <span class="text-stone-400">Sun Rasi</span><span>{s.sunRasi}</span>
                <span class="text-stone-400">Yoga</span><span>{s.yoga} <span class="text-stone-300">({s.yogaElapse})</span></span>
                <span class="text-stone-400">Paksa</span><span>{s.paksa}</span>
                <span class="text-stone-400">Masa</span><span>{s.masa}</span>
                <span class="text-stone-400">Gaurabda</span><span>{s.gaurabdaYear}</span>
                <span class="text-stone-400">Lagna</span><span>{s.ascendant}</span>
              </div>
            </div>

            {/* Muhurta & Sandhya */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Muhurta & Sandhya</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span class="text-stone-400">Brahma Muhurta</span><span>{s.brahmaMuhurta}</span>
                <span class="text-stone-400">Gayatri</span><span>{s.gayatri}</span>
                <span class="text-stone-400">Savitri</span><span>{s.savitri}</span>
                <span class="text-stone-400">Saraswati</span><span>{s.saraswati}</span>
              </div>
            </div>

            {/* Kala */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Kala Periods</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span class="text-red-400">Rahu Kala</span><span class="text-red-600">{s.rahuKala}</span>
                <span class="text-orange-400">Yama Ghanti</span><span class="text-orange-600">{s.yamaGhanti}</span>
                <span class="text-amber-400">Guli Kala</span><span class="text-amber-600">{s.guliKala}</span>
              </div>
            </div>

            {/* Graha */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Graha Positions</h4>
              <div class="grid grid-cols-3 gap-1 text-[10px]">
                <span class="text-stone-400 font-medium">Graha</span><span class="text-stone-400 font-medium">Rasi</span><span class="text-stone-400 font-medium">Naksatra</span>
                {s.grahas.map((g, i) => (
                  <>
                    <span key={`n${i}`} class="font-medium">{g.skt}</span>
                    <span key={`r${i}`}>{g.rasi}</span>
                    <span key={`k${i}`}>{g.naksatra}</span>
                  </>
                ))}
              </div>
            </div>

            {/* Child names */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Child Name Syllables</h4>
              <div class="grid grid-cols-2 gap-x-4 text-xs">
                <span class="text-stone-400">By Naksatra</span><span class="font-medium">{s.childNaksatra}</span>
                <span class="text-stone-400">By Rasi</span><span class="font-medium">{s.childRasi}</span>
              </div>
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Calendar - Gaurabda',
};
