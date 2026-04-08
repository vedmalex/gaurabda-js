// <gaurabda-calendar> — embeddable month calendar widget
// Usage: <gaurabda-calendar latitude="23.42" longitude="88.39" timezone="Asia/Calcutta" year="2024" month="3"></gaurabda-calendar>

import {
  EarthData, TimeZone, GregorianDateTime,
  ResultCalendar, FastType, getMasaName, getTithiName,
} from '@gaurabda/core';

const STYLES = `
:host { display: block; font-family: system-ui, sans-serif; color: #1c1917; }
.wrap { background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden; max-width: 480px; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #78350f; color: #fff; }
.header h2 { margin: 0; font-size: 1em; font-weight: 600; }
.header button { background: none; border: none; color: #fde68a; cursor: pointer; font-size: 1.2em; padding: 4px 8px; }
.header button:hover { color: #fff; }
.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.7em; color: #a8a29e; padding: 6px 0; border-bottom: 1px solid #f5f5f4; }
.grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.day { border-bottom: 1px solid #f5f5f4; border-right: 1px solid #f5f5f4; padding: 4px; min-height: 52px; font-size: 0.75em; }
.day.muted { color: #d6d3d1; }
.day.fasting { background: #fefce8; }
.day.parana { background: #f0fdf4; }
.day-num { font-weight: 600; font-size: 0.9em; }
.day-tithi { color: #78716c; margin-top: 1px; }
.masa-label { font-size: 0.75em; color: #fde68a; }
`;

export class GaurabdaCalendarElement extends HTMLElement {
  static observedAttributes = ['latitude', 'longitude', 'timezone', 'year', 'month'];

  private shadow: ShadowRoot;
  private _year: number;
  private _month: number;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    const now = new Date();
    this._year = now.getFullYear();
    this._month = now.getMonth() + 1;
  }

  connectedCallback() {
    this._year = parseInt(this.getAttribute('year') ?? '') || this._year;
    this._month = parseInt(this.getAttribute('month') ?? '') || this._month;
    this.render();
  }

  attributeChangedCallback() {
    this._year = parseInt(this.getAttribute('year') ?? '') || this._year;
    this._month = parseInt(this.getAttribute('month') ?? '') || this._month;
    this.render();
  }

  private navigate(delta: number) {
    this._month += delta;
    if (this._month > 12) { this._month = 1; this._year++; }
    if (this._month < 1) { this._month = 12; this._year--; }
    this.render();
  }

  private render() {
    const lat = parseFloat(this.getAttribute('latitude') ?? '23.42');
    const lon = parseFloat(this.getAttribute('longitude') ?? '88.39');
    const tzName = this.getAttribute('timezone') ?? 'Asia/Calcutta';

    const tz = TimeZone.findByName(tzName);
    const earth = new EarthData();
    earth.latitudeDeg = lat;
    earth.longitudeDeg = lon;
    earth.offsetUtcHours = tz.offsetUtcHours;

    const cal = new ResultCalendar();
    cal.calculateMonth(earth, this._year, this._month);

    // Build day cells
    const firstDay = cal.days[cal.BEFORE_DAYS];
    if (!firstDay?.date) return;

    const startWd = firstDay.date.weekday;
    const padBefore = startWd === 0 ? 6 : startWd - 1;

    let cells = '';
    // Pad
    for (let i = 0; i < padBefore; i++) {
      const d = cal.days[cal.BEFORE_DAYS - padBefore + i];
      if (d?.date) cells += `<div class="day muted"><span class="day-num">${d.date.day}</span></div>`;
    }
    // Month days
    let mainMasa = '';
    for (let i = 0; i < cal.pureCount; i++) {
      const d = cal.days[cal.BEFORE_DAYS + i];
      if (!d?.date) continue;
      if (!mainMasa) mainMasa = getMasaName(d.astrodata.masa);
      const cls = d.nFastID === FastType.FAST_EKADASI ? 'fasting' : d.ekadasi_parana ? 'parana' : '';
      cells += `<div class="day ${cls}"><span class="day-num">${d.date.day}</span><div class="day-tithi">${getTithiName(d.astrodata.sunRise.tithi)}</div></div>`;
    }
    // Pad end
    const total = padBefore + cal.pureCount;
    const padAfter = (7 - (total % 7)) % 7;
    for (let i = 0; i < padAfter; i++) {
      const d = cal.days[cal.BEFORE_DAYS + cal.pureCount + i];
      if (d?.date) cells += `<div class="day muted"><span class="day-num">${d.date.day}</span></div>`;
    }

    const monthName = GregorianDateTime.getMonthName(this._month);

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="wrap">
        <div class="header">
          <button id="prev">&larr;</button>
          <div>
            <h2>${monthName} ${this._year}</h2>
            ${mainMasa ? `<div class="masa-label">${mainMasa} Masa</div>` : ''}
          </div>
          <button id="next">&rarr;</button>
        </div>
        <div class="weekdays">
          <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
        </div>
        <div class="grid">${cells}</div>
      </div>
    `;

    this.shadow.getElementById('prev')?.addEventListener('click', () => this.navigate(-1));
    this.shadow.getElementById('next')?.addEventListener('click', () => this.navigate(1));
  }
}

customElements.define('gaurabda-calendar', GaurabdaCalendarElement);
