import { component$, useSignal, $ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData, GregorianDateTime,
  ResultCalendar, getMasaName, getTithiName, getNaksatraName,
} from '~/components/location-store';
import { matchFestivalsForDay } from '@gaurabda/core';

interface SearchResult {
  date: string;
  weekday: string;
  tithi: string;
  masa: string;
  text: string;
  category: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default component$(() => {
  const query = useSignal('');
  const results = useSignal<SearchResult[]>([]);
  const searching = useSignal(false);
  const total = useSignal(0);

  const doSearch = $(async () => {
    const q = query.value.trim().toLowerCase();
    if (q.length < 2) { results.value = []; total.value = 0; return; }

    searching.value = true;

    const stored = loadLocation();
    const earth = toEarthData(stored);
    const now = new Date();
    const y = now.getFullYear();

    // Calculate full year calendar
    const cal = new ResultCalendar();
    const start = GregorianDateTime.fromComponents(y, 1, 1);
    start.TimezoneHours = earth.offsetUtcHours;
    const isLeap = GregorianDateTime.isLeapYear(y);
    cal.calculateCalendar(earth, start, isLeap ? 366 : 365);

    const found: SearchResult[] = [];

    for (let i = 0; i < cal.pureCount; i++) {
      const day = cal.days[cal.BEFORE_DAYS + i];
      if (!day?.date) continue;

      const a = day.astrodata;
      const sr = a.sunRise;
      const dateStr = `${day.date.day} ${GregorianDateTime.getMonthAbreviation(day.date.month)} ${day.date.year}`;
      const wd = WEEKDAYS[day.date.weekday];
      const tithi = getTithiName(sr.tithi);
      const masa = getMasaName(a.masa);
      const naksatra = getNaksatraName(sr.naksatra);

      // Search festivals
      const dayIndex = cal.BEFORE_DAYS + i;
      const festivals = matchFestivalsForDay(cal.days, dayIndex);
      for (const f of festivals) {
        if (f.name.toLowerCase().includes(q)) {
          found.push({ date: dateStr, weekday: wd, tithi, masa, text: f.name, category: 'Festival' });
        }
      }

      // Search ekadasi
      if (day.ekadasi_vrata_name && day.ekadasi_vrata_name.toLowerCase().includes(q)) {
        found.push({ date: dateStr, weekday: wd, tithi, masa, text: day.ekadasi_vrata_name, category: 'Ekadasi' });
      }

      // Search by tithi name
      if (tithi.toLowerCase().includes(q)) {
        found.push({ date: dateStr, weekday: wd, tithi, masa, text: `${tithi} tithi`, category: 'Tithi' });
      }

      // Search by naksatra name
      if (naksatra.toLowerCase().includes(q)) {
        found.push({ date: dateStr, weekday: wd, tithi, masa, text: `${naksatra} naksatra`, category: 'Naksatra' });
      }

      // Search by masa name
      if (masa.toLowerCase().includes(q) && (i === 0 || getMasaName(cal.days[cal.BEFORE_DAYS + i - 1]?.astrodata.masa ?? -1) !== masa)) {
        found.push({ date: dateStr, weekday: wd, tithi, masa, text: `${masa} Masa begins`, category: 'Masa' });
      }
    }

    results.value = found.slice(0, 100);
    total.value = found.length;
    searching.value = false;
  });

  return (
    <div>
      <h2 class="text-2xl font-bold mb-4">Search</h2>

      <div class="bg-white rounded-lg shadow p-5 mb-6">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Search festivals, tithis, naksatras, ekadasis..."
            class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            bind:value={query}
            onKeyUp$={(e) => { if ((e as KeyboardEvent).key === 'Enter') doSearch(); }}
          />
          <button
            onClick$={doSearch}
            class="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 text-sm"
          >
            Search
          </button>
        </div>
        <p class="text-xs text-stone-400 mt-2">Searches across all events for the current year ({new Date().getFullYear()})</p>
      </div>

      {searching.value && <p class="text-stone-500">Searching...</p>}

      {results.value.length > 0 && (
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-4 py-2 bg-stone-50 text-xs text-stone-500">
            {total.value} results found{total.value > 100 ? ' (showing first 100)' : ''}
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-stone-100 text-left text-xs font-semibold text-stone-500 uppercase">
                <th class="px-4 py-2 w-28">Date</th>
                <th class="px-4 py-2 w-16">Day</th>
                <th class="px-4 py-2">Event</th>
                <th class="px-4 py-2 w-20">Type</th>
                <th class="px-4 py-2 w-28">Masa</th>
              </tr>
            </thead>
            <tbody>
              {results.value.map((r, i) => (
                <tr key={i} class="border-t hover:bg-stone-50">
                  <td class="px-4 py-2 text-stone-500 whitespace-nowrap">{r.date}</td>
                  <td class="px-4 py-2 text-stone-400">{r.weekday}</td>
                  <td class="px-4 py-2 font-medium">{r.text}</td>
                  <td class="px-4 py-2">
                    <span class="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{r.category}</span>
                  </td>
                  <td class="px-4 py-2 text-stone-500">{r.masa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searching.value && results.value.length === 0 && query.value.length >= 2 && (
        <p class="text-stone-400 text-center mt-8">No results found for "{query.value}"</p>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Search - Gaurabda',
};
