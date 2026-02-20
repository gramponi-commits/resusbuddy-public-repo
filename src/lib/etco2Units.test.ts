import { describe, expect, it } from 'vitest';
import {
  convertKpaToMmhg,
  convertMmhgToKpa,
  formatEtco2Value,
  getEtco2ThresholdDisplay,
  isEtco2Adequate,
  parseEtco2InputToCanonical,
} from './etco2Units';

describe('etco2Units', () => {
  it('converts mmHg to kPa correctly', () => {
    expect(convertMmhgToKpa(10)).toBeCloseTo(1.33322, 5);
  });

  it('converts kPa to mmHg correctly', () => {
    expect(convertKpaToMmhg(1.3)).toBeCloseTo(9.75083, 5);
  });

  it('formats kPa with one decimal', () => {
    expect(formatEtco2Value(10, 'kpa')).toBe('1.3');
    expect(formatEtco2Value(11, 'kpa')).toBe('1.5');
  });

  it('formats mmHg as an integer string', () => {
    expect(formatEtco2Value(9.75, 'mmhg')).toBe('10');
  });

  it('returns threshold display values for both units', () => {
    expect(getEtco2ThresholdDisplay('mmhg')).toBe('10');
    expect(getEtco2ThresholdDisplay('kpa')).toBe('1.3');
  });

  it('keeps clinical status threshold in canonical mmHg', () => {
    expect(isEtco2Adequate(10)).toBe(true);
    expect(isEtco2Adequate(9.99)).toBe(false);
  });

  it('parses kPa input to canonical mmHg with 1 decimal normalization', () => {
    expect(parseEtco2InputToCanonical('1.34', 'kpa')).toBeCloseTo(convertKpaToMmhg(1.3), 5);
  });

  it('rejects decimal input in mmHg mode', () => {
    expect(parseEtco2InputToCanonical('10.5', 'mmhg')).toBeNull();
  });
});
