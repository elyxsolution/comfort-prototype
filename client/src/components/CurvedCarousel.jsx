import { useEffect, useRef } from 'react';
import { CAROUSEL } from '../lib/media.js';
import { reduced } from '../lib/motion.js';

// A running strip of pictures whose top and bottom edges follow a shallow arc, like the Avenlo About page.
// It keeps drifting, speeds up while you scroll, and slows to a stop under the pointer.
export default function CurvedCarousel({ items = CAROUSEL }) {
  const track = useRef();
  const wrap = useRef();

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    let x = 0;
    let boost = 0;
    let slow = 1;
    let target = 1;
    let last = performance.now();
    let lastY = window.scrollY;
    let raf;
    let visible = true;
    const half = () => el.scrollWidth / 2;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '200px' });
    io.observe(wrap.current);
    const still = reduced();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || still) return;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      boost += (Math.min(Math.abs(dy), 90) * 0.5 - boost) * Math.min(1, dt * 6);
      slow += (target - slow) * Math.min(1, dt * 5);
      x -= (46 + boost * 14) * slow * dt;
      const w = half();
      if (x <= -w) x += w;
      el.style.transform = `translate3d(${x}px,0,0)`;
    };
    raf = requestAnimationFrame(tick);
    const enter = () => (target = 0);
    const leave = () => (target = 1);
    wrap.current.addEventListener('pointerenter', enter);
    wrap.current.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      wrap.current?.removeEventListener('pointerenter', enter);
      wrap.current?.removeEventListener('pointerleave', leave);
    };
  }, []);

  const list = [...items, ...items];
  return (
    <div className="arc" ref={wrap} aria-roledescription="carousel" aria-label="Photographs of Comfort Builders projects">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="arcClip" clipPathUnits="objectBoundingBox">
            <path d="M0,0 Q0.5,0.16 1,0 L1,1 Q0.5,0.84 0,1 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="arc__clip">
        <div className="arc__track" ref={track}>
          {list.map((p, i) => (
            <figure className="arc__item" key={i} aria-hidden={i >= items.length ? 'true' : undefined}>
              <img src={p.src} alt={i >= items.length ? '' : p.alt} width="680" height="900" loading={i < 4 ? 'eager' : 'lazy'} draggable="false" />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
