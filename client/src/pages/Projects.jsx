import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Btn, Eyebrow } from '../components/Ui.jsx';
import { useEnquiry } from '../components/Enquiry.jsx';
import { catalogue, STATUS_LABEL } from '../lib/data.js';
import { imgOf } from '../lib/media.js';
import { gsap, useReveal, reduced } from '../lib/motion.js';

const { projects, company } = catalogue;
const featured = projects.filter((p) => p.status !== 'completed');
const built = projects.filter((p) => p.status === 'completed');

const priceOf = (p) => (p.status === 'ongoing' && p.residential ? `From ₹${company.startingPriceLakhs} lakhs` : p.status === 'upcoming' ? 'Details soon' : 'Completed');

function Featured({ p, cls }) {
  const m = imgOf(p.slug);
  return (
    <Link to={`/projects/${p.slug}`} className={`fcard ${cls}`}>
      <div className="fcard__frame">
        <div className="fcard__zoom"><img className="fcard__img" src={m.src} alt={m.alt} width="1400" height="1000" loading="lazy" /></div>
        <div className="fcard__scrim" />
        <div className="fcard__in">
          <div className="fcard__l">
            <h2 className="fcard__title">{p.name}</h2>
            <div className="tags"><span>{STATUS_LABEL[p.status]}</span><span>{p.residential ? 'Residential' : 'Commercial'}</span></div>
          </div>
          <div className="fcard__r">
            <p className="fcard__meta">{p.units}</p>
            <p className="fcard__where"><span>{p.locality}</span> <i>&middot;</i> <span className="nw">{priceOf(p)}</span></p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Projects() {
  const root = useRef();
  const { open } = useEnquiry();
  const [on, setOn] = useState(0);
  useReveal(root, []);

  useLayoutEffect(() => {
    if (reduced()) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.fcard').forEach((card) => {
        const frame = card.querySelector('.fcard__frame');
        const img = card.querySelector('.fcard__img');
        const txt = card.querySelectorAll('.fcard__in > *');
        gsap.fromTo(frame, { clipPath: 'inset(14% 9% 14% 9% round 30px)', y: 70 }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', y: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top 94%', end: 'top 42%', scrub: true } });
        gsap.fromTo(img, { scale: 1.28, yPercent: -6 }, { scale: 1.02, yPercent: 6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo(txt, { y: 34, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, ease: 'expo.out', duration: 1, scrollTrigger: { trigger: card, start: 'top 60%', once: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="props">
      <section className="pintro stripes">
        <Eyebrow data-r>Projects</Eyebrow>
        <h1 className="h1" data-r data-r-delay="0.05">Homes we are <em>building</em> now</h1>
        <p className="lead" data-r data-r-delay="0.1">
          Apartments from ₹{company.startingPriceLakhs} lakhs, in 2, 3 and 4 BHK, and commercial space across Bengaluru. Two are going up now and two are being planned.
        </p>
      </section>

      <section className="pfeat">
        {featured.map((p, i) => (
          <Featured key={p.slug} p={p} cls={`fcard--${i + 1}`} />
        ))}
      </section>

      <section className="pmore">
        <div className="pmore__head">
          <Eyebrow data-r>Already built</Eyebrow>
          <h2 className="h2" data-r data-r-delay="0.05">Everything else <span className="grey">we have built</span></h2>
        </div>
        <div className="pmore__body">
          <div className="pmore__pic" data-r>
            {built.map((p, i) => {
              const m = imgOf(p.slug);
              return <img key={p.slug} className={on === i ? 'is-on' : ''} src={m.src} alt={on === i ? m.alt : ''} width="1200" height="1500" loading={i < 2 ? 'eager' : 'lazy'} />;
            })}
          </div>
          <ul className="pmore__list" data-r>
            {built.map((p, i) => (
              <li key={p.slug}>
                <Link to={`/projects/${p.slug}`} className={`mr ${on === i ? 'is-on' : ''}`} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)}>
                  <span className="mr__main">
                    <b>{p.name}</b>
                    <small>{p.locality}, Bengaluru</small>
                  </span>
                  <span className="mr__pills"><i>{p.units}</i><i>{p.kind}</i></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pcta">
        <img src="/img/photos/img2.jpg" alt="" width="1200" height="900" loading="lazy" />
        <div className="pcta__in">
          <Eyebrow data-r>Get started</Eyebrow>
          <h2 className="h1" data-r data-r-delay="0.05">Your next home <em>starts here</em></h2>
          <Btn variant="light" onClick={() => open()} data-r data-r-delay="0.1">Book a visit</Btn>
        </div>
      </section>
    </div>
  );
}
