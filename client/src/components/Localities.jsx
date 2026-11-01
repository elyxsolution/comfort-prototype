import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow } from './Ui.jsx';
import { catalogue, STATUS_LABEL } from '../lib/data.js';
import { imgOf } from '../lib/media.js';

const pad = (n) => String(n).padStart(3, '0');

// Where the firm has built, as an index of localities. Point at one and its picture is drawn in from below,
// with the projects that stand there listed beneath it.
export default function Localities() {
  const groups = useMemo(() => {
    const m = new Map();
    catalogue.projects.forEach((p) => {
      const key = p.locality.replace(' 9th Phase', '');
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(p);
    });
    return [...m.entries()].map(([name, list]) => ({ name, list })).sort((a, b) => b.list.length - a.list.length);
  }, []);
  const [on, setOn] = useState(0);

  return (
    <section id="map" className="loc">
      <div className="loc__head">
        <Eyebrow data-r>Across the city</Eyebrow>
        <h2 className="h2" data-r data-r-delay="0.05">Where we <em>have built.</em></h2>
        <p data-r data-r-delay="0.1">{groups.length} localities, {catalogue.projects.length} projects. Point at a place to see what stands there.</p>
      </div>
      <div className="loc__body">
        <ul className="loc__list" onMouseLeave={() => {}}>
          {groups.map((g, i) => (
            <li key={g.name}>
              <button
                className={`lrow ${on === i ? 'is-on' : ''}`}
                onMouseEnter={() => setOn(i)}
                onFocus={() => setOn(i)}
                onClick={() => setOn(i)}
                aria-pressed={on === i}
              >
                <span className="lrow__sweep" />
                <span className="lrow__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="lrow__name">{g.name}</span>
                <span className="lrow__count">+{pad(g.list.length)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="loc__stage">
          {groups.map((g, i) => {
            const m = imgOf(g.list[0].slug);
            return (
              <figure key={g.name} className={`lfig ${on === i ? 'is-on' : ''}`} aria-hidden={on !== i}>
                <img src={m.src} alt={on === i ? m.alt : ''} width="1200" height="1500" loading={i < 2 ? 'eager' : 'lazy'} />
                <div className="lfig__scrim" />
                <figcaption className="lfig__cap">
                  <p className="lfig__where">{g.name}, Bengaluru</p>
                  <ul>
                    {g.list.map((p) => (
                      <li key={p.slug}>
                        <Link to={`/projects/${p.slug}`} tabIndex={on === i ? 0 : -1}>
                          <span>{p.name}</span>
                          <small>{STATUS_LABEL[p.status]}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
