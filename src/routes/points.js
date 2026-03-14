import { Router } from 'express';
import { professionRates, systemSettings } from '../data/seed.js';

const router = Router();

// GET /api/points/profession-rates
router.get('/profession-rates', (req, res) => {
  res.json(professionRates);
});

// PUT /api/points/profession-rates/:id
router.put('/profession-rates/:id', (req, res) => {
  const index = professionRates.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Rate not found' });
  const { cashPerPoint, pointsPerUnit, isActive } = req.body;
  if (cashPerPoint !== undefined) professionRates[index].cashPerPoint = parseFloat(cashPerPoint);
  if (pointsPerUnit !== undefined) professionRates[index].pointsPerUnit = parseInt(pointsPerUnit);
  if (isActive !== undefined) professionRates[index].isActive = Boolean(isActive);
  res.json(professionRates[index]);
});

// GET /api/points/settings
router.get('/settings', (req, res) => {
  res.json({
    pointsPerUnit: systemSettings.pointsPerUnit,
    minimumWithdrawal: systemSettings.minimumWithdrawal,
    maximumWithdrawal: systemSettings.maximumWithdrawal,
    currency: systemSettings.currency,
    currencySymbol: systemSettings.currencySymbol,
  });
});

export default router;
