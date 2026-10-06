import { useLayoutEffect, useRef } from 'react';
import SplitType from 'split-type';
import { gsap } from '../lib/animation';

export default function RevealTitle({ lines, as: Tag = 'h2', className = '', ready = true, reducedMotion = false, intro = false, animate = true, id }) {
  const ref = useRef(null);
  const label = lines.join(' ');

  useLayoutEffect(() => {
    if (!ready || reducedMotion || !animate) return;
    const splits = Array.from(ref.current.children).map((mask) => new SplitType(mask.firstElementChild, { types: 'lines', lineClass: 'split-line' }));
    const splitLines = splits.flatMap((split) => split.lines);
    const ctx = gsap.context(() => {
      gsap.fromTo(splitLines, { yPercent: 112 }, {
        yPercent: 0,
        duration: 1.05,
        stagger: 0.09,
        ease: 'power4.out',
        delay: intro ? 0.18 : 0,
        ...(!intro && { scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }),
      });
    }, ref);
    return () => { ctx.revert(); splits.forEach((split) => split.revert()); };
  }, [ready, reducedMotion, intro, animate, label]);

  return <Tag id={id} ref={ref} className={`reveal-title ${className} ${!ready ? 'awaiting-intro' : ''}`} aria-label={label}>
    {lines.map((line, i) => <span className="line-mask" aria-hidden="true" key={i}><span className="line-content">{line}</span></span>)}
  </Tag>;
}
