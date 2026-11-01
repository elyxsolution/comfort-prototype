import { useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Btn, Eyebrow } from '../components/Ui.jsx';
import { EnquiryForm, useEnquiry } from '../components/Enquiry.jsx';
import Archive from '../components/Archive.jsx';
import { bySlug, catalogue, STATUS_LABEL } from '../lib/data.js';
import { useReveal, useDrift } from '../lib/motion.js';

const COPY = {
  ongoing: 'Construction is under way. Book a site visit to see the progress, the plans and the paperwork.',
  upcoming: 'This project is being planned. Leave your number and we will tell you first when details are ready.',
  completed: 'This project is complete.',
};

export default function ProjectDetail() {
  const { slug } = useParams();
  const p = bySlug(slug);
  if (!p) return <Navigate to="/projects" replace />;
  return <Detail key={p.slug} p={p} />;
}

function Detail({ p }) {
  const root = useRef();
  const { open } = useEnquiry();
  useReveal(root, []);
  useDrift(root, []);
  const others = catalogue.projects.filter((x) => x.slug !== p.slug && x.status === p.status).slice(0, 3);
  const facts = [
    ['Status', STATUS_LABEL[p.status]],
    ['Where', p.locality],
    ['Type', p.kind],
    ['Homes', p.units],
  ];
  return (
    <div ref={root} className="detail">
      <header className="dhead">
        <Eyebrow data-r>{STATUS_LABEL[p.status]} &middot; {p.locality}</Eyebrow>
        <h1 className="h1" data-r data-r-delay="0.05">{p.name}</h1>
        <p className="lead" data-r data-r-delay="0.1">
          {p.meaning ? p.meaning + ' ' : ''}
          {p.name} is {p.residential ? 'a residential' : 'a commercial'} project in {p.locality}, Bengaluru. {COPY[p.status]}
        </p>
        <div className="dhead__actions" data-r data-r-delay="0.15">
          <Btn variant="dark" onClick={() => open({ project: p.slug })}>Book a site visit</Btn>
          <a className="textlink" href="#enquire">Or leave your number</a>
        </div>
      </header>

      <figure className="dhero" data-r>
        <img data-drift src={'/img/renders/' + p.slug + '.jpg'} width="1600" height="900" alt={'Illustrative 3D render of ' + p.name + ', ' + p.locality} />
        <figcaption className="dhero__tag">An illustrative render, not the final design.</figcaption>
      </figure>

      <dl className="facts">
        {facts.map(([k, v]) => (
          <div key={k} data-r>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <section className="dbody">
        <div className="dbody__ask">
          <Eyebrow data-r>The details</Eyebrow>
          <h2 className="h2" data-r data-r-delay="0.05">Ask for <em>the details.</em></h2>
          <p data-r>Floor plans, specifications and the price list are shared on request, along with the RERA number and approvals for this project.</p>
          <ul className="plain" data-r style={{ width: '100%' }}>
            <li>Floor plans and unit sizes</li>
            <li>Specifications and finishes</li>
            <li>Price list and payment plan</li>
            <li>RERA number, OC/CC status and bank approvals</li>
          </ul>
        </div>
        <div id="enquire" className="dform" data-r>
          <h2 className="h3">Request a call back.</h2>
          <EnquiryForm project={p.status === 'completed' ? '' : p.slug} source={'project:' + p.slug} />
        </div>
      </section>

      {others.length > 0 && (
        <section className="dmore">
          <Eyebrow data-r>More {STATUS_LABEL[p.status].toLowerCase()} projects</Eyebrow>
          <ul className="plain plain--links" data-r>
            {others.map((o) => (
              <li key={o.slug}>
                <Link to={'/projects/' + o.slug}>{o.name} <small>{o.locality}</small></Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Archive narrow title="Around our projects." keys={['street', 'lalbagh', 'map', 'vidhana']} />
      <p className="detail__back"><Link className="textlink" to="/projects">Back to all projects</Link></p>
    </div>
  );
}
