import mongoose from 'mongoose';
import { REVERSAL_STATUS } from '../config/constants.js';

const transactionReversalSchema = new mongoose.Schema(
  {
    reversalReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    originalTransactionReference: {
      type: String,
      required: true,
      index: true,
    },
    reversalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    requestedAmountMinorUnits: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REVERSAL_STATUS),
      default: REVERSAL_STATUS.PENDING,
      index: true,
    },
    caseReference: {
      type: String,
      default: '',
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const TransactionReversal = mongoose.model('TransactionReversal', transactionReversalSchema);

