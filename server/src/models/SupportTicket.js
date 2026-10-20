import mongoose from 'mongoose';
import { TICKET_STATUS, TICKET_PRIORITY } from '../config/constants.js';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedAccount: {
      type: String,
      default: '',
    },
    relatedTransaction: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['INCORRECT_TRANSFER', 'ACCOUNT_HOLD', 'CARD_SERVICE', 'SUSPICIOUS_ACTIVITY', 'GENERAL_INQUIRY'],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderRole: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

