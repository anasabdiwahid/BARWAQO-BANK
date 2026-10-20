import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check HttpOnly signed cookie or standard cookie
    if (req.cookies && req.cookies.barwaqo_token) {
      token = req.cookies.barwaqo_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to Barwaqo Bank.',
        code: 'UNAUTHENTICATED',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'barwaqo_bank_access_secret_super_secure_key_2026_9837194812301');

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or session expired.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact bank compliance.`,
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Attach to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
      code: 'INVALID_TOKEN',
    });
  }
};

