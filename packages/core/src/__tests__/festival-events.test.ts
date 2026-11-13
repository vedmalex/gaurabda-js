import { describe, expect, it } from 'vitest';
import { Location } from '../location.js';
import { ResultCalendar } from '../result-calendar.js';
import { matchFestivalsForDay } from '../festival-events.js';

function mayapurCalendar(year: number, month: number): ResultCalendar {
  const location = new Location('Mayapur', 23.42, 88.39, 'Asia/Calcutta');
  const cal = new ResultCalendar();
  cal.calculateMonth(location.getEarthData(), year, month);
  return cal;
}

function festivalNamesOn(cal: ResultCalendar, dayOfMonth: number): string[] {
  const dayIndex = cal.days.findIndex(day => day.date?.day === dayOfMonth && day.date.month === 9 && day.date.year === 2026);
  expect(dayIndex).toBeGreaterThanOrEqual(0);
  return matchFestivalsForDay(cal.days, dayIndex).map(festival => festival.name);
}

describe('festival special events', () => {
  it('matches Krishna Janmashtami and related next-day events like legacy GCAL', () => {
    const cal = mayapurCalendar(2026, 9);

    expect(festivalNamesOn(cal, 4)).toContain('Sri Krsna Janmastami: Appearance of Lord Sri Krsna');
    expect(festivalNamesOn(cal, 5)).toEqual(
      expect.arrayContaining(['Nandotsava', 'Srila Prabhupada -- Appearance']),
    );
  });

  it('does not show Janmashtami related events again on Radhastami', () => {
    const cal = mayapurCalendar(2026, 9);

    const names = festivalNamesOn(cal, 19);
    expect(names).toContain('Radhastami: Appearance of Srimati Radharani');
    expect(names).not.toContain('Nandotsava');
    expect(names).not.toContain('Srila Prabhupada -- Appearance');
  });
});
