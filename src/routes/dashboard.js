import { Router } from 'express';
import { staffUsers, referrals, withdrawals, importedHours } from '../data/seed.js';
const router = Router();

router.get('/stats', (req, res) => {
  const totalUsers = staffUsers.filter(u => u.isActive).length;
  const totalReferrals = referrals.length;
  const totalPoints = staffUsers.reduce((s, u) => s + u.pointsBalance, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
  const hoursImportedToday = importedHours.filter(h => h.importedAt?.startsWith(new Date().toISOString().split('T')[0])).length;
  const pendingHours = importedHours.filter(h => h.status === 'pending').length;
  res.json({ totalUsers, totalReferrals, totalPoints, pendingWithdrawals, hoursImportedToday, pendingHours });
});

export default router;
