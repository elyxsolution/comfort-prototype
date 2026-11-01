import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TowerStage, { createStageState } from '../three/TowerStage.jsx';
import ProjectRail from '../components/ProjectRail.jsx';
import Localities from '../components/Localities.jsx';
import { Btn, Eyebrow, ScrubText, Loop } from '../components/Ui.jsx';
import { useEnquiry } from '../components/Enquiry.jsx';
import { catalogue, STATUS_LABEL, yearsSince } from '../lib/data.js';
import { imgOf } from '../lib/media.js';
import { gsap, ScrollTrigger, useReveal, useDrift, reduced } from '../lib/motion.js';

const { company, projects, zones } = catalogue;
const completed = projects.filter((p) => p.status === 'completed');
const localities = [...new Set(projects.map((p) => p.locality.replace(' 9th Phase', '')))];

const STEPS = [
  { t: 'Plan and design', d: 'The apartments are drawn, reviewed and approved before anything is poured.', c: 'An approved plan' },
  { t: 'Register under RERA', d: 'The project is registered, so you can look it up before you commit.', c: 'A RERA number' },
  { t: 'Foundation and structure', d: 'The tower rises floor by floor, and you are welcome to come and see it.', c: 'Floor by floor' },
  { t: 'Finish and landscape', d: 'Homes are finished and the grounds are planted, with generous open space.', c: '60% open space' },
  { t: 'Certificates and loans', d: 'Occupancy and completion certificates are in place, and banks lend against the project.', c: 'OC/CC · SBI · HDFC · Axis · LICHFL' },
  { t: 'Keys, and the housewarming', d: 'You receive your keys, and we hand over the home we promised.', c: 'Your home' },
];

const SERVICES = [
  { n: '01', t: 'Property development', to: '/projects', slug: 'comfort-heights', items: ['Apartments', 'Villas', 'Commercial complexes', 'In and around Bengaluru'] },
  { n: '02', t: 'Construction and quality', to: '/about', slug: 'comfort-vimalaprabha', items: ['Planning and design', 'Construction', 'Quality of workmanship', 'Attention to detail'] },
  { n: '03', t: 'Buying with confidence', to: '/contact', slug: 'comfort-vishwasta', items: ['RERA compliance', 'OC/CC in place', 'Home loans from SBI, HDFC, Axis, LICHFL', 'Open, fair dealing'] },
  { n: '04', t: 'Property management', to: '/about', slug: 'comfort-greens', items: ['Property management services', 'Long-term customer relationships', 'Knowledge of the Bengaluru market'] },
];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Home() {
  const root = useRef();
  const { open } = useEnquiry();
  useReveal(root, []);
  useDrift(root, []);
  return (
    <div ref={root} className="home">
      <Story open={open} />
      <ProjectRail />
      <Services />
      <Localities />
      <Stats />
      <Matcher open={open} />
      <Cta open={open} />
    </div>
  );
}

