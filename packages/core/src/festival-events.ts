// Festival event matcher — matches ISKCON festivals to calendar days.
// Loads events from events.json and matches by tithi+masa, ekadasi+paksa,
// sankranti, and selected legacy GCAL special scripts.

import eventsData from './data/events.json' with { type: 'json' };
import eventsShaktiData from './data/events-shakti.json' with { type: 'json' };
import { HourTime } from './hour-time.js';
import { getMoonLongitude } from './core-astronomy.js';
import {
  isFestivalEkadasi,
  isFestivalSankranti,
  isFestivalTithiMasa,
  isFestivalSpecial,
  type FestivalDayLike,
  type FestivalDescriptor,
} from './festival.js';
import type { EarthData } from './earth-data.js';
import type { GregorianDateTime } from './gregorian-date-time.js';

interface TithiEvent {
  type: 'T';
  name: string;
  tithi: number;
  masa: number;
  fast: number;
  fastSubj: string;
  dayoff: number;
}

interface EkadasiEvent {
  type: 'E';
  name: string;
  masa: number;
  paksa: number;
  fast: number;
  fastSubj: string;
  dayoff: number;
}

interface SankrantiEvent {
  type: 'S';
  name: string;
  sankranti: number;
  fast: number;
  fastSubj: string;
  dayoff: number;
}

interface RelatedEvent {
  type: 'R';
  name: string;
  fast: number;
  fastSubj: string;
  dayoff: number;
}

interface SpecialEvent {
  type: 'X';
  name: string;
  masa1: number;
  masa2: number;
  fast: number;
  fastSubj: string;
  dayoff: number;
  events?: RelatedEvent[];
}

type FestivalEvent = TithiEvent | EkadasiEvent | SankrantiEvent | SpecialEvent | { type: string; name: string; [k: string]: unknown };

interface FestivalEventShape {
  dayoff?: number;
  masa?: number;
  tithi?: number;
  paksa?: number;
  sankranti?: number;
  masa1?: number;
  masa2?: number;
}

interface FestivalBook {
  name: string;
  bookid?: string;
  events: FestivalEvent[];
}

interface EventsDB {
  books: FestivalBook[];
  visible?: Record<string, boolean>;
}

const dbMain = eventsData as unknown as EventsDB;
const dbShakti = eventsShaktiData as unknown as EventsDB;

// Merge both databases
const db: EventsDB = {
  books: [...dbMain.books, ...dbShakti.books],
  visible: { ...(dbMain.visible ?? {}), ...(dbShakti.visible ?? {}) },
};

export interface MatchedFestival {
  name: string;
  bookName: string;
  bookIndex: number;
  fast: number;
  fastSubject: string;
}

interface FestivalCalendarDay extends FestivalDayLike {
  date: GregorianDateTime | null;
  earth: EarthData | null;
  astrodata: FestivalDayLike['astrodata'] & {
    tithi: number;
    naksatra: number;
    sunNoon: HourTime;
  };
}

function isBookVisible(book: FestivalBook): boolean {
  if (!db.visible || book.bookid === undefined) return true;
  return db.visible[book.bookid] !== false;
}

function descriptorFromEvent(ev: FestivalEventShape): FestivalDescriptor {
  return {
    dayoff: ev.dayoff ?? 0,
    masa: ev.masa ?? -1,
    tithi: ev.tithi ?? -1,
    paksa: ev.paksa ?? -1,
    sankranti: ev.sankranti ?? -1,
    masa1: ev.masa1 ?? -1,
    masa2: ev.masa2 ?? -1,
  };
}

function pushUnique(result: MatchedFestival[], item: MatchedFestival): void {
  if (!result.some(existing => existing.name === item.name)) result.push(item);
}

function midnightNaksatra(day: FestivalCalendarDay): number {
  if (!day.date || !day.earth) return -1;

  const date = day.date.clone();
  const midnight = HourTime.fromObject(day.astrodata.sunNoon);
  date.shour = day.astrodata.sunNoon.totalDays;
  date.addHours(12);
  midnight.longitudeMoon = getMoonLongitude(date, day.earth);
  return midnight.naksatra;
}

function isKrishnaJanmastami(days: readonly FestivalCalendarDay[], idx: number): boolean {
  const d0 = days[idx - 1];
  const d1 = days[idx];
  const d2 = days[idx + 1];
  if (!d0 || !d1 || !d2) return false;

  let a0 = 0;
  let a1 = 0;
  let a2 = 0;

  if (d0.ksayaTithi === 7) return true;
  if (d0.astrodata.tithi === 7) a0 = 16;
  if (d1.astrodata.tithi === 7) a1 = 16;
  if (d2.astrodata.tithi === 7) a2 = 16;
  if (a1 === 0) return false;
  if (a0 < a1 && a1 > a2) return true;

  if (d0.astrodata.naksatra === 3) a0 += 8;
  if (d1.astrodata.naksatra === 3) a1 += 8;
  if (d2.astrodata.naksatra === 3) a2 += 8;
  if (a0 < a1 && a1 > a2) return true;
  if (a0 > a1 || a2 > a1) return false;

  if (midnightNaksatra(d0) === 3) a0 += 4;
  if (midnightNaksatra(d1) === 3) a1 += 4;
  if (midnightNaksatra(d2) === 3) a2 += 4;
  if (a0 < a1 && a1 > a2) return true;
  if (a0 > a1 || a2 > a1) return false;

  if (d0.date?.weekday === 0 || d0.date?.weekday === 2) a0 += 2;
  if (d1.date?.weekday === 0 || d1.date?.weekday === 2) a1 += 2;
  if (d2.date?.weekday === 0 || d2.date?.weekday === 2) a2 += 2;
  if (d2.astrodata.tithi === 7) a1 += 1;

  return a0 < a1 && a1 > a2;
}

