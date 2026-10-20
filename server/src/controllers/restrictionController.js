import { Account } from '../models/Account.js';
import { AccountRestriction } from '../models/AccountRestriction.js';
import { Notification } from '../models/Notification.js';
import { logAuditEvent } from '../services/auditService.js';
import { toMinorUnits } from '../utils/money.js';
import { RESTRICTION_TYPES, RESTRICTION_STATUS, ACCOUNT_STATUS, ROLES } from '../config/constants.js';

export const createRestriction = async (req, res, next) => {
  try {
    const creator = req.user;
    const { accountNumber, restrictionType, amount = 0, reason, caseReference, expiresAt } = req.body;

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    const amountMinorUnits = toMinorUnits(amount, account.currency);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const restrictionRef = `RST-${dateStr}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Apply hold on account balances
    if (restrictionType === RESTRICTION_TYPES.PARTIAL_HOLD && amountMinorUnits > 0) {
      account.restrictedBalanceMinorUnits += amountMinorUnits;
      account.syncAvailableBalance();
    } else if (restrictionType === RESTRICTION_TYPES.FULL_FREEZE) {
      account.status = ACCOUNT_STATUS.FROZEN;
    }

    await account.save();

    const restriction = await AccountRestriction.create({
      restrictionReference: restrictionRef,
      accountId: account._id,
      accountNumber: account.accountNumber,
      restrictionType,
      amountMinorUnits,
      currency: account.currency,
      reason,
      caseReference,
      createdBy: creator._id,
      status: RESTRICTION_STATUS.ACTIVE,
      effectiveAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Notify customer
    await Notification.create({
      userId: account.userId,
      title: 'Security Notice: Account Restriction Applied',
      message: `A ${restrictionType.replace('_', ' ')} has been placed on account ${account.accountNumber}. Reason: ${reason}`,
      category: 'ACCOUNT_RESTRICTION',
      relatedReference: restrictionRef,
    });

    await logAuditEvent({
      req,
      action: 'ACCOUNT_RESTRICTION_APPLIED',
      resourceType: 'ACCOUNT_RESTRICTION',
      resourceId: restrictionRef,
      outcome: 'SUCCESS',
      metadata: { accountNumber, restrictionType, amountMinorUnits, reason },
    });

    return res.status(201).json({
      success: true,
      message: `Restriction ${restrictionRef} successfully applied to account ${accountNumber}.`,
      data: { restriction, account },
    });
  } catch (error) {
    next(error);
  }
};

export const listRestrictions = async (req, res, next) => {
  try {
    const { accountNumber, status = 'ACTIVE', page = 1, limit = 20 } = req.query;
    const query = {};

    if (accountNumber) query.accountNumber = accountNumber;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [restrictions, total] = await Promise.all([
      AccountRestriction.find(query)
        .populate('createdBy', 'fullName role')
        .populate('releasedBy', 'fullName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AccountRestriction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        restrictions,
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

export const releaseRestriction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { releaseReason } = req.body;
    const actor = req.user;

    const restriction = await AccountRestriction.findById(id);
    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: 'Restriction record not found.',
        code: 'NOT_FOUND',
      });
    }

    if (restriction.status !== RESTRICTION_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: `This restriction is already ${restriction.status}.`,
        code: 'ALREADY_RELEASED',
      });
    }

    const account = await Account.findById(restriction.accountId);
    if (account) {
      if (restriction.restrictionType === RESTRICTION_TYPES.PARTIAL_HOLD && restriction.amountMinorUnits > 0) {
        account.restrictedBalanceMinorUnits = Math.max(
          0,
          account.restrictedBalanceMinorUnits - restriction.amountMinorUnits
        );
        account.syncAvailableBalance();
      } else if (restriction.restrictionType === RESTRICTION_TYPES.FULL_FREEZE) {
        account.status = ACCOUNT_STATUS.ACTIVE;
      }
      await account.save();
    }

    restriction.status = RESTRICTION_STATUS.RELEASED;
    restriction.releasedBy = actor._id;
    restriction.releasedAt = new Date();
    restriction.releaseReason = releaseReason;
    await restriction.save();

    if (account) {
      await Notification.create({
        userId: account.userId,
        title: 'Notice: Account Restriction Lifted',
        message: `Restriction ${restriction.restrictionReference} on account ${account.accountNumber} has been released.`,
        category: 'RESTRICTION_RELEASED',
        relatedReference: restriction.restrictionReference,
      });
    }

    await logAuditEvent({
      req,
      action: 'ACCOUNT_RESTRICTION_RELEASED',
      resourceType: 'ACCOUNT_RESTRICTION',
      resourceId: restriction.restrictionReference,
      outcome: 'SUCCESS',
      reason: releaseReason,
    });

    return res.status(200).json({
      success: true,
      message: `Restriction ${restriction.restrictionReference} released successfully.`,
      data: restriction,
    });
  } catch (error) {
    next(error);
  }
};

