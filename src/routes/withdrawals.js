import { Router } from 'express';
import { withdrawals } from '../data/seed.js';
import PDFDocument from 'pdfkit';

const router = Router();

// GET /api/withdrawals
router.get('/', (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  let data = [...withdrawals];

  if (search) {
    const q = search.toLowerCase();
    data = data.filter((w) => w.userName?.toLowerCase().includes(q) || String(w.id).includes(q));
  }
  if (status && status !== 'all') data = data.filter((w) => w.status === status);

  const total = data.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  res.json({ data: data.slice(offset, offset + parseInt(limit)), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

// GET /api/withdrawals/:id
router.get('/:id', (req, res) => {
  const w = withdrawals.find((w) => w.id === parseInt(req.params.id));
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
  res.json(w);
});

// GET /api/withdrawals/:id/pdf — download PDF receipt
router.get('/:id/pdf', (req, res) => {
  const w = withdrawals.find((w) => w.id === parseInt(req.params.id));
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="payout-receipt-${w.id}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.fontSize(22).font('Helvetica-Bold').text('ReferralHub', 50, 50);
  doc.fontSize(11).font('Helvetica').fillColor('#666').text('Payout Receipt', 50, 78);

  doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // ── Status badge area ───────────────────────────────────────────────────────
  const statusColors = { completed: '#16a34a', approved: '#2563eb', pending: '#d97706', rejected: '#dc2626' };
  const statusColor = statusColors[w.status] || '#666';
  doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor)
     .text(`STATUS: ${(w.status || 'pending').toUpperCase()}`, 400, 50);

  // ── Main info grid ──────────────────────────────────────────────────────────
  const col1 = 50, col2 = 300, rowH = 22;
  let y = 115;

  const row = (label, value, x = col1) => {
    doc.fontSize(9).font('Helvetica').fillColor('#888').text(label, x, y);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111').text(String(value ?? '—'), x, y + 12);
    if (x === col2) y += rowH + 8;
  };

  row('RECEIPT NUMBER',  `RH-WD-${w.id}`);          row('DATE REQUESTED',    w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-AU') : '—', col2);
  row('STAFF NAME',      w.userName || '—');          row('PROCESSED DATE',    w.processedAt ? new Date(w.processedAt).toLocaleDateString('en-AU') : 'Pending', col2);
  row('EMAIL',           w.email || '—');             row('PROCESSED BY',      w.processedBy || 'Pending', col2);
  row('CLASSIFICATION',  w.classification || '—');    row('PAYMENT METHOD',    w.paymentMethod || 'Bank Transfer', col2);

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  y += 16;

  // ── Amount box ──────────────────────────────────────────────────────────────
  doc.roundedRect(50, y, 495, 70, 6).fillColor('#f8fafc').fill();
  doc.fontSize(11).font('Helvetica').fillColor('#555').text('Points Redeemed', 65, y + 14);
  doc.fontSize(11).font('Helvetica').fillColor('#555').text('Payout Amount (AUD)', 280, y + 14);
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#111').text(`${(w.pointsUsed || 0).toLocaleString()} pts`, 65, y + 32);
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#16a34a').text(`$${(w.amount || 0).toFixed(2)}`, 280, y + 32);
  y += 88;

  // ── Bank details ─────────────────────────────────────────────────────────────
  if (w.bankName || w.accountNumber) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111').text('Bank Details', 50, y); y += 18;
    if (w.bankName)      { doc.fontSize(9).font('Helvetica').fillColor('#888').text('Bank', 50, y).fontSize(10).fillColor('#111').text(w.bankName, 50, y + 12); y += 30; }
    if (w.accountNumber) { doc.fontSize(9).fillColor('#888').text('Account Number', 50, y).fontSize(10).fillColor('#111').text(w.accountNumber, 50, y + 12); y += 30; }
    if (w.bsb)           { doc.fontSize(9).fillColor('#888').text('BSB', 220, y - 60).fontSize(10).fillColor('#111').text(w.bsb, 220, y - 48); }
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (w.notes) {
    y += 10;
    doc.fontSize(9).font('Helvetica').fillColor('#888').text('Notes', 50, y);
    doc.fontSize(10).fillColor('#333').text(w.notes, 50, y + 14, { width: 495 });
    y += 40;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.moveTo(50, 760).lineTo(545, 760).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#aaa')
     .text('This document is an official payout receipt from ReferralHub. Keep this for your records.', 50, 768, { align: 'center', width: 495 });

  doc.end();
});

// PATCH /api/withdrawals/:id - approve/reject/process
router.patch('/:id', (req, res) => {
  const index = withdrawals.findIndex((w) => w.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Withdrawal not found' });
  const { status, rejectionReason, processedBy } = req.body;
  if (status) withdrawals[index].status = status;
  if (rejectionReason !== undefined) withdrawals[index].rejectionReason = rejectionReason;
  if (processedBy) withdrawals[index].processedBy = processedBy;
  if (['completed', 'rejected'].includes(status)) withdrawals[index].processedAt = new Date().toISOString();
  res.json(withdrawals[index]);
});

export default router;
