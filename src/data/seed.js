// Seed / mock data for development
// When Supabase is connected, this file is replaced by real DB queries

const classifications = ['Registered Nurse', 'Care Worker', 'Support Worker', 'Admin Staff', 'Driver'];
const bankNames = ['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA', 'Sterling Bank', 'Fidelity Bank'];

const hourlyRateByClassification = {
  'Registered Nurse': 35,
  'Care Worker': 25,
  'Support Worker': 22,
  'Admin Staff': 20,
  'Driver': 23,
};

const getRandomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generatePhone = () => {
  const prefixes = ['803', '806', '810', '813', '816', '907', '908', '909'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+234 ${prefix} ${rest.slice(0, 3)} ${rest.slice(3)}`;
};

export const professionRates = [
  { id: 1, classification: 'Registered Nurse', pointsPerUnit: 2, cashPerPoint: 2.5, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 2, classification: 'Care Worker', pointsPerUnit: 2, cashPerPoint: 0.5, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 3, classification: 'Support Worker', pointsPerUnit: 2, cashPerPoint: 0.5, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 4, classification: 'Admin Staff', pointsPerUnit: 2, cashPerPoint: 0.5, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
  { id: 5, classification: 'Driver', pointsPerUnit: 2, cashPerPoint: 0.5, currencySymbol: '$', currencyCode: 'AUD', isActive: true },
];

// 50 Staff Users
const rawUsers = [
  { id: 1, firstName: 'Adewale', lastName: 'Johnson', email: 'adewale.johnson@company.com', department: 'Sales', position: 'Senior', location: 'Lagos', joinDate: '2024-03-15', isActive: true, pointsBalance: 12500, totalReferrals: 18, successfulReferrals: 15 },
  { id: 2, firstName: 'Chioma', lastName: 'Okafor', email: 'chioma.okafor@company.com', department: 'Sales', position: 'Junior', location: 'Lagos', joinDate: '2024-08-20', isActive: true, pointsBalance: 8900, totalReferrals: 12, successfulReferrals: 10 },
  { id: 3, firstName: 'Oluwaseun', lastName: 'Adebayo', email: 'oluwaseun.adebayo@company.com', department: 'Sales', position: 'Manager', location: 'Lagos', joinDate: '2023-05-10', isActive: true, pointsBalance: 15000, totalReferrals: 20, successfulReferrals: 18 },
  { id: 4, firstName: 'Blessing', lastName: 'Eze', email: 'blessing.eze@company.com', department: 'Sales', position: 'Junior', location: 'Abuja', joinDate: '2024-09-01', isActive: true, pointsBalance: 6700, totalReferrals: 9, successfulReferrals: 7 },
  { id: 5, firstName: 'Emeka', lastName: 'Nwosu', email: 'emeka.nwosu@company.com', department: 'Sales', position: 'Senior', location: 'Lagos', joinDate: '2023-11-22', isActive: true, pointsBalance: 11200, totalReferrals: 16, successfulReferrals: 14 },
  { id: 6, firstName: 'Fatima', lastName: 'Abdullahi', email: 'fatima.abdullahi@company.com', department: 'Sales', position: 'Junior', location: 'Abuja', joinDate: '2024-07-14', isActive: true, pointsBalance: 7800, totalReferrals: 11, successfulReferrals: 9 },
  { id: 7, firstName: 'Ibrahim', lastName: 'Yusuf', email: 'ibrahim.yusuf@company.com', department: 'Sales', position: 'Senior', location: 'Abuja', joinDate: '2024-01-30', isActive: true, pointsBalance: 10500, totalReferrals: 15, successfulReferrals: 13 },
  { id: 8, firstName: 'Ngozi', lastName: 'Okonkwo', email: 'ngozi.okonkwo@company.com', department: 'Sales', position: 'Junior', location: 'Port Harcourt', joinDate: '2024-10-05', isActive: true, pointsBalance: 5400, totalReferrals: 7, successfulReferrals: 6 },
  { id: 9, firstName: 'Tunde', lastName: 'Olatunji', email: 'tunde.olatunji@company.com', department: 'Sales', position: 'Senior', location: 'Lagos', joinDate: '2023-07-18', isActive: true, pointsBalance: 13400, totalReferrals: 19, successfulReferrals: 16 },
  { id: 10, firstName: 'Amarachi', lastName: 'Ikenna', email: 'amarachi.ikenna@company.com', department: 'Sales', position: 'Junior', location: 'Lagos', joinDate: '2024-06-25', isActive: true, pointsBalance: 8100, totalReferrals: 10, successfulReferrals: 8 },
  { id: 11, firstName: 'Kunle', lastName: 'Adeyemi', email: 'kunle.adeyemi@company.com', department: 'Sales', position: 'Senior', location: 'Lagos', joinDate: '2023-12-08', isActive: true, pointsBalance: 9800, totalReferrals: 14, successfulReferrals: 12 },
  { id: 12, firstName: 'Zainab', lastName: 'Mohammed', email: 'zainab.mohammed@company.com', department: 'Sales', position: 'Junior', location: 'Abuja', joinDate: '2024-11-12', isActive: true, pointsBalance: 4200, totalReferrals: 5, successfulReferrals: 4 },
  { id: 13, firstName: 'Chinedu', lastName: 'Okoro', email: 'chinedu.okoro@company.com', department: 'Sales', position: 'Senior', location: 'Port Harcourt', joinDate: '2024-02-14', isActive: false, pointsBalance: 2100, totalReferrals: 3, successfulReferrals: 2 },
  { id: 14, firstName: 'Aisha', lastName: 'Bello', email: 'aisha.bello@company.com', department: 'Sales', position: 'Junior', location: 'Abuja', joinDate: '2024-05-20', isActive: true, pointsBalance: 7200, totalReferrals: 8, successfulReferrals: 7 },
  { id: 15, firstName: 'Segun', lastName: 'Bakare', email: 'segun.bakare@company.com', department: 'Sales', position: 'Manager', location: 'Lagos', joinDate: '2023-04-10', isActive: true, pointsBalance: 14700, totalReferrals: 20, successfulReferrals: 17 },
  { id: 16, firstName: 'Nneka', lastName: 'Chukwu', email: 'nneka.chukwu@company.com', department: 'Sales', position: 'Junior', location: 'Port Harcourt', joinDate: '2024-08-30', isActive: true, pointsBalance: 6300, totalReferrals: 8, successfulReferrals: 6 },
  { id: 17, firstName: 'Babatunde', lastName: 'Afolabi', email: 'babatunde.afolabi@company.com', department: 'Sales', position: 'Senior', location: 'Lagos', joinDate: '2023-09-05', isActive: true, pointsBalance: 11800, totalReferrals: 17, successfulReferrals: 14 },
  { id: 18, firstName: 'Hauwa', lastName: 'Aliyu', email: 'hauwa.aliyu@company.com', department: 'Sales', position: 'Junior', location: 'Abuja', joinDate: '2024-07-22', isActive: true, pointsBalance: 5900, totalReferrals: 7, successfulReferrals: 5 },
  { id: 19, firstName: 'Chijioke', lastName: 'Nnadi', email: 'chijioke.nnadi@company.com', department: 'Sales', position: 'Senior', location: 'Lagos', joinDate: '2024-03-18', isActive: false, pointsBalance: 1800, totalReferrals: 2, successfulReferrals: 1 },
  { id: 20, firstName: 'Folake', lastName: 'Odusanya', email: 'folake.odusanya@company.com', department: 'Sales', position: 'Junior', location: 'Lagos', joinDate: '2024-09-14', isActive: true, pointsBalance: 6800, totalReferrals: 9, successfulReferrals: 7 },
  { id: 21, firstName: 'Ahmed', lastName: 'Musa', email: 'ahmed.musa@company.com', department: 'Marketing', position: 'Manager', location: 'Lagos', joinDate: '2023-06-12', isActive: true, pointsBalance: 13900, totalReferrals: 18, successfulReferrals: 16 },
  { id: 22, firstName: 'Grace', lastName: 'Adekunle', email: 'grace.adekunle@company.com', department: 'Marketing', position: 'Senior', location: 'Lagos', joinDate: '2024-01-20', isActive: true, pointsBalance: 10200, totalReferrals: 13, successfulReferrals: 11 },
  { id: 23, firstName: 'Michael', lastName: 'Obi', email: 'michael.obi@company.com', department: 'Marketing', position: 'Junior', location: 'Abuja', joinDate: '2024-10-01', isActive: true, pointsBalance: 4800, totalReferrals: 6, successfulReferrals: 5 },
  { id: 24, firstName: 'Kemi', lastName: 'Fashola', email: 'kemi.fashola@company.com', department: 'Marketing', position: 'Senior', location: 'Lagos', joinDate: '2023-10-15', isActive: true, pointsBalance: 11500, totalReferrals: 15, successfulReferrals: 13 },
  { id: 25, firstName: 'Damilola', lastName: 'Taiwo', email: 'damilola.taiwo@company.com', department: 'Marketing', position: 'Junior', location: 'Lagos', joinDate: '2024-06-08', isActive: true, pointsBalance: 7500, totalReferrals: 10, successfulReferrals: 8 },
  { id: 26, firstName: 'Yusuf', lastName: 'Ibrahim', email: 'yusuf.ibrahim@company.com', department: 'Marketing', position: 'Senior', location: 'Abuja', joinDate: '2024-02-28', isActive: true, pointsBalance: 9400, totalReferrals: 12, successfulReferrals: 10 },
  { id: 27, firstName: 'Bukola', lastName: 'Ojo', email: 'bukola.ojo@company.com', department: 'Marketing', position: 'Junior', location: 'Port Harcourt', joinDate: '2024-11-20', isActive: true, pointsBalance: 3600, totalReferrals: 4, successfulReferrals: 3 },
  { id: 28, firstName: 'Oluwatobi', lastName: 'Martins', email: 'oluwatobi.martins@company.com', department: 'Marketing', position: 'Senior', location: 'Lagos', joinDate: '2023-08-14', isActive: true, pointsBalance: 12100, totalReferrals: 16, successfulReferrals: 14 },
  { id: 29, firstName: 'Sade', lastName: 'Williams', email: 'sade.williams@company.com', department: 'Marketing', position: 'Junior', location: 'Lagos', joinDate: '2024-05-12', isActive: false, pointsBalance: 2700, totalReferrals: 3, successfulReferrals: 2 },
  { id: 30, firstName: 'Bolaji', lastName: 'Adeleke', email: 'bolaji.adeleke@company.com', department: 'Marketing', position: 'Senior', location: 'Abuja', joinDate: '2024-04-05', isActive: true, pointsBalance: 8700, totalReferrals: 11, successfulReferrals: 9 },
  { id: 31, firstName: 'Ifeanyi', lastName: 'Uche', email: 'ifeanyi.uche@company.com', department: 'Marketing', position: 'Junior', location: 'Port Harcourt', joinDate: '2024-09-22', isActive: true, pointsBalance: 5100, totalReferrals: 6, successfulReferrals: 5 },
  { id: 32, firstName: 'Titilayo', lastName: 'Ogunleye', email: 'titilayo.ogunleye@company.com', department: 'Marketing', position: 'Senior', location: 'Lagos', joinDate: '2023-11-30', isActive: true, pointsBalance: 10800, totalReferrals: 14, successfulReferrals: 12 },
  { id: 33, firstName: 'Victor', lastName: 'Eze', email: 'victor.eze@company.com', department: 'IT', position: 'Manager', location: 'Lagos', joinDate: '2023-05-20', isActive: true, pointsBalance: 14200, totalReferrals: 19, successfulReferrals: 17 },
  { id: 34, firstName: 'Jennifer', lastName: 'Okeke', email: 'jennifer.okeke@company.com', department: 'IT', position: 'Senior', location: 'Lagos', joinDate: '2024-01-15', isActive: true, pointsBalance: 9900, totalReferrals: 13, successfulReferrals: 11 },
  { id: 35, firstName: 'Samuel', lastName: 'Adeyinka', email: 'samuel.adeyinka@company.com', department: 'IT', position: 'Junior', location: 'Abuja', joinDate: '2024-08-05', isActive: true, pointsBalance: 6100, totalReferrals: 8, successfulReferrals: 6 },
  { id: 36, firstName: 'Chiamaka', lastName: 'Nnamdi', email: 'chiamaka.nnamdi@company.com', department: 'IT', position: 'Senior', location: 'Lagos', joinDate: '2023-12-10', isActive: true, pointsBalance: 10600, totalReferrals: 14, successfulReferrals: 12 },
  { id: 37, firstName: 'Daniel', lastName: 'Okpara', email: 'daniel.okpara@company.com', department: 'IT', position: 'Junior', location: 'Abuja', joinDate: '2024-07-18', isActive: true, pointsBalance: 7100, totalReferrals: 9, successfulReferrals: 7 },
  { id: 38, firstName: 'Funmi', lastName: 'Lawal', email: 'funmi.lawal@company.com', department: 'IT', position: 'Senior', location: 'Port Harcourt', joinDate: '2024-03-25', isActive: false, pointsBalance: 3200, totalReferrals: 4, successfulReferrals: 3 },
  { id: 39, firstName: 'Abdullahi', lastName: 'Suleiman', email: 'abdullahi.suleiman@company.com', department: 'IT', position: 'Junior', location: 'Abuja', joinDate: '2024-10-12', isActive: true, pointsBalance: 4500, totalReferrals: 5, successfulReferrals: 4 },
  { id: 40, firstName: 'Rachael', lastName: 'Dike', email: 'rachael.dike@company.com', department: 'IT', position: 'Senior', location: 'Lagos', joinDate: '2023-09-08', isActive: true, pointsBalance: 11300, totalReferrals: 15, successfulReferrals: 13 },
  { id: 41, firstName: 'Precious', lastName: 'Oluwole', email: 'precious.oluwole@company.com', department: 'HR', position: 'Manager', location: 'Lagos', joinDate: '2023-04-15', isActive: true, pointsBalance: 13600, totalReferrals: 18, successfulReferrals: 16 },
  { id: 42, firstName: 'Godwin', lastName: 'Amadi', email: 'godwin.amadi@company.com', department: 'HR', position: 'Senior', location: 'Lagos', joinDate: '2024-02-20', isActive: true, pointsBalance: 9200, totalReferrals: 12, successfulReferrals: 10 },
  { id: 43, firstName: 'Mary', lastName: 'Ajayi', email: 'mary.ajayi@company.com', department: 'HR', position: 'Junior', location: 'Abuja', joinDate: '2024-06-30', isActive: true, pointsBalance: 6900, totalReferrals: 9, successfulReferrals: 7 },
  { id: 44, firstName: 'Gbenga', lastName: 'Olaniyan', email: 'gbenga.olaniyan@company.com', department: 'HR', position: 'Senior', location: 'Abuja', joinDate: '2023-10-25', isActive: false, pointsBalance: 2400, totalReferrals: 3, successfulReferrals: 2 },
  { id: 45, firstName: 'Esther', lastName: 'Nwachukwu', email: 'esther.nwachukwu@company.com', department: 'HR', position: 'Junior', location: 'Port Harcourt', joinDate: '2024-09-10', isActive: true, pointsBalance: 5600, totalReferrals: 7, successfulReferrals: 6 },
  { id: 46, firstName: 'Chukwuma', lastName: 'Obi', email: 'chukwuma.obi@company.com', department: 'Operations', position: 'Manager', location: 'Lagos', joinDate: '2023-07-05', isActive: true, pointsBalance: 14500, totalReferrals: 19, successfulReferrals: 17 },
  { id: 47, firstName: 'Olayinka', lastName: 'Balogun', email: 'olayinka.balogun@company.com', department: 'Operations', position: 'Senior', location: 'Lagos', joinDate: '2024-01-12', isActive: true, pointsBalance: 10400, totalReferrals: 14, successfulReferrals: 12 },
  { id: 48, firstName: 'Elizabeth', lastName: 'Ogundipe', email: 'elizabeth.ogundipe@company.com', department: 'Operations', position: 'Junior', location: 'Abuja', joinDate: '2024-08-15', isActive: true, pointsBalance: 6400, totalReferrals: 8, successfulReferrals: 7 },
  { id: 49, firstName: 'Ikechukwu', lastName: 'Anyanwu', email: 'ikechukwu.anyanwu@company.com', department: 'Operations', position: 'Senior', location: 'Port Harcourt', joinDate: '2023-11-18', isActive: false, pointsBalance: 1500, totalReferrals: 2, successfulReferrals: 1 },
  { id: 50, firstName: 'Amina', lastName: 'Bala', email: 'amina.bala@company.com', department: 'Operations', position: 'Junior', location: 'Abuja', joinDate: '2024-10-28', isActive: true, pointsBalance: 4100, totalReferrals: 5, successfulReferrals: 4 },
];

// Enrich users
rawUsers.forEach((user, index) => {
  user.classification = classifications[index % classifications.length];
  user.hourlyRate = hourlyRateByClassification[user.classification] || 22;
  user.connecteamUserId = `ct-${1000 + user.id}`;
  user.phone = generatePhone();
  user.referralCode = `REF${String.fromCharCode(65 + (index % 26))}${index.toString().padStart(2, '0')}`;
  user.password = 'password123';
  user.avatar = `https://i.pravatar.cc/150?img=${user.id}`;
  user.lastActiveDate = user.isActive
    ? getRandomDate(new Date('2026-01-01'), new Date('2026-02-09')).toISOString().split('T')[0]
    : getRandomDate(new Date('2025-06-01'), new Date('2025-10-01')).toISOString().split('T')[0];
  if (Math.random() > 0.3) {
    user.bankAccount = {
      bankName: bankNames[Math.floor(Math.random() * bankNames.length)],
      accountNumber: String(Math.floor(Math.random() * 9000000000) + 1000000000),
      accountName: `${user.firstName} ${user.lastName}`,
    };
  } else {
    user.bankAccount = null;
  }
});

