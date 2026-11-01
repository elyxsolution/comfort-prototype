const PICS = {
  vidhana: { src: '/img/vidhana.jpg', w: 1920, h: 1280, alt: 'Vidhana Soudha, Bengaluru, lit at night under a dark sky', cap: 'Vidhana Soudha. DeepanjanGhosh, CC BY-SA 4.0.' },
  lalbagh: { src: '/img/lalbagh.jpg', w: 1920, h: 1920, alt: 'The Lalbagh Glass House under a cloudy sky, in black and white', cap: 'Lalbagh Glass House. Subhashish Panigrahi, CC BY-SA 3.0.' },
  street: { src: '/img/commercial-street-1900.jpg', w: 1920, h: 1293, alt: 'Commercial Street, Bangalore, in 1900, with shopfronts and a pole', cap: 'Commercial Street, 1900. CH Doveton, CC BY-SA 3.0.' },
  map: { src: '/img/map-1900.jpg', w: 1920, h: 1672, alt: 'A printed map of Bangalore around 1900', cap: 'Bangalore, around 1900. John Bartholomew, public domain.' },
  siege: { src: '/img/map-1791.jpg', w: 1507, h: 2000, alt: 'A historic plan of the fort and town of Bangalore in 1791', cap: 'Plan of the Fort and Petta, 1791. Colin Mackenzie, public domain.' },
};

// A row of real pictures of the city the firm builds in. Each page picks its own four so no two pages repeat the same set.
export default function Archive({ keys = ['street', 'lalbagh', 'map', 'vidhana'], title = 'The city we build in.', narrow = false }) {
  return (
    <section className={`archive ${narrow ? 'archive--narrow' : ''}`}>
      <h2 className="lead-strong" data-r>{title}</h2>
      <div className="archive__grid">
        {keys.map((k, i) => {
          const p = PICS[k];
          return (
            <figure key={k} className={`archive__item archive__item--${i}`} data-r data-r-delay={i * 0.07}>
              <div className="archive__frame">
                <img data-drift src={p.src} width={p.w} height={p.h} loading="lazy" alt={p.alt} />
              </div>
              <figcaption>{p.cap}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
