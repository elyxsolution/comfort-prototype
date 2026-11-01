import nodemailer from 'nodemailer';

// Email is optional: set SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_TO (and MAIL_FROM) to enable it.
const enabled = Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);
const transport = enabled
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

export async function notify(subject, text, attachments = []) {
  if (!transport) return false;
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO,
      subject,
      text,
      attachments,
    });
    return true;
  } catch (e) {
    console.error('Mail failed:', e.message);
    return false;
  }
}