export const staffUsers = rawUsers;

export const adminUsers = [
  { id: 'admin-1', name: 'Admin Super', email: 'admin@company.com', password: 'admin123', role: 'super_admin', permissions: ['all'], createdAt: '2023-01-01T00:00:00.000Z', lastLogin: '2026-01-15T08:30:00.000Z' },
  { id: 'admin-2', name: 'Manager User', email: 'manager@company.com', password: 'manager123', role: 'manager', permissions: ['view_users', 'view_referrals', 'approve_withdrawals', 'view_reports'], createdAt: '2023-02-15T00:00:00.000Z', lastLogin: '2026-01-14T14:20:00.000Z' },
  { id: 'admin-3', name: 'Analyst User', email: 'analyst@company.com', password: 'analyst123', role: 'analyst', permissions: ['view_users', 'view_referrals', 'view_reports'], createdAt: '2023-03-10T00:00:00.000Z', lastLogin: '2026-01-13T11:45:00.000Z' },
];

// Generate referrals
const generateReferrals = () => {
  const referrals = [];
  const statuses = ['pending', 'approved', 'completed', 'rejected'];
  const weights = [0.3, 0.25, 0.35, 0.1];
  let id = 1;
  staffUsers.forEach((user) => {
    for (let i = 0; i < user.totalReferrals; i++) {
      const r = Math.random();
      let cum = 0;
      let status = 'pending';
      for (let j = 0; j < weights.length; j++) { cum += weights[j]; if (r < cum) { status = statuses[j]; break; } }
      const created = getRandomDate(new Date(user.joinDate), new Date());
      referrals.push({
        id: id++, userId: user.id, referrerName: `${user.firstName} ${user.lastName}`, referrerCode: user.referralCode,
        refereeName: `Referee ${id}`, refereeEmail: `referee${id}@example.com`, refereePhone: generatePhone(),
        status, pointsAwarded: status === 'completed' ? 500 : 0, createdAt: created.toISOString(),
        updatedAt: status === 'pending' ? created.toISOString() : getRandomDate(created, new Date()).toISOString(),
        notes: status === 'rejected' ? 'Duplicate entry' : status === 'completed' ? 'Successfully onboarded' : '',
      });
    }
  });
  return referrals;
};
export const referrals = generateReferrals();

