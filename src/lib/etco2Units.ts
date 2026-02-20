export type ETCO2Unit = 'mmhg' | 'kpa';

const KPA_PER_MMHG = 0.133322;
export const ETCO2_THRESHOLD_MMHG = 10;

export function convertMmhgToKpa(mmhg: number): number {
  return mmhg * KPA_PER_MMHG;
}

export function convertKpaToMmhg(kpa: number): number {
  return kpa / KPA_PER_MMHG;
}

export function convertCanonicalEtco2ToUnit(canonicalMmhg: number, unit: ETCO2Unit): number {
  return unit === 'kpa' ? convertMmhgToKpa(canonicalMmhg) : canonicalMmhg;
}

export function convertUnitEtco2ToCanonical(value: number, unit: ETCO2Unit): number {
  return unit === 'kpa' ? convertKpaToMmhg(value) : value;
}

export function getEtco2UnitLabel(unit: ETCO2Unit): 'mmHg' | 'kPa' {
  return unit === 'kpa' ? 'kPa' : 'mmHg';
}

export function formatEtco2Value(canonicalMmhg: number, unit: ETCO2Unit): string {
  if (unit === 'kpa') {
    return convertMmhgToKpa(canonicalMmhg).toFixed(1);
  }

  return String(Math.round(canonicalMmhg));
}

export function parseEtco2InputToCanonical(inputValue: string, unit: ETCO2Unit): number | null {
  const parsedValue = Number(inputValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  if (unit === 'mmhg' && !Number.isInteger(parsedValue)) {
    return null;
  }

  const normalizedValue = unit === 'kpa'
    ? Math.round(parsedValue * 10) / 10
    : parsedValue;

  return convertUnitEtco2ToCanonical(normalizedValue, unit);
}

export function isEtco2Adequate(canonicalMmhg: number): boolean {
  return canonicalMmhg >= ETCO2_THRESHOLD_MMHG;
}

export function getEtco2ThresholdDisplay(unit: ETCO2Unit): string {
  if (unit === 'kpa') {
    return convertMmhgToKpa(ETCO2_THRESHOLD_MMHG).toFixed(1);
  }

  return String(ETCO2_THRESHOLD_MMHG);
}
