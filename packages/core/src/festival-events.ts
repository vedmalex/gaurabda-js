// Festival event matcher — matches ISKCON festivals to calendar days
// Loads events from events.json and matches by tithi+masa, ekadasi+paksa, sankranti

import eventsData from './data/events.json' with { type: 'json' };

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

type FestivalEvent = TithiEvent | EkadasiEvent | SankrantiEvent | { type: string; name: string; [k: string]: unknown };

interface FestivalBook {
  name: string;
  events: FestivalEvent[];
}

interface EventsDB {
  books: FestivalBook[];
  visible: number[];
}

const db = eventsData as unknown as EventsDB;

export interface MatchedFestival {
  name: string;
  bookName: string;
  bookIndex: number;
  fast: number;
  fastSubject: string;
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
      // Type 'X' (special) requires script execution — skipped for now
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
