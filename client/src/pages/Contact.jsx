import { useRef } from 'react';
import { EnquiryForm } from '../components/Enquiry.jsx';
import { catalogue, waLink } from '../lib/data.js';
import { useReveal, useDrift } from '../lib/motion.js';
import PageHero from '../components/PageHero.jsx';
import Archive from '../components/Archive.jsx';

const MAP =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d242.98401925467957!2d77.57967144967326!3d12.988199149995554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1615e596ecd9%3A0x9e1c41ce5e105539!2s2%2C%20N%20Park%20Rd%2C%20Kumara%20Park%20East%2C%20Seshadripuram%2C%20Bengaluru%2C%20Karnataka%20560001!5e0!3m2!1sen!2sin!4v1581414789211!5m2!1sen!2sin';

export default function Contact() {
  const root = useRef();
  useReveal(root, []);
  useDrift(root, []);
  const c = catalogue.company;
  return (
    <div ref={root} className="page contact">
      <PageHero>
        <span className="eyebrow" data-r>Get in touch</span>
        <h1 className="h1" data-r data-r-delay="0.05">Let&rsquo;s <em>talk.</em></h1>
        <p className="lead" data-r data-r-delay="0.08">Call, message or visit. Or leave your number and we will call you back.</p>
      </PageHero>
      <div className="contact__grid">
        <div className="contact__info">
          <div data-r>
            <h2 className="lead-strong">Head office</h2>
            <address>
              {c.address.map((l) => <span key={l}>{l}<br /></span>)}
            </address>
          </div>
          <div data-r>
            <h2 className="lead-strong">Phone</h2>
            <p>
              {c.phones.map((p) => <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block">{p}</a>)}
              <span className="soft">Fax {c.fax}</span>
            </p>
          </div>
          <div data-r>
            <h2 className="lead-strong">Write</h2>
            <p>
              <a className="block" href={`mailto:${c.email}`}>{c.email}</a>
              <a className="block" href={waLink()} target="_blank" rel="noreferrer">Message us on WhatsApp</a>
            </p>
          </div>
        </div>
        <div className="contact__form" data-r>
          <h2 className="head">Request a call back.</h2>
          <EnquiryForm source="contact" />
        </div>
      </div>
      <div className="contact__map" data-r>
        <iframe title="Map to the Comfort Builders head office on North Park Road, Bengaluru" src={MAP} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <Archive keys={['vidhana', 'map', 'street', 'lalbagh']} title="Find us in the middle of it." />
    </div>
  );
}
