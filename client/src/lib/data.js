import { useEffect, useState } from 'react';
import bundled from '@shared/projects.json';

// The catalogue ships with the bundle so the page never waits on the network,
// then the API copy replaces it when it answers (so the client can update it server-side).
export function useCatalogue() {
  const [data, setData] = useState(bundled);
  useEffect(() => {
    let live = true;
    fetch('/api/projects')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && j?.ok && setData({ company: j.company, zones: j.zones, projects: j.projects.length ? bundled.projects.map((p) => j.projects.find((x) => x.slug === p.slug) || p) : bundled.projects }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return data;
}

export const catalogue = bundled;
export const STATUS_LABEL = { ongoing: 'Ongoing', upcoming: 'Upcoming', completed: 'Completed' };
export const bySlug = (slug) => bundled.projects.find((p) => p.slug === slug);
export const yearsSince = () => new Date().getFullYear() - bundled.company.since;
export const waLink = (text = 'Hello, I would like to know more about your projects.') =>
  `https://wa.me/${bundled.company.whatsapp}?text=${encodeURIComponent(text)}`;
