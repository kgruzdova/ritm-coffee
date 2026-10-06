import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animation';

const drinks = [
  { name: 'АВТОРСКИЙ ЛАТТЕ', price: '290 ₽', note: 'ДВОЙНОЙ ЭСПРЕССО · МОЛОКО · ЛЮБОВЬ' },
  { name: 'ЭСПРЕССО', price: '190 ₽', note: 'БРАЗИЛИЯ · ШОКОЛАД · ЧИСТЫЙ ХАРАКТЕР' },
  { name: 'КАПУЧИНО', price: '260 ₽', note: 'ЭСПРЕССО · НЕЖНАЯ ПЕНА · ТВОЯ ПАУЗА' },
];

export default function DrinkTicker({ ready, reducedMotion }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    let timeline;
    let visible = false;
    const ctx = gsap.context(() => {
      const slides = Array.from(root.current.children);
      gsap.set(slides, { autoAlpha: 0 });
      gsap.set(slides[0], { autoAlpha: 1 });
      // Allow the Hero entrance to finish before counting the first full hold.
      timeline = gsap.timeline({ paused: true, repeat: -1, delay: 1.5 });
      slides.forEach((slide, i) => {
        timeline.to(slide, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, '+=7')
          .fromTo(slides[(i + 1) % slides.length], { autoAlpha: 0 }, {
            autoAlpha: 1, duration: 0.6, ease: 'power1.inOut',
            // The final transition targets slide 0; never hide it while building
            // the timeline. Matching fades keep total text opacity at 1.
            immediateRender: false,
          }, '<');
      });
    }, root);
    const syncPlayback = () => {
      if (visible && !document.hidden) timeline.play();
      else timeline.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.1 });
    observer.observe(root.current);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      ctx.revert();
    };
  }, [ready, reducedMotion]);

  return <div ref={root} className="drink-ticker">
    {drinks.map((drink) => <div className="drink-slide" key={drink.name}>
      <div className="drink-slide-row"><strong>{drink.name}</strong><span>{drink.price}</span></div>
      <span className="sticker-bottom">{drink.note}</span>
    </div>)}
  </div>;
}
