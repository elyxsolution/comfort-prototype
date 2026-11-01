import { Router } from 'express';
import { getCatalogue } from '../store.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, zone, bhk } = req.query;
  const { company, zones, projects } = getCatalogue();
  let list = projects;
  if (status) list = list.filter((p) => p.status === status);
  if (zone) list = list.filter((p) => p.zone === zone);
  if (bhk) list = list.filter((p) => p.bhk.includes(Number(bhk)));
  res.json({ ok: true, company, zones, projects: list });
});

router.get('/:slug', (req, res) => {
  const project = getCatalogue().projects.find((p) => p.slug === req.params.slug);
  if (!project) return res.status(404).json({ ok: false, error: 'Project not found' });
  res.json({ ok: true, project });
});

export default router;
