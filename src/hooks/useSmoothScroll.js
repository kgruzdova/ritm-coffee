import { useCallback, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../lib/animation';

export default function useSmoothScroll({ ready, reducedMotion, locked }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!ready || reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
      prevent: (node) => node.hasAttribute('data-lenis-prevent'),
    });
    lenisRef.current = lenis;
    const tick = (time) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [ready, reducedMotion]);

  useEffect(() => {
    const oldOverflow = document.documentElement.style.overflow;
    if (locked || !ready) {
      document.documentElement.style.overflow = 'hidden';
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
    return () => { document.documentElement.style.overflow = oldOverflow; };
  }, [locked, ready, reducedMotion]);

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    return () => { alive = false; };
  }, []);

  return useCallback((target) => {
    if (!target) return;
    // Lenis and native anchors both respect the responsive CSS scroll padding.
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.25, force: true });
    else target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  }, [reducedMotion]);
}
