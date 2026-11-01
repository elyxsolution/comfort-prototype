import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import projectsRouter from './routes/projects.js';
import enquiriesRouter from './routes/enquiries.js';
import careersRouter from './routes/careers.js';
import adminRouter from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
const clientDist = path.resolve(__dirname, '../../client/dist');

const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:'],
        'frame-src': ["'self'", 'https://www.google.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'script-src': ["'self'"],
        'connect-src': ["'self'"],
        'worker-src': ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: ORIGINS }));
app.use(compression());
app.use(express.json({ limit: '50kb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many submissions. Please try again in a few minutes or call us.' },
});

app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.use('/api/projects', apiLimiter, projectsRouter);
app.use('/api/enquiries', formLimiter, enquiriesRouter);
app.use('/api/careers', formLimiter, careersRouter);
app.use('/api/admin', apiLimiter, adminRouter);
app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ ok: false, error: status >= 500 ? 'Something went wrong. Please call us.' : err.message });
});

app.listen(PORT, () => console.log(`Comfort API listening on http://localhost:${PORT}`));
