// Converted from js/TCoreEvent.js (192 lines)
// FIX: Convert.ToInt32() → toInt32() (line 40)
// FIX: DAYTIME → DayTime (line 78)
// FIX: bare Localized() → direct strings via strings.ts

import { toInt32 } from './math.js';
import { CoreEventType, DstTypeChange } from './enums.js';
import { DayTime } from './day-time.js';
import { getRasiName } from './rasi.js';
import {
  format, getMuhurtaName, getKalaName, getDSTSignature,
  getWeekdayName, getTithiName, getNaksatraName, getYogaName,
} from './strings.js';

export class CoreEvent {
  nType: number = 0;
  nData: number = 0;
  Time: number = 0;
  nDst: number = 0;

  constructor(ev?: CoreEvent) {
    if (ev !== undefined) {
      this.set(ev);
    }
  }

  static withTimeType(inTime: number, inType: number): CoreEvent {
    const v = new CoreEvent();
    v.nType = inType;
    v.Time = inTime;
    return v;
  }

  getDstTime(biasSeconds: number): number {
    return this.Time + this.nDst * biasSeconds;
  }

  set(de: CoreEvent): void {
    this.nType = de.nType;
    this.nData = de.nData;
    this.Time = de.Time;
    this.nDst = de.nDst;
  }

  // FIX: Convert.ToInt32() → toInt32()
  daySeconds(utcDayStart: number): number {
    return toInt32((this.Time - utcDayStart + 86400) % 86400);
  }

  toString(): string {
    return this.typeString() + ' ' + this.Time;
  }

  getTimeString(utcDayStart: number): string {
    const ds = this.daySeconds(utcDayStart);
    const ht = new DayTime();
    ht.setDayTime(ds / 86400.0 + this.nDst / 24.0);
    return ht.toLongTimeString();
  }

  static getTypeString(nType: number, nData?: number): string {
    if (nData === undefined) {
      switch (nType) {
        case CoreEventType.CCTYPE_CONJ: return 'Conjunction';
        case CoreEventType.CCTYPE_DATE: return 'Date';
        case CoreEventType.CCTYPE_M_RASI: return 'Moon rasi';
        case CoreEventType.CCTYPE_NAKS: return 'Naksatra';
        case CoreEventType.CCTYPE_SANK: return 'Sankranti';
        case CoreEventType.CCTYPE_TITHI: return 'Tithi';
        case CoreEventType.CCTYPE_YOGA: return 'Yoga';
        default: return 'Unspecified event';
      }
    }

    switch (nType) {
      case CoreEventType.CCTYPE_ASCENDENT:
        return 'Ascendent ' + getRasiName(nData);
      case CoreEventType.CCTYPE_CONJ:
        return 'Conjunction in ' + getRasiName(nData);
      case CoreEventType.CCTYPE_DATE:
        return 'Date';
      case CoreEventType.CCTYPE_DAY_MUHURTA:
        return format('{0} Muhurta', getMuhurtaName(nData));
      case CoreEventType.CCTYPE_DAY_OF_WEEK:
        return getWeekdayName(nData);
      case CoreEventType.CCTYPE_KALA_END:
        return format('{0} ends', getKalaName(nData));
      case CoreEventType.CCTYPE_KALA_START:
        return format('{0} starts', getKalaName(nData));
      case CoreEventType.CCTYPE_M_RASI:
        return format('Moon in {0} rasi', getRasiName(nData));
      case CoreEventType.CCTYPE_M_RISE:
        return 'Moon rise';
      case CoreEventType.CCTYPE_M_SET:
        return 'Moon set';
      case CoreEventType.CCTYPE_NAKS:
        return format('{0} Naksatra', getNaksatraName(nData));
      case CoreEventType.CCTYPE_S_ARUN:
        return 'Arunodaya';
      case CoreEventType.CCTYPE_S_MIDNIGHT:
        return 'Midnight';
      case CoreEventType.CCTYPE_S_NOON:
        return 'Noon';
      case CoreEventType.CCTYPE_S_RISE:
        return 'Sunrise';
      case CoreEventType.CCTYPE_S_SET:
        return 'Sunset';
      case CoreEventType.CCTYPE_SANK:
        return format('{0} Sankranti', getRasiName(nData));
      case CoreEventType.CCTYPE_TITHI:
        return format('{0} Tithi', getTithiName(nData));
      case CoreEventType.CCTYPE_YOGA:
        return format('{0} Yoga', getYogaName(nData));
      default:
        return format('Unspecified event {0} / {1}', nType, nData);
    }
  }

  groupNameString(): string {
    return CoreEvent.getTypeString(this.nType);
  }

  typeString(): string {
    return CoreEvent.getTypeString(this.nType, this.nData);
  }

  dstSignature(): string {
    return getDSTSignature(this.nDst);
  }

  applyDstType(utcDayStart: number, inDst: number): void {
    switch (inDst) {
      case DstTypeChange.DstOff:
        this.nDst = 0;
        break;
      case DstTypeChange.DstStart:
        this.nDst = this.daySeconds(utcDayStart) >= 7200 ? 1 : 0;
        break;
      case DstTypeChange.DstOn:
        this.nDst = 1;
        break;
      case DstTypeChange.DstEnd:
        this.nDst = this.daySeconds(utcDayStart) <= 7200 ? 1 : 0;
        break;
      default:
        this.nDst = 0;
        break;
    }
  }
}
