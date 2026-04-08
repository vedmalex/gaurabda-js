// Converted from js/TCountry.js (340 lines)
// Data loaded from countries.json

import countryData from './data/countries.json' with { type: 'json' };

interface CountryRecord {
  code: number;
  name: string;
  continent: number;
  FirstDayOfWeek: number;
  abbreviatedName: string;
}

const continents: string[] = countryData.continents as string[];
const countries: CountryRecord[] = countryData.countries as CountryRecord[];

export function getCountryName(code: number): string {
  const c = countries.find(r => r.code === code);
  return c ? c.name : '';
}

export function getCountryContinentName(code: number): string {
  const c = countries.find(r => r.code === code);
  return c ? (continents[c.continent] ?? '') : '';
}

export function getCountryByISOCode(isoCode: string): CountryRecord | undefined {
  return countries.find(r => r.abbreviatedName === isoCode);
}

export function getCountryByName(name: string): CountryRecord | undefined {
  return countries.find(r => r.name === name);
}

export function getAllCountries(): readonly CountryRecord[] {
  return countries;
}

export function getContinentName(index: number): string {
  return continents[index] ?? '';
}
