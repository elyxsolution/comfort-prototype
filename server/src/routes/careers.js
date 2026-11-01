import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { append, uploadDir } from '../store.js';
import { notify } from '../mailer.js';

const router = Router();
const ALLOWED = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED.get(file.mimetype) || '.bin'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype) ? cb(null, true) : cb(Object.assign(new Error('Please attach a PDF or Word file.'), { status: 415 })),
});

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,16}$/, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email').max(120),
  website: z.string().max(0).optional(),
});

router.post('/', upload.single('cv'), (req, res, next) => {
  try {
    if (req.body && req.body.website) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(201).json({ ok: true, message: 'Thank you. We have your CV.' });
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file) fs.unlink(req.file.path, () => {});
      const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
      return res.status(422).json({ ok: false, error: 'Please check the highlighted fields.', fields });
    }
    if (!req.file) return res.status(422).json({ ok: false, error: 'Please attach your CV.', fields: { cv: 'Attach your CV' } });
    // eslint-disable-next-line no-unused-vars
    const { website, ...data } = parsed.data;
    const row = append('careers.ndjson', { ...data, cv: path.basename(req.file.path), cvOriginalName: req.file.originalname });
    notify(`Career application: ${data.name}`, `Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}`, [
      { filename: req.file.originalname, path: req.file.path },
    ]);
    res.status(201).json({ ok: true, id: row.id, message: 'Thank you. We have your CV.' });
  } catch (e) {
    next(e);
  }
});

export default router;
