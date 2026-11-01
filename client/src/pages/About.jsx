import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Btn, Arrow, ScrubText } from '../components/Ui.jsx';
import { useEnquiry } from '../components/Enquiry.jsx';
import { catalogue, yearsSince } from '../lib/data.js';
import { useReveal, useDrift } from '../lib/motion.js';
import PageHero from '../components/PageHero.jsx';
import CurvedCarousel from '../components/CurvedCarousel.jsx';
import Archive from '../components/Archive.jsx';

const VALUES = [
  ['Ethical, value-based business.', 'We do business the way we would want it done with us.'],
  ['Open in every transaction.', 'What you are buying, what it costs and what comes with it, said plainly.'],
  ['Access and value.', 'Homes that are easy to reach and that hold their value over the years.'],
  ['Quality and fresh thinking.', 'Years of experience in construction and property management, applied with care.'],
  ['Long relationships.', 'We would rather you refer us to a friend than sell you something once.'],
];

export default function About() {
  const root = useRef();
  const { open } = useEnquiry();
  useReveal(root, []);
  useDrift(root, []);
  const c = catalogue.company;
  return (
    <div ref={root} className="page about">
      <PageHero>
        <span className="eyebrow" data-r>Our story</span>
        <h1 className="h1" data-r data-r-delay="0.05">More than just <em>comfort.</em></h1>
        <p className="lead" data-r data-r-delay="0.08">
          Comfort Builders &amp; Developers is a Bengaluru property developer. We have been at it for {yearsSince()} years, and we still treat every home as if it were our own.
        </p>
      </PageHero>
      <div className="bleed" data-r><CurvedCarousel /></div>

      <section className="about__story">
        <ScrubText className="about__big">
          We build homes, villas and commercial complexes in Bengaluru, and manage property too. We aim to be the builder you would send your family to.
        </ScrubText>
        <div className="about__cols">
          <p data-r>
            Comfort Builders started in Bengaluru with property development as its main focus. Over the years we have worked on a range of prestigious real estate projects with the city&rsquo;s leading developers, and we have clients well beyond Bengaluru.
          </p>
          <p data-r data-r-delay="0.08">
            Our projects are planned around good amenities and a relaxed ambience. Our marketing team knows Bengaluru&rsquo;s property market well, which helps buyers close a deal that is fair to them.
          </p>
        </div>
      </section>

      <section className="about__note">
        <figure className="plate plate--tall" data-r>
          <div className="plate__frame plate__frame--tall">
            <img data-drift src="/img/map-1791.jpg" width="1507" height="2000" loading="lazy" alt="A historic plan of the fort and town of Bangalore as stormed by the British Army in 1791" />
          </div>
          <figcaption>Plan of the Fort and Petta of Bangalore, 1791, by Colin Mackenzie (public domain).</figcaption>
        </figure>
        <div className="about__letter">
          <h2 className="head" data-r>A note from our Managing Partner.</h2>
          <p data-r>
            Shri {c.partner} has been building homes in Bengaluru since {c.since}. His personal attention and the quality of his work are the reason customers keep referring him to people who want to buy property.
          </p>
          <p data-r>
            He has deep knowledge of construction, quality and planning, and he believes exceptional relationships with customers are the key to their satisfaction. From pre-construction to after closing, the promise is honesty, quality of work and attention to detail.
          </p>
          <p className="sign" data-r>{c.partner}<br /><small>{c.partnerTitle}, Comfort Builders &amp; Developers</small></p>
        </div>
      </section>

      <section className="about__values">
        <h2 className="head" data-r>What we hold to.</h2>
        <ol className="values">
          {VALUES.map(([t, d]) => (
            <li key={t} data-r>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <Archive keys={['street', 'lalbagh', 'vidhana', 'map']} title="The city that raised us." />

      <section className="note">
        <p className="note__title" data-r>Want to meet the team?</p>
        <p data-r>Visit us at {c.address.join(', ')}, or book a site visit and we will come to you.</p>
        <div className="note__actions" data-r>
          <Btn onClick={() => open()}>Book a site visit <Arrow /></Btn>
          <Link className="textlink" to="/contact">Contact details</Link>
        </div>
      </section>
    </div>
  );
}
