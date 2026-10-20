import { Transaction } from '../models/Transaction.js';
import { TransactionReversal } from '../models/TransactionReversal.js';
import { Notification } from '../models/Notification.js';
import { executeReversal } from '../services/ledgerService.js';
import { logAuditEvent } from '../services/auditService.js';
import { REVERSAL_STATUS, ROLES } from '../config/constants.js';

export const requestReversal = async (req, res, next) => {
  try {
    const creator = req.user;
    const { transactionReference, reason, caseReference } = req.body;

    const originalTx = await Transaction.findOne({ transactionReference });
    if (!originalTx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction reference not found.',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (originalTx.isReversed) {
      return res.status(400).json({
        success: false,
        message: 'This transaction has already been reversed.',
        code: 'ALREADY_REVERSED',
      });
    }

    const existingPending = await TransactionReversal.findOne({
      originalTransactionId: originalTx._id,
      status: REVERSAL_STATUS.PENDING,
    });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'A reversal request for this transaction is already pending review.',
        code: 'DUPLICATE_REVERSAL_REQUEST',
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const reversalRef = `REV-REQ-${dateStr}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const reversalRequest = await TransactionReversal.create({
      reversalReference: reversalRef,
      originalTransactionId: originalTx._id,
      originalTransactionReference: originalTx.transactionReference,
      requestedBy: creator._id,
      reason,
      requestedAmountMinorUnits: originalTx.amountMinorUnits,
      status: REVERSAL_STATUS.PENDING,
      caseReference,
    });

    await logAuditEvent({
      req,
      action: 'REVERSAL_REQUESTED',
      resourceType: 'TRANSACTION_REVERSAL',
      resourceId: reversalRef,
      outcome: 'SUCCESS',
      metadata: { originalTransactionReference: originalTx.transactionReference, reason },
    });

    return res.status(201).json({
      success: true,
      message: `Reversal request ${reversalRef} submitted for supervisory review.`,
      data: reversalRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const listReversals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [reversals, total] = await Promise.all([
      TransactionReversal.find(query)
        .populate('originalTransactionId')
        .populate('requestedBy', 'fullName role email')
        .populate('approvedBy', 'fullName role email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TransactionReversal.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reversals,
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

export const reviewReversal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes } = req.body; // APPROVE or REJECT
    const reviewer = req.user;

    // Approvers must be Manager, Admin, or Super Admin
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(reviewer.role)) {
      return res.status(403).json({
        success: false,
        message: 'Supervisory role required to review reversal requests.',
        code: 'FORBIDDEN',
      });
    }

    const reversal = await TransactionReversal.findById(id);
    if (!reversal) {
      return res.status(404).json({
        success: false,
        message: 'Reversal request not found.',
        code: 'NOT_FOUND',
      });
    }

    if (reversal.status !== REVERSAL_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `This reversal has already been reviewed (status: ${reversal.status}).`,
        code: 'ALREADY_PROCESSED',
      });
    }

    // Safety rule: Requester cannot approve their own reversal
    if (String(reversal.requestedBy) === String(reviewer._id)) {
      return res.status(400).json({
        success: false,
        message: 'Segregation of duties violation: You cannot approve a reversal you requested.',
        code: 'SELF_APPROVAL_PROHIBITED',
      });
    }

    if (action === 'REJECT') {
      reversal.status = REVERSAL_STATUS.REJECTED;
      reversal.approvedBy = reviewer._id;
      reversal.reviewNotes = reviewNotes;
      await reversal.save();

      await logAuditEvent({
        req,
        action: 'REVERSAL_REJECTED',
        resourceType: 'TRANSACTION_REVERSAL',
        resourceId: reversal.reversalReference,
        outcome: 'SUCCESS',
        reason: reviewNotes,
      });

      return res.status(200).json({
        success: true,
        message: `Reversal request ${reversal.reversalReference} has been rejected.`,
        data: reversal,
      });
    }

    // APPROVAL: Execute atomic reversal
    const result = await executeReversal({
      originalTransactionId: reversal.originalTransactionId,
      reason: reversal.reason,
      approvedByUserId: reviewer._id,
      executedByUserId: reviewer._id,
    });

    reversal.status = REVERSAL_STATUS.EXECUTED;
    reversal.approvedBy = reviewer._id;
    reversal.executedBy = reviewer._id;
    reversal.reversalTransactionId = result.reversalTx._id;
    reversal.approvedAt = new Date();
    reversal.executedAt = new Date();
    reversal.reviewNotes = reviewNotes || 'Approved and executed';
    await reversal.save();

    await logAuditEvent({
      req,
      action: 'REVERSAL_EXECUTED',
      resourceType: 'TRANSACTION_REVERSAL',
      resourceId: reversal.reversalReference,
      outcome: 'SUCCESS',
      metadata: {
        originalReference: reversal.originalTransactionReference,
        reversalTxReference: result.reversalTx.transactionReference,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Reversal successfully approved and executed. Reference: ${result.reversalTx.transactionReference}`,
      data: {
        reversal,
        reversalTransaction: result.reversalTx,
      },
    });
  } catch (error) {
    next(error);
  }
};

