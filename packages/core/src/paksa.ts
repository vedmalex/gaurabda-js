// Converted from js/GCPaksa.js

export function getPaksaName(i: number): string {
  return i === 1 ? 'Gaura' : 'Krsna';
}

export function getPaksaAbbr(i: number): string {
  const s = getPaksaName(i);
  if (s.length < 1) return ' ';
  return s[0];
}
