import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { ROLES } from '../config/constants.js';
import { validateRoleCreationHierarchy } from '../middleware/roleCheck.js';
import { logAuditEvent } from '../services/auditService.js';

export const createUser = async (req, res, next) => {
  try {
    const creator = req.user;
    const { fullName, email, phone, role, branchId, jobTitle, password, permissions = [] } = req.body;

    // Strict Role Hierarchy Validation
    const canCreate = validateRoleCreationHierarchy(creator.role, role);
    if (!canCreate) {
      await logAuditEvent({
        req,
        action: 'USER_CREATION_ATTEMPT_DENIED',
        resourceType: 'USER',
        outcome: 'BLOCKED',
        reason: `Role ${creator.role} is not authorized to create role ${role}`,
      });

      return res.status(403).json({
        success: false,
        message: `Hierarchy violation: You are not authorized to create a user with role ${role}.`,
        code: 'HIERARCHY_VIOLATION',
      });
    }

    // Branch scoping validation: Non-Super Admins can only assign to their own branch
    let assignedBranch = branchId;
    if (creator.role !== ROLES.SUPER_ADMIN) {
      if (creator.branchId && String(creator.branchId) !== String(branchId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign staff to your own designated branch.',
          code: 'BRANCH_SCOPE_VIOLATION',
        });
      }
      assignedBranch = creator.branchId || branchId;
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists in the system.',
        code: 'DUPLICATE_EMAIL',
      });
    }

    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      fullName,
      email: email.toLowerCase().trim(),
      phone,
      passwordHash,
      role,
      branchId: assignedBranch,
      jobTitle: jobTitle || '',
      permissions,
      status: 'ACTIVE',
      createdBy: creator._id,
    });

    await logAuditEvent({
      req,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: newUser._id,
      outcome: 'SUCCESS',
      metadata: { createdRole: role, targetUserEmail: email },
    });

    return res.status(201).json({
      success: true,
      message: `${role} account for ${fullName} created successfully.`,
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        branchId: newUser.branchId,
        jobTitle: newUser.jobTitle,
        status: newUser.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, status, branchId, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // Branch scoping: If Manager or Employee, restrict to their branch
    if (req.user.role === ROLES.MANAGER || req.user.role === ROLES.EMPLOYEE) {
      if (req.user.branchId) {
        query.branchId = req.user.branchId;
      }
    } else if (branchId) {
      query.branchId = branchId;
    }

    if (role) {
      query.role = role;
    } else {
      // Don't return Customers in staff list
      query.role = { $ne: ROLES.CUSTOMER };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('branchId', 'branchName branchCode city')
        .populate('createdBy', 'fullName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
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

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('branchId', 'branchName branchCode city')
      .populate('createdBy', 'fullName role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
        code: 'NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const actor = req.user;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user account not found.',
        code: 'NOT_FOUND',
      });
    }

    // Safety rule: Self-deactivation forbidden for Super Admin
    if (String(actor._id) === String(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Critical safety violation: You cannot alter your own account status.',
        code: 'SELF_STATUS_CHANGE_PROHIBITED',
      });
    }

    // Hierarchy validation: Only Super Admin can touch Admin; Admin can touch Manager/Employee; Manager can touch Employee
    if (targetUser.role === ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin status cannot be altered.',
        code: 'FORBIDDEN',
      });
    }

    if (targetUser.role === ROLES.ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can alter Admin accounts.',
        code: 'FORBIDDEN',
      });
    }

    if (targetUser.role === ROLES.MANAGER && ![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify Manager accounts.',
        code: 'FORBIDDEN',
      });
    }

    targetUser.status = status;
    await targetUser.save();

    await logAuditEvent({
      req,
      action: 'USER_STATUS_UPDATED',
      resourceType: 'USER',
      resourceId: targetUser._id,
      outcome: 'SUCCESS',
      reason: `Status changed to ${status}`,
    });

    return res.status(200).json({
      success: true,
      message: `User status successfully updated to ${status}.`,
      data: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

