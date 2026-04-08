// Converted from js/Vaisnavaday.js (970 lines)
// FIX: foreach → for-of; .Index() → .indexOf(); sprintf → format/template
// FIX: TCoreEventCollection → CoreEvent[] with helper functions
// FIX: GCMath.Min/Max on CoreEvent → minByTime/maxByTime helpers
// FIX: missing this. on dispItem, text (line 16-18)

import { CoreEventType, DstTypeChange, FastType, MahadvadasiType, NaksatraId, TithiId } from './enums.js';
import { CoreEvent } from './core-event.js';
import { HourTime } from './hour-time.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import { AstroData } from './astro-data.js';
import { getEkadasiName } from './ekadasi.js';
import {
  tithiIsEkadasi, tithiIsDvadasi, tithiIsTrayodasi,
  tithiLessEkadasi, tithiIsFullNewMoon,
} from './tithi.js';
import type { EarthData } from './earth-data.js';

// ── Helpers ─────────────────────────────────────────────────────────

function minByTime(a: CoreEvent, b: CoreEvent): CoreEvent {
  return a.Time <= b.Time ? a : b;
}

function maxByTime(a: CoreEvent, b: CoreEvent): CoreEvent {
  return a.Time >= b.Time ? a : b;
}

// CoreEventCollection helpers (replaces class wrapper)
function findIndexOf(list: CoreEvent[], nType: number, startIdx: number): number {
  for (let i = Math.max(startIdx, 0); i < list.length; i++) {
    if (list[i].nType === nType) return i;
  }
  return -1;
}

function findBackIndexOf(list: CoreEvent[], nType: number, startIdx: number): number {
  const idx = Math.min(startIdx, list.length - 1);
  for (let i = idx; i >= 0; i--) {
    if (list[i].nType === nType) return i;
  }
  return -1;
}

export function insertByTime(list: CoreEvent[], ce: CoreEvent): void {
  for (let i = 0; i < list.length; i++) {
    if (list[i].Time > ce.Time) {
      list.splice(i, 0, ce);
      return;
    }
  }
  list.push(ce);
}

// ── VaisnavEvent ────────────────────────────────────────────────────

export class VaisnavEvent {
  prio: number = 0;
  dispItem: number = 0;
  text: string = '';
  fasttype: number = 0;
  fastsubject: string = '';
  spec: string = '';
}

// ── CoreEventFindRec ────────────────────────────────────────────────

export class CoreEventFindRec {
  day: VaisnavaDay | null = null;
  coreEvent: CoreEvent = new CoreEvent();
  dateTimeOfEvent: GregorianDateTime = new GregorianDateTime();
}

// ── VaisnavaDay ─────────────────────────────────────────────────────

export class VaisnavaDay {
  previous: VaisnavaDay | null = null;
  next: VaisnavaDay | null = null;

  date: GregorianDateTime | null = null;
  moonrise: HourTime = new HourTime();
  moonset: HourTime = new HourTime();
  earth: EarthData | null = null;
  astrodata: AstroData = new AstroData();

  coreEvents: CoreEvent[] = [];

  biasMinutes: number = 0;
  dstDayType: number = DstTypeChange.DstOff;
  utcDayStart: number = -1;

  dayEvents: VaisnavEvent[] = [];
  nFeasting: number | null = null;
  nFastID: number = FastType.FAST_NULL;

  nMahadvadasiID: number = MahadvadasiType.EV_NULL;
  ekadasi_vrata_name: string = '';
  eparana_time1: CoreEvent | null = null;
  eparana_time2: CoreEvent | null = null;

  sankranti_zodiac: number = -1;
  sankranti_day: GregorianDateTime | null = null;

  ksayaTithi: number = -1;
  ksayaMasa: number = -1;
  vriddhiDayNo: number = 1;

  get astro(): AstroData { return this.astrodata; }
  get fastType(): number { return this.nFastID; }
  get ekadasi_parana(): boolean { return this.eparana_time1 !== null; }

  getGregorianDateTime(ce: CoreEvent): GregorianDateTime {
    const gdt = this.date!.clone();
    gdt.shour = (ce.getDstTime(this.biasMinutes * 60) - this.utcDayStart) / 86400.0;
    return gdt;
  }

  getCoreEventTime(tce: CoreEvent): string {
    return GregorianDateTime.timeSpanToLongString(tce.getDstTime(this.biasMinutes * 60) - this.utcDayStart);
  }

  findCoreEvent(nType: number): CoreEvent | null {
    for (const ce of this.coreEvents) {
      if (ce.nType === nType) return ce;
    }
    return null;
  }

