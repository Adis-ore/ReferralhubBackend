import { Router } from 'express';
import { adminNotifications, staffNotifications } from '../data/seed.js';
const router = Router();

// Admin notifications
router.get('/admin', (req, res) => {
  res.json(adminNotifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.patch('/admin/:id/read', (req, res) => {
  const n = adminNotifications.find(n => n.id === parseInt(req.params.id));
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.isRead = true;
  res.json(n);
});

router.delete('/admin/:id', (req, res) => {
  const index = adminNotifications.findIndex(n => n.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  adminNotifications.splice(index, 1);
  res.json({ success: true });
});

// Staff notifications
router.get('/staff/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = staffNotifications.filter(n => n.userId === userId)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(data);
});

router.patch('/staff/:id/read', (req, res) => {
  const n = staffNotifications.find(n => n.id === parseInt(req.params.id));
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.isRead = true;
  res.json(n);
});

export default router;
