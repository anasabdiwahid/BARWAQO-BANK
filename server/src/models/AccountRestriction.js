import mongoose from 'mongoose';
import { RESTRICTION_TYPES, RESTRICTION_STATUS, DEFAULT_CURRENCY } from '../config/constants.js';

const accountRestrictionSchema = new mongoose.Schema(
  {
    restrictionReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      required: true,
      index: true,
    },
    restrictionType: {
      type: String,
      enum: Object.values(RESTRICTION_TYPES),
      required: true,
    },
    amountMinorUnits: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    caseReference: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(RESTRICTION_STATUS),
      default: RESTRICTION_STATUS.ACTIVE,
      index: true,
    },
    effectiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    releaseReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const AccountRestriction = mongoose.model('AccountRestriction', accountRestrictionSchema);

