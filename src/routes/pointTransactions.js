import { Router } from 'express';
import { pointTransactions } from '../data/seed.js';
const router = Router();

router.get('/', (req, res) => {
  const { userId, type, page = 1, limit = 20 } = req.query;
  let data = [...pointTransactions];
  if (userId) data = data.filter(t => t.userId === parseInt(userId));
  if (type && type !== 'all') data = data.filter(t => t.type === type);
  data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: data.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export default router;
