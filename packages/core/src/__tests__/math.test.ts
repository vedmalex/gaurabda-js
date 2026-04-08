import { describe, it, expect } from 'vitest';
import {
  putIn360, putIn180, putIn24, putIn1,
  sinDeg, cosDeg, arccosDeg, arcSinDeg, tanDeg,
  intFloor, intRound, abs, getSign, getFraction,
  daytimeToHourMin, daytimeToHourMinSec,
  deg2rad, rad2deg, GC_PI, GC_RADS,
} from '../math.js';

describe('math constants', () => {
  it('GC_RADS is pi/180', () => {
    expect(GC_RADS).toBeCloseTo(GC_PI / 180, 15);
  });
});

describe('putIn360', () => {
  it('normalizes positive overflow', () => {
    expect(putIn360(370)).toBeCloseTo(10);
  });
  it('normalizes negative', () => {
    expect(putIn360(-10)).toBeCloseTo(350);
  });
  it('passes through 0-360', () => {
    expect(putIn360(180)).toBe(180);
  });
  it('normalizes large values', () => {
    expect(putIn360(730)).toBeCloseTo(10);
  });
});

describe('putIn180', () => {
  it('wraps 359 to -1', () => {
    expect(putIn180(359)).toBeCloseTo(-1);
  });
  it('passes through -180 to 180', () => {
    expect(putIn180(90)).toBe(90);
  });
});

describe('putIn24', () => {
  it('normalizes 25 to 1', () => {
    expect(putIn24(25)).toBeCloseTo(1);
  });
  it('normalizes -1 to 23', () => {
    expect(putIn24(-1)).toBeCloseTo(23);
  });
});

describe('putIn1', () => {
  it('normalizes 1.5 to 0.5', () => {
    expect(putIn1(1.5)).toBeCloseTo(0.5);
  });
  it('normalizes -0.3 to 0.7', () => {
    expect(putIn1(-0.3)).toBeCloseTo(0.7);
  });
});

describe('trig functions', () => {
  it('sinDeg(90) = 1', () => {
    expect(sinDeg(90)).toBeCloseTo(1.0, 10);
  });
  it('cosDeg(0) = 1', () => {
    expect(cosDeg(0)).toBeCloseTo(1.0, 10);
  });
  it('cosDeg(90) = 0', () => {
    expect(cosDeg(90)).toBeCloseTo(0.0, 10);
  });
  it('arccosDeg(1) = 0', () => {
    expect(arccosDeg(1)).toBeCloseTo(0.0, 10);
  });
  it('arcSinDeg(1) = 90', () => {
    expect(arcSinDeg(1)).toBeCloseTo(90.0, 10);
  });
  it('tanDeg(45) = 1', () => {
    expect(tanDeg(45)).toBeCloseTo(1.0, 10);
  });
});

describe('abs (FIX B1)', () => {
  it('positive number', () => {
    expect(abs(5)).toBe(5);
  });
  it('negative number', () => {
    expect(abs(-5)).toBe(5);
  });
  it('zero', () => {
    expect(abs(0)).toBe(0);
  });
});

describe('integer functions', () => {
  it('intFloor(3.7) = 3', () => {
    expect(intFloor(3.7)).toBe(3);
  });
  it('intFloor(-1.2) = -2', () => {
    expect(intFloor(-1.2)).toBe(-2);
  });
  it('intRound(3.5) = 4', () => {
    expect(intRound(3.5)).toBe(4);
  });
  it('intRound(3.4) = 3', () => {
    expect(intRound(3.4)).toBe(3);
  });
});

describe('getSign', () => {
  it('positive', () => expect(getSign(5)).toBe(1));
  it('negative', () => expect(getSign(-5)).toBe(-1));
  it('zero', () => expect(getSign(0)).toBe(0));
});

describe('getFraction', () => {
  it('3.75 -> 0.75', () => {
    expect(getFraction(3.75)).toBeCloseTo(0.75);
  });
});

describe('degree/radian conversion', () => {
  it('deg2rad(180) = pi', () => {
    expect(deg2rad(180)).toBeCloseTo(GC_PI, 10);
  });
  it('rad2deg(pi) = 180', () => {
    expect(rad2deg(GC_PI)).toBeCloseTo(180, 10);
  });
});

describe('daytimeToHourMin', () => {
  it('0.5 = 12:00', () => {
    expect(daytimeToHourMin(0.5)).toEqual([12, 0]);
  });
  it('0.0 = 0:00', () => {
    expect(daytimeToHourMin(0.0)).toEqual([0, 0]);
  });
});

describe('daytimeToHourMinSec', () => {
  it('0.5 = 12:00:00', () => {
    expect(daytimeToHourMinSec(0.5)).toEqual([12, 0, 0]);
  });
});
