import { CURRENCY_PRECISION, DEFAULT_CURRENCY } from '../config/constants.js';

/**
 * Convert human monetary decimal amount (e.g. 50.75) to integer minor units (5075)
 */
export const toMinorUnits = (amount, currency = DEFAULT_CURRENCY) => {
  const precision = CURRENCY_PRECISION[currency] ?? 2;
  const factor = Math.pow(10, precision);
  return Math.round(Number(amount) * factor);
};

/**
 * Convert integer minor units (5075) back to decimal number (50.75)
 */
export const fromMinorUnits = (minorUnits, currency = DEFAULT_CURRENCY) => {
  const precision = CURRENCY_PRECISION[currency] ?? 2;
  const factor = Math.pow(10, precision);
  return Number(minorUnits) / factor;
};

/**
 * Format minor units into human readable string with currency code
 */
export const formatCurrency = (minorUnits, currency = DEFAULT_CURRENCY) => {
  const amount = fromMinorUnits(minorUnits, currency);
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: CURRENCY_PRECISION[currency] ?? 2,
    maximumFractionDigits: CURRENCY_PRECISION[currency] ?? 2,
  })} ${currency}`;
};

