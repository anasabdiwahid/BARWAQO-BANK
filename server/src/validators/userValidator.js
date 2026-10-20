import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(6, 'Valid phone number is required'),
    role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE], {
      errorMap: () => ({ message: 'Role must be ADMIN, MANAGER, or EMPLOYEE' }),
    }),
    branchId: z.string().min(1, 'Assigned branch is required'),
    jobTitle: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    permissions: z.array(z.string()).optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
  }),
});

