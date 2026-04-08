import { component$, useSignal, useVisibleTask$, useComputed$, $ } from '@builder.io/qwik';
import { type DocumentHead, useLocation } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData,
  ResultCalendar, GregorianDateTime, getMasaName, getTithiName,
  getNaksatraName, getYogaName, getPaksaName, getFastingName,
} from '~/components/location-store';
import { FastType, matchFestivals, calculateSandhyaTimes, calculateBrahmaMuhurta } from '@gaurabda/core';

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
  // for detail panel
  sunNaksatra: string;
  sunRasi: string;
  gaurabdaYear: number;
  brahmaMuhurta: string;
  gayatri: string;
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
        sunNaksatra: getNaksatraName(sr.sunNaksatra),
        sunRasi: '',
        gaurabdaYear: a.gaurabdaYear,
        brahmaMuhurta: `${fmtTime(bmS)} - ${fmtTime(bmE)}`,
        gayatri: `${fmtTime(sandhya.gayatriStart)} - ${fmtTime(sandhya.gayatriEnd)}`,
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
    selected.value = null;
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
          <div class="flex gap-2">
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

      {/* Detail panel */}
      {selected.value && (
        <div class="w-80 shrink-0">
          <div class="bg-white rounded-lg shadow p-5 sticky top-6">
            <div class="flex justify-between items-start mb-3">
              <div>
                <p class="text-lg font-bold">{selected.value.d.day} {GregorianDateTime.getMonthName(selected.value.d.month)}</p>
                <p class="text-sm text-stone-500">{WEEKDAYS[selected.value.d.weekday]}</p>
              </div>
              <button onClick$={closeDetail} class="text-stone-400 hover:text-stone-600 text-lg">&times;</button>
            </div>

            {/* Fasting */}
            {selected.value.d.isFasting && (
              <div class="bg-yellow-50 border-l-3 border-yellow-400 p-2 mb-3 rounded text-xs">
                <p class="font-semibold text-yellow-800">{selected.value.d.ekadasiName}</p>
                <p class="text-yellow-700">{selected.value.d.fastName}</p>
              </div>
            )}

            {/* Festivals */}
            {selected.value.d.festivals.length > 0 && (
              <div class="mb-3">
                <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Festivals</h4>
                <ul class="space-y-0.5">
                  {selected.value.d.festivals.map((f, i) => (
                    <li key={i} class="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sun times */}
            <div class="mb-3">
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Sun</h4>
              <div class="grid grid-cols-2 gap-1 text-xs">
                <span class="text-stone-400">Sunrise</span><span>{selected.value.d.sunrise}</span>
                <span class="text-stone-400">Sunset</span><span>{selected.value.d.sunset}</span>
                <span class="text-stone-400">Brahma Muhurta</span><span>{selected.value.d.brahmaMuhurta}</span>
                <span class="text-stone-400">Gayatri</span><span>{selected.value.d.gayatri}</span>
              </div>
            </div>

            {/* Vedic */}
            <div>
              <h4 class="text-[10px] font-semibold text-stone-400 uppercase mb-1">Vedic</h4>
              <div class="grid grid-cols-2 gap-1 text-xs">
                <span class="text-stone-400">Tithi</span><span>{selected.value.d.tithi}</span>
                <span class="text-stone-400">Naksatra</span><span>{selected.value.d.naksatra}</span>
                <span class="text-stone-400">Sun Naksatra</span><span>{selected.value.d.sunNaksatra}</span>
                <span class="text-stone-400">Yoga</span><span>{selected.value.d.yoga}</span>
                <span class="text-stone-400">Paksa</span><span>{selected.value.d.paksa}</span>
                <span class="text-stone-400">Masa</span><span>{selected.value.d.masa}</span>
                <span class="text-stone-400">Gaurabda</span><span>{selected.value.d.gaurabdaYear}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Calendar - Gaurabda',
};