function isSpecialScriptEvent(days: readonly FestivalCalendarDay[], idx: number, ev: SpecialEvent): boolean {
  const descriptor = descriptorFromEvent(ev);
  descriptor.script = (calendarDays, eventIndex) => {
    if (ev.name === 'Sri Krsna Janmastami: Appearance of Lord Sri Krsna') {
      return isKrishnaJanmastami(calendarDays as readonly FestivalCalendarDay[], eventIndex);
    }
    return false;
  };
  return isFestivalSpecial(days, idx, descriptor);
}

/** Match festivals using full calendar context. Required for legacy type X special events. */
export function matchFestivalsForDay(days: readonly FestivalCalendarDay[], index: number): MatchedFestival[] {
  const result: MatchedFestival[] = [];

  for (let bi = 0; bi < db.books.length; bi++) {
    const book = db.books[bi];
    if (!isBookVisible(book)) continue;

    for (const ev of book.events) {
      const item = {
        name: ev.name,
        bookName: book.name,
        bookIndex: bi,
        fast: Number((ev as { fast?: number }).fast ?? 0),
        fastSubject: String((ev as { fastSubj?: string }).fastSubj ?? ''),
      };

      if (ev.type === 'T') {
        if (isFestivalTithiMasa(days, index, descriptorFromEvent(ev as TithiEvent))) pushUnique(result, item);
      } else if (ev.type === 'E') {
        if (isFestivalEkadasi(days, index, descriptorFromEvent(ev as EkadasiEvent))) pushUnique(result, item);
      } else if (ev.type === 'S') {
        if (isFestivalSankranti(days, index, descriptorFromEvent(ev as SankrantiEvent))) pushUnique(result, item);
      } else if (ev.type === 'X') {
        const special = ev as SpecialEvent;
        if (isSpecialScriptEvent(days, index, special)) pushUnique(result, item);

        for (const related of special.events ?? []) {
          if (related.type !== 'R') continue;
          const baseIndex = index - (special.dayoff ?? 0) - (related.dayoff ?? 0);
          if (isSpecialScriptEvent(days, baseIndex, special)) {
            pushUnique(result, {
              name: related.name,
              bookName: book.name,
              bookIndex: bi,
              fast: related.fast,
              fastSubject: related.fastSubj,
            });
          }
        }
      }
    }
  }

  return result;
}

/** Match festivals for a given day's astronomical data */
export function matchFestivals(
  tithi: number,
  masa: number,
  paksa: number,
  sankrantiZodiac: number,
  prevTithi?: number,
  prevMasa?: number,
): MatchedFestival[] {
  const result: MatchedFestival[] = [];

  for (let bi = 0; bi < db.books.length; bi++) {
    const book = db.books[bi];
    if (!isBookVisible(book)) continue;

    for (const ev of book.events) {
      if (ev.type === 'T') {
        const te = ev as TithiEvent;
        // Match tithi+masa, accounting for dayoff
        const effectiveTithi = te.dayoff === 0 ? te.tithi : te.tithi;
        if (te.masa === masa && tithi === effectiveTithi) {
          // Check it wasn't already shown yesterday (dayoff logic)
          if (te.dayoff !== 0 && prevTithi !== undefined && prevMasa !== undefined) {
            if (prevMasa === te.masa && prevTithi === te.tithi) continue;
          }
          result.push({ name: te.name, bookName: book.name, bookIndex: bi, fast: te.fast, fastSubject: te.fastSubj });
        }
      } else if (ev.type === 'E') {
        const ee = ev as EkadasiEvent;
        if (ee.masa === masa && ee.paksa === paksa) {
          // Ekadasi-type events match on paksa+masa (tithi is ekadasi/dvadasi)
          if (tithi === 10 || tithi === 25 || tithi === 11 || tithi === 26) {
            result.push({ name: ee.name, bookName: book.name, bookIndex: bi, fast: ee.fast, fastSubject: ee.fastSubj });
          }
        }
      } else if (ev.type === 'S') {
        const se = ev as SankrantiEvent;
        if (sankrantiZodiac === se.sankranti) {
          result.push({ name: se.name, bookName: book.name, bookIndex: bi, fast: se.fast, fastSubject: se.fastSubj });
        }
      }
      // Type 'X' (special) requires full calendar context. Use matchFestivalsForDay().
    }
  }

  return result;
}

/** Get all festival book names */
export function getFestivalBookNames(): string[] {
  return db.books.map(b => b.name);
}

/** Get total festival count */
export function getFestivalCount(): number {
  return db.books.reduce((sum, b) => sum + b.events.length, 0);
}
