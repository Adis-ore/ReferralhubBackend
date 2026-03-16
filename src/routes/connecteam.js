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
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'API key is required' });
  }
  try {
    // Verify by listing time clocks — lightweight call
    const result = await connecteamFetch('/time-clock/v1/time-clocks', apiKey);
    connecteamSettings.isConnected = true;
    const clockCount = result?.data?.timeClocks?.length || result?.data?.length || 0;
    res.json({ success: true, message: `Connected to Connecteam successfully. Found ${clockCount} time clock(s).`, data: result });
  } catch (err) {
    connecteamSettings.isConnected = false;
    res.json({ success: false, message: `Connection failed: ${err.message}` });
  }
});

// GET /api/connecteam/users — fetch your Connecteam members
router.get('/users', async (req, res) => {
  const apiKey = connecteamSettings.apiKey;
  if (!apiKey) return res.status(400).json({ error: 'No API key configured' });
  try {
    const result = await connecteamFetch('/users/v1/users', apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// ─── Connecteam API helpers ────────────────────────────────────────────────────
const CONNECTEAM_BASE = 'https://api.connecteam.com';

async function connecteamFetch(path, apiKey) {
  const response = await fetch(`${CONNECTEAM_BASE}${path}`, {
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Connecteam ${path} → ${response.status}: ${text}`);
  }
  return response.json();
}

// Determine the day-of-week shift type from a date string
function shiftTypeFromDate(dateStr) {
  const day = new Date(dateStr).getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return 'weekend';
  return 'regular';
}

// ─── Core sync function (shared by /sync, /sync-now and the cron job) ─────────
export async function performSync({ triggeredBy = 'manual', adminId = null } = {}) {
  const syncStart = Date.now();
  const { professionRates } = await import('../data/seed.js');
  const multiplierMap = connecteamSettings.shiftMultipliers || { regular: 1.0, overtime: 1.5, weekend: 2.0, public_holiday: 2.5 };
  const apiKey = connecteamSettings.apiKey;
  const hasApiKey = apiKey && apiKey.length >= 10;

  let recordsFetched = 0, recordsImported = 0, recordsFailed = 0;
  let errorMessage = null;

  if (hasApiKey) {
    try {
      const clocksRes = await connecteamFetch('/time-clock/v1/time-clocks', apiKey);
      const timeClocks = clocksRes?.data?.timeClocks || clocksRes?.data || [];

      if (timeClocks.length === 0) {
        // No time clocks set up — simulate for real staff only
        errorMessage = 'API key valid but no time clocks found. Simulating shifts for real staff.';
        const shiftTypes = ['regular', 'overtime', 'weekend', 'public_holiday'];
        const today = new Date();
        const realStaff = staffUsers.filter(u => u.connecteamUserId && typeof u.connecteamUserId === 'number' && u.isActive);
        realStaff.forEach((user) => {
          const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
          const hours = parseFloat((Math.random() * 6 + 2).toFixed(2));
          const professionRate = professionRates.find(p => p.classification === user.classification)?.cashPerPoint || 0.5;
          const multiplier = multiplierMap[shiftType] || 1.0;
          const pointsToAward = Math.round(hours * user.hourlyRate * professionRate * multiplier);
          const shiftDate = new Date(today);
          shiftDate.setDate(shiftDate.getDate() - Math.floor(Math.random() * 3));
          const dateStr = shiftDate.toISOString().split('T')[0];
          if (!importedHours.find(h => h.userId === user.id && h.shiftDate === dateStr)) {
            importedHours.unshift({
              id: `IH-REAL-${Date.now()}-${user.id}`,
              userId: user.id, userName: `${user.firstName} ${user.lastName}`,
              classification: user.classification, connecteamUserId: user.connecteamUserId,
              shiftDate: dateStr,
              clockIn: '07:00', clockOut: `${7 + Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`,
              hoursWorked: hours, shiftType, multiplier, hourlyRate: user.hourlyRate,
              professionRate, pointsToAward, status: 'pending',
              approvedBy: null, approvedAt: null, rejectionReason: null,
              connecteamShiftId: `real-sim-${Date.now()}-${user.id}`,
              importedAt: new Date().toISOString(),
            });
            recordsImported++;
          }
          recordsFetched++;
        });
        connecteamSettings.isConnected = true;
      } else {
        for (const clock of timeClocks) {
          const activitiesRes = await connecteamFetch(
            `/time-clock/v1/time-clocks/${clock.id}/time-activities?limit=100`,
            apiKey
          );
          const activities = activitiesRes?.data?.timeActivities || activitiesRes?.data || [];
          recordsFetched += activities.length;

          for (const activity of activities) {
            try {
              const ctUserId = activity.userId;
              const startTs = activity.timeActivity?.start?.timestamp;
              const endTs = activity.timeActivity?.end?.timestamp;
              if (!startTs || !endTs) continue;

              const activityId = activity.timeActivity?.id || `ct-${ctUserId}-${startTs.split('T')[0]}`;
              if (importedHours.find(h => h.connecteamShiftId === activityId)) continue;

              const user = staffUsers.find(u => String(u.connecteamUserId) === String(ctUserId));
              if (!user) continue;

              const shiftDate = startTs.split('T')[0];
              const ms = new Date(endTs) - new Date(startTs);
              const hoursWorked = parseFloat((ms / 3600000).toFixed(2));
              const shiftType = shiftTypeFromDate(shiftDate);
              const multiplier = multiplierMap[shiftType] || 1.0;
              const professionRate = professionRates.find(p => p.classification === user.classification)?.cashPerPoint || 0.5;
              const pointsToAward = Math.round(hoursWorked * user.hourlyRate * professionRate * multiplier);

              importedHours.unshift({
                id: `IH-CT-${Date.now()}-${user.id}`,
                userId: user.id, userName: `${user.firstName} ${user.lastName}`,
                classification: user.classification, connecteamUserId: ctUserId,
                shiftDate, clockIn: startTs.split('T')[1]?.slice(0, 5) || '00:00',
                clockOut: endTs.split('T')[1]?.slice(0, 5) || '00:00',
                hoursWorked, shiftType, multiplier, hourlyRate: user.hourlyRate,
                professionRate, pointsToAward, status: 'pending',
                approvedBy: null, approvedAt: null, rejectionReason: null,
                connecteamShiftId: activityId, importedAt: new Date().toISOString(),
              });
              recordsImported++;
            } catch (_) { recordsFailed++; }
          }
        }
        connecteamSettings.isConnected = true;
      }
    } catch (err) {
      console.error('[Connecteam sync] API error:', err.message);
      errorMessage = `API error: ${err.message}. Falling back to simulation.`;

      // Fallback simulation using active real staff only
      const shiftTypes = ['regular', 'overtime', 'weekend', 'public_holiday'];
      const today = new Date();
      const realStaff = staffUsers.filter(u => u.connecteamUserId && typeof u.connecteamUserId === 'number' && u.isActive);
      const eligible = realStaff.length > 0 ? realStaff : staffUsers.filter(u => u.isActive).slice(0, 4);
      for (const user of eligible) {
        const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        const hours = parseFloat((Math.random() * 6 + 2).toFixed(2));
        const professionRate = professionRates.find(p => p.classification === user.classification)?.cashPerPoint || 0.5;
        const multiplier = multiplierMap[shiftType] || 1.0;
        const pointsToAward = Math.round(hours * user.hourlyRate * professionRate * multiplier);
        const shiftDate = new Date(today);
        shiftDate.setDate(shiftDate.getDate() - Math.floor(Math.random() * 3));
        const dateStr = shiftDate.toISOString().split('T')[0];
        if (!importedHours.find(h => h.userId === user.id && h.shiftDate === dateStr)) {
          importedHours.unshift({
            id: `IH-SIM-${Date.now()}-${user.id}`,
            userId: user.id, userName: `${user.firstName} ${user.lastName}`,
            classification: user.classification, connecteamUserId: user.connecteamUserId,
            shiftDate: dateStr, clockIn: '07:00',
            clockOut: `${7 + Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`,
            hoursWorked: hours, shiftType, multiplier, hourlyRate: user.hourlyRate,
            professionRate, pointsToAward, status: 'pending',
            approvedBy: null, approvedAt: null, rejectionReason: null,
            connecteamShiftId: `sim-${Date.now()}-${user.id}`, importedAt: new Date().toISOString(),
          });
          recordsImported++;
        }
        recordsFetched++;
      }
    }
  }

  const log = {
    id: `SL-${Date.now()}`,
    syncedAt: new Date().toISOString(),
    status: !hasApiKey ? 'skipped' : (errorMessage && recordsImported === 0 ? 'failed' : 'success'),
    recordsFetched, recordsImported, recordsFailed,
    duration: `${((Date.now() - syncStart) / 1000).toFixed(1)}s`,
    triggeredBy,
    errorMessage,
    adminId,
  };
  connecteamSyncLogs.unshift(log);
  connecteamSettings.lastSync = log.syncedAt;

  const message = !hasApiKey
    ? 'No API key configured. Add your Connecteam API key in Settings.'
    : errorMessage
    ? `${errorMessage} ${recordsImported} records imported via simulation.`
    : `Sync complete. ${recordsImported} new records imported from Connecteam.`;

  return { log, message };
}

// POST /api/connecteam/sync
router.post('/sync', async (req, res) => {
  try {
    const result = await performSync({ triggeredBy: 'manual', adminId: req.body.adminId || 'admin-1' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/connecteam/sync-now (same as /sync — used by HoursImport button and external callers)
router.post('/sync-now', async (req, res) => {
  try {
    const result = await performSync({ triggeredBy: 'manual', adminId: req.body.adminId || 'admin-1' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/connecteam/logs
router.get('/logs', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = connecteamSyncLogs.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: connecteamSyncLogs.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export default router;
