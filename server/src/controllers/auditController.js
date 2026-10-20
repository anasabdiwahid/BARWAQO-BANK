import { AuditLog } from '../models/AuditLog.js';
import { ROLES } from '../config/constants.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, outcome, search, page = 1, limit = 25 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (outcome) query.outcome = outcome;

    if (search) {
      query.$or = [
        { actorName: { $regex: search.trim(), $options: 'i' } },
        { action: { $regex: search.trim(), $options: 'i' } },
        { resourceId: { $regex: search.trim(), $options: 'i' } },
        { reason: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
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