  getRecentCoreTimes(nTypeStart: number, nTypeFind: number, count: number): CoreEventFindRec[] {
    const dayList: CoreEventFindRec[] = [];
    let cursor: VaisnavaDay | null = this;
    let idx = findIndexOf(this.coreEvents, nTypeStart, 0);
    if (idx >= 0) {
      while (cursor !== null && dayList.length < count) {
        idx = findBackIndexOf(cursor.coreEvents, nTypeFind, idx - 1);
        if (idx < 0) {
          cursor = cursor.previous;
          idx = 1000;
        } else {
          const cer = new CoreEventFindRec();
          cer.day = cursor;
          cer.coreEvent = cursor.coreEvents[idx];
          cer.dateTimeOfEvent = cursor.getGregorianDateTime(cursor.coreEvents[idx]);
          dayList.unshift(cer);
        }
      }
    }
    return dayList;
  }

  getNextCoreTimes(nTypeStart: number, nTypeFind: number, count: number): CoreEventFindRec[] {
    const dayList: CoreEventFindRec[] = [];
    let cursor: VaisnavaDay | null = this;
    let idx = findIndexOf(this.coreEvents, nTypeStart, 0);
    if (idx >= 0) {
      while (cursor !== null && dayList.length < count) {
        idx = findIndexOf(cursor.coreEvents, nTypeFind, idx + 1);
        if (idx < 0) {
          cursor = cursor.next;
          idx = -1;
        } else {
          const cer = new CoreEventFindRec();
          cer.day = cursor;
          cer.coreEvent = cursor.coreEvents[idx];
          cer.dateTimeOfEvent = cursor.getGregorianDateTime(cursor.coreEvents[idx]);
          dayList.push(cer);
        }
      }
    }
    return dayList;
  }

  addEvent(priority: number, dispItem: number, text: string): VaisnavEvent {
    const dc = new VaisnavEvent();
    dc.prio = priority;
    dc.dispItem = dispItem;
    dc.text = text;
    this.dayEvents.push(dc);
    return dc;
  }

  sortDayEvents(): void {
    this.dayEvents.sort((a, b) => a.prio - b.prio);
  }

  // ── Ekadasi calculation ─────────────────────────────────────────

  ekadasiCalc(_earth: EarthData): number {
    const t = this;
    if (!t.previous || !t.next) return 0;

    const s = t.previous;
    const u = t.next;

    if (tithiIsEkadasi(t.astrodata.sunRise.tithi)) {
      if (tithiLessEkadasi(t.astrodata.sunArunodaya.tithi)) {
        t.nMahadvadasiID = MahadvadasiType.EV_NULL;
        t.ekadasi_vrata_name = '';
        t.nFastID = FastType.FAST_NULL;
      } else {
        if (tithiIsEkadasi(s.astrodata.sunRise.tithi) && tithiIsEkadasi(s.astrodata.sunArunodaya.tithi)) {
          if (tithiIsTrayodasi(u.astrodata.sunRise.tithi)) {
            t.nMahadvadasiID = MahadvadasiType.EV_UNMILANI_TRISPRSA;
          } else {
            t.nMahadvadasiID = MahadvadasiType.EV_UNMILANI;
          }
          t.ekadasi_vrata_name = getEkadasiName(t.astrodata.masa, t.astrodata.sunRise.paksa);
          t.nFastID = FastType.FAST_EKADASI;
        } else {
          if (tithiIsTrayodasi(u.astrodata.sunRise.tithi)) {
            t.nMahadvadasiID = MahadvadasiType.EV_TRISPRSA;
            t.ekadasi_vrata_name = getEkadasiName(t.astrodata.masa, t.astrodata.sunRise.paksa);
            t.nFastID = FastType.FAST_EKADASI;
          } else {
            if (tithiIsEkadasi(u.astrodata.sunRise.tithi) || u.nMahadvadasiID >= MahadvadasiType.EV_SUDDHA) {
              t.nMahadvadasiID = MahadvadasiType.EV_NULL;
              t.ekadasi_vrata_name = '';
              t.nFastID = FastType.FAST_NULL;
            } else if (u.nMahadvadasiID === MahadvadasiType.EV_NULL) {
              t.nMahadvadasiID = MahadvadasiType.EV_SUDDHA;
              t.ekadasi_vrata_name = getEkadasiName(t.astrodata.masa, t.astrodata.sunRise.paksa);
              t.nFastID = FastType.FAST_EKADASI;
            }
          }
        }
      }
    }

    return 1;
  }

  // ── Parana (break-fast) calculation ─────────────────────────────

