import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import TowerStage, { createStageState } from '../three/TowerStage.jsx';
import { bySlug } from '../lib/data.js';

// Not linked anywhere. Used once to render each project's tower to a picture (public/img/renders).
export default function Render() {
  const [q] = useSearchParams();
  const p = bySlug(q.get('p')) || bySlug('comfort-heights');
  const num = (k, d) => (q.get(k) === null ? d : Number(q.get(k)));
  const state = useMemo(
    () => createStageState({ build: 1, dusk: num('d', 0.5), rot: num('rot', 0.7), zoom: num('zoom', 1.3), lift: num('lift', 0.2), look: num('look', 0.38) }),
    [q.toString()] // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <TowerStage state={state} palette={p.tower.palette} floors={p.tower.floors} blocks={p.tower.blocks} scenic still className="render-stage" />
    </div>
  );
}
