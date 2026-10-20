import mongoose from 'mongoose';
import { INITIAL_ACCOUNT_NUMBER } from '../config/constants.js';

const accountCounterSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
    default: 'BARWAQO_ACCOUNT_NUMBER',
  },
  lastSeq: {
    type: Number,
    required: true,
    default: INITIAL_ACCOUNT_NUMBER - 1, // e.g. 10011000 so first increment becomes 10011001
  },
});

export const AccountCounter = mongoose.model('AccountCounter', accountCounterSchema);

