import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import {
  loadLocation, toEarthData, todayDate,
  ResultCalendar, getTithiName, getNaksatraName, getYogaName,
  GregorianDateTime,
} from '~/components/location-store';
import {
  calculateRatedSlots, type TimeSlotRating,
  SunData, KalaType,
} from '@gaurabda/core';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function scoreColor(percent: number): string {
  if (percent >= 80) return 'bg-green-500';
  if (percent >= 64) return 'bg-green-400';
  if (percent >= 52) return 'bg-lime-400';
  if (percent >= 40) return 'bg-yellow-400';
  if (percent >= 28) return 'bg-orange-400';
  return 'bg-red-400';
}

function scoreBadge(percent: number): string {
  if (percent >= 80) return 'Excellent';
  if (percent >= 64) return 'Good';
  if (percent >= 52) return 'Fair';
  if (percent >= 40) return 'Neutral';
  if (percent >= 28) return 'Poor';
  return 'Avoid';
}

export default component$(() => {
  const slots = useSignal<TimeSlotRating[]>([]);
  const dayInfo = useSignal('');
  const tithiInfo = useSignal('');
  const naksatraInfo = useSignal('');
  const yogaInfo = useSignal('');

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const stored = loadLocation();
    const earth = toEarthData(stored);
    const today = todayDate(stored);

    const cal = new ResultCalendar();
    cal.calculateCalendar(earth, today, 3);

    const idx = cal.findDate(today);
    const day = cal.getDay(idx);
    if (!day?.date) return;

    const a = day.astrodata;
    const sr = a.sunRise;

    dayInfo.value = `${WEEKDAYS[day.date.weekday]}, ${day.date.day} ${GregorianDateTime.getMonthName(day.date.month)} ${day.date.year}`;
    tithiInfo.value = getTithiName(sr.tithi);
    naksatraInfo.value = getNaksatraName(sr.naksatra);
    yogaInfo.value = getYogaName(sr.yoga);

    // Kala times
    const kala = (type: number) => SunData.calculateKala(sr.totalDays, a.sunSet.totalDays, day.date!.weekday, type);
    const [rk1, rk2] = kala(KalaType.KT_RAHU_KALAM);
    const [yg1, yg2] = kala(KalaType.KT_YAMA_GHANTI);
    const [gk1, gk2] = kala(KalaType.KT_GULI_KALAM);

    slots.value = calculateRatedSlots(
      sr.tithi, sr.naksatra, sr.yoga, day.date!.weekday,
      sr.totalDays, a.sunSet.totalDays,
      rk1, rk2, yg1, yg2, gk1, gk2,
    );
  });

  return (
    <div>
      <h2 class="text-2xl font-bold mb-2">Muhurta Rating</h2>
      <p class="text-sm text-stone-500 mb-1">{dayInfo.value}</p>
      <p class="text-xs text-stone-400 mb-6">
        Tithi: {tithiInfo.value} &middot; Naksatra: {naksatraInfo.value} &middot; Yoga: {yogaInfo.value}
      </p>

      {/* Visual bar chart */}
      <div class="bg-white rounded-lg shadow p-5 mb-6">
        <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Auspiciousness Timeline</h3>
        <div class="space-y-1">
          {slots.value.map((s, i) => (
            <div key={i} class="flex items-center gap-2 text-xs">
              <span class="w-24 text-stone-500 shrink-0">{s.label}</span>
              <span class="w-24 text-stone-400 shrink-0 truncate">{s.muhurtaName}</span>
              <div class="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
                <div
                  class={['h-full rounded-full transition-all', scoreColor(s.percent)]}
                  style={{ width: `${s.percent}%` }}
                />
              </div>
              <span class={['w-14 text-right font-medium', s.percent >= 52 ? 'text-green-700' : 'text-red-600']}>
                {s.percent}%
              </span>
              <span class="w-16 text-stone-400">{scoreBadge(s.percent)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-stone-100 text-left font-semibold text-stone-500 uppercase">
              <th class="px-3 py-2">Time</th>
              <th class="px-3 py-2">Muhurta</th>
              <th class="px-3 py-2 text-center">Tithi</th>
              <th class="px-3 py-2 text-center">Naks</th>
              <th class="px-3 py-2 text-center">Yoga</th>
              <th class="px-3 py-2 text-center">Day</th>
              <th class="px-3 py-2 text-center">Muh</th>
              <th class="px-3 py-2 text-center">Kala</th>
              <th class="px-3 py-2 text-center">Total</th>
              <th class="px-3 py-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {slots.value.map((s, i) => (
              <tr key={i} class={['border-t', s.kalaPenalty > 0 ? 'bg-red-50' : i >= 15 ? 'bg-stone-50' : '']}>
                <td class="px-3 py-1.5 text-stone-500">{s.label}</td>
                <td class="px-3 py-1.5 font-medium">{s.muhurtaName}</td>
                <td class="px-3 py-1.5 text-center">{s.tithiScore}</td>
                <td class="px-3 py-1.5 text-center">{s.naksatraScore}</td>
                <td class="px-3 py-1.5 text-center">{s.yogaScore}</td>
                <td class="px-3 py-1.5 text-center">{s.weekdayScore}</td>
                <td class="px-3 py-1.5 text-center">{s.muhurtaScore}</td>
                <td class="px-3 py-1.5 text-center text-red-500">{s.kalaPenalty > 0 ? `-${s.kalaPenalty}` : ''}</td>
                <td class="px-3 py-1.5 text-center font-bold">{s.score}</td>
                <td class="px-3 py-1.5">
                  <span class={['px-1.5 py-0.5 rounded text-white text-[10px]', scoreColor(s.percent)]}>
                    {scoreBadge(s.percent)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p class="text-xs text-stone-400 mt-4">
        Score = Tithi + Naksatra + Yoga + Weekday + Muhurta - Kala penalty. Max: 25.
        During Rahu Kala, Yama Ghanti, or Guli Kala periods a penalty is applied.
      </p>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Muhurta Rating - Gaurabda',
};
