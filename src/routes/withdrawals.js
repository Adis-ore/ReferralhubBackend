import { Router } from 'express';
import { withdrawals } from '../data/seed.js';

const router = Router();

// GET /api/withdrawals
router.get('/', (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  let data = [...withdrawals];

  if (search) {
    const q = search.toLowerCase();
    data = data.filter((w) => w.userName?.toLowerCase().includes(q) || String(w.id).includes(q));
  }
  if (status && status !== 'all') data = data.filter((w) => w.status === status);

  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: data.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

// GET /api/withdrawals/:id
router.get('/:id', (req, res) => {
  const w = withdrawals.find((w) => w.id === parseInt(req.params.id));
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
  res.json(w);
});

// PATCH /api/withdrawals/:id - approve/reject/process
router.patch('/:id', (req, res) => {
  const index = withdrawals.findIndex((w) => w.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Withdrawal not found' });
  const { status, rejectionReason, processedBy } = req.body;
  if (status) withdrawals[index].status = status;
  if (rejectionReason !== undefined) withdrawals[index].rejectionReason = rejectionReason;
  if (processedBy) withdrawals[index].processedBy = processedBy;
  if (['completed', 'rejected'].includes(status)) withdrawals[index].processedAt = new Date().toISOString();
  res.json(withdrawals[index]);
});

export default router;
