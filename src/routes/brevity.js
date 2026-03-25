import { Router } from 'express';
import { importedHours, connecteamSettings, staffUsers, pointTransactions, brevitySettings, brevitySyncLogs } from '../data/seed.js';
import { testBrevityConnection, getBrevityUsers, getBrevityTimesheets } from '../services/brevityApi.js';

const router = Router();

// ─── GET /api/brevity/settings ────────────────────────────────────────────────
router.get('/settings', (req, res) => {
  res.json(brevitySettings);
});

// ─── PUT /api/brevity/settings ────────────────────────────────────────────────
router.put('/settings', (req, res) => {
  const allowed = ['companyCode', 'apiKey', 'autoSync', 'syncFrequency'];
  for (const key of allowed) {
    if (key in req.body) brevitySettings[key] = req.body[key];
  }
  res.json(brevitySettings);
});

// ─── POST /api/brevity/test-connection ────────────────────────────────────────
router.post('/test-connection', async (req, res) => {
  const companyCode = req.body.companyCode || brevitySettings.companyCode;
  const apiKey      = req.body.apiKey      || brevitySettings.apiKey;

  if (!companyCode || !apiKey) {
    return res.status(400).json({ success: false, message: 'Company code and API key are required' });
  }

  const result = await testBrevityConnection(companyCode, apiKey);
  if (result.success) {
    brevitySettings.isConnected = true;
    brevitySettings.companyCode = companyCode;
    brevitySettings.apiKey      = apiKey;
  } else {
    brevitySettings.isConnected = false;
  }
  res.json(result);
});

// ─── GET /api/brevity/logs ────────────────────────────────────────────────────
router.get('/logs', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total  = brevitySyncLogs.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({
    data: brevitySyncLogs.slice(offset, offset + parseInt(limit)),
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Core sync function — shared by /sync, /sync-now and the cron job
// ─────────────────────────────────────────────────────────────────────────────
export async function performBrevitySync({ triggeredBy = 'manual', adminId = null } = {}) {
  const syncStart   = Date.now();
  const companyCode = brevitySettings.companyCode || process.env.BREVITY_COMPANY_CODE;
  const apiKey      = brevitySettings.apiKey      || process.env.BREVITY_API_KEY;
  const hasCredentials = companyCode && apiKey;

  let recordsFetched = 0, recordsImported = 0, recordsFailed = 0;
  let errorMessage   = null;

  if (hasCredentials) {
    // Sync window: last 7 days
    const endDate   = new Date().toISOString().split('T')[0];
    const startDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    })();

    try {
      const timesheets = await getBrevityTimesheets(companyCode, apiKey, startDate, endDate);
      recordsFetched   = timesheets.length;

      // Build email → ReferralHub staff lookup
      const staffByEmail = {};
      staffUsers.forEach(u => {
        if (u.email) staffByEmail[u.email.toLowerCase()] = u;
      });

      for (const ts of timesheets) {
        try {
          // ── Brevity timesheet field mapping ──────────────────────────────────
          // These field names will be confirmed once the API key is active.
          // Adjust the property names below to match actual Brevity response fields.
          const tsId         = ts.id          ?? ts.timesheetId ?? ts.Id;
          const employeeEmail= (ts.employeeEmail ?? ts.email ?? '').toLowerCase();
          const shiftDateRaw = ts.date         ?? ts.shiftDate  ?? ts.startDate ?? ts.Date;
          const startTime    = ts.startTime    ?? ts.StartTime  ?? '00:00';
          const endTime      = ts.endTime      ?? ts.EndTime    ?? '00:00';
          const hoursWorked  = parseFloat(ts.totalHours ?? ts.hours ?? ts.TotalHours ?? 0);
          const status       = (ts.status      ?? ts.Status     ?? '').toLowerCase();

          if (!tsId || hoursWorked <= 0) continue;

          // Only import approved timesheets
          if (status && status !== 'approved') continue;

          // Deduplicate — skip if already imported
          const shiftId = `brev-${tsId}`;
          if (importedHours.find(h => h.connecteamShiftId === shiftId)) continue;

          // Match to a ReferralHub staff member by email
          const user = employeeEmail ? staffByEmail[employeeEmail] : null;
          if (!user) { recordsFailed++; continue; }

          const shiftDate  = shiftDateRaw ? new Date(shiftDateRaw).toISOString().split('T')[0] : endDate;
          const dayOfWeek  = new Date(shiftDate).getDay();
          const shiftType  = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'regular';
          const multiplier = (connecteamSettings.shiftMultipliers ?? {})[shiftType] ?? 1.0;
          const pph        = connecteamSettings.pointsPerHour ?? 10;
          const pointsToAward = Math.round(hoursWorked * pph * multiplier);

          importedHours.unshift({
            id:                 `IH-BREV-${Date.now()}-${user.id}`,
            userId:             user.id,
            userName:           `${user.firstName} ${user.lastName}`,
            classification:     user.classification,
            connecteamUserId:   null,
            brevityTimesheetId: tsId,
            source:             'brevity',
            shiftDate,
            clockIn:            startTime,
            clockOut:           endTime,
            hoursWorked,
            shiftType,
            multiplier,
            hourlyRate:         user.hourlyRate ?? 0,
            pointsPerHour:      pph,
            pointsToAward,
            status:             'pending',
            approvedBy:         null,
            approvedAt:         null,
            rejectionReason:    null,
            connecteamShiftId:  shiftId,
            importedAt:         new Date().toISOString(),
          });
          recordsImported++;
        } catch (_) { recordsFailed++; }
      }

      brevitySettings.isConnected = true;
    } catch (err) {
      console.error('[Brevity sync] error:', err.message);
      errorMessage = err.message;
      brevitySettings.isConnected = false;
    }
  }

  const log = {
    id:              `BSL-${Date.now()}`,
    syncedAt:        new Date().toISOString(),
    status:          !hasCredentials ? 'skipped' : (errorMessage && recordsImported === 0 ? 'failed' : 'success'),
    source:          'brevity',
    recordsFetched,
    recordsImported,
    recordsFailed,
    duration:        `${((Date.now() - syncStart) / 1000).toFixed(1)}s`,
    triggeredBy,
    errorMessage,
    adminId,
  };
  brevitySyncLogs.unshift(log);
  brevitySettings.lastSync = log.syncedAt;

  const message = !hasCredentials
    ? 'Brevity not configured. Add BREVITY_COMPANY_CODE and BREVITY_API_KEY in Settings.'
    : errorMessage
    ? `Brevity sync error: ${errorMessage}`
    : `Brevity sync complete. ${recordsImported} new timesheets imported.`;

  return { log, message };
}

// ─── POST /api/brevity/sync ───────────────────────────────────────────────────
router.post('/sync', async (req, res) => {
  try {
    const result = await performBrevitySync({ triggeredBy: 'manual', adminId: req.body.adminId });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/brevity/sync-now ───────────────────────────────────────────────
router.post('/sync-now', async (req, res) => {
  try {
    const result = await performBrevitySync({ triggeredBy: 'manual', adminId: req.body.adminId });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
