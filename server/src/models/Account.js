import mongoose from 'mongoose';
import { ACCOUNT_STATUS, ACCOUNT_TYPES, DEFAULT_CURRENCY } from '../config/constants.js';

const accountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: [/^\d{8}$/, 'Account number must contain exactly 8 digits'],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      default: ACCOUNT_TYPES.SAVINGS,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
    openingDate: {
      type: Date,
      default: Date.now,
    },
    ledgerBalanceMinorUnits: {
      type: Number,
      required: true,
      default: 0,
    },
    restrictedBalanceMinorUnits: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    availableBalanceMinorUnits: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to recalculate available balance based on ledger and holds
accountSchema.methods.syncAvailableBalance = function () {
  this.availableBalanceMinorUnits = Math.max(0, this.ledgerBalanceMinorUnits - this.restrictedBalanceMinorUnits);
  return this.availableBalanceMinorUnits;
};

export const Account = mongoose.model('Account', accountSchema);

