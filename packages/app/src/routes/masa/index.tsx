import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { loadLocation, toEarthData, getMasaName, GregorianDateTime } from '~/components/location-store';
import { ResultMasaList } from '@gaurabda/core';

interface MasaBar {
  masa: string;
  year: number;
  startDay: number;  // day offset from Jan 1
  endDay: number;
  startLabel: string;
  endLabel: string;
  width: number;     // percentage
  left: number;      // percentage
  color: string;
}

const MASA_COLORS = [
  'bg-rose-200', 'bg-orange-200', 'bg-amber-200', 'bg-yellow-200',
  'bg-lime-200', 'bg-green-200', 'bg-emerald-200', 'bg-teal-200',
  'bg-cyan-200', 'bg-sky-200', 'bg-blue-200', 'bg-indigo-200',
  'bg-purple-300', // Adhika
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// removed dayOfYear — using toDayNum (relative to Jan 1 of selected year) instead

export default component$(() => {
  const yearVal = useSignal(new Date().getFullYear());
  const masas = useSignal<MasaBar[]>([]);
  const gaurabdaYear = useSignal(0);
  const totalDays = useSignal(365);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const y = track(() => yearVal.value);

    const stored = loadLocation();
    const earth = toEarthData(stored);

    // Calculate 3 years to capture masas spanning year boundaries
    const allEntries: typeof ResultMasaList.prototype.entries = [];
    for (const yr of [y - 1, y, y + 1]) {
      const rml = new ResultMasaList();
      rml.calculateMasaList(earth, yr, 1);
      allEntries.push(...rml.entries);
    }

    const isLeap = GregorianDateTime.isLeapYear(y);
    const total = isLeap ? 366 : 365;
    totalDays.value = total;

    // Find gaurabda year from the first masa that starts in this calendar year
    const firstInYear = allEntries.find(e => e.vcStart.year === y);
    if (firstInYear) gaurabdaYear.value = firstInYear.year;

    const jan1 = new Date(y, 0, 1).getTime();
    const toDayNum = (day: number, mo: number, yr: number) =>
      Math.floor((new Date(yr, mo - 1, day).getTime() - jan1) / 86400000);

    // Deduplicate by masa+start and filter to visible range
    const seen = new Set<string>();
    masas.value = allEntries
      .map((e) => {
        const key = `${e.masa}-${e.vcStart.day}-${e.vcStart.month}-${e.vcStart.year}`;
        if (seen.has(key)) return null;
        seen.add(key);

        const s = toDayNum(e.vcStart.day, e.vcStart.month, e.vcStart.year);
        const en = toDayNum(e.vcEnd.day, e.vcEnd.month, e.vcEnd.year);
        const startClamped = Math.max(0, s);
        const endClamped = Math.min(total, en);
        if (endClamped <= startClamped) return null;

        return {
          masa: getMasaName(e.masa),
          year: e.year,
          startDay: startClamped,
          endDay: endClamped,
          startLabel: `${e.vcStart.day} ${MONTH_NAMES[e.vcStart.month - 1]}`,
          endLabel: `${e.vcEnd.day} ${MONTH_NAMES[e.vcEnd.month - 1]}`,
          width: ((endClamped - startClamped) / total) * 100,
          left: (startClamped / total) * 100,
          color: MASA_COLORS[e.masa % MASA_COLORS.length],
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => a.startDay - b.startDay);
  });

  const goPrev = $((): void => { yearVal.value--; });
  const goNext = $((): void => { yearVal.value++; });

  // Month grid markers
  const monthMarkers = MONTH_NAMES.map((name, i) => {
    const d = new Date(yearVal.value, i, 1);
    const jan1 = new Date(yearVal.value, 0, 1);
    const offset = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
    return { name, left: (offset / totalDays.value) * 100 };
  });

  return (
    <div>
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <button onClick$={goPrev} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&larr;</button>
        <div class="text-center">
          <h2 class="text-2xl font-bold">{yearVal.value}</h2>
          {gaurabdaYear.value > 0 && <p class="text-sm text-stone-500">Gaurabda {gaurabdaYear.value}</p>}
        </div>
        <button onClick$={goNext} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&rarr;</button>
      </div>

      {/* Timeline — single horizontal strip */}
      <div class="bg-white rounded-lg shadow p-5">
        {/* Month labels */}
        <div class="relative h-5 mb-1">
          {monthMarkers.map(m => (
            <div key={m.name} class="absolute text-[10px] text-stone-400 font-medium" style={{ left: `${m.left}%` }}>
              {m.name}
            </div>
          ))}
        </div>

        {/* Month tick marks */}
        <div class="relative h-1.5 mb-1">
          {monthMarkers.map(m => (
            <div key={m.name} class="absolute top-0 w-px h-full bg-stone-300" style={{ left: `${m.left}%` }} />
          ))}
        </div>

        {/* Single continuous masa strip */}
        <div class="relative h-12 rounded-lg overflow-hidden border border-stone-200">
          {masas.value.map((m, i) => (
            <div
              key={i}
              class={['absolute top-0 bottom-0 flex items-center justify-center border-r border-white/50 overflow-hidden', m.color]}
              style={{ left: `${m.left}%`, width: `${Math.max(m.width, 1)}%` }}
              title={`${m.masa} (${m.startLabel} – ${m.endLabel})`}
            >
              <span class="text-[10px] font-semibold text-stone-700 truncate px-0.5">{m.masa}</span>
            </div>
          ))}
        </div>

        {/* Date labels below strip */}
        <div class="relative h-5 mt-0.5">
          {masas.value.map((m, i) => (
            <div key={i} class="absolute text-[8px] text-stone-400" style={{ left: `${m.left}%` }}>
              {m.startLabel}
            </div>
          ))}
        </div>
      </div>

      {/* Table view */}
      <div class="bg-white rounded-lg shadow overflow-hidden mt-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-stone-100 text-left text-xs font-semibold text-stone-500 uppercase">
              <th class="px-4 py-2">Masa</th>
              <th class="px-4 py-2">Gaurabda</th>
              <th class="px-4 py-2">Start</th>
              <th class="px-4 py-2">End</th>
              <th class="px-4 py-2">Days</th>
            </tr>
          </thead>
          <tbody>
            {masas.value.map((m, i) => (
              <tr key={i} class="border-t hover:bg-stone-50">
                <td class="px-4 py-2">
                  <span class={['inline-block w-3 h-3 rounded-sm mr-2', m.color]} />
                  <span class="font-medium">{m.masa}</span>
                </td>
                <td class="px-4 py-2 text-stone-500">{m.year}</td>
                <td class="px-4 py-2">{m.startLabel}</td>
                <td class="px-4 py-2">{m.endLabel}</td>
                <td class="px-4 py-2 text-stone-500">{m.endDay - m.startDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Masa List - Gaurabda',
};
