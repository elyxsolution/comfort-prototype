import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow } from './Ui.jsx';
import { bySlug, STATUS_LABEL } from '../lib/data.js';
import { imgOf } from '../lib/media.js';
import { gsap, ScrollTrigger } from '../lib/motion.js';

const SLUGS = ['comfort-heights', 'comfort-vimalaprabha', 'residential-jp-nagar-9th-phase', 'commercial-complex-malleswaram'];
const ITEMS = SLUGS.map(bySlug);
const pad = (n) => String(n).padStart(2, '0');

// Ongoing and upcoming projects as a row of slides. On a desktop the section pins and your scroll slides the row sideways,
// each picture drifting inside its frame and each slide growing as it reaches the middle. On a phone it is a swipe row.
export default function ProjectRail() {
  const sec = useRef();
  const track = useRef();
  const bar = useRef();
  const [active, setActive] = useState(0);
  const current = useRef(0);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const view = sec.current.querySelector('.rail__view');
      const dist = () => Math.max(0, track.current.scrollWidth - view.clientWidth);
      const cards = gsap.utils.toArray('.rcard', track.current);
      const tween = gsap.to(track.current, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec.current,
          start: 'top top',
          end: () => '+=' + Math.round(dist() * 1.2),
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            bar.current.style.transform = `scaleX(${self.progress})`;
            const idx = Math.min(ITEMS.length - 1, Math.round(self.progress * (ITEMS.length - 1)));
            if (idx !== current.current) {
              current.current = idx;
              setActive(idx);
            }
          },
        },
      });
      cards.forEach((card, i) => {
        const img = card.querySelector('.rcard__img');
        const inner = card.querySelector('.rcard__in');
        const body = card.querySelectorAll('.rcard__txt > *');
        const st = (start, end) => ({ trigger: card, containerAnimation: tween, start, end, scrub: true });
        gsap.fromTo(img, { xPercent: -9, scale: 1.14 }, { xPercent: 9, scale: 1.14, ease: 'none', scrollTrigger: st('left right', 'right left') });
        gsap.fromTo(inner, { scale: 0.86, opacity: 0.45, y: 40 }, { scale: 1, opacity: 1, y: 0, ease: 'none', scrollTrigger: st('left 96%', 'left 48%') });
        if (i < cards.length - 1) gsap.to(inner, { scale: 0.92, opacity: 0.5, ease: 'none', scrollTrigger: st('left 14%', 'left -45%') });
        gsap.fromTo(body, { y: 46, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: st('left 80%', 'left 46%') });
      });
      ScrollTrigger.refresh();
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="rail" ref={sec} aria-label="Ongoing and upcoming projects">
      <div className="rail__head">
        <div>
          <Eyebrow>Ongoing &amp; upcoming</Eyebrow>
          <h2 className="h2">Homes <em>taking shape.</em></h2>
        </div>
        <p className="rail__count" aria-live="polite"><b>{pad(active + 1)}</b><span> / {pad(ITEMS.length)}</span></p>
      </div>
      <div className="rail__view">
        <div className="rail__track" ref={track}>
          {ITEMS.map((p, i) => {
            const m = imgOf(p.slug);
            return (
              <Link key={p.slug} to={`/projects/${p.slug}`} className="rcard" data-i={i}>
                <div className="rcard__in">
                  <div className="rcard__zoom"><img className="rcard__img" src={m.src} alt={m.alt} width="1400" height="900" loading={i < 2 ? 'eager' : 'lazy'} draggable="false" /></div>
                  <div className="rcard__scrim" />
                  <span className="rcard__chip">{STATUS_LABEL[p.status]}</span>
                  <div className="rcard__txt">
                    <h3 className="rcard__title">{p.name}</h3>
                    <p className="rcard__meta"><span>{p.locality}</span><span>{p.units}</span></p>
                    <span className="btn btn--light rcard__btn">
                      <span className="btn__label">View project</span>
                      <i className="c c-tl" /><i className="c c-tr" /><i className="c c-bl" /><i className="c c-br" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          <span className="rail__end" aria-hidden="true" />
        </div>
      </div>
      <div className="rail__foot" aria-hidden="true">
        <span className="rail__bar"><i ref={bar} /></span>
        <span className="rail__hint">Keep scrolling</span>
      </div>
    </section>
  );
}
