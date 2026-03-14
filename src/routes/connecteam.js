import { Router } from 'express';
import { importedHours, connecteamSyncLogs, connecteamSettings, staffUsers } from '../data/seed.js';

const router = Router();

// GET /api/connecteam/settings
router.get('/settings', (req, res) => {
  res.json(connecteamSettings);
});

// PUT /api/connecteam/settings
router.put('/settings', (req, res) => {
  const allowed = ['apiKey', 'organizationId', 'webhookUrl', 'syncFrequency', 'autoSync', 'shiftMultipliers'];
  for (const key of allowed) {
    if (key in req.body) connecteamSettings[key] = req.body[key];
  }
  res.json(connecteamSettings);
});

// POST /api/connecteam/test-connection
router.post('/test-connection', async (req, res) => {
  const { apiKey, organizationId } = req.body;
  if (!apiKey || !organizationId) {
    return res.status(400).json({ success: false, message: 'API key and Organization ID are required' });
  }
  // Mock test - replace with real Connecteam API call when key is available
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (apiKey.length < 10 || apiKey === 'YOUR_API_KEY') {
    return res.json({ success: false, message: 'Invalid API key. Check your Connecteam credentials.' });
  }
  connecteamSettings.isConnected = true;
  res.json({ success: true, message: 'Connected successfully to Connecteam' });
});

// GET /api/connecteam/hours - list imported hours
router.get('/hours', (req, res) => {
  const { status, userId, shiftType, page = 1, limit = 20 } = req.query;
  let data = [...importedHours];

  if (status && status !== 'all') data = data.filter((h) => h.status === status);
  if (userId) data = data.filter((h) => h.userId === parseInt(userId));
  if (shiftType && shiftType !== 'all') data = data.filter((h) => h.shiftType === shiftType);

  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: data.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

// PATCH /api/connecteam/hours/:id - approve or reject
router.patch('/hours/:id', (req, res) => {
  const index = importedHours.findIndex((h) => h.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Hours record not found' });

  const { status, rejectionReason, approvedBy } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  importedHours[index].status = status;
  importedHours[index].approvedAt = new Date().toISOString();
  importedHours[index].approvedBy = approvedBy || 'admin';
  if (status === 'rejected' && rejectionReason) importedHours[index].rejectionReason = rejectionReason;

  // If approved: award points to the staff user
  if (status === 'approved') {
    const userIndex = staffUsers.findIndex((u) => u.id === importedHours[index].userId);
    if (userIndex !== -1) {
      staffUsers[userIndex].pointsBalance += importedHours[index].pointsToAward;
    }
  }

  res.json(importedHours[index]);
});

// POST /api/connecteam/hours/bulk-approve - bulk approve
router.post('/hours/bulk-approve', (req, res) => {
  const { ids, approvedBy } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });

  const updated = [];
  ids.forEach((id) => {
    const index = importedHours.findIndex((h) => h.id === id);
    if (index !== -1 && importedHours[index].status === 'pending') {
      importedHours[index].status = 'approved';
      importedHours[index].approvedAt = new Date().toISOString();
      importedHours[index].approvedBy = approvedBy || 'admin';
      const userIndex = staffUsers.findIndex((u) => u.id === importedHours[index].userId);
      if (userIndex !== -1) staffUsers[userIndex].pointsBalance += importedHours[index].pointsToAward;
      updated.push(importedHours[index]);
    }
  });

  res.json({ updated: updated.length, records: updated });
});

// POST /api/connecteam/sync - trigger a manual sync
router.post('/sync', async (req, res) => {
  // Simulate sync
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const log = {
    id: `SL-${Date.now()}`,
    syncedAt: new Date().toISOString(),
    status: 'success',
    recordsFetched: 0,
    recordsImported: 0,
    recordsFailed: 0,
    duration: '2s',
    triggeredBy: 'manual',
    errorMessage: null,
    adminId: req.body.adminId || 'admin-1',
  };
  connecteamSyncLogs.unshift(log);
  connecteamSettings.lastSync = log.syncedAt;
  res.json({ success: true, log, message: 'Sync completed. 0 new records (demo mode - no API key configured).' });
});

// GET /api/connecteam/logs
router.get('/logs', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = connecteamSyncLogs.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: connecteamSyncLogs.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export default router;
