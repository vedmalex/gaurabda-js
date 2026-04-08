import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { loadLocation, toEarthData, getMasaName, GregorianDateTime } from '~/components/location-store';
import { ResultMasaList } from '@gaurabda/core';

interface MasaRow {
  masa: string;
  year: number;
  start: string;
  end: string;
}

export default component$(() => {
  const masas = useSignal<MasaRow[]>([]);
  const yearLabel = useSignal('');

  useVisibleTask$(() => {
    const now = new Date();
    const y = now.getFullYear();
    yearLabel.value = y.toString();

    const stored = loadLocation();
    const earth = toEarthData(stored);

    const rml = new ResultMasaList();
    rml.calculateMasaList(earth, y, 1);

    masas.value = rml.entries.map(e => ({
      masa: getMasaName(e.masa),
      year: e.year,
      start: `${e.vcStart.day} ${GregorianDateTime.getMonthAbreviation(e.vcStart.month)}`,
      end: `${e.vcEnd.day} ${GregorianDateTime.getMonthAbreviation(e.vcEnd.month)}`,
    }));
  });

  return (
    <div>
      <h2 class="text-2xl font-bold mb-2">Masa List</h2>
      <p class="text-sm text-stone-500 mb-6">Gaurabda year {yearLabel.value}</p>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-stone-100 text-left text-xs font-semibold text-stone-500 uppercase">
              <th class="px-4 py-2">Masa</th>
              <th class="px-4 py-2">Gaurabda</th>
              <th class="px-4 py-2">Start</th>
              <th class="px-4 py-2">End</th>
            </tr>
          </thead>
          <tbody>
            {masas.value.map((m, i) => (
              <tr key={i} class="border-t hover:bg-stone-50">
                <td class="px-4 py-2 font-medium">{m.masa}</td>
                <td class="px-4 py-2 text-stone-500">{m.year}</td>
                <td class="px-4 py-2">{m.start}</td>
                <td class="px-4 py-2">{m.end}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {masas.value.length === 0 && (
        <p class="text-stone-400 mt-4">Loading masa list...</p>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Masa List - Gaurabda',
};
