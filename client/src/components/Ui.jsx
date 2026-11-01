import { Children, forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, reduced } from '../lib/motion.js';
import Logo3D, { LogoSvg } from './Logo3D.jsx';

// The client's own mark: the arc of wavy gold rays, traced from their logo.
export function Mark({ size = 28 }) {
  return <LogoSvg mark className="markico" style={{ width: size, height: size }} />;
}

export function Wordmark({ tone = 'light', height = 70 }) {
  return <Logo3D tone={tone} height={height} />;
}

// A flat rectangle held by four corner brackets. It fills solid on hover. Any <Arrow /> passed as a child is dropped.
export const Btn = forwardRef(function Btn({ to, href, variant = 'primary', children, className = '', ...rest }, fwd) {
  const local = useRef();
  const ref = fwd || local;
  const cls = `btn btn--${variant} ${className}`;
  const label = Children.toArray(children).filter((c) => c?.type !== Arrow);
  const inner = (
    <>
      <span className="btn__label">{label}</span>
      <i className="c c-tl" /><i className="c c-tr" /><i className="c c-bl" /><i className="c c-br" />
    </>
  );
  if (to) return <Link ref={ref} to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a ref={ref} href={href} className={cls} {...rest}>{inner}</a>;
  return <button ref={ref} type="button" className={cls} {...rest}>{inner}</button>;
});

// A small square marker and a wide-tracked caption.
export function Eyebrow({ children, ...rest }) {
  return <p className="eyebrow" {...rest}><i />{children}</p>;
}

// A muted loop that plays only while on screen and holds on its poster for people who prefer reduced motion.
export function Loop({ src, poster, label, className = '' }) {
  const ref = useRef();
  useEffect(() => {
    const v = ref.current;
    if (!v || reduced()) return undefined;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} />;
}

export function Arrow() {
  return (
    <svg className="arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M2 9h13M10 3.5 15.5 9 10 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

// Words come in as you read. The final state is full ink; text is never left faded.
export function ScrubText({ children, as: Tag = 'p', className = '' }) {
  const ref = useRef();
  const words = String(children).split(' ');
  useLayoutEffect(() => {
    if (reduced() || !ref.current) return undefined;
    const spans = ref.current.querySelectorAll('.w');
    const tween = gsap.fromTo(
      spans,
      { opacity: 0.32 },
      { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'bottom 48%', scrub: true } }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(spans, { clearProps: 'opacity' });
    };
  }, [children]);
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <span className="w" key={i}>
          {w}{' '}
        </span>
      ))}
    </Tag>
  );
}

export function Field({ label, name, error, children, hint }) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`} htmlFor={name}>
      <span className="field__label">{label}</span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
