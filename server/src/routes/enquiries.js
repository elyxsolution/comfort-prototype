import { Router } from 'express';
import { z } from 'zod';
import { append } from '../store.js';
import { notify } from '../mailer.js';

const router = Router();

const PHONE = /^(\+?91)?[6-9][0-9]{9}$|^\+?[0-9]{8,14}$/;

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[ ()-]/g, ''))
    .refine((v) => PHONE.test(v), 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email').max(120).optional().or(z.literal('')),
  project: z.string().trim().max(80).optional().or(z.literal('')),
  bhk: z.coerce.number().int().min(1).max(6).optional(),
  message: z.string().trim().max(1200).optional().or(z.literal('')),
  source: z.string().trim().max(60).optional(),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

router.post('/', (req, res, next) => {
  try {
    // Honeypot tripped: answer as if it worked so the bot learns nothing, and store nothing.
    if (req.body && req.body.website) return res.status(201).json({ ok: true, message: 'Thank you. We will call you shortly.' });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
      return res.status(422).json({ ok: false, error: 'Please check the highlighted fields.', fields });
    }
    // eslint-disable-next-line no-unused-vars
    const { website, ...data } = parsed.data;
    const row = append('enquiries.ndjson', { ...data, project: data.project || 'General' });
    notify(
      `New enquiry: ${data.name} (${row.project})`,
      `Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || '-'}\nProject: ${row.project}\nBHK: ${data.bhk || '-'}\n\n${data.message || ''}`
    );
    res.status(201).json({ ok: true, id: row.id, message: 'Thank you. We will call you shortly.' });
  } catch (e) {
    next(e);
  }
});

export default router;
