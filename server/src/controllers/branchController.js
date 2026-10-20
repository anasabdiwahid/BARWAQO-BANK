import { Branch } from '../models/Branch.js';
import { logAuditEvent } from '../services/auditService.js';

export const getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find().populate('managerId', 'fullName email phone');
    return res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const { branchName, branchCode, address, city, phone, managerId } = req.body;

    const existing = await Branch.findOne({ branchCode: branchCode.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A branch with this code already exists.',
        code: 'DUPLICATE_BRANCH_CODE',
      });
    }

    const branch = await Branch.create({
      branchName,
      branchCode: branchCode.toUpperCase().trim(),
      address,
      city: city || 'Mogadishu',
      phone,
      managerId: managerId || null,
      status: 'ACTIVE',
    });

    await logAuditEvent({
      req,
      action: 'BRANCH_CREATED',
      resourceType: 'BRANCH',
      resourceId: branch._id,
      outcome: 'SUCCESS',
      metadata: { branchCode, branchName },
    });

    return res.status(201).json({
      success: true,
      message: `Branch ${branchName} created successfully.`,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

