import { Router } from 'express';
import { staffUsers, referrals } from '../data/seed.js';

const router = Router();

// GET /api/users - list all staff users (with search/filter/pagination)
router.get('/', (req, res) => {
  const { search, department, status, page = 1, limit = 20 } = req.query;
  let users = [...staffUsers];

  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.referralCode?.toLowerCase().includes(q)
    );
  }
  if (department && department !== 'all') users = users.filter((u) => u.department === department);
  if (status === 'active') users = users.filter((u) => u.isActive);
  if (status === 'inactive') users = users.filter((u) => !u.isActive);

  const total = users.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const data = users.slice(offset, offset + parseInt(limit)).map(({ password, ...u }) => u);

  res.json({ data, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

// GET /api/users/:id - get single user
router.get('/:id', (req, res) => {
  const user = staffUsers.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userData } = user;
  const userReferrals = referrals.filter((r) => r.userId === user.id);
  res.json({ ...userData, referrals: userReferrals });
});

// PATCH /api/users/:id - update user (activate/deactivate, adjust points, etc.)
router.patch('/:id', (req, res) => {
  const userIndex = staffUsers.findIndex((u) => u.id === parseInt(req.params.id));
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  const allowed = ['isActive', 'pointsBalance', 'hourlyRate', 'bankAccount', 'department', 'position', 'location'];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }
  Object.assign(staffUsers[userIndex], updates);
  const { password, ...userData } = staffUsers[userIndex];
  res.json(userData);
});

// POST /api/users/:id/adjust-points
router.post('/:id/adjust-points', (req, res) => {
  const { type, amount, reason } = req.body;
  const userIndex = staffUsers.findIndex((u) => u.id === parseInt(req.params.id));
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  if (!['add', 'deduct'].includes(type)) return res.status(400).json({ error: 'type must be add or deduct' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
  if (!reason) return res.status(400).json({ error: 'reason is required' });

  const user = staffUsers[userIndex];
  if (type === 'deduct' && amount > user.pointsBalance) {
    return res.status(400).json({ error: 'Cannot deduct more than available points' });
  }
  user.pointsBalance = type === 'add' ? user.pointsBalance + amount : user.pointsBalance - amount;
  res.json({ userId: user.id, newBalance: user.pointsBalance, adjustment: type === 'add' ? amount : -amount, reason });
});

export default router;
