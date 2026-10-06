import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animation';
import { assetUrl } from '../lib/assets';

export default function Preloader({ onComplete, reducedMotion }) {
  const root = useRef(null);
  const number = useRef(null);
  const liquid = useRef(null);

  useLayoutEffect(() => {
    let active = true;
    let timeout;
    const progress = { value: 0 };
    const image = new Image();
    image.srcset = `${assetUrl('hero-cup-480.avif')} 480w, ${assetUrl('hero-cup.avif')} 960w`;
    image.sizes = '(max-width: 370px) 92vw, (max-width: 700px) 84vw, (max-width: 1050px) 51vw, 39vw';
    image.src = assetUrl('hero-cup.avif');
    const assets = Promise.race([
      Promise.allSettled([image.decode(), document.fonts.ready]),
      new Promise((resolve) => { timeout = window.setTimeout(resolve, 5500); }),
    ]);
    const ctx = gsap.context(() => {
      gsap.set(liquid.current, { svgOrigin: '76 205', scaleY: 0, opacity: 1 });
      const update = () => {
        number.current.textContent = Math.round(progress.value).toString().padStart(3, '0');
        gsap.set(liquid.current, { scaleY: progress.value / 100 });
      };
      const finish = () => assets.then(() => {
        if (!active) return;
        ctx.add(() => {
          gsap.timeline({ onComplete }).to(progress, { value: 100, duration: reducedMotion ? 0 : 0.32, onUpdate: update })
            .to(root.current, { yPercent: -101, duration: reducedMotion ? 0 : 0.9, ease: 'power4.inOut', delay: reducedMotion ? 0 : 0.18 });
        });
      });
      gsap.to(progress, { value: 92, duration: reducedMotion ? 0 : 2.05, ease: 'power1.inOut', onUpdate: update, onComplete: finish });
    }, root);
    return () => { active = false; window.clearTimeout(timeout); ctx.revert(); };
  }, [onComplete, reducedMotion]);

  return <div ref={root} className="preloader" role="status" aria-label="Готовим ваш кофе">
    <div className="preloader-top"><span className="eyebrow">/ ЗАВАРИВАЕМ ХОРОШИЙ ДЕНЬ</span><button type="button" onClick={onComplete}>ПРОПУСТИТЬ ↗</button></div>
    <span ref={number} className="preloader-count" aria-hidden="true">000</span>
    <svg className="preloader-cup" viewBox="0 0 150 220" fill="none" aria-hidden="true">
      <defs><clipPath id="loading-cup"><path d="M24 25h102l-13 169q-1 10-11 10H48q-10 0-11-10Z" /></clipPath><linearGradient id="coffee-fill" x1="0" y1="20" x2="0" y2="205" gradientUnits="userSpaceOnUse"><stop stopColor="#d8a767" /><stop offset="1" stopColor="#8d562b" /></linearGradient></defs>
      <g clipPath="url(#loading-cup)"><rect ref={liquid} className="preloader-liquid" x="20" y="25" width="112" height="180" fill="url(#coffee-fill)" /></g>
      <path d="M15 25h120M24 25l13 169q1 10 11 10h54q10 0 11-10l13-169" stroke="#eee9de" strokeWidth="2" />
    </svg>
    <div className="preloader-bottom"><span className="wordmark">РИТМ<span className="logo-dot">®</span></span><span className="eyebrow">ВСЁ ХОРОШЕЕ НАЧИНАЕТСЯ С КОФЕ.</span></div>
  </div>;
}
