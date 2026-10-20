import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
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
    entryType: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      required: true,
      default: 'SOS',
    },
    balanceEffect: {
      type: Number,
      enum: [-1, 1], // -1 for Debit (funds leave), +1 for Credit (funds arrive)
      required: true,
    },
    entryStatus: {
      type: String,
      enum: ['POSTED', 'REVERSED', 'PENDING'],
      default: 'POSTED',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    runningBalanceMinorUnits: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    relatedEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LedgerEntry',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);

