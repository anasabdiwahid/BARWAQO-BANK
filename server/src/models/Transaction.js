import mongoose from 'mongoose';
import { TRANSACTION_STATUS, TRANSACTION_TYPES, DEFAULT_CURRENCY } from '../config/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    transactionReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    senderAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
      index: true,
    },
    senderAccountNumber: {
      type: String,
      default: null,
      index: true,
    },
    senderName: {
      type: String,
      default: '',
    },
    recipientAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
      index: true,
    },
    recipientAccountNumber: {
      type: String,
      default: null,
      index: true,
    },
    recipientName: {
      type: String,
      default: '',
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      required: true,
      default: DEFAULT_CURRENCY,
    },
    feeMinorUnits: {
      type: Number,
      default: 0,
    },
    totalDebitMinorUnits: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.POSTED,
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    description: {
      type: String,
      default: 'Internal Account Transfer',
      trim: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
    relatedOriginalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);

