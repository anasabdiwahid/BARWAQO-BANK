import { Account } from '../models/Account.js';
import { Customer } from '../models/Customer.js';
import { Transaction } from '../models/Transaction.js';
import { executeInternalTransfer } from '../services/ledgerService.js';
import { logAuditEvent } from '../services/auditService.js';
import { toMinorUnits, fromMinorUnits, formatCurrency } from '../utils/money.js';
import { ROLES, ACCOUNT_STATUS, DEFAULT_CURRENCY } from '../config/constants.js';

/**
 * Mask name for privacy (e.g., "Abdi Hassan" -> "A*** H***")
 */
const maskName = (fullName) => {
  if (!fullName) return 'Verified Customer';
  return fullName
    .split(' ')
    .map((part) => (part.length > 1 ? `${part[0]}${'*'.repeat(Math.min(part.length - 1, 4))}` : part))
    .join(' ');
};

export const previewTransfer = async (req, res, next) => {
  try {
    const { recipientAccountNumber, amount, currency = DEFAULT_CURRENCY } = req.body;

    // 1. Identify Sender Account
    let senderAccount = null;
    if (req.user.role === ROLES.CUSTOMER) {
      senderAccount = await Account.findOne({ userId: req.user._id, status: ACCOUNT_STATUS.ACTIVE });
    }

    if (!senderAccount && req.body.senderAccountId) {
      senderAccount = await Account.findById(req.body.senderAccountId);
    }

    if (!senderAccount) {
      return res.status(400).json({
        success: false,
        message: 'Active sender account could not be found.',
        code: 'SENDER_NOT_FOUND',
      });
    }

    // 2. Validate Recipient Account
    const recipientAccount = await Account.findOne({ accountNumber: recipientAccountNumber })
      .populate('customerId', 'fullName');

    if (!recipientAccount) {
      return res.status(404).json({
        success: false,
        message: 'Recipient account number is not registered with Barwaqo Bank.',
        code: 'RECIPIENT_NOT_FOUND',
      });
    }

    if (String(senderAccount._id) === String(recipientAccount._id)) {
      return res.status(400).json({
        success: false,
        message: 'Sender and recipient cannot be the same account.',
        code: 'SAME_ACCOUNT',
      });
    }

    if (recipientAccount.status !== ACCOUNT_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: `Recipient account is currently ${recipientAccount.status} and cannot receive funds.`,
        code: 'RECIPIENT_NOT_ACTIVE',
      });
    }

    const amountMinorUnits = toMinorUnits(amount, currency);
    // Configurable internal transfer fee (e.g., 0 SOS for internal transfers)
    const feeMinorUnits = 0;
    const totalDebitMinorUnits = amountMinorUnits + feeMinorUnits;

    const hasSufficientFunds = senderAccount.availableBalanceMinorUnits >= totalDebitMinorUnits;

    return res.status(200).json({
      success: true,
      data: {
        recipient: {
          accountNumber: recipientAccount.accountNumber,
          accountType: recipientAccount.accountType,
          maskedName: maskName(recipientAccount.customerId?.fullName),
        },
        transfer: {
          amount,
          amountMinorUnits,
          currency,
          fee: fromMinorUnits(feeMinorUnits, currency),
          feeMinorUnits,
          totalDebit: fromMinorUnits(totalDebitMinorUnits, currency),
          totalDebitMinorUnits,
        },
        sender: {
          accountNumber: senderAccount.accountNumber,
          availableBalanceMinorUnits: senderAccount.availableBalanceMinorUnits,
          hasSufficientFunds,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const executeTransfer = async (req, res, next) => {
  try {
    const { recipientAccountNumber, amount, currency = DEFAULT_CURRENCY, description, idempotencyKey } = req.body;

    let senderAccount = null;
    if (req.user.role === ROLES.CUSTOMER) {
      senderAccount = await Account.findOne({ userId: req.user._id });
    } else if (req.body.senderAccountId) {
      senderAccount = await Account.findById(req.body.senderAccountId);
    }

    if (!senderAccount) {
      return res.status(400).json({
        success: false,
        message: 'Sender account not found.',
        code: 'SENDER_NOT_FOUND',
      });
    }

    const amountMinorUnits = toMinorUnits(amount, currency);
    const feeMinorUnits = 0;

    const result = await executeInternalTransfer({
      senderAccountId: senderAccount._id,
      recipientAccountNumber,
      amountMinorUnits,
      feeMinorUnits,
      currency,
      description: description || 'Transfer between Barwaqo accounts',
      idempotencyKey,
      initiatedByUserId: req.user._id,
    });

    await logAuditEvent({
      req,
      action: 'MONEY_TRANSFER_SUCCESS',
      resourceType: 'TRANSACTION',
      resourceId: result.transaction.transactionReference,
      outcome: 'SUCCESS',
      metadata: {
        amount,
        currency,
        senderAccountNumber: senderAccount.accountNumber,
        recipientAccountNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer completed successfully.',
      data: {
        transaction: result.transaction,
        receipt: {
          bankName: 'BARWAQO BANK',
          transactionReference: result.transaction.transactionReference,
          date: result.transaction.createdAt,
          senderAccount: senderAccount.accountNumber,
          recipientAccount: recipientAccountNumber,
          amount: amount,
          currency,
          fee: 0,
          totalDebit: amount,
          status: 'POSTED',
          description: result.transaction.description,
        },
      },
    });
  } catch (error) {
    await logAuditEvent({
      req,
      action: 'MONEY_TRANSFER_FAILED',
      resourceType: 'TRANSACTION',
      outcome: 'FAILURE',
      reason: error.message,
    });
    next(error);
  }
};

export const getTransferByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const transaction = await Transaction.findOne({ transactionReference: reference })
      .populate('senderAccountId', 'accountNumber accountType branchId')
      .populate('recipientAccountId', 'accountNumber accountType branchId')
      .populate('initiatedBy', 'fullName role email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    // IDOR Protection: If customer, must be sender or recipient
    if (req.user.role === ROLES.CUSTOMER) {
      const myAccounts = await Account.find({ userId: req.user._id });
      const myAccountNumbers = myAccounts.map((a) => a.accountNumber);
      const isParty =
        myAccountNumbers.includes(transaction.senderAccountNumber) ||
        myAccountNumbers.includes(transaction.recipientAccountNumber);

      if (!isParty) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a party to this transaction.',
          code: 'ACCESS_DENIED',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const listTransfers = async (req, res, next) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    // Customer only sees their transactions
    if (req.user.role === ROLES.CUSTOMER) {
      const accounts = await Account.find({ userId: req.user._id });
      const numbers = accounts.map((a) => a.accountNumber);
      query.$or = [{ senderAccountNumber: { $in: numbers } }, { recipientAccountNumber: { $in: numbers } }];
    } else if (req.user.role !== ROLES.SUPER_ADMIN && req.user.branchId) {
      query.branchId = req.user.branchId;
    }

    if (status) query.status = status;
    if (type) query.transactionType = type;

    if (search) {
      query.$or = [
        { transactionReference: { $regex: search.trim(), $options: 'i' } },
        { senderAccountNumber: { $regex: search.trim(), $options: 'i' } },
        { recipientAccountNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

