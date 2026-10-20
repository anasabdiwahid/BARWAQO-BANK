import { z } from 'zod';
import { ACCOUNT_TYPES } from '../config/constants.js';

export const registerCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Customer full name is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    motherName: z.string().min(2, "Mother's full name is required"),
    responsiblePersonName: z.string().min(2, 'Responsible Person / Next of Kin name is required'),
    responsiblePersonRelationship: z.string().min(2, 'Relationship is required'),
    responsiblePersonPhone: z.string().min(6, "Responsible person's phone number is required"),
    identityDocumentType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE']),
    identityDocumentNumber: z.string().min(4, 'Valid document number is required'),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid Date of Birth is required',
    }),
    phone: z.string().min(6, 'Customer phone number is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().min(3, 'Residential address is required'),
    city: z.string().min(2, 'City is required').default('Mogadishu'),
    country: z.string().min(2, 'Country is required').default('Somalia'),
    branchId: z.string().min(1, 'Branch assignment is required'),
    accountType: z.enum(Object.values(ACCOUNT_TYPES)).default(ACCOUNT_TYPES.SAVINGS),
    initialDeposit: z.number().min(0, 'Initial deposit cannot be negative').default(0),
    password: z.string().min(8, 'Customer portal initial password must be at least 8 characters'),
  }),
});

