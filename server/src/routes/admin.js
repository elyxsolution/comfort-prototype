import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { readAll } from '../store.js';

const router = Router();

// Set ADMIN_TOKEN to enable. Send it as `Authorization: Bearer <token>`.
function guard(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return res.status(503).json({ ok: false, error: 'Admin is disabled. Set ADMIN_TOKEN.' });
  const given = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
}

router.get('/enquiries', guard, (_req, res) => res.json({ ok: true, items: readAll('enquiries.ndjson') }));
router.get('/careers', guard, (_req, res) => res.json({ ok: true, items: readAll('careers.ndjson') }));

export default router;
