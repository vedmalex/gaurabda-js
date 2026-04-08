import { describe, it, expect } from 'vitest';
import { findNearestCity, findNearestCities, haversineDistance } from '../nearest.js';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(23.42, 88.39, 23.42, 88.39)).toBe(0);
  });

  it('calculates approximate distance Moscow-London (~2500 km)', () => {
    const d = haversineDistance(55.75, 37.62, 51.51, -0.13);
    expect(d).toBeGreaterThan(2400);
    expect(d).toBeLessThan(2600);
  });

  it('calculates distance across equator', () => {
    const d = haversineDistance(10, 0, -10, 0);
    expect(d).toBeGreaterThan(2200);
    expect(d).toBeLessThan(2300);
  });
});

describe('findNearestCity', () => {
  it('finds Mayapur/Kolkata for Mayapur coordinates', () => {
    const result = findNearestCity(23.42, 88.39);
    expect(result.distanceKm).toBeLessThan(200);
    expect(result.location.city).toBeDefined();
    expect(result.location.latitudeDeg).toBeGreaterThan(20);
  });

  it('finds a London-area city for London coordinates', () => {
    const result = findNearestCity(51.51, -0.13);
    expect(result.distanceKm).toBeLessThan(50);
    expect(result.location.city).toMatch(/London/i);
  });

  it('finds a Tokyo-area city for Tokyo coordinates', () => {
    const result = findNearestCity(35.68, 139.76);
    expect(result.distanceKm).toBeLessThan(50);
  });
});

describe('findNearestCities', () => {
  it('returns requested number of results', () => {
    const results = findNearestCities(51.51, -0.13, 5);
    expect(results.length).toBe(5);
  });

  it('results are sorted by distance', () => {
    const results = findNearestCities(40.71, -74.01, 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distanceKm).toBeGreaterThanOrEqual(results[i - 1].distanceKm);
    }
  });

  it('first result is the nearest', () => {
    const results = findNearestCities(55.75, 37.62, 3);
    const single = findNearestCity(55.75, 37.62);
    expect(results[0].location.city).toBe(single.location.city);
  });
});
