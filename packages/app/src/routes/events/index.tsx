import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { loadLocation, toEarthData, GregorianDateTime } from '~/components/location-store';
import { ResultCoreEvents, CoreEvent } from '@gaurabda/core';

interface EventRow {
  type: string;
  date: string;
  time: string;
}

export default component$(() => {
  const events = useSignal<EventRow[]>([]);
  const monthLabel = useSignal('');

  useVisibleTask$(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    const stored = loadLocation();
    const earth = toEarthData(stored);

    const rce = new ResultCoreEvents();
    rce.full = true;
    rce.calculateEvents(earth, y, m);

    monthLabel.value = GregorianDateTime.getMonthName(m) + ' ' + y;

    events.value = rce.events.map(e => ({
      type: CoreEvent.getTypeString(e.nType, e.nData),
      date: '', // events have Julian time, not formatted date
      time: new Date((e.Time / 86400 - 2440587.5) * 86400000).toLocaleString(),
    }));
  });

  return (
    <div>
      <h2 class="text-2xl font-bold mb-2">Core Events</h2>
      <p class="text-sm text-stone-500 mb-6">{monthLabel.value}</p>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-stone-100 text-left text-xs font-semibold text-stone-500 uppercase">
              <th class="px-4 py-2">Event</th>
              <th class="px-4 py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.value.map((ev, i) => (
              <tr key={i} class="border-t hover:bg-stone-50">
                <td class="px-4 py-2">{ev.type}</td>
                <td class="px-4 py-2 text-stone-500">{ev.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.value.length === 0 && (
        <p class="text-stone-400 mt-4">Loading events...</p>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Events - Gaurabda',
};
