import { describe, it, expect } from 'vitest';
import {
  getString, setString, format,
  getTithiName, getNaksatraName, getNaksatraPadaText, getYogaName,
  getWeekdayName, getMuhurtaName, getSandhyaName, getKalaName,
  getDayPartName, getMoonTimesName,
  getLongitudeDirectionName, getLatitudeDirectionName,
  getPlanetNameEn, getPlanetName,
  getNaksatraChildSyllable, getRasiChildSyllable,
  getDSTSignature, getFastingName, getSpecFestivalName,
} from '../strings.js';

describe('strings — string table', () => {
  it('returns weekday names by index', () => {
    expect(getString(0)).toBe('Sunday');
    expect(getString(6)).toBe('Saturday');
  });

  it('returns empty string for missing index', () => {
    expect(getString(99999)).toBe('');
  });

  it('setString overrides a value', () => {
    const original = getString(0);
    setString(0, 'Dimanche');
    expect(getString(0)).toBe('Dimanche');
    setString(0, original); // restore
  });
});

describe('strings — tithi names', () => {
  it('returns first tithi (Krsna Pratipat)', () => {
    expect(getTithiName(0)).toBe('Pratipat');
  });

  it('returns Amavasya at index 14', () => {
    expect(getTithiName(14)).toBe('Amavasya');
  });

  it('returns Purnima at index 29', () => {
    expect(getTithiName(29)).toBe('Purnima');
  });

  it('wraps around at 30', () => {
    expect(getTithiName(30)).toBe('Pratipat');
  });
});

describe('strings — naksatra names', () => {
  it('returns Asvini at 0', () => {
    expect(getNaksatraName(0)).toBe('Asvini');
  });

  it('returns Revati at 26', () => {
    expect(getNaksatraName(26)).toBe('Revati');
  });

  it('wraps around at 27', () => {
    expect(getNaksatraName(27)).toBe('Asvini');
  });

  it('returns pada text', () => {
    expect(getNaksatraPadaText(0)).toBe('1st Pada');
    expect(getNaksatraPadaText(3)).toBe('4th Pada');
  });
});

describe('strings — yoga names', () => {
  it('returns Viskumba at 0', () => {
    expect(getYogaName(0)).toBe('Viskumba');
  });

  it('returns Vaidhriti at 26', () => {
    expect(getYogaName(26)).toBe('Vaidhriti');
  });

  it('wraps around at 27', () => {
    expect(getYogaName(27)).toBe('Viskumba');
  });
});

describe('strings — weekday names', () => {
  it('returns Sunday at 0', () => {
    expect(getWeekdayName(0)).toBe('Sunday');
  });

  it('wraps around at 7', () => {
    expect(getWeekdayName(7)).toBe('Sunday');
  });
});

describe('strings — muhurta names', () => {
  it('returns Rudra at 0', () => {
    expect(getMuhurtaName(0)).toBe('Rudra');
  });

  it('returns Samudram at 29', () => {
    expect(getMuhurtaName(29)).toBe('Samudram');
  });
});

describe('strings — sandhya and kala', () => {
  it('getSandhyaName returns correct names', () => {
    expect(getSandhyaName(0)).toBe('Sunrise');
    expect(getSandhyaName(1)).toBe('Noon');
    expect(getSandhyaName(2)).toBe('Sunset');
    expect(getSandhyaName(3)).toBe('Midnight');
    expect(getSandhyaName(99)).toBe('');
  });

  it('getKalaName returns Rahu kalam for KT_RAHU_KALAM', () => {
    expect(getKalaName(1)).toBe('Rahu kalam');
  });

  it('getKalaName returns default for unknown', () => {
    expect(getKalaName(999)).toBe('Special interval');
  });
});

describe('strings — direction names', () => {
  it('longitude direction', () => {
    expect(getLongitudeDirectionName(-10)).toBe('West');
    expect(getLongitudeDirectionName(10)).toBe('East');
  });

  it('latitude direction', () => {
    expect(getLatitudeDirectionName(-10)).toBe('South');
    expect(getLatitudeDirectionName(10)).toBe('North');
  });
});

describe('strings — planet names', () => {
  it('English planet names', () => {
    expect(getPlanetNameEn(0)).toBe('Sun');
    expect(getPlanetNameEn(4)).toBe('Jupiter');
  });

  it('Sanskrit planet names', () => {
    expect(getPlanetName(0)).toBe('Surya');
    expect(getPlanetName(4)).toBe('Guru');
  });
});

describe('strings — misc', () => {
  it('getDayPartName', () => {
    expect(getDayPartName(0)).toBe('Day');
    expect(getDayPartName(1)).toBe('Night');
  });

  it('getMoonTimesName', () => {
    expect(getMoonTimesName(0)).toBe('Moonrise');
    expect(getMoonTimesName(1)).toBe('Moonset');
  });

  it('getDSTSignature', () => {
    expect(getDSTSignature(0)).toBe('LT');
    expect(getDSTSignature(1)).toBe('DST');
  });

  it('getFastingName returns known fasting', () => {
    expect(getFastingName(1)).toBe('Fast till noon');
    expect(getFastingName(999)).toBe('');
  });

  it('child syllables', () => {
    expect(getNaksatraChildSyllable(0, 0)).toBe('chu');
    expect(getNaksatraChildSyllable(0, 3)).toBe('la');
  });

  it('rasi child syllables', () => {
    expect(getRasiChildSyllable(0)).toBe('a.. e.. la..');
  });

  it('getSpecFestivalName', () => {
    expect(getSpecFestivalName(10)).toBe('Sri Krsna Janmastami: Appearance of Lord Sri Krsna');
    expect(getSpecFestivalName(999)).toBe('');
  });
});

describe('strings — format()', () => {
  it('replaces {0} with first arg', () => {
    expect(format('{0} Muhurta', 'Rudra')).toBe('Rudra Muhurta');
  });

  it('replaces multiple placeholders', () => {
    expect(format('{0} and {1}', 'A', 'B')).toBe('A and B');
  });

  it('leaves unmatched placeholders', () => {
    expect(format('{0} and {1}', 'A')).toBe('A and {1}');
  });

  it('handles numeric args', () => {
    expect(format('Event {0} / {1}', 10, 20)).toBe('Event 10 / 20');
  });
});
