import { PALETTES } from '../three/Tower.jsx';

// A flat elevation of a project's tower, drawn in code in its own facade colours.
export default function Glyph({ palette = 'ochre', floors = 10, blocks = 1, className = '', title }) {
  const p = PALETTES[palette] || PALETTES.ochre;
  const H = 120;
  const fh = Math.min(7.2, 88 / floors);
  const towers = blocks === 2 ? [{ x: 8, w: 46, f: floors }, { x: 66, w: 46, f: Math.max(floors - 2, 5) }] : [{ x: 28, w: 64, f: floors }];
  return (
    <svg className={`glyph ${className}`} viewBox={`0 0 120 ${H}`} role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title} focusable="false">
      <rect x="0" y={H - 8} width="120" height="8" fill="#56653a" />
      {towers.map((t, ti) => {
        const top = H - 8 - t.f * fh;
        return (
          <g key={ti}>
            <rect x={t.x} y={top} width={t.w} height={t.f * fh} fill={p.wall} />
            {Array.from({ length: t.f }, (_, f) => {
              const y = H - 8 - (f + 1) * fh;
              const bays = t.w > 50 ? 4 : 3;
              return (
                <g key={f}>
                  <rect x={t.x - 2} y={y} width={t.w + 4} height={1.1} fill={p.trim} />
                  {Array.from({ length: bays }, (_, b) => (
                    <rect key={b} x={t.x + 3 + b * ((t.w - 6) / bays)} y={y + fh * 0.22} width={((t.w - 6) / bays) * 0.6} height={fh * 0.5} fill="#1c2a30" />
                  ))}
                  {(f + ti) % 2 === 0 && <rect x={t.x + t.w * 0.3} y={y + fh * 0.12} width={t.w * 0.22} height={fh * 0.2} fill={p.accent} />}
                </g>
              );
            })}
            <rect x={t.x + 4} y={top - 2.5} width={t.w - 8} height="2.5" fill="#4f6a34" />
          </g>
        );
      })}
    </svg>
  );
}
