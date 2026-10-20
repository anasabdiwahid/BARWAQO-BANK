import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'TRANSFER_SENT',
        'TRANSFER_RECEIVED',
        'ACCOUNT_RESTRICTION',
        'RESTRICTION_RELEASED',
        'SECURITY_ALERT',
        'KYC_UPDATE',
        'REVERSAL_UPDATE',
        'SUPPORT_UPDATE',
        'SYSTEM_ANNOUNCEMENT',
      ],
      default: 'SYSTEM_ANNOUNCEMENT',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedReference: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);

