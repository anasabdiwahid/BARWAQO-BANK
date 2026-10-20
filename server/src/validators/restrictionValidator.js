import { z } from 'zod';
import { RESTRICTION_TYPES } from '../config/constants.js';

export const createRestrictionSchema = z.object({
  body: z.object({
    accountNumber: z.string().regex(/^\d{8}$/, 'Account number must be 8 digits'),
    restrictionType: z.enum(Object.values(RESTRICTION_TYPES)),
    amount: z.number().min(0).optional().default(0), // Applicable for PARTIAL_HOLD
    reason: z.string().min(5, 'A clear reason for account restriction is required'),
    caseReference: z.string().optional().default(''),
    expiresAt: z.string().optional(),
  }),
});

export const releaseRestrictionSchema = z.object({
  body: z.object({
    releaseReason: z.string().min(5, 'Release reason is required'),
  }),
});