  calculateEParana(_earth: EarthData): number {
    const t = this;
    if (!t.previous) return 0;

    t.nMahadvadasiID = MahadvadasiType.EV_NULL;
    t.nFastID = FastType.FAST_NULL;

    const sunRise = t.findCoreEvent(CoreEventType.CCTYPE_S_RISE);
    const sunSet = t.findCoreEvent(CoreEventType.CCTYPE_S_SET);
    if (!sunRise || !sunSet) return 0;

    const thirdDay = new CoreEvent();
    thirdDay.nData = sunRise.nData;
    thirdDay.nType = CoreEventType.CCTYPE_THIRD_OF_DAY;
    thirdDay.nDst = sunRise.nDst;
    thirdDay.Time = (sunSet.Time - sunRise.Time) / 3 + sunRise.Time;

    const recentTimes = this.getRecentCoreTimes(CoreEventType.CCTYPE_S_RISE, CoreEventType.CCTYPE_TITHI, 1);
    if (recentTimes.length !== 1) return 0;
    const tithiStart = new CoreEvent(recentTimes[0].coreEvent);

    const nextTimes = this.getNextCoreTimes(CoreEventType.CCTYPE_S_RISE, CoreEventType.CCTYPE_TITHI, 1);
    if (nextTimes.length !== 1) return 0;
    const tithiEnd = new CoreEvent(nextTimes[0].coreEvent);
    tithiEnd.nType = CoreEventType.CCTYPE_TITHI_END;
    tithiEnd.applyDstType(this.utcDayStart, this.dstDayType);

    if (!this.previous) return 0;
    const naksEndTimes = this.previous.getNextCoreTimes(CoreEventType.CCTYPE_S_RISE, CoreEventType.CCTYPE_NAKS, 1);
    if (naksEndTimes.length !== 1) return 0;
    const naksEnd = new CoreEvent(naksEndTimes[0].coreEvent);
    naksEnd.nType = CoreEventType.CCTYPE_NAKS_END;
    naksEnd.applyDstType(this.utcDayStart, this.dstDayType);

    const tithiQuart = new CoreEvent();
    tithiQuart.nType = CoreEventType.CCTYPE_TITHI_QUARTER;
    tithiQuart.nData = tithiStart.nData;
    tithiQuart.Time = (tithiEnd.Time - tithiStart.Time) / 4 + tithiStart.Time;
    tithiQuart.nDst = tithiStart.nDst;
    tithiQuart.applyDstType(this.utcDayStart, this.dstDayType);

    let parBeg: CoreEvent | null = null;
    let parEnd: CoreEvent | null = null;

    switch (t.previous.nMahadvadasiID) {
      case MahadvadasiType.EV_UNMILANI:
        parEnd = minByTime(tithiEnd, thirdDay);
        parBeg = sunRise;
        break;
      case MahadvadasiType.EV_VYANJULI:
        parBeg = sunRise;
        parEnd = minByTime(tithiEnd, thirdDay);
        break;
      case MahadvadasiType.EV_TRISPRSA:
        parBeg = sunRise;
        parEnd = thirdDay;
        break;
      case MahadvadasiType.EV_JAYANTI:
      case MahadvadasiType.EV_VIJAYA:
        if (tithiIsDvadasi(t.astrodata.sunRise.tithi)) {
          if (naksEnd.Time < tithiEnd.Time) {
            parBeg = naksEnd;
            parEnd = naksEnd.Time < thirdDay.Time ? minByTime(tithiEnd, thirdDay) : tithiEnd;
          } else {
            parBeg = sunRise;
            parEnd = minByTime(tithiEnd, thirdDay);
          }
        } else {
          parBeg = sunRise;
          parEnd = minByTime(naksEnd, thirdDay);
        }
        break;
      case MahadvadasiType.EV_JAYA:
      case MahadvadasiType.EV_PAPA_NASINI:
        if (tithiIsDvadasi(t.astrodata.sunRise.tithi)) {
          if (naksEnd.Time < tithiEnd.Time) {
            parBeg = naksEnd;
            parEnd = naksEnd.Time < thirdDay.Time ? minByTime(tithiEnd, thirdDay) : tithiEnd;
          } else {
            parBeg = sunRise;
            parEnd = minByTime(tithiEnd, thirdDay);
          }
        } else {
          parBeg = naksEnd;
          parEnd = naksEnd.Time < thirdDay.Time ? thirdDay : null;
        }
        break;
      default:
        parEnd = minByTime(tithiEnd, thirdDay);
        parBeg = maxByTime(sunRise, tithiQuart);
        if (tithiIsDvadasi(t.previous.astrodata.sunRise.tithi)) {
          parBeg = sunRise;
        }
        break;
    }

    if (parBeg && parEnd && parBeg.Time >= parEnd.Time) {
      parEnd = null;
    }

    t.eparana_time1 = parBeg;
    t.eparana_time2 = parEnd;
    return 1;
  }

