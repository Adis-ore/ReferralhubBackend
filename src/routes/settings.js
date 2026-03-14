import { Router } from 'express';
import { systemSettings } from '../data/seed.js';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
  res.json(systemSettings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  const allowed = ['timezone', 'currency', 'currencySymbol', 'pointsPerUnit', 'minimumWithdrawal', 'maximumWithdrawal', 'referralHoursCap', 'retentionYears', 'features', 'inactivityPeriods'];
  for (const key of allowed) {
    if (key in req.body) systemSettings[key] = req.body[key];
  }
  res.json(systemSettings);
});

export default router;
