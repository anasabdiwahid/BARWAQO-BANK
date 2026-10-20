import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Account } from '../models/Account.js';
import { AccountCounter } from '../models/AccountCounter.js';
import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { AccountRestriction } from '../models/AccountRestriction.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { ROLES, ACCOUNT_STATUS, ACCOUNT_TYPES, TRANSACTION_TYPES, TRANSACTION_STATUS, RESTRICTION_TYPES, RESTRICTION_STATUS, TICKET_STATUS, DEFAULT_CURRENCY } from '../config/constants.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[SEED] Clearing existing synthetic development collections...');

    await Promise.all([
      Branch.deleteMany({}),
      User.deleteMany({}),
      Customer.deleteMany({}),
      Account.deleteMany({}),
      AccountCounter.deleteMany({}),
      Transaction.deleteMany({}),
      LedgerEntry.deleteMany({}),
      AccountRestriction.deleteMany({}),
      SupportTicket.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[SEED] Creating Bank Branches...');
    const branches = await Branch.create([
      {
        branchName: 'Mogadishu Central Headquarters',
        branchCode: 'BB-MG01',
        address: 'KM4 Maka Al Mukarama Avenue',
        city: 'Mogadishu',
        phone: '+252 61 5000001',
        status: 'ACTIVE',
      },
      {
        branchName: 'Hargeisa Regional Branch',
        branchCode: 'BB-HG02',
        address: '1st August Commercial District',
        city: 'Hargeisa',
        phone: '+252 63 5000002',
        status: 'ACTIVE',
      },
      {
        branchName: 'Kismayo Coastal Branch',
        branchCode: 'BB-KS03',
        address: 'Port Road Financial Center',
        city: 'Kismayo',
        phone: '+252 61 5000003',
        status: 'ACTIVE',
      },
    ]);

    const hqBranch = branches[0];
    const hargeisaBranch = branches[1];

    console.log('[SEED] Initializing Atomic 8-Digit Account Counter...');
    await AccountCounter.create([
      {
        identifier: 'BARWAQO_ACCOUNT_NUMBER',
        lastSeq: 10011000, // so the very first created account will be 10011001!
      },
      {
        identifier: 'BARWAQO_CUSTOMER_ID',
        lastSeq: 1000, // so first is BB-CUST-1001
      },
    ]);

    console.log('[SEED] Creating Staff Users (Super Admin, Admin, Manager, Employees)...');
    const commonPasswordHash = await User.hashPassword('Barwaqo@2026');

    // 1. Super Admin
    const superAdmin = await User.create({
      fullName: 'Dr. Abdirashid Barre',
      email: 'superadmin@barwaqobank.so',
      username: 'superadmin',
      phone: '+252 61 5111111',
      passwordHash: commonPasswordHash,
      role: ROLES.SUPER_ADMIN,
      branchId: hqBranch._id,
      jobTitle: 'Chief Executive Officer',
      permissions: ['ALL_PERMISSIONS'],
      status: 'ACTIVE',
    });

    // 2. Admin
    const admin = await User.create({
      fullName: 'Fatima Zahra Warsame',
      email: 'admin@barwaqobank.so',
      username: 'admin',
      phone: '+252 61 5222222',
      passwordHash: commonPasswordHash,
      role: ROLES.ADMIN,
      branchId: hqBranch._id,
      jobTitle: 'Head of Operations & Compliance',
      permissions: ['ADMIN_OPERATIONS', 'VIEW_AUDIT', 'MANAGE_MANAGERS'],
      status: 'ACTIVE',
      createdBy: superAdmin._id,
    });

    // 3. Manager
    const manager = await User.create({
      fullName: 'Mohamed Ibrahim Guled',
      email: 'manager@barwaqobank.so',
      username: 'manager',
      phone: '+252 61 5333333',
      passwordHash: commonPasswordHash,
      role: ROLES.MANAGER,
      branchId: hqBranch._id,
      jobTitle: 'Branch Operations Manager',
      permissions: ['APPROVE_REVERSALS', 'APPLY_HOLDS', 'MANAGE_STAFF'],
      status: 'ACTIVE',
      createdBy: admin._id,
    });

    // Update branch manager
    hqBranch.managerId = manager._id;
    await hqBranch.save();

    // 4. Employee 1
    const employee1 = await User.create({
      fullName: 'Amina Nur Osman',
      email: 'amina.employee@barwaqobank.so',
      username: 'employee1',
      phone: '+252 61 5444444',
      passwordHash: commonPasswordHash,
      role: ROLES.EMPLOYEE,
      branchId: hqBranch._id,
      jobTitle: 'Customer Relationship Officer',
      permissions: ['REGISTER_CUSTOMER', 'SEARCH_CUSTOMER', 'REQUEST_REVERSAL', 'INITIATE_HOLD'],
      status: 'ACTIVE',
      createdBy: manager._id,
    });

    // 5. Employee 2
    const employee2 = await User.create({
      fullName: 'Hassan Ali Farah',
      email: 'hassan.employee@barwaqobank.so',
      username: 'employee2',
      phone: '+252 61 5555555',
      passwordHash: commonPasswordHash,
      role: ROLES.EMPLOYEE,
      branchId: hargeisaBranch._id,
      jobTitle: 'Branch Teller & Customer Service',
      permissions: ['REGISTER_CUSTOMER', 'SEARCH_CUSTOMER', 'REQUEST_REVERSAL'],
      status: 'ACTIVE',
      createdBy: manager._id,
    });

    console.log('[SEED] Creating Customers and Accounts (Sequential 8-digit starting at 10011001)...');

    const customerSeeds = [
      {
        fullName: 'Sahra Abdi Mohamed',
        accountNumber: '10011001',
        customerId: 'BB-CUST-1001',
        email: 'sahra.customer@barwaqobank.so',
        phone: '+252 61 6000001',
        gender: 'FEMALE',
        motherName: 'Halima Jama',
        responsiblePersonName: 'Abdi Mohamed Shire',
        responsiblePersonRelationship: 'Father',
        responsiblePersonPhone: '+252 61 7000001',
        identityDocumentType: 'NATIONAL_ID',
        identityDocumentNumber: 'SOM-ID-9812401',
        dateOfBirth: new Date('1994-05-14'),
        address: 'Wadajir District, House 42',
        initialDepositMinorUnits: 25000000, // 250,000.00 SOS
      },
      {
        fullName: 'Khadar Ahmed Shire',
        accountNumber: '10011002',
        customerId: 'BB-CUST-1002',
        email: 'khadar.customer@barwaqobank.so',
        phone: '+252 61 6000002',
        gender: 'MALE',
        motherName: 'Mariam Ali',
        responsiblePersonName: 'Ahmed Shire Nur',
        responsiblePersonRelationship: 'Brother',
        responsiblePersonPhone: '+252 61 7000002',
        identityDocumentType: 'PASSPORT',
        identityDocumentNumber: 'P-SOM-482910',
        dateOfBirth: new Date('1988-11-22'),
        address: 'Hodan District, Taleex',
        initialDepositMinorUnits: 18000000, // 180,000.00 SOS
      },
      {
        fullName: 'Bilal Muse Aden',
        accountNumber: '10011003',
        customerId: 'BB-CUST-1003',
        email: 'bilal.customer@barwaqobank.so',
        phone: '+252 61 6000003',
        gender: 'MALE',
        motherName: 'Fadumo Omar',
        responsiblePersonName: 'Omar Muse Aden',
        responsiblePersonRelationship: 'Uncle',
        responsiblePersonPhone: '+252 61 7000003',
        identityDocumentType: 'NATIONAL_ID',
        identityDocumentNumber: 'SOM-ID-6718290',
        dateOfBirth: new Date('2001-02-10'),
        address: 'Hamar Weyne Center',
        initialDepositMinorUnits: 12000000, // 120,000.00 SOS
      },
      {
        fullName: 'Hodan Yusuf Jama',
        accountNumber: '10011004',
        customerId: 'BB-CUST-1004',
        email: 'hodan.customer@barwaqobank.so',
        phone: '+252 61 6000004',
        gender: 'FEMALE',
        motherName: 'Khadija Hassan',
        responsiblePersonName: 'Yusuf Jama Koshin',
        responsiblePersonRelationship: 'Father',
        responsiblePersonPhone: '+252 61 7000004',
        identityDocumentType: 'NATIONAL_ID',
        identityDocumentNumber: 'SOM-ID-7819201',
        dateOfBirth: new Date('1997-09-30'),
        address: 'Karaan District, Seaside',
        initialDepositMinorUnits: 9500000, // 95,000.00 SOS
      },
    ];

    const createdAccounts = [];

    for (const c of customerSeeds) {
      const user = await User.create({
        fullName: c.fullName,
        email: c.email,
        username: c.accountNumber,
        phone: c.phone,
        passwordHash: commonPasswordHash,
        role: ROLES.CUSTOMER,
        branchId: hqBranch._id,
        status: 'ACTIVE',
        createdBy: employee1._id,
      });

      const customer = await Customer.create({
        customerId: c.customerId,
        userId: user._id,
        fullName: c.fullName,
        gender: c.gender,
        motherName: c.motherName,
        responsiblePersonName: c.responsiblePersonName,
        responsiblePersonRelationship: c.responsiblePersonRelationship,
        responsiblePersonPhone: c.responsiblePersonPhone,
        identityDocumentType: c.identityDocumentType,
        identityDocumentNumber: c.identityDocumentNumber,
        dateOfBirth: c.dateOfBirth,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: 'Mogadishu',
        country: 'Somalia',
        branchId: hqBranch._id,
        kycStatus: 'VERIFIED',
        verificationStatus: 'APPROVED',
        createdBy: employee1._id,
      });

      const account = await Account.create({
        accountNumber: c.accountNumber,
        customerId: customer._id,
        userId: user._id,
        branchId: hqBranch._id,
        accountType: ACCOUNT_TYPES.SAVINGS,
        currency: DEFAULT_CURRENCY,
        status: ACCOUNT_STATUS.ACTIVE,
        openingDate: new Date(),
        ledgerBalanceMinorUnits: c.initialDepositMinorUnits,
        restrictedBalanceMinorUnits: 0,
        availableBalanceMinorUnits: c.initialDepositMinorUnits,
      });

      // Initial deposit transaction & ledger entry
      const tx = await Transaction.create({
        transactionReference: `INIT-DEP-${c.accountNumber}`,
        transactionType: TRANSACTION_TYPES.DEPOSIT,
        senderAccountId: null,
        senderAccountNumber: 'CASH-VAULT',
        recipientAccountId: account._id,
        recipientAccountNumber: account.accountNumber,
        recipientName: c.fullName,
        amountMinorUnits: c.initialDepositMinorUnits,
        currency: DEFAULT_CURRENCY,
        feeMinorUnits: 0,
        totalDebitMinorUnits: c.initialDepositMinorUnits,
        status: TRANSACTION_STATUS.POSTED,
        initiatedBy: employee1._id,
        branchId: hqBranch._id,
        description: 'Account Opening Cash Deposit',
        postedAt: new Date(),
      });

      await LedgerEntry.create({
        transactionId: tx._id,
        accountId: account._id,
        accountNumber: account.accountNumber,
        entryType: 'CREDIT',
        amountMinorUnits: c.initialDepositMinorUnits,
        currency: DEFAULT_CURRENCY,
        balanceEffect: 1,
        entryStatus: 'POSTED',
        description: 'Credit: Opening deposit',
        runningBalanceMinorUnits: c.initialDepositMinorUnits,
        createdBy: employee1._id,
      });

      createdAccounts.push(account);
    }

    // Update sequence counter to match last created
    await AccountCounter.findOneAndUpdate(
      { identifier: 'BARWAQO_ACCOUNT_NUMBER' },
      { lastSeq: 10011004 }
    );
    await AccountCounter.findOneAndUpdate(
      { identifier: 'BARWAQO_CUSTOMER_ID' },
      { lastSeq: 1004 }
    );

    console.log('[SEED] Creating Sample Inter-Customer Transfer (Sahra -> Khadar 25,000 SOS)...');
    const transferAmount = 2500000; // 25,000.00 SOS
    const acc1 = createdAccounts[0]; // Sahra (10011001)
    const acc2 = createdAccounts[1]; // Khadar (10011002)

    acc1.ledgerBalanceMinorUnits -= transferAmount;
    acc1.availableBalanceMinorUnits -= transferAmount;
    await acc1.save();

    acc2.ledgerBalanceMinorUnits += transferAmount;
    acc2.availableBalanceMinorUnits += transferAmount;
    await acc2.save();

    const sampleTx = await Transaction.create({
      transactionReference: 'BB-20261021-DEMO01',
      transactionType: TRANSACTION_TYPES.TRANSFER_DEBIT,
      senderAccountId: acc1._id,
      senderAccountNumber: acc1.accountNumber,
      senderName: 'Sahra Abdi Mohamed',
      recipientAccountId: acc2._id,
      recipientAccountNumber: acc2.accountNumber,
      recipientName: 'Khadar Ahmed Shire',
      amountMinorUnits: transferAmount,
      currency: DEFAULT_CURRENCY,
      feeMinorUnits: 0,
      totalDebitMinorUnits: transferAmount,
      status: TRANSACTION_STATUS.POSTED,
      initiatedBy: acc1.userId,
      branchId: hqBranch._id,
      description: 'Family Support payment',
      postedAt: new Date(),
    });

    const l1 = await LedgerEntry.create({
      transactionId: sampleTx._id,
      accountId: acc1._id,
      accountNumber: acc1.accountNumber,
      entryType: 'DEBIT',
      amountMinorUnits: transferAmount,
      currency: DEFAULT_CURRENCY,
      balanceEffect: -1,
      entryStatus: 'POSTED',
      description: `Debit: Transfer to ${acc2.accountNumber}`,
      runningBalanceMinorUnits: acc1.ledgerBalanceMinorUnits,
      createdBy: acc1.userId,
    });

    await LedgerEntry.create({
      transactionId: sampleTx._id,
      accountId: acc2._id,
      accountNumber: acc2.accountNumber,
      entryType: 'CREDIT',
      amountMinorUnits: transferAmount,
      currency: DEFAULT_CURRENCY,
      balanceEffect: 1,
      entryStatus: 'POSTED',
      description: `Credit: Transfer received from ${acc1.accountNumber}`,
      runningBalanceMinorUnits: acc2.ledgerBalanceMinorUnits,
      createdBy: acc1.userId,
      relatedEntryId: l1._id,
    });

    console.log('[SEED] Creating Sample Account Restriction (Partial hold on Bilal)...');
    const acc3 = createdAccounts[2]; // Bilal (10011003)
    const holdAmount = 1500000; // 15,000.00 SOS
    acc3.restrictedBalanceMinorUnits = holdAmount;
    acc3.syncAvailableBalance();
    await acc3.save();

    await AccountRestriction.create({
      restrictionReference: 'RST-20261021-DEMO01',
      accountId: acc3._id,
      accountNumber: acc3.accountNumber,
      restrictionType: RESTRICTION_TYPES.PARTIAL_HOLD,
      amountMinorUnits: holdAmount,
      currency: DEFAULT_CURRENCY,
      reason: 'Temporary regulatory inquiry pending documentation review',
      createdBy: employee1._id,
      approvedBy: manager._id,
      status: RESTRICTION_STATUS.ACTIVE,
      effectiveAt: new Date(),
    });

    console.log('[SEED] Creating Sample Customer Support Dispute Ticket...');
    await SupportTicket.create({
      ticketReference: 'TCK-20261021-DEMO01',
      customerId: acc1.customerId,
      userId: acc1.userId,
      relatedAccount: acc1.accountNumber,
      relatedTransaction: sampleTx.transactionReference,
      category: 'INCORRECT_TRANSFER',
      subject: 'Inquiry regarding transaction reference BB-20261021-DEMO01',
      description: 'Hello Barwaqo Support, I would like to verify the delivery confirmation for this transfer.',
      priority: 'MEDIUM',
      status: TICKET_STATUS.OPEN,
      messages: [
        {
          senderId: acc1.userId,
          senderRole: ROLES.CUSTOMER,
          message: 'Hello Barwaqo Support, I would like to verify the delivery confirmation for this transfer.',
          createdAt: new Date(),
        },
      ],
    });

    console.log('[SEED] Creating Initial Audit Log...');
    await AuditLog.create({
      actorId: superAdmin._id,
      actorName: superAdmin.fullName,
      actorRole: superAdmin.role,
      action: 'SYSTEM_BOOTSTRAP_COMPLETE',
      resourceType: 'SYSTEM',
      outcome: 'SUCCESS',
      reason: 'Synthetic development seed completed successfully with Barwaqo Bank master parameters.',
    });

    console.log(`
========================================================================
  BARWAQO BANK — SYNTHETIC SEED SUCCESSFUL!
========================================================================
  Official Test Credentials (Password for all: Barwaqo@2026):

  1. SUPER ADMIN:
     - Email:    superadmin@barwaqobank.so
     - Username: superadmin

  2. ADMIN:
     - Email:    admin@barwaqobank.so
     - Username: admin

  3. MANAGER:
     - Email:    manager@barwaqobank.so
     - Username: manager

  4. EMPLOYEES:
     - Email:    amina.employee@barwaqobank.so
     - Email:    hassan.employee@barwaqobank.so

  5. CUSTOMERS (Login with Account Number or Email):
     - Account:  10011001 (Sahra Abdi Mohamed) - Balance: 225,000 SOS
     - Account:  10011002 (Khadar Ahmed Shire) - Balance: 205,000 SOS
     - Account:  10011003 (Bilal Muse Aden) - Balance: 105,000 SOS (15,000 Hold)
     - Account:  10011004 (Hodan Yusuf Jama) - Balance: 95,000 SOS
========================================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error('[CRITICAL] Seed failure:', error);
    process.exit(1);
  }
};

seedDatabase();

