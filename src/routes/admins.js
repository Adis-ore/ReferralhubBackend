import { Router } from 'express';
import { adminUsers } from '../data/seed.js';
const router = Router();

router.get('/', (req, res) => {
  res.json(adminUsers.map(({ password, ...a }) => a));
});

router.post('/', (req, res) => {
  const admin = { id: `admin-${Date.now()}`, ...req.body, createdAt: new Date().toISOString(), lastLogin: null };
  adminUsers.push(admin);
  const { password, ...adminData } = admin;
  res.status(201).json(adminData);
});

router.patch('/:id', (req, res) => {
  const index = adminUsers.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Admin not found' });
  const allowed = ['name', 'email', 'role', 'permissions', 'isActive'];
  for (const key of allowed) { if (key in req.body) adminUsers[index][key] = req.body[key]; }
  const { password, ...adminData } = adminUsers[index];
  res.json(adminData);
});

router.delete('/:id', (req, res) => {
  const index = adminUsers.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Admin not found' });
  adminUsers.splice(index, 1);
  res.json({ success: true });
});

export default router;
