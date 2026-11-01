import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Nav, Footer } from './components/Chrome.jsx';
import { EnquiryProvider } from './components/Enquiry.jsx';
import { gsap, ScrollTrigger, reduced } from './lib/motion.js';
import Home from './pages/Home.jsx';
import Render from './pages/Render.jsx';

const Projects = lazy(() => import('./pages/Projects.jsx'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Gallery = lazy(() => import('./pages/Gallery.jsx'));
const Career = lazy(() => import('./pages/Career.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

let lenis;

function useSmoothScroll() {
  useEffect(() => {
    if (reduced()) return undefined;
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    if (import.meta.env.DEV) window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenis = undefined;
    };
  }, []);
}

function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // The story is driven by scroll, so a reload always starts it from the beginning.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => (lenis ? lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView()), 60);
        return;
      }
    }
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    const id = setTimeout(() => ScrollTrigger.refresh(), 250);
    return () => clearTimeout(id);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/__render') return <Render />;
  const home = pathname === '/';
  useSmoothScroll();
  return (
    <EnquiryProvider>
      <RouteEffects />
      <Nav half={home} />
      <main id="main" key={pathname} className="route">
        <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/career" element={<Career />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </EnquiryProvider>
  );
}
