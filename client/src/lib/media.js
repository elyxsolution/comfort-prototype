import { bySlug } from './data.js';

// Photographs supplied by the client sit on the projects they most plausibly belong to.
// The mapping is a placeholder: swap a file name here when the right photograph is confirmed.
const PHOTO = {
  'comfort-heights': 'c25',
  'comfort-vimalaprabha': 'img2',
  'residential-jp-nagar-9th-phase': 'pro',
  'comfort-arizona': 'img8',
  'comfort-vishwasta': 'img1',
  'comfort-greens': 'img6',
  'comfort-enclave': 'pro2',
  'kaushal-emerald': 'pro3',
};

export function imgOf(slug) {
  const p = bySlug(slug);
  const name = p ? p.name : slug;
  if (PHOTO[slug]) return { src: `/img/photos/${PHOTO[slug]}.jpg`, alt: `${name}${p ? ', ' + p.locality : ''}`, kind: 'photo' };
  return { src: `/img/renders/${slug}.jpg`, alt: `Illustrative 3D render of ${name}${p ? ', ' + p.locality : ''}`, kind: 'render' };
}

// Photographs for the About page carousel, in running order.
export const CAROUSEL = [
  { src: '/img/photos/c25.jpg', alt: 'A Comfort apartment tower under construction against a blue sky' },
  { src: '/img/photos/img2.jpg', alt: 'A white and ochre apartment tower beside its entrance gate' },
  { src: '/img/photos/pro.jpg', alt: 'Architect rendering of an apartment block with blue accents and a garden court' },
  { src: '/img/photos/img6.jpg', alt: 'Apartment tower with ochre bands and a steel entrance arch' },
  { src: '/img/photos/pro3.jpg', alt: 'Kaushal Emerald, a glass-fronted commercial complex' },
  { src: '/img/photos/img1.jpg', alt: 'Balconied white tower with ochre columns and a gatehouse' },
  { src: '/img/photos/pro2.jpg', alt: 'Architect rendering of a stone-clad apartment building on a street corner' },
  { src: '/img/photos/img8.jpg', alt: 'Two apartment towers with ochre facades facing a courtyard' },
];
