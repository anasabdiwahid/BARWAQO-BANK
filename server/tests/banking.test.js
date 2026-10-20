import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Account } from '../src/models/Account.js';
import { getNextAccountNumber } from '../src/services/accountSequenceService.js';

describe('BARWAQO BANK — Core Banking System Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barwaqo_bank');
    }
  });

  afterAll(async () => {
    // Keep connection intact for dev server
  });

  describe('1. Health and Environment', () => {
    it('should return 200 and healthy API status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.brand).toBe('BARWAQO BANK');
    });
  });

  describe('2. Authentication and Authorization', () => {
    it('should authenticate Super Admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'superadmin@barwaqobank.so',
          password: 'Barwaqo@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('SUPER_ADMIN');
      expect(res.body.data.token).toBeDefined();
    });

    it('should authenticate Customer by 8-digit Account Number (10011001)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '10011001',
          password: 'Barwaqo@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.account.accountNumber).toBe('10011001');
    });

    it('should reject invalid credentials with generic secure message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'superadmin@barwaqobank.so',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('3. Account Number Generation', () => {
    it('should generate an account number that is strictly 8 digits string', async () => {
      const accNumber = await getNextAccountNumber();
      expect(accNumber).toMatch(/^\d{8}$/);
      expect(typeof accNumber).toBe('string');
      expect(accNumber.length).toBe(8);
    });
  });

  describe('4. Strict Money Transfers & Balances', () => {
    let customerToken = '';

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '10011001',
          password: 'Barwaqo@2026',
        });
      customerToken = res.body.data.token;
    });

    it('should preview transfer with masked recipient name and limit check', async () => {
      const res = await request(app)
        .post('/api/transfers/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recipientAccountNumber: '10011002',
          amount: 500,
          currency: 'SOS',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipient.accountNumber).toBe('10011002');
      expect(res.body.data.recipient.maskedName).toBeDefined();
    });

    it('should reject transfer when amount exceeds available balance', async () => {
      const res = await request(app)
        .post('/api/transfers/execute')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recipientAccountNumber: '10011002',
          amount: 999999999, // Exceeds balance
          currency: 'SOS',
          description: 'Overspending attempt',
        });

      expect(res.status).toBe(500); // or 400 with ledger rejection
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Insufficient available funds/i);
    });

    it('should execute valid atomic transfer and produce ledger records', async () => {
      const res = await request(app)
        .post('/api/transfers/execute')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recipientAccountNumber: '10011002',
          amount: 1000,
          currency: 'SOS',
          description: 'Automated test payment',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receipt.transactionReference).toBeDefined();
      expect(res.body.data.receipt.amount).toBe(1000);
    });
  });

  describe('5. Role Hierarchy Enforcement', () => {
    let managerToken = '';

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'manager@barwaqobank.so',
          password: 'Barwaqo@2026',
        });
      managerToken = res.body.data.token;
    });

    it('should forbid a Manager from creating an Admin', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fullName: 'Illegal Admin',
          email: 'illegal.admin@barwaqobank.so',
          phone: '+252 61 9999999',
          role: 'ADMIN',
          branchId: '000000000000000000000001',
          password: 'SecurePassword123!',
        });

      expect(res.status).toBe(403); // Role hierarchy violation correctly forbidden
    });
  });
});
