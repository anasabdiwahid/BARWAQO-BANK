import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    responsiblePersonName: {
      type: String,
      required: true,
      trim: true,
    },
    responsiblePersonRelationship: {
      type: String,
      required: true,
      trim: true,
    },
    responsiblePersonPhone: {
      type: String,
      required: true,
      trim: true,
    },
    identityDocumentType: {
      type: String,
      enum: ['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE'],
      required: true,
    },
    identityDocumentNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Mogadishu',
    },
    country: {
      type: String,
      required: true,
      default: 'Somalia',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    kycStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'SUSPENDED'],
      default: 'APPROVED',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);

