import { z } from 'zod';

export const transferPreviewSchema = z.object({
  body: z.object({
    recipientAccountNumber: z
      .string()
      .regex(/^\d{8}$/, 'Recipient account number must be exactly 8 digits'),
    amount: z.number().positive('Transfer amount must be greater than zero'),
    currency: z.string().default('SOS'),
  }),
});

export const executeTransferSchema = z.object({
  body: z.object({
    recipientAccountNumber: z
      .string()
      .regex(/^\d{8}$/, 'Recipient account number must be exactly 8 digits'),
    amount: z.number().positive('Transfer amount must be greater than zero'),
    currency: z.string().default('SOS'),
    description: z.string().max(150).optional().default('Transfer'),
    idempotencyKey: z.string().optional(),
    senderAccountId: z.string().optional(), // For employees assisting or customers with multi-accounts
  }),
});

