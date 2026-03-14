import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { adminUsers, staffUsers } from '../data/seed.js';

const router = Router();

// POST /api/auth/admin/login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const admin = adminUsers.find((a) => a.email === email && a.password === password);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '24h' }
  );

  const { password: _, ...adminData } = admin;
  res.json({ token, user: adminData });
});

// POST /api/auth/staff/login
router.post('/staff/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const staff = staffUsers.find((u) => u.email === email && u.password === password);
  if (!staff) return res.status(401).json({ error: 'Invalid credentials' });
  if (!staff.isActive) return res.status(403).json({ error: 'Account is inactive' });

  const token = jwt.sign(
    { id: staff.id, name: `${staff.firstName} ${staff.lastName}`, email: staff.email, role: 'staff' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '24h' }
  );

  const { password: _, ...staffData } = staff;
  res.json({ token, user: staffData });
});

export default router;
