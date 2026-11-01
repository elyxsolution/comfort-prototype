import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReveal, useDrift } from '../lib/motion.js';
import PageHero from '../components/PageHero.jsx';
import { Loop } from '../components/Ui.jsx';

const PICS = [
  { src: '/img/vidhana.jpg', w: 1920, h: 1280, alt: 'Vidhana Soudha, Bengaluru, lit at night', cap: 'Vidhana Soudha. DeepanjanGhosh, CC BY-SA 4.0.', cls: 'g1' },
  { src: '/img/lalbagh.jpg', w: 1920, h: 1920, alt: 'The Lalbagh Glass House under a cloudy sky, in black and white', cap: 'Lalbagh Glass House. Subhashish Panigrahi, CC BY-SA 3.0.', cls: 'g2' },
  { src: '/img/commercial-street-1900.jpg', w: 1920, h: 1293, alt: 'Commercial Street, Bangalore, in 1900', cap: 'Commercial Street, 1900. CH Doveton, CC BY-SA 3.0.', cls: 'g3' },
  { src: '/img/map-1900.jpg', w: 1920, h: 1672, alt: 'A printed map of Bangalore around 1900', cap: 'Bangalore, around 1900. John Bartholomew, public domain.', cls: 'g4' },
];

export default function Gallery() {
  const root = useRef();
  useReveal(root, []);
  useDrift(root, []);
  return (
    <div ref={root} className="page">
      <PageHero>
        <span className="eyebrow" data-r>The city</span>
        <h1 className="h1" data-r data-r-delay="0.05"><em>Gallery.</em></h1>
        <p className="lead" data-r data-r-delay="0.08">
          Photographs of our projects will live here. Until they are added, this page shows the city we build in.
        </p>
      </PageHero>
      <div className="gal">
        {PICS.map((p) => (
          <figure key={p.src} className={`gal__item ${p.cls}`} data-r>
            <div className="gal__frame">
              <img data-drift src={p.src} width={p.w} height={p.h} loading="lazy" alt={p.alt} />
            </div>
            <figcaption>{p.cap}</figcaption>
          </figure>
        ))}
        <figure className="gal__item g5" data-r>
          <div className="gal__frame">
            <Loop className="gal__video" src="/img/hebbal.webm" poster="/img/hebbal-poster.jpg" label="Looking north across the tree canopy of Bengaluru under an overcast sky" />
          </div>
          <figcaption>Looking north over Bengaluru. Yourusernamewillbepublic2, CC0.</figcaption>
        </figure>
        <div className="gal__slot" data-r>
          <p className="lead-strong">Project photographs</p>
          <p>To be supplied by Comfort Builders: site progress, completed homes and handovers.</p>
          <Link className="textlink" to="/contact">Send us photographs</Link>
        </div>
      </div>
    </div>
  );
}
