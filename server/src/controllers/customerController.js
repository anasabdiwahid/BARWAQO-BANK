import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { AccountRestriction } from '../models/AccountRestriction.js';
import { getNextAccountNumber, getNextCustomerId } from '../services/accountSequenceService.js';
import { logAuditEvent } from '../services/auditService.js';
import { toMinorUnits } from '../utils/money.js';
import { ROLES, ACCOUNT_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS, DEFAULT_CURRENCY } from '../config/constants.js';

export const registerCustomer = async (req, res, next) => {
  try {
    const creator = req.user;
    const {
      fullName,
      gender,
      motherName,
      responsiblePersonName,
      responsiblePersonRelationship,
      responsiblePersonPhone,
      identityDocumentType,
      identityDocumentNumber,
      dateOfBirth,
      phone,
      email,
      address,
      city,
      country,
      branchId,
      accountType,
      initialDeposit = 0,
      password,
    } = req.body;

    // Check duplicate phone or identity document
    const duplicateDoc = await Customer.findOne({
      identityDocumentType,
      identityDocumentNumber: identityDocumentNumber.trim(),
    });
    if (duplicateDoc) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this identity document number is already registered.',
        code: 'DUPLICATE_IDENTITY_DOCUMENT',
      });
    }

    // Branch assignment: Employee/Manager must assign to their own branch
    let assignedBranch = branchId;
    if (creator.role !== ROLES.SUPER_ADMIN && creator.branchId) {
      assignedBranch = creator.branchId;
    }

    // 1. Generate sequential 8-digit account number and customer ID
    const accountNumber = await getNextAccountNumber();
    const customerId = await getNextCustomerId();

    // 2. Create customer portal user
    const passwordHash = await User.hashPassword(password);
    const userEmail = email ? email.toLowerCase().trim() : `${accountNumber}@customer.barwaqobank.so`;

    const portalUser = await User.create({
      fullName,
      email: userEmail,
      username: accountNumber, // can also log in directly with account number
      phone,
      passwordHash,
      role: ROLES.CUSTOMER,
      branchId: assignedBranch,
      status: 'ACTIVE',
      createdBy: creator._id,
    });

    // 3. Create Customer record
    const customer = await Customer.create({
      customerId,
      userId: portalUser._id,
      fullName,
      gender,
      motherName,
      responsiblePersonName,
      responsiblePersonRelationship,
      responsiblePersonPhone,
      identityDocumentType,
      identityDocumentNumber: identityDocumentNumber.trim(),
      dateOfBirth: new Date(dateOfBirth),
      phone,
      email: userEmail,
      address,
      city,
      country,
      branchId: assignedBranch,
      kycStatus: 'VERIFIED',
      verificationStatus: 'APPROVED',
      createdBy: creator._id,
    });

    // 4. Create Account record
    const initialDepositMinorUnits = toMinorUnits(initialDeposit, DEFAULT_CURRENCY);

    const account = await Account.create({
      accountNumber,
      customerId: customer._id,
      userId: portalUser._id,
      branchId: assignedBranch,
      accountType,
      currency: DEFAULT_CURRENCY,
      status: ACCOUNT_STATUS.ACTIVE,
      openingDate: new Date(),
      ledgerBalanceMinorUnits: initialDepositMinorUnits,
      restrictedBalanceMinorUnits: 0,
      availableBalanceMinorUnits: initialDepositMinorUnits,
    });

    // 5. If initial deposit, record transaction & ledger entry
    if (initialDepositMinorUnits > 0) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const ref = `DEP-${dateStr}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const tx = await Transaction.create({
        transactionReference: ref,
        transactionType: TRANSACTION_TYPES.DEPOSIT,
        senderAccountId: null,
        senderAccountNumber: 'CASH-VAULT',
        recipientAccountId: account._id,
        recipientAccountNumber: account.accountNumber,
        recipientName: customer.fullName,
        amountMinorUnits: initialDepositMinorUnits,
        currency: DEFAULT_CURRENCY,
        feeMinorUnits: 0,
        totalDebitMinorUnits: initialDepositMinorUnits,
        status: TRANSACTION_STATUS.POSTED,
        initiatedBy: creator._id,
        branchId: assignedBranch,
        description: 'Account Opening Initial Cash Deposit',
        postedAt: new Date(),
      });

      await LedgerEntry.create({
        transactionId: tx._id,
        accountId: account._id,
        accountNumber: account.accountNumber,
        entryType: 'CREDIT',
        amountMinorUnits: initialDepositMinorUnits,
        currency: DEFAULT_CURRENCY,
        balanceEffect: 1,
        entryStatus: 'POSTED',
        description: 'Credit: Account opening cash deposit',
        runningBalanceMinorUnits: initialDepositMinorUnits,
        createdBy: creator._id,
      });
    }

    await logAuditEvent({
      req,
      action: 'CUSTOMER_REGISTERED',
      resourceType: 'CUSTOMER',
      resourceId: customer.customerId,
      outcome: 'SUCCESS',
      metadata: { accountNumber, customerId, branchId: assignedBranch },
    });

    return res.status(201).json({
      success: true,
      message: `Customer ${fullName} registered successfully with Account Number: ${accountNumber}`,
      data: {
        customer,
        account,
        portalCredentials: {
          loginIdentifier: accountNumber,
          email: userEmail,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (req, res, next) => {
  try {
    const { search, branchId, page = 1, limit = 20 } = req.query;
    const query = {};

    // Branch scoping for staff
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (branchId) {
      query.branchId = branchId;
    }

    if (search) {
      // Check if search query matches an account number
      const accountMatch = await Account.findOne({ accountNumber: search.trim() });
      if (accountMatch) {
        query._id = accountMatch.customerId;
      } else {
        query.$or = [
          { fullName: { $regex: search.trim(), $options: 'i' } },
          { customerId: { $regex: search.trim(), $options: 'i' } },
          { phone: { $regex: search.trim(), $options: 'i' } },
          { identityDocumentNumber: { $regex: search.trim(), $options: 'i' } },
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('branchId', 'branchName branchCode city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(query),
    ]);

    // Attach primary account info for each customer
    const customerIds = customers.map((c) => c._id);
    const accounts = await Account.find({ customerId: { $in: customerIds } });
    const accountMap = new Map();
    accounts.forEach((acc) => accountMap.set(String(acc.customerId), acc));

    const enrichedCustomers = customers.map((c) => {
      const acc = accountMap.get(String(c._id));
      return {
        ...c.toObject(),
        account: acc || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        customers: enrichedCustomers,
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

export const getCustomerDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).populate('branchId', 'branchName branchCode city address');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer record not found.',
        code: 'CUSTOMER_NOT_FOUND',
      });
    }

    // Branch scoping
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.branchId) {
      if (String(customer.branchId?._id || customer.branchId) !== String(req.user.branchId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Customer belongs to a different bank branch.',
          code: 'BRANCH_SCOPE_VIOLATION',
        });
      }
    }

    const accounts = await Account.find({ customerId: customer._id });
    const accountNumbers = accounts.map((a) => a.accountNumber);

    const [recentTransactions, activeRestrictions] = await Promise.all([
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
    ]);

    return res.status(200).json({
      success: true,
      data: {
        customer,
        accounts,
        recentTransactions,
        activeRestrictions,
      },
    });
  } catch (error) {
    next(error);
  }
};

