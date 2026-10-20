import { z } from 'zod';

export const requestReversalSchema = z.object({
  body: z.object({
    transactionReference: z.string().min(5, 'Valid transaction reference is required'),
    reason: z.string().min(5, 'Reason for requesting reversal is required'),
    caseReference: z.string().optional().default(''),
  }),
});

export const reviewReversalSchema = z.object({
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    reviewNotes: z.string().optional().default(''),
  }),
});

