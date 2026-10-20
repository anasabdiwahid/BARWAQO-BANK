import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { AccountRestriction } from '../models/AccountRestriction.js';
import { TransactionReversal } from '../models/TransactionReversal.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { AuditLog } from '../models/AuditLog.js';
import { Branch } from '../models/Branch.js';
import { ROLES, ACCOUNT_STATUS, TRANSACTION_STATUS, REVERSAL_STATUS } from '../config/constants.js';

export const getSuperAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      totalAdmins,
      totalManagers,
      totalEmployees,
      totalAccounts,
      activeAccounts,
      restrictedAccounts,
      totalTransfers,
      todayTransfers,
      recentAudit,
      branchesCount,
      pendingReversals,
    ] = await Promise.all([
      Customer.countDocuments(),
      User.countDocuments({ role: ROLES.ADMIN }),
      User.countDocuments({ role: ROLES.MANAGER }),
      User.countDocuments({ role: ROLES.EMPLOYEE }),
      Account.countDocuments(),
      Account.countDocuments({ status: ACCOUNT_STATUS.ACTIVE }),
      AccountRestriction.countDocuments({ status: 'ACTIVE' }),
      Transaction.countDocuments(),
      Transaction.find({ createdAt: { $gte: today } }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      Branch.countDocuments(),
      TransactionReversal.countDocuments({ status: REVERSAL_STATUS.PENDING }),
    ]);

    let todayVolumeMinorUnits = 0;
    todayTransfers.forEach((tx) => {
      todayVolumeMinorUnits += tx.amountMinorUnits;
    });

    // Recent 10 transactions
    const recentTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalStaff: totalAdmins + totalManagers + totalEmployees,
          totalAdmins,
          totalManagers,
          totalEmployees,
          totalAccounts,
          activeAccounts,
          restrictedAccounts,
          branchesCount,
          totalTransfers,
          todayTransferCount: todayTransfers.length,
          todayVolumeMinorUnits,
          pendingReversals,
        },
        recentAudit,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const branchFilter = req.user.branchId ? { branchId: req.user.branchId } : {};

    const [
      branchCustomers,
      branchAccounts,
      restrictedAccounts,
      managersCount,
      employeesCount,
      reversalRequests,
      recentTransactions,
    ] = await Promise.all([
      Customer.countDocuments(branchFilter),
      Account.countDocuments(branchFilter),
      AccountRestriction.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ role: ROLES.MANAGER, ...branchFilter }),
      User.countDocuments({ role: ROLES.EMPLOYEE, ...branchFilter }),
      TransactionReversal.countDocuments({ status: REVERSAL_STATUS.PENDING }),
      Transaction.find(branchFilter).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          branchCustomers,
          branchAccounts,
          restrictedAccounts,
          managersCount,
          employeesCount,
          reversalRequests,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerDashboard = async (req, res, next) => {
  try {
    const branchFilter = req.user.branchId ? { branchId: req.user.branchId } : {};

    const [employees, customerCount, pendingReversals, openTickets, recentTransactions] = await Promise.all([
      User.find({ role: ROLES.EMPLOYEE, ...branchFilter }).select('-passwordHash'),
      Customer.countDocuments(branchFilter),
      TransactionReversal.countDocuments({ status: REVERSAL_STATUS.PENDING }),
      SupportTicket.countDocuments({ status: 'OPEN' }),
      Transaction.find(branchFilter).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          employeesCount: employees.length,
          customerCount,
          pendingReversals,
          openTickets,
        },
        employees,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const branchFilter = req.user.branchId ? { branchId: req.user.branchId } : {};

    const [registeredByMe, branchCustomers, pendingTickets, recentTransactions] = await Promise.all([
      Customer.countDocuments({ createdBy: req.user._id }),
      Customer.countDocuments(branchFilter),
      SupportTicket.countDocuments({ status: 'OPEN' }),
      Transaction.find(branchFilter).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          registeredByMe,
          branchCustomers,
          pendingTickets,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDashboard = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });
    const accounts = await Account.find({ userId: req.user._id });

    if (!accounts.length) {
      return res.status(200).json({
        success: true,
        data: {
          customer,
          primaryAccount: null,
          accounts: [],
          recentTransactions: [],
          stats: {
            availableBalanceMinorUnits: 0,
            ledgerBalanceMinorUnits: 0,
            restrictedBalanceMinorUnits: 0,
            totalReceivedMinorUnits: 0,
            totalSentMinorUnits: 0,
          },
        },
      });
    }

    const primaryAccount = accounts[0];
    const accountNumbers = accounts.map((a) => a.accountNumber);

    const [recentTransactions, activeRestrictions, unreadSupport] = await Promise.all([
      Transaction.find({
        $or: [
          { senderAccountNumber: { $in: accountNumbers } },
          { recipientAccountNumber: { $in: accountNumbers } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),
      AccountRestriction.find({
        accountNumber: { $in: accountNumbers },
        status: 'ACTIVE',
      }),
      SupportTicket.countDocuments({ userId: req.user._id, status: { $ne: 'CLOSED' } }),
    ]);

    // Calculate total received & sent
    let totalReceivedMinorUnits = 0;
    let totalSentMinorUnits = 0;

    const allTx = await Transaction.find({
      $or: [
        { senderAccountNumber: { $in: accountNumbers } },
        { recipientAccountNumber: { $in: accountNumbers } },
      ],
      status: TRANSACTION_STATUS.POSTED,
    });

    allTx.forEach((tx) => {
      if (accountNumbers.includes(tx.recipientAccountNumber)) {
        totalReceivedMinorUnits += tx.amountMinorUnits;
      }
      if (accountNumbers.includes(tx.senderAccountNumber)) {
        totalSentMinorUnits += tx.totalDebitMinorUnits;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        customer,
        primaryAccount,
        accounts,
        recentTransactions,
        activeRestrictions,
        stats: {
          ledgerBalanceMinorUnits: primaryAccount.ledgerBalanceMinorUnits,
          availableBalanceMinorUnits: primaryAccount.availableBalanceMinorUnits,
          restrictedBalanceMinorUnits: primaryAccount.restrictedBalanceMinorUnits,
          totalReceivedMinorUnits,
          totalSentMinorUnits,
          unreadSupport,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

