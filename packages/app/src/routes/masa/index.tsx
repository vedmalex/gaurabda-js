import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead, Link } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData, getMasaName, GregorianDateTime,
  ResultCalendar, getTithiName,
} from '~/components/location-store';
import { ResultMasaList, FastType, matchFestivalsForDay } from '@gaurabda/core';

interface MasaBar {
  masa: string; year: number; startDay: number; endDay: number;
  startLabel: string; endLabel: string; width: number; left: number; color: string;
}

interface YearDay {
  day: number; month: number;
  masaColor: string;
  hasFestival: boolean;
  isFasting: boolean;
  isParana: boolean;
  tithi: string;
}

const MASA_COLORS = [
  'bg-rose-200', 'bg-orange-200', 'bg-amber-200', 'bg-yellow-200',
  'bg-lime-200', 'bg-green-200', 'bg-emerald-200', 'bg-teal-200',
  'bg-cyan-200', 'bg-sky-200', 'bg-blue-200', 'bg-indigo-200',
  'bg-purple-300',
];
const MASA_BORDER_COLORS = [
  'border-rose-400', 'border-orange-400', 'border-amber-400', 'border-yellow-400',
  'border-lime-400', 'border-green-400', 'border-emerald-400', 'border-teal-400',
  'border-cyan-400', 'border-sky-400', 'border-blue-400', 'border-indigo-400',
  'border-purple-500',
];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default component$(() => {
  const yearVal = useSignal(new Date().getFullYear());
  const masas = useSignal<MasaBar[]>([]);
  const gaurabdaYear = useSignal(0);
  const totalDays = useSignal(365);
  const yearMonths = useSignal<YearDay[][]>([]); // 12 months of days

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const y = track(() => yearVal.value);
    const stored = loadLocation();
    const earth = toEarthData(stored);

    // --- Masa timeline ---
    const allEntries: typeof ResultMasaList.prototype.entries = [];
    for (const yr of [y - 1, y, y + 1]) {
      const rml = new ResultMasaList();
      rml.calculateMasaList(earth, yr, 1);
      allEntries.push(...rml.entries);
    }

    const isLeap = GregorianDateTime.isLeapYear(y);
    const total = isLeap ? 366 : 365;
    totalDays.value = total;

    const firstInYear = allEntries.find(e => e.vcStart.year === y);
    if (firstInYear) gaurabdaYear.value = firstInYear.year;

    const jan1 = new Date(y, 0, 1).getTime();
    const toDayNum = (day: number, mo: number, yr: number) =>
      Math.floor((new Date(yr, mo - 1, day).getTime() - jan1) / 86400000);

    const seen = new Set<string>();
    const masaList = allEntries
      .map((e) => {
        const key = `${e.masa}-${e.vcStart.day}-${e.vcStart.month}-${e.vcStart.year}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const s = toDayNum(e.vcStart.day, e.vcStart.month, e.vcStart.year);
        const en = toDayNum(e.vcEnd.day, e.vcEnd.month, e.vcEnd.year);
        const sc = Math.max(0, s); const ec = Math.min(total, en);
        if (ec <= sc) return null;
        return {
          masa: getMasaName(e.masa), year: e.year,
          masaIdx: e.masa,
          startDay: sc, endDay: ec,
          startLabel: `${e.vcStart.day} ${MONTH_NAMES[e.vcStart.month - 1]}`,
          endLabel: `${e.vcEnd.day} ${MONTH_NAMES[e.vcEnd.month - 1]}`,
          width: ((ec - sc) / total) * 100, left: (sc / total) * 100,
          color: MASA_COLORS[e.masa % MASA_COLORS.length],
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => a.startDay - b.startDay);
    masas.value = masaList;

    // --- Year calendar: 12 mini months ---
    const months: YearDay[][] = [];
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = GregorianDateTime.getMonthMaxDays(y, m);
      const cal = new ResultCalendar();
      cal.calculateMonth(earth, y, m);

      const monthDays: YearDay[] = [];
      // Pad start for weekday alignment (Mon=1)
      const firstWd = cal.days[cal.BEFORE_DAYS]?.date?.weekday ?? 0;
      const pad = firstWd === 0 ? 6 : firstWd - 1;
      for (let p = 0; p < pad; p++) monthDays.push({ day: 0, month: m, masaColor: '', hasFestival: false, isFasting: false, isParana: false, tithi: '' });

      for (let d = 0; d < daysInMonth; d++) {
        const vd = cal.days[cal.BEFORE_DAYS + d];
        if (!vd?.date) continue;
        const a = vd.astrodata;
        const sr = a.sunRise;
        const dayNum = toDayNum(vd.date.day, vd.date.month, vd.date.year);
        // Find which masa this day belongs to
        const mb = masaList.find(bar => dayNum >= bar.startDay && dayNum < bar.endDay);
        const dayIndex = cal.BEFORE_DAYS + d;
        const festivals = matchFestivalsForDay(cal.days, dayIndex);
        monthDays.push({
          day: vd.date.day, month: m,
          masaColor: mb ? MASA_BORDER_COLORS[(mb as any).masaIdx % MASA_BORDER_COLORS.length] : '',
          hasFestival: festivals.length > 0,
          isFasting: vd.nFastID === FastType.FAST_EKADASI,
          isParana: vd.ekadasi_parana,
          tithi: getTithiName(sr.tithi),
        });
      }
      months.push(monthDays);
    }
    yearMonths.value = months;
  });

  const goPrev = $((): void => { yearVal.value--; });
  const goNext = $((): void => { yearVal.value++; });

  const monthMarkers = MONTH_NAMES.map((name, i) => {
    const d = new Date(yearVal.value, i, 1);
    const jan1v = new Date(yearVal.value, 0, 1);
    return { name, left: (Math.floor((d.getTime() - jan1v.getTime()) / 86400000) / totalDays.value) * 100 };
  });

  return (
    <div>
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <button onClick$={goPrev} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&larr;</button>
        <div class="text-center">
          <h2 class="text-2xl font-bold">{yearVal.value}</h2>
          {gaurabdaYear.value > 0 && <p class="text-sm text-stone-500">Gaurabda {gaurabdaYear.value}</p>}
        </div>
        <button onClick$={goNext} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&rarr;</button>
      </div>

      {/* Masa timeline strip */}
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <div class="relative h-5 mb-1">
          {monthMarkers.map(m => (
            <div key={m.name} class="absolute text-[10px] text-stone-400" style={{ left: `${m.left}%` }}>{m.name}</div>
          ))}
        </div>
        <div class="relative h-10 rounded-lg overflow-hidden border border-stone-200">
          {masas.value.map((m, i) => (
            <div key={i}
              class={['absolute top-0 bottom-0 flex items-center justify-center border-r border-white/50 overflow-hidden', m.color]}
              style={{ left: `${m.left}%`, width: `${Math.max(m.width, 1)}%` }}
              title={`${m.masa} (${m.startLabel} – ${m.endLabel})`}
            >
              <span class="text-[9px] font-semibold text-stone-700 truncate px-0.5">{m.masa}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Year calendar grid — 12 mini months */}
      <div class="grid grid-cols-4 gap-3">
        {yearMonths.value.map((days, mi) => (
          <div key={mi} class="bg-white rounded-lg shadow p-2">
            {/* Month header — clickable */}
            <Link href={`/calendar/?y=${yearVal.value}&m=${mi + 1}`}
              class="block text-center text-xs font-bold text-amber-700 hover:underline mb-1">
              {MONTH_NAMES[mi]}
            </Link>
            {/* Weekday headers */}
            <div class="grid grid-cols-7 text-center text-[7px] text-stone-300 mb-0.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, di) => <span key={di}>{d}</span>)}
            </div>
            {/* Day cells */}
            <div class="grid grid-cols-7 gap-px">
              {days.map((d, di) => (
                d.day === 0
                  ? <span key={di} />
                  : <Link key={di} href={`/calendar/?y=${yearVal.value}&m=${mi + 1}&d=${d.day}`}
                      class={[
                        'text-[9px] text-center rounded-sm leading-4 border',
                        d.masaColor || 'border-transparent',
                        d.isFasting ? 'bg-yellow-100 font-bold text-yellow-700' :
                        d.isParana ? 'bg-green-100 text-green-700' :
                        d.hasFestival ? 'bg-amber-50 text-amber-800' :
                        'text-stone-600 hover:bg-stone-100',
                      ]}
                      title={d.tithi + (d.hasFestival ? ' *' : '')}
                    >
                      {d.day}
                    </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table view */}
      <div class="bg-white rounded-lg shadow overflow-hidden mt-4">
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