// Generate withdrawals
const generateWithdrawals = () => {
  const withdrawals = [];
  const statuses = ['pending', 'approved', 'processing', 'completed', 'rejected'];
  const weights = [0.21, 0.25, 0.12, 0.33, 0.09];
  let id = 1;
  const eligible = staffUsers.filter((u) => u.pointsBalance > 5000).slice(0, 40);
  eligible.forEach((user) => {
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      const r = Math.random(); let cum = 0; let status = 'pending';
      for (let j = 0; j < weights.length; j++) { cum += weights[j]; if (r < cum) { status = statuses[j]; break; } }
      const amount = Math.floor(Math.random() * 50000) + 10000;
      const created = getRandomDate(new Date(user.joinDate), new Date());
      withdrawals.push({
        id: id++, userId: user.id, userName: `${user.firstName} ${user.lastName}`, amount, points: amount * 10,
        status, bankName: ['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA'][Math.floor(Math.random() * 5)],
        accountNumber: Math.floor(Math.random() * 9000000000) + 1000000000,
        accountName: `${user.firstName} ${user.lastName}`, createdAt: created.toISOString(),
        processedAt: ['completed', 'rejected'].includes(status) ? getRandomDate(created, new Date()).toISOString() : null,
        processedBy: ['completed', 'rejected'].includes(status) ? adminUsers[Math.floor(Math.random() * adminUsers.length)].name : null,
        rejectionReason: status === 'rejected' ? 'Invalid account details' : null,
      });
    }
  });
  return withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};
