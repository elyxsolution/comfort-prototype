const nodemailer = require('nodemailer');

// Vercel functions cannot keep files, so every enquiry and CV is emailed to the office.
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO (and optionally MAIL_FROM, SMTP_SECURE) in Vercel > Settings > Environment Variables.
const configured = () => Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);

function transport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

async function send({ subject, text, replyTo, attachments }) {
  await transport().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    replyTo,
    subject,
    text,
    attachments,
  });
}

const NOT_SET_UP = { ok: false, error: 'Online enquiries are not switched on yet. Please call +91 99000 73744.' };

module.exports = { configured, send, NOT_SET_UP };
