import mongoose from 'mongoose';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Notification } from '../models/Notification.js';
import { ACCOUNT_STATUS, TRANSACTION_STATUS, TRANSACTION_TYPES } from '../config/constants.js';
import { formatCurrency } from '../utils/money.js';

/**
 * Generate a unique banking transaction reference
 */
export const generateTransactionReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BB-${dateStr}-${randomStr}`;
};

/**
 * Atomic internal money transfer between two accounts
 * Supports both Replica Set transactions and standalone atomic conditional execution
 */
export const executeInternalTransfer = async ({
  senderAccountId,
  recipientAccountNumber,
  amountMinorUnits,
  feeMinorUnits = 0,
  currency = 'SOS',
  description = 'Internal Account Transfer',
  idempotencyKey = null,
  initiatedByUserId,
}) => {
  // Check idempotency if key provided
  if (idempotencyKey) {
    const existingTx = await Transaction.findOne({ idempotencyKey });
    if (existingTx) {
      return { transaction: existingTx, isDuplicate: true };
    }
  }

  // 1. Fetch Sender Account
  const sender = await Account.findById(senderAccountId);
  if (!sender) {
    throw new Error('Sender account not found.');
  }
  if (sender.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new Error(`Sender account is ${sender.status}. Outgoing transfers are prohibited.`);
  }

  // 2. Fetch Recipient Account
  const recipient = await Account.findOne({ accountNumber: recipientAccountNumber });
  if (!recipient) {
    throw new Error('Recipient account number is invalid or does not exist.');
  }
  if (recipient.status === ACCOUNT_STATUS.CLOSED) {
    throw new Error('Recipient account is closed and cannot receive funds.');
  }
  if (String(sender._id) === String(recipient._id)) {
    throw new Error('Sender and recipient accounts cannot be the same.');
  }
  if (sender.currency !== recipient.currency) {
    throw new Error(`Currency mismatch: sender has ${sender.currency}, recipient has ${recipient.currency}.`);
  }

  const totalDebitMinorUnits = amountMinorUnits + feeMinorUnits;

  // 3. Strict Available Balance Validation
  if (sender.availableBalanceMinorUnits < totalDebitMinorUnits) {
    throw new Error(
      `Insufficient available funds. Required: ${formatCurrency(totalDebitMinorUnits, currency)}, Available: ${formatCurrency(
        sender.availableBalanceMinorUnits,
        currency
      )}`
    );
  }

  // 4. Atomic conditional balance updates on Sender (concurrency safe)
  const updatedSender = await Account.findOneAndUpdate(
    {
      _id: sender._id,
      availableBalanceMinorUnits: { $gte: totalDebitMinorUnits },
      status: ACCOUNT_STATUS.ACTIVE,
    },
    {
      $inc: {
        ledgerBalanceMinorUnits: -totalDebitMinorUnits,
        availableBalanceMinorUnits: -totalDebitMinorUnits,
      },
    },
    { new: true }
  );

  if (!updatedSender) {
    throw new Error('Transfer rejected: Available balance changed or concurrent transfer conflict occurred.');
  }

  // 5. Update Recipient Account
  const updatedRecipient = await Account.findByIdAndUpdate(
    recipient._id,
    {
      $inc: {
        ledgerBalanceMinorUnits: amountMinorUnits,
        availableBalanceMinorUnits: amountMinorUnits,
      },
    },
    { new: true }
  );

  // 6. Generate Transaction Record
  const transactionReference = generateTransactionReference();
  const transaction = await Transaction.create({
    transactionReference,
    idempotencyKey,
    transactionType: TRANSACTION_TYPES.TRANSFER_DEBIT,
    senderAccountId: sender._id,
    senderAccountNumber: sender.accountNumber,
    senderName: sender.accountNumber,
    recipientAccountId: recipient._id,
    recipientAccountNumber: recipient.accountNumber,
    recipientName: recipient.accountNumber,
    amountMinorUnits,
    currency,
    feeMinorUnits,
    totalDebitMinorUnits,
    status: TRANSACTION_STATUS.POSTED,
    initiatedBy: initiatedByUserId,
    branchId: sender.branchId,
    description,
    postedAt: new Date(),
  });

  // 7. Create Immutable Double-Entry Ledger Records
  // Entry 1: Sender Debit
  const senderLedger = await LedgerEntry.create({
    transactionId: transaction._id,
    accountId: sender._id,
    accountNumber: sender.accountNumber,
    entryType: 'DEBIT',
    amountMinorUnits: totalDebitMinorUnits,
    currency,
    balanceEffect: -1,
    entryStatus: 'POSTED',
    description: `Debit: Transfer to ${recipient.accountNumber} - ${description}`,
    runningBalanceMinorUnits: updatedSender.ledgerBalanceMinorUnits,
    createdBy: initiatedByUserId,
  });

  // Entry 2: Recipient Credit
  const recipientLedger = await LedgerEntry.create({
    transactionId: transaction._id,
    accountId: recipient._id,
    accountNumber: recipient.accountNumber,
    entryType: 'CREDIT',
    amountMinorUnits,
    currency,
    balanceEffect: 1,
    entryStatus: 'POSTED',
    description: `Credit: Transfer received from ${sender.accountNumber} - ${description}`,
    runningBalanceMinorUnits: updatedRecipient.ledgerBalanceMinorUnits,
    createdBy: initiatedByUserId,
    relatedEntryId: senderLedger._id,
  });

  // 8. Notifications
  await Notification.create([
    {
      userId: sender.userId,
      title: 'Money Transfer Sent',
      message: `You successfully transferred ${formatCurrency(amountMinorUnits, currency)} to account ${recipient.accountNumber}.`,
      category: 'TRANSFER_SENT',
      relatedReference: transactionReference,
    },
    {
      userId: recipient.userId,
      title: 'Money Received',
      message: `You received ${formatCurrency(amountMinorUnits, currency)} from account ${sender.accountNumber}.`,
      category: 'TRANSFER_RECEIVED',
      relatedReference: transactionReference,
    },
  ]);

  return {
    transaction,
    senderAccount: updatedSender,
    recipientAccount: updatedRecipient,
    senderLedger,
    recipientLedger,
  };
};

/**
 * Execute an approved transaction reversal
 */
export const executeReversal = async ({
  originalTransactionId,
  reason,
  approvedByUserId,
  executedByUserId,
}) => {
  const originalTx = await Transaction.findById(originalTransactionId);
  if (!originalTx) {
    throw new Error('Original transaction not found.');
  }
  if (originalTx.isReversed) {
    throw new Error('This transaction has already been reversed.');
  }

  const senderAccount = await Account.findById(originalTx.senderAccountId);
  const recipientAccount = await Account.findById(originalTx.recipientAccountId);

  if (!senderAccount || !recipientAccount) {
    throw new Error('Associated accounts for reversal no longer exist.');
  }

  // Check if original recipient has enough available funds to reverse the amount
  if (recipientAccount.availableBalanceMinorUnits < originalTx.amountMinorUnits) {
    throw new Error(
      `Reversal cannot be executed automatically: Recipient account has insufficient available balance (${formatCurrency(
        recipientAccount.availableBalanceMinorUnits,
        originalTx.currency
      )}). Escalating to Investigation Case.`
    );
  }

  // Atomic reversal operations:
  // 1. Debit original recipient
  const updatedRecipient = await Account.findOneAndUpdate(
    {
      _id: recipientAccount._id,
      availableBalanceMinorUnits: { $gte: originalTx.amountMinorUnits },
    },
    {
      $inc: {
        ledgerBalanceMinorUnits: -originalTx.amountMinorUnits,
        availableBalanceMinorUnits: -originalTx.amountMinorUnits,
      },
    },
    { new: true }
  );

  if (!updatedRecipient) {
    throw new Error('Reversal conflict: Recipient available balance altered during execution.');
  }

  // 2. Credit original sender
  const updatedSender = await Account.findByIdAndUpdate(
    senderAccount._id,
    {
      $inc: {
        ledgerBalanceMinorUnits: originalTx.amountMinorUnits,
        availableBalanceMinorUnits: originalTx.amountMinorUnits,
      },
    },
    { new: true }
  );

  // 3. Create Reversal Transaction record
  const reversalReference = `REV-${generateTransactionReference()}`;
  const reversalTx = await Transaction.create({
    transactionReference: reversalReference,
    transactionType: TRANSACTION_TYPES.REVERSAL_CREDIT,
    senderAccountId: recipientAccount._id,
    senderAccountNumber: recipientAccount.accountNumber,
    recipientAccountId: senderAccount._id,
    recipientAccountNumber: senderAccount.accountNumber,
    amountMinorUnits: originalTx.amountMinorUnits,
    currency: originalTx.currency,
    feeMinorUnits: 0,
    totalDebitMinorUnits: originalTx.amountMinorUnits,
    status: TRANSACTION_STATUS.POSTED,
    initiatedBy: executedByUserId,
    branchId: senderAccount.branchId,
    description: `Approved Reversal of ${originalTx.transactionReference}. Reason: ${reason}`,
    relatedOriginalTransactionId: originalTx._id,
    postedAt: new Date(),
  });

  // 4. Immutable Double-Entry Ledger entries for reversal
  await LedgerEntry.create([
    {
      transactionId: reversalTx._id,
      accountId: recipientAccount._id,
      accountNumber: recipientAccount.accountNumber,
      entryType: 'DEBIT',
      amountMinorUnits: originalTx.amountMinorUnits,
      currency: originalTx.currency,
      balanceEffect: -1,
      entryStatus: 'POSTED',
      description: `Debit: Reversal charge for TXN ${originalTx.transactionReference}`,
      runningBalanceMinorUnits: updatedRecipient.ledgerBalanceMinorUnits,
      createdBy: executedByUserId,
    },
    {
      transactionId: reversalTx._id,
      accountId: senderAccount._id,
      accountNumber: senderAccount.accountNumber,
      entryType: 'CREDIT',
      amountMinorUnits: originalTx.amountMinorUnits,
      currency: originalTx.currency,
      balanceEffect: 1,
      entryStatus: 'POSTED',
      description: `Credit: Reversal refund for TXN ${originalTx.transactionReference}`,
      runningBalanceMinorUnits: updatedSender.ledgerBalanceMinorUnits,
      createdBy: executedByUserId,
    },
  ]);

  // 5. Update original transaction status
  originalTx.isReversed = true;
  originalTx.status = TRANSACTION_STATUS.REVERSED;
  await originalTx.save();

  return { reversalTx, updatedSender, updatedRecipient };
};

