const busboy = require('busboy');
const { configured, send, NOT_SET_UP } = require('./_lib/mail.js');

// Vercel functions accept a request body of about 4.5 MB, so a CV is capped at 4 MB here.
const MAX = 4 * 1024 * 1024;
const TYPES = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

function parse(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let file = null;
    let tooBig = false;
    let badType = false;
    const bb = busboy({ headers: req.headers, limits: { fileSize: MAX, files: 1, fields: 12 } });
    bb.on('field', (k, v) => (fields[k] = v));
    bb.on('file', (k, stream, info) => {
      if (!TYPES.has(info.mimeType)) {
        badType = true;
        return stream.resume();
      }
      const chunks = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('limit', () => (tooBig = true));
      stream.on('end', () => (file = { buffer: Buffer.concat(chunks), filename: info.filename || 'cv', contentType: info.mimeType }));
    });
    bb.on('error', reject);
    bb.on('close', () => resolve({ fields, file, tooBig, badType }));
    req.pipe(bb);
  });
}

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  let p;
  try {
    p = await parse(req);
  } catch {
    return res.status(400).json({ ok: false, error: 'Could not read that form. Please try again.' });
  }
  const { fields: f, file } = p;
  if (f.website) return res.status(201).json({ ok: true, message: 'Thank you. We have your CV.' });
  if (p.badType) return res.status(415).json({ ok: false, error: 'Please attach a PDF or Word file.' });
  if (p.tooBig) return res.status(413).json({ ok: false, error: 'That file is over 4 MB. Please send a smaller one.' });

  const name = clean(f.name, 80);
  const phone = clean(f.phone, 20);
  const email = clean(f.email, 120);
  const errs = {};
  if (name.length < 2) errs.name = 'Please enter your name';
  if (!/^\+?[0-9 ()-]{8,16}$/.test(phone)) errs.phone = 'Enter a valid phone number';
  if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email';
  if (!file) errs.cv = 'Attach your CV';
  if (Object.keys(errs).length) return res.status(422).json({ ok: false, error: 'Please check the highlighted fields.', fields: errs });

  if (!configured()) return res.status(503).json(NOT_SET_UP);
  try {
    await send({
      subject: `Career application: ${name}`,
      replyTo: email,
      text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}`,
      attachments: [{ filename: file.filename, content: file.buffer, contentType: file.contentType }],
    });
  } catch (e) {
    console.error('career mail failed', e.message);
    return res.status(502).json({ ok: false, error: 'We could not send that just now. Please email sales@comfortbuilders.in.' });
  }
  return res.status(201).json({ ok: true, message: 'Thank you. We have your CV.' });
};
