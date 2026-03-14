import { Router } from 'express';
import { referralPrograms } from '../data/seed.js';
const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let data = [...referralPrograms];
  if (status === 'active') data = data.filter(p => p.isActive);
  if (status === 'inactive') data = data.filter(p => !p.isActive);
  res.json(data);
});

router.post('/', (req, res) => {
  const program = { id: Date.now(), ...req.body, createdAt: new Date().toISOString(), participantCount: 0 };
  referralPrograms.push(program);
  res.status(201).json(program);
});

router.patch('/:id', (req, res) => {
  const index = referralPrograms.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Program not found' });
  Object.assign(referralPrograms[index], req.body);
  res.json(referralPrograms[index]);
});

router.delete('/:id', (req, res) => {
  const index = referralPrograms.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Program not found' });
  referralPrograms.splice(index, 1);
  res.json({ success: true });
});

export default router;