// The tower starts as nothing and is built as you scroll. The page darkens into night as it is finished.
function Story({ open }) {
  const section = useRef();
  const stage = useMemo(() => createStageState({ build: 0, dusk: 0, rot: 0.25, zoom: 1.0, lift: 0.1, look: 0.14 }), []);

  useLayoutEffect(() => {
    stage.onBg = (hex) => {
      if (section.current) section.current.style.backgroundColor = hex;
    };
    const ctx = gsap.context(() => {
      const night = (on) => section.current.classList.toggle('is-night', on);
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress;
          const b = Math.min(1, Math.max(0, (p - 0.035) / 0.7));
          stage.build = b;
          stage.dusk = smooth(0.74, 0.95, p);
          stage.rot = 0.25 + 1.25 * p;
          const hgt = Math.min(1, (b * 20) / 14);
          stage.zoom = 1.0 + 0.5 * hgt;
          stage.lift = 0.08 + 0.14 * hgt;
          stage.look = 0.05 + 0.58 * hgt;
          night(p > 0.85);
          section.current.style.setProperty('--built', String(b));
        },
      });
    }, section);
    return () => {
      stage.onBg = null;
      ctx.revert();
    };
  }, [stage]);

  return (
    <section ref={section} className="story" style={{ backgroundColor: '#f3f3f0' }}>
      <div className="story__stage">
        <TowerStage state={stage} palette="ochre" floors={14} blocks={2} orbit className="story__canvas" label="A Comfort Builders tower being built as you scroll" />
      </div>

      <div className="story__blocks">
        <div className="sblock sblock--hero stripes">
          <div className="sblock__in">
            <Eyebrow data-r>Bengaluru &middot; since 1990</Eyebrow>
            <h1 className="h1" data-r data-r-delay="0.05">Building Bengaluru&rsquo;s <em>homes</em> since 1990.</h1>
            <p className="lead" data-r data-r-delay="0.12">
              Comfort Builders &amp; Developers plans, builds and hands over apartments and commercial spaces across the city, and many of our buyers come to us by referral.
            </p>
            <div className="hero__actions" data-r data-r-delay="0.2">
              <Btn variant="dark" onClick={() => open()}>Book a site visit</Btn>
              <Btn to="/projects">See projects</Btn>
            </div>
          </div>
          <p className="scrollcue" aria-hidden="true"><span>Scroll to build</span><i /></p>
        </div>

        <div className="sblock sblock--left">
          <div className="sblock__in">
            <Eyebrow data-r>Our story</Eyebrow>
            <ScrubText className="statement">
              Comfort Builders has been building homes in Bengaluru since 1990, under the personal care of our Managing Partner, T. Narasimha Murthy.
            </ScrubText>
            <p data-r>Many of our buyers come to us through someone who already bought from us. We take that as the measure of the work.</p>
            <p data-r>We build apartments, villas and commercial complexes in and around the city, and we also manage property once it is built.</p>
            <Link className="textlink" to="/about" data-r>Read our story</Link>
          </div>
        </div>

        {STEPS.map((s, i) => (
          <div key={s.t} className={`sblock ${i % 2 === 0 ? 'sblock--right' : 'sblock--left'}`}>
            <div className="sblock__in step">
              <p className="step__no" data-r><span>{String(i + 1).padStart(2, '0')}</span> / 06</p>
              <h2 className="h2" data-r data-r-delay="0.05">{s.t}</h2>
              <p data-r data-r-delay="0.1">{s.d}</p>
              <span className="tag" data-r data-r-delay="0.15">{s.c}</span>
            </div>
          </div>
        ))}

        <div className="sblock sblock--right">
          <div className="sblock__in">
            <Eyebrow data-r>The facts</Eyebrow>
            <h2 className="h2" data-r data-r-delay="0.05">Names you <em>can check.</em></h2>
            <div className="facts2" data-r data-r-delay="0.1">
              <ul>
                <li className="facts2__h">Home loans from</li>
                {company.banks.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <ul>
                <li className="facts2__h">What we stand behind</li>
                {company.claims.map((c) => <li key={c.figure}>{c.figure} {c.text}</li>)}
              </ul>
            </div>
            <p className="soft" data-r>Ask us for the RERA number, approvals and bank letters of any project you are considering.</p>
          </div>
        </div>

        <div className="sblock sblock--left sblock--end">
          <div className="sblock__in">
            <Eyebrow data-r>Lit from the inside</Eyebrow>
            <h2 className="h2" data-r data-r-delay="0.05">{yearsSince()} years in <em>one city.</em></h2>
            <dl className="bignums" data-r data-r-delay="0.1">
              <div><dt>Building since</dt><dd>{company.since}</dd></div>
              <div><dt>Completed</dt><dd>+{String(completed.length).padStart(3, '0')}</dd></div>
              <div><dt>Localities</dt><dd>+{String(localities.length).padStart(3, '0')}</dd></div>
            </dl>
            <Btn variant="light" onClick={() => open()} data-r>Book a site visit</Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

// Numbered rows. On hover a blue sweep fills the row and a picture slides in beside the arrow.
function Services() {
  return (
    <section className="svc" id="services">
      <div className="svc__head">
        <div>
          <Eyebrow data-r>What we do</Eyebrow>
          <h2 className="h2" data-r data-r-delay="0.05">Everything a buyer needs, <em>in one place.</em></h2>
        </div>
        <p className="svc__count" data-r><span>Services</span>+{String(SERVICES.length).padStart(3, '0')}</p>
      </div>
      <ul className="svc__list">
        {SERVICES.map((s) => (
          <li key={s.n} data-r>
            <Link to={s.to} className="svc__row">
              <span className="svc__sweep" />
              <span className="svc__n">{s.n}</span>
              <span className="svc__t">{s.t}</span>
              <ul className="svc__items">
                {s.items.map((it) => <li key={it}><b>+</b>{it}</li>)}
              </ul>
              <span className="svc__media">
                <span className="svc__thumb"><img src={`${imgOf(s.slug).src}`} width="400" height="225" loading="lazy" alt="" /></span>
                <span className="svc__arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 9h13M10 3.5 15.5 9 10 14.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats">
      <div className="stats__mosaic">
        <figure className="stats__photo">
          <img data-drift src="/img/lalbagh.jpg" width="1920" height="1920" loading="lazy" alt="The iron-and-glass Glass House at Lalbagh botanical garden under a cloudy sky, in black and white" />
          <figcaption>Lalbagh Glass House, Bengaluru. Photograph by Subhashish Panigrahi (CC BY-SA 3.0).</figcaption>
        </figure>
        <div className="tile tile--navy" data-r>
          <Eyebrow>Open space</Eyebrow>
          <p className="tile__fig">60%</p>
          <p className="tile__cap">Open space, as published for our current projects. Ask us for the figure for the project you are considering.</p>
        </div>
        <div className="tile tile--blue" data-r data-r-delay="0.1">
          <Eyebrow>Our record</Eyebrow>
          <p className="tile__fig">+{String(completed.length).padStart(3, '0')}</p>
          <p className="tile__cap">Completed projects, from apartments in JP Nagar to commercial complexes in Malleswaram.</p>
        </div>
      </div>
    </section>
  );
}

function Matcher({ open }) {
  const [bhk, setBhk] = useState(3);
  const [zone, setZone] = useState('any');
  const list = useRef();
  const results = projects.filter((p) => p.residential && (bhk === 'any' || p.bhk.includes(bhk)) && (zone === 'any' || p.zone === zone));
  useLayoutEffect(() => {
    if (reduced() || !list.current) return;
    gsap.fromTo(list.current.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'expo.out', clearProps: 'transform' });
  }, [bhk, zone]);
  return (
    <section id="match" className="match">
      <div className="match__ask">
        <Eyebrow data-r>Find your home</Eyebrow>
        <h2 className="h2" data-r data-r-delay="0.05">Which home <em>fits you?</em></h2>
        <fieldset data-r>
          <legend>How many bedrooms?</legend>
          <div className="chips">
            {[2, 3, 4].map((n) => (
              <button key={n} className="chip" aria-pressed={bhk === n} onClick={() => setBhk(n)}>{n} BHK</button>
            ))}
            <button className="chip" aria-pressed={bhk === 'any'} onClick={() => setBhk('any')}>Any</button>
          </div>
        </fieldset>
        <fieldset data-r>
          <legend>Which part of the city?</legend>
          <div className="chips">
            {zones.map((z) => (
              <button key={z.id} className="chip" aria-pressed={zone === z.id} onClick={() => setZone(z.id)}>{z.name}</button>
            ))}
            <button className="chip" aria-pressed={zone === 'any'} onClick={() => setZone('any')}>Anywhere</button>
          </div>
        </fieldset>
      </div>
      <div className="match__out" aria-live="polite">
        <p className="match__count">{results.length ? `${results.length} ${results.length === 1 ? 'project fits' : 'projects fit'}` : 'No project fits yet'}</p>
        <ul ref={list}>
          {results.map((p) => (
            <li key={p.slug}>
              <Link to={`/projects/${p.slug}`} className="mrow">
                <span className="mrow__sweep" />
                <span className="match__name">{p.name}</span>
                <span className="match__meta">{p.locality} &middot; {p.units} &middot; {STATUS_LABEL[p.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!results.length && <p>Nothing matches that exactly. Tell us what you are looking for and we will call you when something does.</p>}
        <Btn variant="dark" onClick={() => open({ bhk: bhk === 'any' ? '' : bhk })}>Talk to us about {bhk === 'any' ? 'your home' : `a ${bhk} BHK`}</Btn>
      </div>
    </section>
  );
}

function Cta({ open }) {
  return (
    <section className="cta on-dark">
      <img data-drift src="/img/vidhana.jpg" width="1920" height="1280" loading="lazy" alt="Vidhana Soudha, Bengaluru, lit at night with warm lamps under a dark sky" />
      <div className="cta__text">
        <Eyebrow data-r>Visit us</Eyebrow>
        <h2 className="h2" data-r data-r-delay="0.05">Come and <em>see it</em> for yourself.</h2>
        <p data-r>Book a site visit. We will show you the plans, the paperwork and the building, and you decide in your own time.</p>
        <div className="cta__row" data-r>
          <Btn variant="light" onClick={() => open()}>Book a site visit</Btn>
          <Btn variant="ghost-light" to="/contact">Contact us</Btn>
        </div>
      </div>
      <p className="cta__credit">Vidhana Soudha, Bengaluru. Photograph by DeepanjanGhosh (CC BY-SA 4.0).</p>
    </section>
  );
}
