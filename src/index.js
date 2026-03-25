import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import referralRoutes from './routes/referrals.js';
import withdrawalRoutes from './routes/withdrawals.js';
import pointsRoutes from './routes/points.js';
import settingsRoutes from './routes/settings.js';
import auditLogRoutes from './routes/auditLogs.js';
import connecteamRoutes, { performSync } from './routes/connecteam.js';
import brevityRoutes, { performBrevitySync } from './routes/brevity.js';
import programRoutes from './routes/programs.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import pointTransactionRoutes from './routes/pointTransactions.js';
import adminRoutes from './routes/admins.js';

const app = express();
const PORT = process.env.PORT || 9000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://referralhub-frontend-kappa.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/connecteam', connecteamRoutes);
app.use('/api/brevity', brevityRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/point-transactions', pointTransactionRoutes);
app.use('/api/admins', adminRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supabase: !!process.env.SUPABASE_URL ? 'configured' : 'not configured (using mock data)',
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Daily auto-sync (2:00 AM) ────────────────────────────────────────────────
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Running daily Connecteam sync...');
  try {
    const { log, message } = await performSync({ triggeredBy: 'scheduled', adminId: null });
    console.log(`[Cron] Connecteam: ${message} (${log.recordsImported} imported)`);
  } catch (err) {
    console.error('[Cron] Connecteam sync failed:', err.message);
  }
});

cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Running daily Brevity sync...');
  try {
    const { log, message } = await performBrevitySync({ triggeredBy: 'scheduled', adminId: null });
    console.log(`[Cron] Brevity: ${message} (${log.recordsImported} imported)`);
  } catch (err) {
    console.error('[Cron] Brevity sync failed:', err.message);
  }
});
console.log('[Cron] Daily syncs scheduled at 2:00 AM (Connecteam + Brevity)');

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ReferralHub Backend running on http://localhost:${PORT}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured (mock data mode)'}`);
});
