import { Account } from '../models/Account.js';
import { Customer } from '../models/Customer.js';
import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { ROLES, DEFAULT_CURRENCY } from '../config/constants.js';

export const getAccountByNumber = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;
    const account = await Account.findOne({ accountNumber })
      .populate('customerId', 'fullName customerId phone email identityDocumentType identityDocumentNumber')
      .populate('branchId', 'branchName branchCode city');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    // IDOR Protection: Customers can ONLY see their own account
    if (req.user.role === ROLES.CUSTOMER && String(account.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: You are not authorized to view this account.',
        code: 'ACCESS_DENIED',
      });
    }

    // Branch scoping for staff
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.CUSTOMER && req.user.branchId) {
      if (String(account.branchId?._id || account.branchId) !== String(req.user.branchId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Account belongs to another branch.',
          code: 'BRANCH_SCOPE_VIOLATION',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

export const getAccountTransactions = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    // IDOR check
    if (req.user.role === ROLES.CUSTOMER && String(account.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: Unauthorized access.',
        code: 'ACCESS_DENIED',
      });
    }

    const query = {
      $or: [
        { senderAccountNumber: accountNumber },
        { recipientAccountNumber: accountNumber },
      ],
    };

    if (type) {
      query.transactionType = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        accountNumber,
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

export const getAccountStatement = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;
    const { startDate, endDate } = req.query;

    const account = await Account.findOne({ accountNumber })
      .populate('customerId', 'fullName customerId address city country phone')
      .populate('branchId', 'branchName branchCode city address');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    // IDOR Protection
    if (req.user.role === ROLES.CUSTOMER && String(account.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: You cannot access statements for this account.',
        code: 'ACCESS_DENIED',
      });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();

    // Fetch ledger entries for strict accounting reconciliation
    const ledgerEntries = await LedgerEntry.find({
      accountId: account._id,
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    let totalCreditsMinorUnits = 0;
    let totalDebitsMinorUnits = 0;

    ledgerEntries.forEach((entry) => {
      if (entry.entryType === 'CREDIT') {
        totalCreditsMinorUnits += entry.amountMinorUnits;
      } else if (entry.entryType === 'DEBIT') {
        totalDebitsMinorUnits += entry.amountMinorUnits;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        bankName: 'BARWAQO BANK',
        accountNumber: account.accountNumber,
        currency: account.currency || DEFAULT_CURRENCY,
        statementPeriod: {
          start,
          end,
        },
        accountHolder: {
          name: account.customerId.fullName,
          customerId: account.customerId.customerId,
          address: account.customerId.address,
          city: account.customerId.city,
          phone: account.customerId.phone,
        },
        branch: {
          name: account.branchId.branchName,
          code: account.branchId.branchCode,
          city: account.branchId.city,
        },
        summary: {
          currentLedgerBalanceMinorUnits: account.ledgerBalanceMinorUnits,
          availableBalanceMinorUnits: account.availableBalanceMinorUnits,
          restrictedBalanceMinorUnits: account.restrictedBalanceMinorUnits,
          totalCreditsMinorUnits,
          totalDebitsMinorUnits,
          netFlowMinorUnits: totalCreditsMinorUnits - totalDebitsMinorUnits,
        },
        entries: ledgerEntries,
      },
    });
  } catch (error) {
    next(error);
  }
};

