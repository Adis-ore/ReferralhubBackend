import { Router } from 'express';
import { importedHours, connecteamSyncLogs, connecteamSettings, staffUsers, pointTransactions, referrals } from '../data/seed.js';

const router = Router();

// GET /api/connecteam/settings
router.get('/settings', (req, res) => {
  res.json(connecteamSettings);
});

// PUT /api/connecteam/settings
router.put('/settings', (req, res) => {
  const allowed = ['apiKey', 'organizationId', 'webhookUrl', 'syncFrequency', 'autoSync', 'shiftMultipliers', 'pointsPerHour', 'referrerBonusPercentage'];
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

  // If approved: award points to staff user + referrer bonus
  if (status === 'approved') {
    const userIndex = staffUsers.findIndex((u) => u.id === importedHours[index].userId);
    if (userIndex !== -1) {
      const hrs = importedHours[index];
      staffUsers[userIndex].pointsBalance  += hrs.pointsToAward;
      staffUsers[userIndex].approvedHours   = (staffUsers[userIndex].approvedHours || 0) + hrs.hoursWorked;

      // Log employee points transaction
      pointTransactions.unshift({
        id: `PT-EMP-${Date.now()}`,
        userId: staffUsers[userIndex].id,
        type: 'hours_approved',
        points: hrs.pointsToAward,
        description: `${hrs.hoursWorked}h shift on ${hrs.shiftDate} (${hrs.shiftType}) approved`,
        createdAt: new Date().toISOString(),
      });

      // Award referrer bonus
      const referredBy = staffUsers[userIndex].referredBy;
      if (referredBy) {
        const referrerIdx = staffUsers.findIndex((u) => u.id === referredBy);
        if (referrerIdx !== -1) {
          const bonusPct  = connecteamSettings.referrerBonusPercentage ?? 50;
          const refBonus  = Math.round(hrs.pointsToAward * bonusPct / 100);
          if (refBonus > 0) {
            staffUsers[referrerIdx].pointsBalance += refBonus;
            pointTransactions.unshift({
              id: `PT-REF-${Date.now()}`,
              userId: staffUsers[referrerIdx].id,
              type: 'referrer_bonus',
              points: refBonus,
              description: `Referrer bonus: ${staffUsers[userIndex].firstName} ${staffUsers[userIndex].lastName} worked ${hrs.hoursWorked}h (${bonusPct}% of ${hrs.pointsToAward} pts)`,
              relatedUserId: staffUsers[userIndex].id,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
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

      const hrs = importedHours[index];
      const userIndex = staffUsers.findIndex((u) => u.id === hrs.userId);
      if (userIndex !== -1) {
        staffUsers[userIndex].pointsBalance += hrs.pointsToAward;
        staffUsers[userIndex].approvedHours = (staffUsers[userIndex].approvedHours || 0) + hrs.hoursWorked;

        pointTransactions.unshift({
          id: `PT-EMP-${Date.now()}-${id}`,
          userId: staffUsers[userIndex].id,
          type: 'hours_approved',
          points: hrs.pointsToAward,
          description: `${hrs.hoursWorked}h shift on ${hrs.shiftDate} (bulk approved)`,
          createdAt: new Date().toISOString(),
        });

        const referredBy = staffUsers[userIndex].referredBy;
        if (referredBy) {
          const referrerIdx = staffUsers.findIndex((u) => u.id === referredBy);
          if (referrerIdx !== -1) {
            const bonusPct = connecteamSettings.referrerBonusPercentage ?? 50;
            const refBonus = Math.round(hrs.pointsToAward * bonusPct / 100);
            if (refBonus > 0) {
              staffUsers[referrerIdx].pointsBalance += refBonus;
              pointTransactions.unshift({
                id: `PT-REF-${Date.now()}-${id}`,
                userId: staffUsers[referrerIdx].id,
                type: 'referrer_bonus',
                points: refBonus,
                description: `Referrer bonus: ${staffUsers[userIndex].firstName} ${staffUsers[userIndex].lastName} worked ${hrs.hoursWorked}h`,
                relatedUserId: staffUsers[userIndex].id,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
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
  const multiplierMap  = connecteamSettings.shiftMultipliers || { regular: 1.0, overtime: 1.5, weekend: 2.0, public_holiday: 2.5 };
  const pointsPerHour  = connecteamSettings.pointsPerHour ?? 10;
  const apiKey         = connecteamSettings.apiKey;
  const hasApiKey      = apiKey && apiKey.length >= 10;

  let recordsFetched = 0, recordsImported = 0, recordsFailed = 0;
  let errorMessage = null;

  if (hasApiKey) {
    // Sync window: last 7 days
    const endDate   = new Date().toISOString().split('T')[0];
    const startDate = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; })();

    const activeStaff = staffUsers.filter(u => u.connecteamUserId && u.isActive);
    const ctUserIds   = activeStaff.map(u => u.connecteamUserId);

    try {
      const clocksRes  = await connecteamFetch('/time-clock/v1/time-clocks', apiKey);
      const timeClocks = clocksRes?.data?.timeClocks || [];

      if (timeClocks.length === 0) {
        errorMessage = 'No time clocks found in Connecteam. Please set up a time clock in your Connecteam dashboard.';
        connecteamSettings.isConnected = true;
      } else {
        for (const clock of timeClocks) {
          // Build query: date range + all known user IDs
          const params = new URLSearchParams({ startDate, endDate, limit: '1000' });
          ctUserIds.forEach(id => params.append('userIds[]', String(id)));

          let activitiesRes;
          try {
            activitiesRes = await connecteamFetch(
              `/time-clock/v1/time-clocks/${clock.timeClockId ?? clock.id}/time-activities?${params.toString()}`,
              apiKey
            );
          } catch (clockErr) {
            console.warn(`[Sync] Clock ${clock.timeClockId ?? clock.id} fetch error:`, clockErr.message);
            recordsFailed++;
            continue;
          }

          // Response format: { data: { timeActivitiesByUsers: { "userId": { shifts: [{ start: {timestamp}, end: {timestamp} }] } } } }
          const activitiesByUser = activitiesRes?.data?.timeActivitiesByUsers || {};

          for (const [ctUserIdStr, userData] of Object.entries(activitiesByUser)) {
            const ctUserId = parseInt(ctUserIdStr);
            const user = activeStaff.find(u => u.connecteamUserId === ctUserId);
            if (!user) continue;

            const shifts = userData.shifts || [];
            recordsFetched += shifts.length;

            for (const shift of shifts) {
              try {
                const startTs = shift.start?.timestamp;
                const endTs   = shift.end?.timestamp;
                if (!startTs || !endTs || endTs <= startTs) continue;

                const shiftId = `ct-${ctUserId}-${startTs}`;
                if (importedHours.find(h => h.connecteamShiftId === shiftId)) continue;

                const startDt  = new Date(startTs * 1000);
                const endDt    = new Date(endTs   * 1000);
                const hoursWorked = parseFloat(((endTs - startTs) / 3600).toFixed(2));
                const shiftDateStr = startDt.toISOString().split('T')[0];
                const shiftType    = shiftTypeFromDate(shiftDateStr);
                const multiplier   = multiplierMap[shiftType] || 1.0;
                const pointsToAward = Math.round(hoursWorked * pointsPerHour * multiplier);

                importedHours.unshift({
                  id: `IH-CT-${Date.now()}-${user.id}`,
                  userId: user.id,
                  userName: `${user.firstName} ${user.lastName}`,
                  classification: user.classification,
                  connecteamUserId: ctUserId,
                  shiftDate: shiftDateStr,
                  clockIn:  `${startDt.getHours().toString().padStart(2,'0')}:${startDt.getMinutes().toString().padStart(2,'0')}`,
                  clockOut: `${endDt.getHours().toString().padStart(2,'0')}:${endDt.getMinutes().toString().padStart(2,'0')}`,
                  hoursWorked,
                  shiftType,
                  multiplier,
                  hourlyRate: user.hourlyRate,
                  pointsPerHour,
                  pointsToAward,
                  status: 'pending',
                  approvedBy: null, approvedAt: null, rejectionReason: null,
                  connecteamShiftId: shiftId,
                  importedAt: new Date().toISOString(),
                });
                recordsImported++;
              } catch (_) { recordsFailed++; }
            }
          }
        }
        connecteamSettings.isConnected = true;
      }
    } catch (err) {
      console.error('[Connecteam sync] API error:', err.message);
      errorMessage = `Connecteam API error: ${err.message}`;
      connecteamSettings.isConnected = false;
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
