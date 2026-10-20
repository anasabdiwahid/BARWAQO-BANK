import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Customer } from '../models/Customer.js';
import { logAuditEvent } from '../services/auditService.js';
import { ROLES } from '../config/constants.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      branchId: user.branchId,
    },
    process.env.JWT_ACCESS_SECRET || 'barwaqo_bank_access_secret_super_secure_key_2026_9837194812301',
    { expiresIn: '12h' }
  );
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Check by email or username
    let user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.toLowerCase().trim() },
      ],
    }).select('+passwordHash');

    // If not found, check if identifier is an 8-digit account number belonging to a customer
    if (!user && /^\d{8}$/.test(identifier.trim())) {
      const account = await Account.findOne({ accountNumber: identifier.trim() });
      if (account) {
        user = await User.findById(account.userId).select('+passwordHash');
      }
    }

    // Generic error to avoid account enumeration
    if (!user) {
      await logAuditEvent({
        req,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH',
        outcome: 'FAILURE',
        reason: 'User not found or invalid credentials',
        metadata: { identifier },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your login details and try again.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (user.status !== 'ACTIVE') {
      await logAuditEvent({
        req,
        actorId: user._id,
        actorName: user.fullName,
        actorRole: user.role,
        action: 'LOGIN_BLOCKED',
        resourceType: 'AUTH',
        outcome: 'BLOCKED',
        reason: `Account is ${user.status}`,
      });

      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact Barwaqo Bank support.`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAuditEvent({
        req,
        actorId: user._id,
        actorName: user.fullName,
        actorRole: user.role,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH',
        outcome: 'FAILURE',
        reason: 'Incorrect password',
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your login details and try again.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    // Set secure HttpOnly cookie
    res.cookie('barwaqo_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });

    // If customer, fetch their primary account
    let customerAccount = null;
    if (user.role === ROLES.CUSTOMER) {
      customerAccount = await Account.findOne({ userId: user._id });
    }

    await logAuditEvent({
      req,
      actorId: user._id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      outcome: 'SUCCESS',
    });

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully. Welcome to Barwaqo Bank.',
      data: {
        token, // provided for optional header use
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
          permissions: user.permissions,
          jobTitle: user.jobTitle,
        },
        account: customerAccount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAuditEvent({
        req,
        action: 'LOGOUT',
        resourceType: 'AUTH',
        outcome: 'SUCCESS',
      });
    }

    res.clearCookie('barwaqo_token');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let customerInfo = null;
    let accounts = [];

    if (user.role === ROLES.CUSTOMER) {
      customerInfo = await Customer.findOne({ userId: user._id });
      accounts = await Account.find({ userId: user._id });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
          permissions: user.permissions,
          jobTitle: user.jobTitle,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
        customer: customerInfo,
        accounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
        code: 'INCORRECT_CURRENT_PASSWORD',
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    await logAuditEvent({
      req,
      action: 'PASSWORD_CHANGE',
      resourceType: 'USER',
      resourceId: user._id,
      outcome: 'SUCCESS',
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

