// Live data — only real users and configuration. No dummy/mock data.

export const professionRates = [
  { id: 1, classification: 'Security Officer',     pointsPerUnit: 2, cashPerPoint: 1.0, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 2, classification: 'Security Coordinator', pointsPerUnit: 2, cashPerPoint: 1.2, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 3, classification: 'Patrol Officer',        pointsPerUnit: 2, cashPerPoint: 1.0, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 4, classification: 'Staff',                 pointsPerUnit: 2, cashPerPoint: 0.8, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
];

// ── Real staff users (from Connecteam) ─────────────────────────────────────────
export const staffUsers = [
  {
    id: 51,
    firstName: 'Sam', lastName: 'Thompson',
    email: 'michael.thompson@mockmail.com',
    password: 'password123',
    department: 'Security', position: 'Security Officer',
    classification: 'Security Officer',
    location: 'Branch 1', joinDate: '2025-02-18',
    isActive: true, pointsBalance: 0, totalReferrals: 0, successfulReferrals: 0,
    hourlyRate: 30,
    connecteamUserId: 14358459,
    phone: '+1 779 237 8813',
    referralCode: 'REFST51',
    avatar: 'https://i.pravatar.cc/150?img=51',
    lastActiveDate: '2026-03-15',
    bankAccount: null,
  },
  {
    id: 52,
    firstName: 'Liz', lastName: 'Carter',
    email: 'emily.carter@mockmail.com',
    password: 'password123',
    department: 'Security', position: 'Security Coordinator',
    classification: 'Security Coordinator',
    location: 'Branch 1', joinDate: '2021-02-17',
    isActive: true, pointsBalance: 0, totalReferrals: 0, successfulReferrals: 0,
    hourlyRate: 33,
    connecteamUserId: 14358460,
    phone: '+1 339 675 1837',
    referralCode: 'REFLC52',
    avatar: 'https://i.pravatar.cc/150?img=52',
    lastActiveDate: '2026-03-15',
    bankAccount: null,
  },
  {
    id: 53,
    firstName: 'Adepeju', lastName: 'Daniel',
    email: 'oretomiwa20@gmail.com',
    password: 'password123',
    department: 'Operations', position: 'Staff',
    classification: 'Staff',
    location: 'Lagos', joinDate: '2026-03-12',
    isActive: true, pointsBalance: 0, totalReferrals: 0, successfulReferrals: 0,
    hourlyRate: 25,
    connecteamUserId: 14640765,
    phone: '+234 803 049 1166',
    referralCode: 'REFAD53',
    avatar: 'https://i.pravatar.cc/150?img=53',
    lastActiveDate: '2026-03-15',
    bankAccount: null,
  },
  {
    id: 54,
    firstName: 'Oreoluwa', lastName: 'Adigun',
    email: 'adigunore20@gmail.com',
    password: 'password123',
    department: 'Operations', position: 'Staff',
    classification: 'Staff',
    location: 'Lagos', joinDate: '2026-03-12',
    isActive: true, pointsBalance: 0, totalReferrals: 0, successfulReferrals: 0,
    hourlyRate: 25,
    connecteamUserId: 14640766,
    phone: '+234 805 948 1104',
    referralCode: 'REFOA54',
    avatar: 'https://i.pravatar.cc/150?img=54',
    lastActiveDate: '2026-03-15',
    bankAccount: null,
  },
];

// ── Admin accounts ─────────────────────────────────────────────────────────────
export const adminUsers = [
  {
    id: 'admin-1',
    name: 'Oreoluwa Adigun',
    email: 'adisoreoluwa@gmail.com',
    password: 'admin123',
    role: 'super_admin',
    permissions: ['all'],
    isActive: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
];

// ── Transactional data — starts empty, filled by real activity ─────────────────
export const referrals            = [];
export const withdrawals          = [];
export const auditLogs            = [];
export const importedHours        = [];
export const connecteamSyncLogs   = [];
export const adminNotifications   = [];
export const staffNotifications   = [];
export const pointTransactions    = [];
export const reports              = [];

// ── Referral programs — one default active program ─────────────────────────────
export const referralPrograms = [
  {
    id: 1,
    name: 'Standard Referral',
    description: 'Base referral reward for all staff',
    pointsPerReferral: 500,
    bonusPoints: 0,
    isActive: true,
    startDate: '2026-01-01',
    endDate: null,
    minHoursRequired: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'admin-1',
    participantCount: 0,
  },
];

// ── System configuration ───────────────────────────────────────────────────────
export const systemSettings = {
  timezone: 'Australia/Sydney',
  currency: 'AUD',
  currencySymbol: '$',
  pointsPerUnit: 2,
  minimumWithdrawal: 100,
  maximumWithdrawal: 2500,
  maxWithdrawalPoints: 2500,
  referralHoursCap: 120,
  inactivityPeriods: { flagInactive: 3, deleteAccount: 6 },
  features: {
    referralSystem: true, withdrawalSystem: true,
    pointsSystem: true, notifications: true, professionBasedRates: true,
  },
  retentionYears: 5,
};

export const connecteamSettings = {
  apiKey: process.env.CONNECTEAM_API_KEY || '',
  organizationId: process.env.CONNECTEAM_ORG_ID || '',
  webhookUrl: '',
  syncFrequency: 'daily',
  lastSync: null,
  isConnected: false,
  autoSync: true,
  shiftMultipliers: { regular: 1.0, overtime: 1.5, weekend: 2.0, public_holiday: 2.5 },
};
