import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import {
  loadLocation, saveLocation, type StoredLocation,
} from '~/components/location-store';
import { searchLocations } from '@gaurabda/location';

interface SearchResult {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  offset: string;
}

export default component$(() => {
  const currentLocation = useSignal<StoredLocation | null>(null);
  const query = useSignal('');
  const results = useSignal<SearchResult[]>([]);
  const saved = useSignal(false);

  useVisibleTask$(() => {
    currentLocation.value = loadLocation();
  });

  const doSearch = $(() => {
    if (query.value.length < 2) {
      results.value = [];
      return;
    }
    const found = searchLocations(query.value, { limit: 15 });
    results.value = found.map(loc => ({
      city: loc.city,
      lat: loc.latitudeDeg,
      lon: loc.longitudeDeg,
      tz: loc.timezone.name,
      offset: `UTC${loc.offsetUtcHours >= 0 ? '+' : ''}${loc.offsetUtcHours}`,
    }));
  });

  const selectLocation = $((r: SearchResult) => {
    const stored: StoredLocation = {
      city: r.city,
      lat: r.lat,
      lon: r.lon,
      tz: r.tz,
    };
    saveLocation(stored);
    currentLocation.value = stored;
    results.value = [];
    query.value = '';
    saved.value = true;
    setTimeout(() => { saved.value = false; }, 2000);
  });

  return (
    <div>
      <h2 class="text-2xl font-bold mb-6">Settings</h2>

      {/* Current location */}
      <div class="bg-white rounded-lg shadow p-5 mb-6">
        <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Current Location</h3>
        {currentLocation.value && (
          <div class="text-sm space-y-1">
            <p><span class="text-stone-400 w-20 inline-block">City:</span> <span class="font-medium">{currentLocation.value.city}</span></p>
            <p><span class="text-stone-400 w-20 inline-block">Latitude:</span> {currentLocation.value.lat.toFixed(4)}</p>
            <p><span class="text-stone-400 w-20 inline-block">Longitude:</span> {currentLocation.value.lon.toFixed(4)}</p>
            <p><span class="text-stone-400 w-20 inline-block">Timezone:</span> {currentLocation.value.tz}</p>
          </div>
        )}
        {saved.value && (
          <p class="text-green-600 text-sm mt-2 font-medium">Location saved!</p>
        )}
      </div>

      {/* Search */}
      <div class="bg-white rounded-lg shadow p-5">
        <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Change Location</h3>
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Search city..."
            class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            bind:value={query}
            onInput$={doSearch}
          />
        </div>

        {results.value.length > 0 && (
          <ul class="mt-2 border rounded divide-y max-h-64 overflow-auto">
            {results.value.map((r, i) => (
              <li key={i}>
                <button
                  class="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors"
                  onClick$={() => selectLocation(r)}
                >
                  <span class="font-medium">{r.city}</span>
                  <span class="text-stone-400 ml-2">{r.tz} ({r.offset})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manual coordinates */}
      <div class="bg-white rounded-lg shadow p-5 mt-6">
        <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Manual Coordinates</h3>
        <p class="text-xs text-stone-400 mb-3">Enter latitude and longitude directly if your city is not in the database.</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-stone-500">Latitude</label>
            <input
              type="number"
              step="0.0001"
              class="w-full border rounded px-3 py-2 text-sm mt-1"
              value={currentLocation.value?.lat}
              onChange$={(e) => {
                if (currentLocation.value) {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  if (!isNaN(val)) {
                    const updated = { ...currentLocation.value, lat: val };
                    saveLocation(updated);
                    currentLocation.value = updated;
                  }
                }
              }}
            />
          </div>
          <div>
            <label class="text-xs text-stone-500">Longitude</label>
            <input
              type="number"
              step="0.0001"
              class="w-full border rounded px-3 py-2 text-sm mt-1"
              value={currentLocation.value?.lon}
              onChange$={(e) => {
                if (currentLocation.value) {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  if (!isNaN(val)) {
                    const updated = { ...currentLocation.value, lon: val };
                    saveLocation(updated);
                    currentLocation.value = updated;
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Settings - Gaurabda',
};
