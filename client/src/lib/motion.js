import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
export const EASE = 'expo.out';
export const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Entrance for every [data-r] inside the scope: rise and fade once, staggered by DOM order within a group.
// Content stays visible if script never runs (the hidden state is set here, not in CSS).
export function useReveal(scope, deps = []) {
  useLayoutEffect(() => {
    if (reduced() || !scope.current) return undefined;
    const ctx = gsap.context(() => {
      const items = Array.from(scope.current.querySelectorAll('[data-r]'));
      items.forEach((el) => {
        const delay = Number(el.dataset.rDelay || 0);
        gsap.set(el, { y: Number(el.dataset.rY || 28), opacity: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 1.05, delay, ease: EASE, clearProps: 'transform' }),
        });
      });
    }, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Slow scale-and-drift on a picture as it crosses the screen (transform only).
export function useDrift(scope, deps = []) {
  useLayoutEffect(() => {
    if (reduced() || !scope.current) return undefined;
    const ctx = gsap.context(() => {
      Array.from(scope.current.querySelectorAll('[data-drift]')).forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 1.16, yPercent: -4 },
          { scale: 1.02, yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }
        );
      });
    }, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
