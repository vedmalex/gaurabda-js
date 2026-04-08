import { component$, useSignal, useVisibleTask$, useComputed$, $ } from '@builder.io/qwik';
import { type DocumentHead, useLocation } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData,
  ResultCalendar, GregorianDateTime, getMasaName, getTithiName,
  getPaksaName,
} from '~/components/location-store';
import { FastType } from '@gaurabda/core';

interface CalDay {
  day: number;
  month: number;
  year: number;
  weekday: number;
  tithi: string;
  paksa: string;
  masa: string;
  isFasting: boolean;
  isParana: boolean;
  isCurrentMonth: boolean;
}

export default component$(() => {
  const loc = useLocation();

  const now = new Date();
  const year = useSignal(parseInt(loc.url.searchParams.get('y') ?? '') || now.getFullYear());
  const month = useSignal(parseInt(loc.url.searchParams.get('m') ?? '') || (now.getMonth() + 1));

  const days = useSignal<CalDay[]>([]);
  const masaLabel = useSignal('');

  useVisibleTask$(({ track }) => {
    const y = track(() => year.value);
    const m = track(() => month.value);

    const stored = loadLocation();
    const earth = toEarthData(stored);

    const cal = new ResultCalendar();
    cal.calculateMonth(earth, y, m);

    const result: CalDay[] = [];
    let mainMasa = '';

    // Get first day's weekday for padding
    const firstDay = cal.days[cal.BEFORE_DAYS];
    if (!firstDay?.date) return;

    // Pad start of month to align to Monday (1) start
    const startWeekday = firstDay.date.weekday;
    const padDays = startWeekday === 0 ? 6 : startWeekday - 1; // Mon=0 pad

    for (let i = 0; i < padDays; i++) {
      const idx = cal.BEFORE_DAYS - padDays + i;
      const d = cal.days[idx];
      if (d?.date) {
        result.push({
          day: d.date.day, month: d.date.month, year: d.date.year,
          weekday: d.date.weekday,
          tithi: getTithiName(d.astrodata.sunRise.tithi),
          paksa: getPaksaName(d.astrodata.sunRise.paksa),
          masa: getMasaName(d.astrodata.masa),
          isFasting: d.nFastID === FastType.FAST_EKADASI,
          isParana: d.ekadasi_parana,
          isCurrentMonth: false,
        });
      }
    }

    // Month days
    for (let i = 0; i < cal.pureCount; i++) {
      const d = cal.days[cal.BEFORE_DAYS + i];
      if (!d?.date) continue;

      if (!mainMasa) mainMasa = getMasaName(d.astrodata.masa);

      result.push({
        day: d.date.day, month: d.date.month, year: d.date.year,
        weekday: d.date.weekday,
        tithi: getTithiName(d.astrodata.sunRise.tithi),
        paksa: getPaksaName(d.astrodata.sunRise.paksa),
        masa: getMasaName(d.astrodata.masa),
        isFasting: d.nFastID === FastType.FAST_EKADASI,
        isParana: d.ekadasi_parana,
        isCurrentMonth: true,
      });
    }

    // Pad end to fill last week
    const remaining = (7 - (result.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      const idx = cal.BEFORE_DAYS + cal.pureCount + i;
      const d = cal.days[idx];
      if (d?.date) {
        result.push({
          day: d.date.day, month: d.date.month, year: d.date.year,
          weekday: d.date.weekday,
          tithi: getTithiName(d.astrodata.sunRise.tithi),
          paksa: getPaksaName(d.astrodata.sunRise.paksa),
          masa: getMasaName(d.astrodata.masa),
          isFasting: d.nFastID === FastType.FAST_EKADASI,
          isParana: d.ekadasi_parana,
          isCurrentMonth: false,
        });
      }
    }

    days.value = result;
    masaLabel.value = mainMasa;
  });

  const monthName = useComputed$(() => {
    return GregorianDateTime.getMonthName(month.value) + ' ' + year.value;
  });

  const goPrev = $((): void => {
    let m = month.value - 1;
    let y = year.value;
    if (m < 1) { m = 12; y--; }
    month.value = m;
    year.value = y;
  });

  const goNext = $((): void => {
    let m = month.value + 1;
    let y = year.value;
    if (m > 12) { m = 1; y++; }
    month.value = m;
    year.value = y;
  });

  return (
    <div>
      {/* Header with nav */}
      <div class="flex items-center justify-between mb-6">
        <button onClick$={goPrev} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&larr; Prev</button>
        <div class="text-center">
          <h2 class="text-2xl font-bold">{monthName.value}</h2>
          {masaLabel.value && <p class="text-sm text-stone-500">{masaLabel.value} Masa</p>}
        </div>
        <button onClick$={goNext} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">Next &rarr;</button>
      </div>

      {/* Calendar grid */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        {/* Weekday headers */}
        <div class="grid grid-cols-7 text-center text-xs font-semibold text-stone-400 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} class="py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div class="grid grid-cols-7">
          {days.value.map((d, i) => (
            <div
              key={i}
              class={[
                'border-b border-r p-2 min-h-[80px] text-xs',
                !d.isCurrentMonth && 'bg-stone-50 text-stone-400',
                d.isFasting && 'bg-yellow-50',
                d.isParana && 'bg-green-50',
              ]}
            >
              <div class="flex justify-between items-start">
                <span class={['font-semibold text-sm', d.isCurrentMonth ? 'text-stone-700' : 'text-stone-400']}>
                  {d.day}
                </span>
                {d.isFasting && <span class="text-yellow-600 text-[10px] font-bold">EK</span>}
                {d.isParana && <span class="text-green-600 text-[10px] font-bold">PAR</span>}
              </div>
              <p class="text-stone-500 mt-0.5">{d.tithi}</p>
              <p class="text-stone-400">{d.paksa}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Calendar - Gaurabda',
};