export const withdrawals = generateWithdrawals();

// Audit logs
const generateAuditLogs = () => {
  const actions = ['User login', 'Referral approved', 'Withdrawal approved', 'Points adjusted', 'User deactivated', 'Settings updated', 'Rate changed'];
  return Array.from({ length: 215 }, (_, i) => {
    const admin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return {
      id: i + 1, adminId: admin.id, adminName: admin.name, action,
      target: action.includes('User') ? `User ${Math.floor(Math.random() * 50) + 1}` : 'System',
      description: `${admin.name} performed ${action}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      createdAt: getRandomDate(new Date('2024-01-01'), new Date()).toISOString(),
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};
export const auditLogs = generateAuditLogs();

export const systemSettings = {
  timezone: 'Australia/Sydney', currency: 'AUD', currencySymbol: '$', pointsPerUnit: 2,
  minimumWithdrawal: 100, maximumWithdrawal: 2500, maxWithdrawalPoints: 2500, referralHoursCap: 120,
  inactivityPeriods: { flagInactive: 3, deleteAccount: 6 },
  features: { referralSystem: true, withdrawalSystem: true, pointsSystem: true, notifications: true, professionBasedRates: true },
  retentionYears: 5,
};

export const connecteamSettings = {
  apiKey: '', organizationId: '', webhookUrl: '', syncFrequency: 'daily',
  lastSync: '2026-03-02T22:00:00.000Z', isConnected: false, autoSync: true,
  shiftMultipliers: { regular: 1.0, overtime: 1.5, weekend: 2.0, public_holiday: 2.5 },
};

const shiftTypes = ['regular', 'overtime', 'weekend', 'public_holiday'];
const multiplierMap = { regular: 1.0, overtime: 1.5, weekend: 2.0, public_holiday: 2.5 };

const generateImportedHours = () => {
  const records = [];
  const today = new Date('2026-03-03');
  const statuses = ['pending', 'pending', 'pending', 'approved', 'approved', 'approved', 'approved', 'approved', 'rejected', 'rejected'];
  staffUsers.slice(0, 20).forEach((user, i) => {
    const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
    const hours = parseFloat((Math.random() * 6 + 2).toFixed(2));
    const professionRate = professionRates.find((p) => p.classification === user.classification)?.cashPerPoint || 0.5;
    const multiplier = multiplierMap[shiftType];
    const pointsToAward = Math.round(hours * user.hourlyRate * professionRate * multiplier);
    const shiftDate = new Date(today); shiftDate.setDate(shiftDate.getDate() - i);
    const status = statuses[i % statuses.length];
    records.push({
      id: `IH-${1001 + i}`, userId: user.id, userName: `${user.firstName} ${user.lastName}`,
      classification: user.classification, connecteamUserId: user.connecteamUserId,
      shiftDate: shiftDate.toISOString().split('T')[0], clockIn: '07:00',
      clockOut: `${7 + Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`,
      hoursWorked: hours, shiftType, multiplier, hourlyRate: user.hourlyRate, professionRate,
      pointsToAward, status, approvedBy: status === 'approved' ? 'admin-1' : status === 'rejected' ? 'admin-2' : null,
      approvedAt: status !== 'pending' ? new Date(shiftDate.getTime() + 86400000).toISOString() : null,
      rejectionReason: status === 'rejected' ? 'Shift not verified in rostering system' : null,
      connecteamShiftId: `cs-${5000 + i}`, importedAt: new Date(today.getTime() - i * 3600000).toISOString(),
    });
  });
  return records;
};
export const importedHours = generateImportedHours();

export const connecteamSyncLogs = (() => {
  const logs = [];
  const base = new Date('2026-03-03T22:00:00.000Z');
  for (let i = 0; i < 15; i++) {
    const syncDate = new Date(base.getTime() - i * 86400000);
    const success = i !== 4 && i !== 10;
    const fetched = success ? Math.floor(Math.random() * 25) + 5 : 0;
    const failed = success ? (Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0) : 0;
    logs.push({
      id: `SL-${100 + i}`, syncedAt: syncDate.toISOString(), status: success ? 'success' : 'failed',
      recordsFetched: fetched, recordsImported: fetched - failed, recordsFailed: failed,
      duration: success ? `${Math.floor(Math.random() * 8) + 2}s` : '0s',
      triggeredBy: i % 3 === 0 ? 'manual' : 'scheduled',
      errorMessage: success ? null : 'Connection timeout: Unable to reach Connecteam API',
      adminId: i % 3 === 0 ? 'admin-1' : null,
    });
  }
  return logs;
})();

export const referralPrograms = [
  { id: 1, name: 'Standard Referral', description: 'Base referral reward for all staff', pointsPerReferral: 500, bonusPoints: 0, isActive: true, startDate: '2024-01-01', endDate: null, minHoursRequired: 40, createdAt: '2024-01-01T00:00:00.000Z', createdBy: 'admin-1', participantCount: 50 },
  { id: 2, name: 'Nurse Bonus Campaign', description: 'Extra bonus for referring Registered Nurses', pointsPerReferral: 800, bonusPoints: 200, isActive: true, startDate: '2026-01-01', endDate: '2026-06-30', minHoursRequired: 80, createdAt: '2025-12-15T00:00:00.000Z', createdBy: 'admin-1', participantCount: 22 },
  { id: 3, name: 'Q1 Incentive', description: 'Quarterly referral boost for all classifications', pointsPerReferral: 600, bonusPoints: 100, isActive: false, startDate: '2025-01-01', endDate: '2025-03-31', minHoursRequired: 40, createdAt: '2024-12-20T00:00:00.000Z', createdBy: 'admin-2', participantCount: 38 },
];

export const adminNotifications = [
  { id: 1, type: 'withdrawal', priority: 'high', title: 'Withdrawal Pending Approval', message: 'Adewale Johnson has requested a withdrawal of 2000 points', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, type: 'referral', priority: 'medium', title: 'New Referral Submitted', message: 'Chioma Okafor submitted a new referral', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, type: 'system', priority: 'low', title: 'Connecteam Sync Completed', message: '18 hours records imported successfully', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, type: 'points', priority: 'medium', title: 'Points Adjustment', message: 'Points manually adjusted for user Oluwaseun Adebayo', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export const staffNotifications = staffUsers.slice(0, 10).flatMap((user, i) => [
  { id: i * 2 + 1, userId: user.id, type: 'points', title: 'Points Earned', message: `You earned ${user.hourlyRate * 10} points for recent shifts`, isRead: i > 3, createdAt: new Date(Date.now() - i * 86400000).toISOString() },
  { id: i * 2 + 2, userId: user.id, type: 'referral', title: 'Referral Update', message: 'Your referral has been approved', isRead: i > 5, createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString() },
]);

export const pointTransactions = staffUsers.flatMap((user) =>
  Array.from({ length: Math.min(user.totalReferrals, 5) }, (_, i) => ({
    id: `PT-${user.id}-${i + 1}`,
    userId: user.id,
    type: i % 3 === 0 ? 'withdrawal' : i % 3 === 1 ? 'referral' : 'hours',
    points: i % 3 === 0 ? -(Math.floor(Math.random() * 500) + 100) : Math.floor(Math.random() * 300) + 50,
    description: i % 3 === 0 ? 'Points withdrawn' : i % 3 === 1 ? 'Referral bonus awarded' : 'Hours worked reward',
    status: i % 3 === 0 ? 'completed' : 'completed',
    createdAt: new Date(Date.now() - i * 7 * 86400000).toISOString(),
  }))
);

export const reports = [
  { id: 1, name: 'Monthly Referral Summary', type: 'referral', schedule: 'monthly', lastRun: '2026-03-01T00:00:00.000Z', nextRun: '2026-04-01T00:00:00.000Z', status: 'active', createdBy: 'admin-1', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 2, name: 'Weekly Withdrawal Report', type: 'withdrawal', schedule: 'weekly', lastRun: '2026-03-10T00:00:00.000Z', nextRun: '2026-03-17T00:00:00.000Z', status: 'active', createdBy: 'admin-2', createdAt: '2025-03-01T00:00:00.000Z' },
  { id: 3, name: 'Points Audit Q1', type: 'points', schedule: 'quarterly', lastRun: '2026-01-01T00:00:00.000Z', nextRun: '2026-04-01T00:00:00.000Z', status: 'active', createdBy: 'admin-1', createdAt: '2025-06-01T00:00:00.000Z' },
];
