import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData, GregorianDateTime,
  ResultCalendar, getMasaName, getFastingName,
} from '~/components/location-store';
import { CoreEvent, CoreEventType, FastType, matchFestivals } from '@gaurabda/core';

type EventCategory = 'all' | 'festival' | 'astro' | 'ekadasi' | 'sankranti';

interface EventRow {
  category: EventCategory;
  name: string;
  date: string;
  time: string;
  detail: string;
  color: string;
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  all: '',
  festival: 'text-amber-700 bg-amber-50',
  astro: 'text-blue-700 bg-blue-50',
  ekadasi: 'text-yellow-700 bg-yellow-50',
  sankranti: 'text-purple-700 bg-purple-50',
};

const CATEGORY_LABELS: { value: EventCategory; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'festival', label: 'Festivals' },
  { value: 'ekadasi', label: 'Ekadasi & Fasting' },
  { value: 'astro', label: 'Astronomical' },
  { value: 'sankranti', label: 'Sankranti' },
];

export default component$(() => {
  const events = useSignal<EventRow[]>([]);
  const filter = useSignal<EventCategory>('all');
  const monthLabel = useSignal('');
  const yearVal = useSignal(new Date().getFullYear());
  const monthVal = useSignal(new Date().getMonth() + 1);

  const loadEvents = $(() => {
    const y = yearVal.value;
    const m = monthVal.value;
    const stored = loadLocation();
    const earth = toEarthData(stored);

    monthLabel.value = GregorianDateTime.getMonthName(m) + ' ' + y;

    // Calculate full calendar to get festivals + astro events
    const cal = new ResultCalendar();
    const startDate = GregorianDateTime.fromComponents(y, m, 1);
    startDate.TimezoneHours = earth.offsetUtcHours;
    const daysInMonth = GregorianDateTime.getMonthMaxDays(y, m);
    cal.calculateCalendar(earth, startDate, daysInMonth);

    const rows: EventRow[] = [];
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < cal.pureCount; i++) {
      const day = cal.days[cal.BEFORE_DAYS + i];
      if (!day?.date) continue;

      const a = day.astrodata;
      const sr = a.sunRise;
      const dateStr = `${day.date.day} ${GregorianDateTime.getMonthAbreviation(day.date.month)} ${WEEKDAYS[day.date.weekday]}`;

      // Festivals
      const festivals = matchFestivals(sr.tithi, a.masa, sr.paksa, day.sankranti_zodiac);
      for (const f of festivals) {
        rows.push({
          category: 'festival',
          name: f.name,
          date: dateStr,
          time: '',
          detail: f.fast ? getFastingName(f.fast) : '',
          color: CATEGORY_COLORS.festival,
        });
      }

      // Ekadasi / Parana
      if (day.nFastID === FastType.FAST_EKADASI) {
        rows.push({
          category: 'ekadasi',
          name: day.ekadasi_vrata_name || 'Ekadasi',
          date: dateStr,
          time: sr.toLongTimeString(),
          detail: getFastingName(day.nFastID),
          color: CATEGORY_COLORS.ekadasi,
        });
      }
      if (day.ekadasi_parana) {
        rows.push({
          category: 'ekadasi',
          name: 'Ekadasi Parana (break fast)',
          date: dateStr,
          time: sr.toLongTimeString(),
          detail: '',
          color: 'text-green-700 bg-green-50',
        });
      }

      // Sankranti
      if (day.sankranti_zodiac >= 0) {
        rows.push({
          category: 'sankranti',
          name: `Sankranti`,
          date: dateStr,
          time: '',
          detail: getMasaName(day.sankranti_zodiac),
          color: CATEGORY_COLORS.sankranti,
        });
      }

      // Core astro events from coreEvents
      for (const ce of day.coreEvents) {
        if (ce.nType === CoreEventType.CCTYPE_TITHI) {
          rows.push({
            category: 'astro',
            name: CoreEvent.getTypeString(ce.nType, ce.nData),
            date: dateStr,
            time: '',
            detail: 'Tithi transition',
            color: CATEGORY_COLORS.astro,
          });
        } else if (ce.nType === CoreEventType.CCTYPE_NAKS) {
          rows.push({
            category: 'astro',
            name: CoreEvent.getTypeString(ce.nType, ce.nData),
            date: dateStr,
            time: '',
            detail: 'Naksatra transition',
            color: CATEGORY_COLORS.astro,
          });
        } else if (ce.nType === CoreEventType.CCTYPE_YOGA) {
          rows.push({
            category: 'astro',
            name: CoreEvent.getTypeString(ce.nType, ce.nData),
            date: dateStr,
            time: '',
            detail: 'Yoga transition',
            color: CATEGORY_COLORS.astro,
          });
        } else if (ce.nType === CoreEventType.CCTYPE_CONJ) {
          rows.push({
            category: 'astro',
            name: CoreEvent.getTypeString(ce.nType, ce.nData),
            date: dateStr,
            time: '',
            detail: 'Sun-Moon conjunction',
            color: CATEGORY_COLORS.astro,
          });
        }
      }
    }

    events.value = rows;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => yearVal.value);
    track(() => monthVal.value);
    loadEvents();
  });

  const goPrev = $((): void => {
    let m = monthVal.value - 1; let y = yearVal.value;
    if (m < 1) { m = 12; y--; }
    monthVal.value = m; yearVal.value = y;
  });

  const goNext = $((): void => {
    let m = monthVal.value + 1; let y = yearVal.value;
    if (m > 12) { m = 1; y++; }
    monthVal.value = m; yearVal.value = y;
  });

  const filtered = events.value.filter(e => filter.value === 'all' || e.category === filter.value);

  return (
    <div>
      {/* Header + nav */}
      <div class="flex items-center justify-between mb-4">
        <button onClick$={goPrev} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&larr;</button>
        <h2 class="text-2xl font-bold">{monthLabel.value}</h2>
        <button onClick$={goNext} class="px-3 py-1 rounded bg-stone-200 hover:bg-stone-300 text-sm">&rarr;</button>
      </div>

      {/* Filter tabs */}
      <div class="flex gap-1 mb-4 flex-wrap">
        {CATEGORY_LABELS.map(cat => (
          <button
            key={cat.value}
            onClick$={() => { filter.value = cat.value; }}
            class={[
              'px-3 py-1 rounded text-xs font-medium transition-colors',
              filter.value === cat.value
                ? 'bg-amber-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
            ]}
          >
            {cat.label}
            {cat.value !== 'all' && (
              <span class="ml-1 opacity-60">
                ({events.value.filter(e => e.category === cat.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events table */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-stone-100 text-left text-xs font-semibold text-stone-500 uppercase">
              <th class="px-4 py-2 w-24">Date</th>
              <th class="px-4 py-2">Event</th>
              <th class="px-4 py-2 w-48">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev, i) => (
              <tr key={i} class="border-t hover:bg-stone-50">
                <td class="px-4 py-2 text-stone-500 whitespace-nowrap">{ev.date}</td>
                <td class="px-4 py-2">
                  <span class={['px-1.5 py-0.5 rounded text-xs', ev.color]}>{ev.name}</span>
                </td>
                <td class="px-4 py-2 text-stone-400 text-xs">{ev.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p class="text-stone-400 mt-4 text-center">
          {events.value.length === 0 ? 'Loading events...' : 'No events match this filter.'}
        </p>
      )}

      <p class="text-xs text-stone-400 mt-3 text-center">
        {filtered.length} events shown / {events.value.length} total
      </p>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Events - Gaurabda',
};
