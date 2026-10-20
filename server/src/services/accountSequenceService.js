import { AccountCounter } from '../models/AccountCounter.js';
import { INITIAL_ACCOUNT_NUMBER } from '../config/constants.js';

/**
 * Concurrency-safe atomic 8-digit sequential account number generator.
 * Produces strictly 8 digits: 10011001, 10011002, etc.
 */
export const getNextAccountNumber = async () => {
  const counter = await AccountCounter.findOneAndUpdate(
    { identifier: 'BARWAQO_ACCOUNT_NUMBER' },
    { $inc: { lastSeq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const seqNumber = counter.lastSeq;

  if (seqNumber > 99999999) {
    throw new Error('CRITICAL: 8-digit account number capacity reached. Contact System Administrator.');
  }

  // Exactly 8 digits string
  const accountNumberStr = String(seqNumber).padStart(8, '0');
  return accountNumberStr;
};

/**
 * Generate sequential Customer ID (e.g., BB-CUST-1001, BB-CUST-1002)
 */
export const getNextCustomerId = async () => {
  const counter = await AccountCounter.findOneAndUpdate(
    { identifier: 'BARWAQO_CUSTOMER_ID' },
    { $inc: { lastSeq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `BB-CUST-${counter.lastSeq}`;
};

