// <gaurabda-today> — embeddable "today" widget
// Usage: <gaurabda-today latitude="23.42" longitude="88.39" timezone="Asia/Calcutta"></gaurabda-today>

import {
  EarthData, TimeZone, GregorianDateTime,
  ResultCalendar, FastType,
  getMasaName, getTithiName, getNaksatraName, getYogaName,
  getPaksaName, getFastingName, getDSTSignature,
} from '@gaurabda/core';

const STYLES = `
:host { display: block; font-family: system-ui, sans-serif; color: #1c1917; }
.card { background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; max-width: 360px; }
.date { font-size: 1.5em; font-weight: 300; margin: 0 0 2px; }
.sub { font-size: 0.8em; color: #78716c; margin: 0 0 12px; }
.section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f5f5f4; }
.section h3 { font-size: 0.7em; text-transform: uppercase; letter-spacing: 0.05em; color: #a8a29e; margin: 0 0 8px; }
.row { display: flex; justify-content: space-between; font-size: 0.85em; padding: 2px 0; }
.label { color: #a8a29e; }
.sun-row { display: flex; gap: 16px; text-align: center; }
.sun-item { flex: 1; }
.sun-time { font-size: 1.1em; font-weight: 300; color: #b45309; }
.sun-label { font-size: 0.7em; color: #a8a29e; }
.fast { background: #fefce8; border-left: 3px solid #facc15; padding: 8px 12px; border-radius: 4px; margin-top: 12px; }
.fast-name { font-weight: 600; color: #854d0e; font-size: 0.85em; }
.fast-type { font-size: 0.8em; color: #a16207; }
`;

export class GaurabdaTodayElement extends HTMLElement {
  static observedAttributes = ['latitude', 'longitude', 'timezone'];

  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
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

    const now = new Date();
    const today = GregorianDateTime.fromComponents(now.getFullYear(), now.getMonth() + 1, now.getDate());
    today.TimezoneHours = tz.offsetUtcHours;

    const cal = new ResultCalendar();
    cal.calculateCalendar(earth, today, 3);

    const idx = cal.findDate(today);
    const day = cal.getDay(idx);
    if (!day?.date) {
      this.shadow.innerHTML = '<p>Error loading calendar data</p>';
      return;
    }

    const a = day.astrodata;
    const sr = a.sunRise;
    const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let fastHtml = '';
    if (day.nFastID !== FastType.FAST_NULL) {
      fastHtml = `<div class="fast">
        <div class="fast-name">${day.ekadasi_vrata_name || 'Ekadasi'}</div>
        <div class="fast-type">${getFastingName(day.nFastID)}</div>
      </div>`;
    }

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="card">
        <p class="date">${WEEKDAYS[day.date.weekday] ?? ''}</p>
        <p class="sub">${day.date.day} ${GregorianDateTime.getMonthName(day.date.month)} ${day.date.year} &middot; ${getDSTSignature(day.biasMinutes)}</p>
        ${fastHtml}
        <div class="section">
          <h3>Sun Times</h3>
          <div class="sun-row">
            <div class="sun-item"><div class="sun-time">${sr.toLongTimeString()}</div><div class="sun-label">Sunrise</div></div>
            <div class="sun-item"><div class="sun-time">${a.sunNoon.toLongTimeString()}</div><div class="sun-label">Noon</div></div>
            <div class="sun-item"><div class="sun-time">${a.sunSet.toLongTimeString()}</div><div class="sun-label">Sunset</div></div>
          </div>
        </div>
        <div class="section">
          <h3>Vedic Day</h3>
          <div class="row"><span class="label">Tithi</span><span>${getTithiName(sr.tithi)} (${sr.tithiElapse.toFixed(1)}%)</span></div>
          <div class="row"><span class="label">Naksatra</span><span>${getNaksatraName(sr.naksatra)}</span></div>
          <div class="row"><span class="label">Yoga</span><span>${getYogaName(sr.yoga)}</span></div>
          <div class="row"><span class="label">Paksa</span><span>${getPaksaName(sr.paksa)}</span></div>
          <div class="row"><span class="label">Masa</span><span>${getMasaName(a.masa)}</span></div>
          <div class="row"><span class="label">Gaurabda</span><span>${a.gaurabdaYear}</span></div>
        </div>
      </div>
    `;
  }
}

customElements.define('gaurabda-today', GaurabdaTodayElement);