  // ── Mahadvadasi calculation ─────────────────────────────────────

  mahadvadasiCalc(_earth: EarthData): number {
    const t = this;
    if (!t.previous || !t.next) return 0;

    const s = t.previous;
    const u = t.next;
    let mahaDay: VaisnavaDay | null = null;

    if (tithiIsDvadasi(s.astrodata.sunRise.tithi)) return 1;

    let nMahaType: number;
    if (
      TithiId.TITHI_GAURA_DVADASI === t.astrodata.sunRise.tithi &&
      TithiId.TITHI_GAURA_DVADASI === t.astrodata.sunSet.tithi &&
      (nMahaType = t.isMhd58()) !== MahadvadasiType.EV_NULL
    ) {
      t.nMahadvadasiID = nMahaType;
      mahaDay = t;
    } else if (tithiIsDvadasi(t.astrodata.sunRise.tithi)) {
      if (tithiIsDvadasi(u.astrodata.sunRise.tithi) && tithiIsEkadasi(s.astrodata.sunRise.tithi) && tithiIsEkadasi(s.astrodata.sunArunodaya.tithi)) {
        t.nMahadvadasiID = MahadvadasiType.EV_VYANJULI;
        mahaDay = t;
      } else if (t.nextNewFullIsVriddhi()) {
        t.nMahadvadasiID = MahadvadasiType.EV_PAKSAVARDHINI;
        mahaDay = t;
      } else if (tithiLessEkadasi(s.astrodata.sunArunodaya.tithi)) {
        t.nMahadvadasiID = MahadvadasiType.EV_SUDDHA;
        mahaDay = t;
      }
    }

    if (mahaDay && mahaDay.next) {
      mahaDay.nFastID = FastType.FAST_EKADASI;
      mahaDay.ekadasi_vrata_name = getEkadasiName(t.astrodata.masa, t.astrodata.sunRise.paksa);
      mahaDay.eparana_time1 = null;
      mahaDay.eparana_time2 = null;

      mahaDay.next.nFastID = FastType.FAST_NULL;
      mahaDay.next.eparana_time1 = null;
      mahaDay.next.eparana_time2 = null;
    }

    return 1;
  }

  nextNewFullIsVriddhi(): boolean {
    let nPrevTithi = 100;
    let cursor: VaisnavaDay | null = this;

    for (let i = 0; i < 8 && cursor !== null; i++) {
      const nTithi = cursor.astrodata.sunRise.tithi;
      if (nTithi === nPrevTithi && tithiIsFullNewMoon(nTithi)) return true;
      nPrevTithi = nTithi;
      cursor = cursor.next;
    }
    return false;
  }

  isMhd58(): number {
    if (!this.next) return MahadvadasiType.EV_NULL;

    const sunRiseNaksatra = this.astrodata.sunRise.naksatra;
    if (sunRiseNaksatra !== this.next.astrodata.sunRise.naksatra) return MahadvadasiType.EV_NULL;
    if (this.astrodata.sunRise.paksa !== 1) return MahadvadasiType.EV_NULL;

    if (this.astrodata.sunRise.tithi === this.astrodata.sunSet.tithi) {
      if (sunRiseNaksatra === NaksatraId.PUNARVASU) return MahadvadasiType.EV_JAYA;
      if (sunRiseNaksatra === NaksatraId.ROHINI) return MahadvadasiType.EV_JAYANTI;
      if (sunRiseNaksatra === NaksatraId.PUSYAMI) return MahadvadasiType.EV_PAPA_NASINI;
      if (sunRiseNaksatra === NaksatraId.SRAVANA) return MahadvadasiType.EV_VIJAYA;
      return MahadvadasiType.EV_NULL;
    }

    if (sunRiseNaksatra === NaksatraId.SRAVANA) return MahadvadasiType.EV_VIJAYA;
    return MahadvadasiType.EV_NULL;
  }

  hasExtraFastingNote(): boolean {
    const t = this.astrodata.sunRise.tithi;
    if (t === 10 || t === 25 || t === 11 || t === 26) {
      return !this.ekadasi_parana;
    }
    return false;
  }

  hasEventsOfDisplayIndex(dispIndex: number): boolean {
    for (const md of this.dayEvents) {
      if (md.dispItem === dispIndex) return true;
    }
    return false;
  }

  findEventsText(text: string): VaisnavEvent | null {
    const lower = text.toLowerCase();
    for (const md of this.dayEvents) {
      if (md.text && md.text.toLowerCase().indexOf(lower) >= 0) return md;
    }
    return null;
  }
}
