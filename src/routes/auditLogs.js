import { Router } from 'express';
import { auditLogs } from '../data/seed.js';

const router = Router();

// GET /api/audit-logs
router.get('/', (req, res) => {
  const { search, adminId, action, page = 1, limit = 20 } = req.query;
  let data = [...auditLogs];

  if (search) {
    const q = search.toLowerCase();
    data = data.filter((l) => l.action?.toLowerCase().includes(q) || l.adminName?.toLowerCase().includes(q) || l.target?.toLowerCase().includes(q));
  }
  if (adminId) data = data.filter((l) => l.adminId === adminId);
  if (action) data = data.filter((l) => l.action?.toLowerCase().includes(action.toLowerCase()));

  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: data.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export default router;
