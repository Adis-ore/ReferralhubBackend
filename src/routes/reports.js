import { Router } from 'express';
import { reports } from '../data/seed.js';
const router = Router();

router.get('/', (req, res) => res.json(reports));

router.post('/', (req, res) => {
  const report = { id: Date.now(), ...req.body, createdAt: new Date().toISOString(), lastRun: null, nextRun: null, status: 'active' };
  reports.push(report);
  res.status(201).json(report);
});

router.patch('/:id', (req, res) => {
  const index = reports.findIndex(r => r.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  Object.assign(reports[index], req.body);
  res.json(reports[index]);
});

router.delete('/:id', (req, res) => {
  const index = reports.findIndex(r => r.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  reports.splice(index, 1);
  res.json({ success: true });
});

export default router;
