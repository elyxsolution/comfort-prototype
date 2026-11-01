import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Wordmark, Btn, Mark } from './Ui.jsx';
import { useEnquiry } from './Enquiry.jsx';
import { catalogue, waLink } from '../lib/data.js';

const LINKS = [
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

function Plus() {
  return (
    <svg className="plus" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// The top bar scrolls away with the page. Once you have scrolled, a small dock holds the menu and the one action.
export function Nav() {
  const { open } = useEnquiry();
  const [menu, setMenu] = useState(false);
  const [docked, setDocked] = useState(false);
  const sentinel = useRef();
  const { pathname } = useLocation();

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', menu);
    return () => document.body.classList.remove('no-scroll');
  }, [menu]);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting), { threshold: 0 });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <span ref={sentinel} className="sentinel" aria-hidden="true" />
      <header className="topbar">
        <a className="skip" href="#main">Skip to content</a>
        <Wordmark height={88} />
        <nav className="topbar__links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `topbar__link ${isActive ? 'is-active' : ''}`}>
              <Plus />
              {l.label}
            </NavLink>
          ))}
          <Btn className="topbar__cta" onClick={() => open()}>Book a visit</Btn>
        </nav>
        <button className="burger" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu((m) => !m)}>
          <span className="sr">Menu</span>
          <i /><i />
        </button>
      </header>

      <div className={`dock ${docked || menu ? 'is-in' : ''}`}>
        <Link to="/" className="dock__mark" aria-label="Comfort Builders, home"><Mark size={34} /><b>Comfort</b></Link>
        <button className="dock__book" onClick={() => open()}>Book a visit</button>
        <button className="dock__menu" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu((m) => !m)}>
          <span className="sr">{menu ? 'Close menu' : 'Open menu'}</span>
          <i /><i /><i />
        </button>
      </div>

      <div id="menu" className="menu" hidden={!menu}>
        {[...LINKS, { to: '/career', label: 'Career' }].map((l) => (
          <Link key={l.to} to={l.to} className="menu__link">{l.label}</Link>
        ))}
        <Btn variant="dark" onClick={() => { setMenu(false); open(); }}>Book a visit</Btn>
      </div>
    </>
  );
}

export function Footer() {
  const c = catalogue.company;
  const { open } = useEnquiry();
  return (
    <footer className="footer on-dark">
      <div className="footer__top">
        <div className="footer__col footer__col--intro">
          <Wordmark tone="dark" height={84} />
          <p>Building homes in Bengaluru since {c.since}.</p>
          <Btn variant="light" onClick={() => open()}>Book a visit</Btn>
        </div>
        <nav aria-label="Footer" className="footer__col">
          <p className="footer__h">Pages</p>
          {[
            ['/projects', 'Projects'],
            ['/about', 'About'],
            ['/gallery', 'Gallery'],
            ['/career', 'Career'],
            ['/contact', 'Contact'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="footer__link">{label}</Link>
          ))}
        </nav>
        <div className="footer__col">
          <p className="footer__h">Projects</p>
          {catalogue.projects.filter((p) => p.status !== 'completed').map((p) => (
            <Link key={p.slug} to={`/projects/${p.slug}`} className="footer__link">{p.name}</Link>
          ))}
        </div>
        <div className="footer__col">
          <p className="footer__h">Visit or call</p>
          <address>
            {c.address.map((l) => <span key={l}>{l}<br /></span>)}
            {c.phones.map((p) => <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="footer__link">{p}</a>)}
          </address>
          <a href={`mailto:${c.email}`} className="footer__link">{c.email}</a>
          <a href={waLink()} target="_blank" rel="noreferrer" className="footer__link">WhatsApp us</a>
        </div>
      </div>
      <p className="footer__giant" aria-hidden="true">Comfort</p>
      <p className="footer__legal">
        RERA No. {c.reraNumber} (as published on the current site; project to be confirmed). Project images are illustrative 3D renders. Pictures: Bangalore 1900, public domain, John Bartholomew, via Wikimedia Commons.
        Lalbagh glass house by Subhashish Panigrahi (CC BY-SA 3.0). Vidhana Soudha by DeepanjanGhosh (CC BY-SA 4.0). Commercial Street, Bangalore, by CH Doveton, 1900 (CC BY-SA 3.0). Hebbal view video by Yourusernamewillbepublic2 (CC0).
      </p>
    </footer>
  );
}
