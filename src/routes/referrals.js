import { Router } from 'express';
import { referrals } from '../data/seed.js';

const router = Router();

// GET /api/referrals
router.get('/', (req, res) => {
  const { search, status, userId, page = 1, limit = 20 } = req.query;
  let data = [...referrals];

  if (search) {
    const q = search.toLowerCase();
    data = data.filter((r) => r.referrerName?.toLowerCase().includes(q) || r.refereeName?.toLowerCase().includes(q));
  }
  if (status && status !== 'all') data = data.filter((r) => r.status === status);
  if (userId) data = data.filter((r) => r.userId === parseInt(userId));

  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: data.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
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
