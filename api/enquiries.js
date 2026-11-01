const { configured, send, NOT_SET_UP } = require('./_lib/mail.js');

const PHONE = /^(\+?91)?[6-9][0-9]{9}$|^\+?[0-9]{8,14}$/;
const clean = (v, max) => String(v ?? '').trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const b = req.body && typeof req.body === 'object' ? req.body : {};

  // Honeypot: a real visitor leaves this empty. Answer as if it worked and send nothing.
  if (b.website) return res.status(201).json({ ok: true, message: 'Thank you. We will call you shortly.' });

  const name = clean(b.name, 80);
  const phone = clean(b.phone, 30).replace(/[ ()-]/g, '');
  const email = clean(b.email, 120);
  const fields = {};
  if (name.length < 2) fields.name = 'Please enter your name';
  if (!PHONE.test(phone)) fields.phone = 'Enter a valid phone number';
  if (email && !/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Enter a valid email';
  if (Object.keys(fields).length) return res.status(422).json({ ok: false, error: 'Please check the highlighted fields.', fields });

  if (!configured()) return res.status(503).json(NOT_SET_UP);

  const project = clean(b.project, 80) || 'General';
  const bhk = clean(b.bhk, 2);
  const message = clean(b.message, 1200);
  try {
    await send({
      subject: `New enquiry: ${name} (${project})`,
      replyTo: email || undefined,
      text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email || '-'}\nProject: ${project}\nBHK: ${bhk || '-'}\nSource: ${clean(b.source, 60) || '-'}\n\n${message}`,
    });
  } catch (e) {
    console.error('enquiry mail failed', e.message);
    return res.status(502).json({ ok: false, error: 'We could not send that just now. Please call +91 99000 73744.' });
  }
  return res.status(201).json({ ok: true, message: 'Thank you. We will call you shortly.' });
};
