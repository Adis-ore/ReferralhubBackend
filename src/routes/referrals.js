import { Router } from 'express';
import { referrals, staffUsers, auditLogs, connecteamSettings } from '../data/seed.js';
import { generateRandomPassword, generateReferralCode } from '../utils/passwordGenerator.js';
import { createConnecteamUser } from '../services/connecteamApi.js';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a recursive referral tree for a given userId.
 * depth controls how many levels deep to go (default 5).
 */
function buildTree(userId, depth = 5) {
  if (depth === 0) return [];
  const directRefs = referrals.filter((r) => r.userId === userId);
  return directRefs.map((ref) => {
    const referee = staffUsers.find((u) => u.id === ref.refereeId);
    const hoursWorked = referee
      ? (referee.approvedHours ?? 0)
      : 0;
    return {
      referralId: ref.id,
      id: ref.refereeId,
      name: ref.refereeName,
      email: referee?.email ?? '',
      classification: referee?.classification ?? '',
      status: ref.status,
      hoursWorked,
      pointsEarned: ref.pointsAwarded ?? 0,
      referredAt: ref.createdAt,
      subReferrals: buildTree(ref.refereeId, depth - 1),
    };
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/referrals
router.get('/', (req, res) => {
  const { search, status, userId, page = 1, limit = 20 } = req.query;
  let data = [...referrals];

  if (search) {
    const q = search.toLowerCase();
    data = data.filter(
      (r) =>
        r.referrerName?.toLowerCase().includes(q) ||
        r.refereeName?.toLowerCase().includes(q)
    );
  }
  if (status && status !== 'all') data = data.filter((r) => r.status === status);
  if (userId) data = data.filter((r) => r.userId === parseInt(userId));

  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({
    data: data.slice(offset, offset + parseInt(limit)),
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// GET /api/referrals/search-referrers?q=... — search staff to use as referrers
router.get('/search-referrers', (req, res) => {
  const q = (req.query.q ?? '').toLowerCase();
  const code = (req.query.code ?? '').toUpperCase();

  let results = staffUsers.filter((u) => u.isActive);

  if (code) {
    // Exact match by referral code
    results = results.filter((u) => u.referralCode === code);
  } else if (q) {
    results = results.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }

  res.json(
    results.slice(0, 10).map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      classification: u.classification,
      referralCode: u.referralCode,
    }))
  );
});

// GET /api/referrals/tree/:userId — multi-level referral tree
router.get('/tree/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = staffUsers.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const directReferrals = buildTree(userId);
  const countAllNodes = (nodes) =>
    nodes.reduce((acc, n) => acc + 1 + countAllNodes(n.subReferrals), 0);
  const maxDepth = (nodes, d = 1) =>
    nodes.length === 0
      ? d - 1
      : Math.max(...nodes.map((n) => maxDepth(n.subReferrals, d + 1)));

  res.json({
    userId,
    userName: `${user.firstName} ${user.lastName}`,
    referralCode: user.referralCode,
    directReferrals,
    totalReferrals: countAllNodes(directReferrals),
    levels: directReferrals.length === 0 ? 0 : maxDepth(directReferrals),
  });
});

// POST /api/referrals/register-referee — register a new staff member via referral
router.post('/register-referee', async (req, res) => {
  const { refereeName, refereeEmail, refereePhone, classification, referrerCode, referrerId } = req.body;

  // Validate required fields
  if (!refereeName || !refereeEmail || !refereePhone || !classification) {
    return res.status(400).json({ error: 'refereeName, refereeEmail, refereePhone and classification are required' });
  }

  // Check duplicate email
  const emailExists = staffUsers.find((u) => u.email.toLowerCase() === refereeEmail.toLowerCase());
  if (emailExists) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  // Find referrer
  let referrer = null;
  if (referrerId) {
    referrer = staffUsers.find((u) => u.id === parseInt(referrerId));
  } else if (referrerCode) {
    referrer = staffUsers.find((u) => u.referralCode === referrerCode.toUpperCase());
  }

  // Generate credentials
  const password = generateRandomPassword(10);
  let referralCode = generateReferralCode();
  // Ensure uniqueness
  while (staffUsers.find((u) => u.referralCode === referralCode)) {
    referralCode = generateReferralCode();
  }

  // Hourly rates per classification
  const hourlyRateMap = {
    'Security Officer': 30,
    'Security Coordinator': 33,
    'Patrol Officer': 28,
    'Staff': 25,
    'Registered Nurse': 35,
    'Care Worker': 25,
    'Support Worker': 22,
    'Admin Staff': 20,
    'Driver': 23,
  };

  const newId = Math.max(...staffUsers.map((u) => u.id), 54) + 1;
  const nameParts = refereeName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const newUser = {
    id: newId,
    firstName,
    lastName,
    email: refereeEmail.toLowerCase().trim(),
    password,
    phone: refereePhone,
    classification,
    department: 'General',
    position: classification,
    location: '',
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true,
    pointsBalance: 0,
    totalReferrals: 0,
    successfulReferrals: 0,
    approvedHours: 0,
    hourlyRate: hourlyRateMap[classification] ?? 25,
    referralCode,
    referredBy: referrer?.id ?? null,
    connecteamUserId: null,
    avatar: `https://i.pravatar.cc/150?img=${newId}`,
    lastActiveDate: new Date().toISOString().split('T')[0],
    bankAccount: null,
  };

  // Create Connecteam account (mocked until API supports user creation)
  let connecteamResult = { success: false, connecteamUserId: null, message: 'No API key configured' };
  if (connecteamSettings.apiKey) {
    try {
      connecteamResult = await createConnecteamUser(connecteamSettings.apiKey, {
        firstName, lastName, email: refereeEmail, phone: refereePhone, role: classification,
      });
      if (connecteamResult.connecteamUserId) {
        newUser.connecteamUserId = connecteamResult.connecteamUserId;
      }
    } catch (err) {
      connecteamResult = { success: false, message: err.message };
    }
  }

  // Save user
  staffUsers.push(newUser);

  // Create referral record
  let referralRecord = null;
  if (referrer) {
    const referralId = referrals.length > 0 ? Math.max(...referrals.map((r) => r.id)) + 1 : 1;
    referralRecord = {
      id: referralId,
      userId: referrer.id,
      refereeId: newId,
      referrerName: `${referrer.firstName} ${referrer.lastName}`,
      referrerCode: referrer.referralCode,
      refereeName,
      refereeEmail: refereeEmail.toLowerCase(),
      refereePhone,
      status: 'invited',
      pointsAwarded: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Registered by admin via referral form',
    };
    referrals.push(referralRecord);
    referrer.totalReferrals = (referrer.totalReferrals ?? 0) + 1;
  }

  // Audit log
  auditLogs.unshift({
    id: auditLogs.length + 1,
    adminId: req.body.adminId ?? 'admin-1',
    adminName: req.body.adminName ?? 'Admin',
    action: 'Referee Registered',
    target: `User ${newId} — ${refereeName}`,
    description: `Registered ${refereeName} (${refereeEmail}) as a referee${referrer ? ` under ${referrer.firstName} ${referrer.lastName}` : ''}`,
    ipAddress: req.ip,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    credentials: { email: newUser.email, password, referralCode },
    referral: referralRecord,
    connecteam: connecteamResult,
    message: `${refereeName} registered successfully.${connecteamResult.success ? ' Connecteam account created.' : ' Note: ' + connecteamResult.message}`,
  });
});

// GET /api/referrals/:id
router.get('/:id', (req, res) => {
  const ref = referrals.find((r) => r.id === parseInt(req.params.id));
  if (!ref) return res.status(404).json({ error: 'Referral not found' });
  res.json(ref);
});

// PATCH /api/referrals/:id - update status
router.patch('/:id', (req, res) => {
  const index = referrals.findIndex((r) => r.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Referral not found' });
  const { status, notes } = req.body;
  if (status) referrals[index].status = status;
  if (notes !== undefined) referrals[index].notes = notes;
  referrals[index].updatedAt = new Date().toISOString();
  res.json(referrals[index]);
});

export default router;
