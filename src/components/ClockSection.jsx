import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/animation';
import { venues } from '../data/menu';
import AssetImage from './AssetImage';
import Arrow from './Arrow';

function ClockFace() {
  return <svg viewBox="0 0 600 600" className="clock-face" aria-hidden="true">
    <circle cx="300" cy="300" r="297" fill="#f7f4ee" />
    {Array.from({ length: 60 }, (_, i) => <line key={i} x1="300" y1="27" x2="300" y2={i % 5 === 0 ? 48 : 35} transform={`rotate(${i * 6} 300 300)`} stroke={i % 5 === 0 ? '#29251f' : '#9f9b92'} strokeWidth={i % 5 === 0 ? 2 : 1} />)}
    {Array.from({ length: 12 }, (_, i) => {
      const angle = ((i + 1) * 30 - 90) * Math.PI / 180;
      return <text key={i} x={300 + Math.cos(angle) * 224} y={310 + Math.sin(angle) * 224} textAnchor="middle" fill="#514d45" fontSize="25" fontFamily="Golos Text, sans-serif">{i + 1}</text>;
    })}
    <circle cx="300" cy="300" r="176" fill="none" stroke="#dad5ca" strokeWidth="0.6" strokeDasharray="1 8" />
  </svg>;
}

export default function ClockSection({ ready, reducedMotion, mobile }) {
  const root = useRef(null);
  const cup = useRef(null);
  const [selected, setSelected] = useState(0);
  const venue = venues[selected];
  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          id: 'clock-parallax',
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          invalidateOnRefresh: true,
          scrub: 1,
        },
        defaults: { ease: 'none' },
      }).fromTo(cup.current,
        { y: mobile ? 10 : 20, rotation: 0, scale: 0.94 },
        { y: mobile ? -10 : -20, rotation: 25, scale: 1.02 },
        0,
      );
    }, root);
    return () => ctx.revert();
  }, [ready, reducedMotion, mobile]);
  return <section id="locations" className="clock-section paper-section" ref={root} aria-labelledby="locations-title">
    <div className="paper-mark clock-mark" aria-hidden="true">Р</div>
    <div className="section-topline"><h2 id="locations-title" className="eyebrow">/ 04 — ВРЕМЯ ДЛЯ КОФЕ</h2><span className="eyebrow">ДЛЯ ВСТРЕЧ. ДЛЯ СЕБЯ. ДЛЯ ТЕБЯ.</span></div>
    <div className="clock-visual"><div className="clock-face-layer"><ClockFace /></div><div ref={cup} className="clock-cup-layer"><AssetImage name="iced-latte" alt="Айс-латте с молочными разводами, льдом и трубочкой в центре большого циферблата" sizes="(max-width: 700px) 40vw, 28vw" /></div><span className="clock-caption">ХОРОШИЙ КОФЕ<br />В ЛЮБОЙ ЧАС.</span></div>
    <div className="clock-contact">
    <div className="locations-list" role="tablist" aria-label="Выберите кофейню">{venues.map((item, i) => <button key={item.name} role="tab" id={`venue-tab-${i}`} aria-controls="venue-panel" aria-selected={selected === i} tabIndex={selected === i ? 0 : -1} onClick={() => setSelected(i)} onKeyDown={(e) => { if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? venues.length - 1 : (i + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1) + venues.length) % venues.length; setSelected(next); e.currentTarget.parentElement.children[next].focus(); } }}><span className="eyebrow">/{item.number}</span><span>{item.name}</span><span className="venue-arrow">↗</span></button>)}</div>
    <div id="venue-panel" role="tabpanel" aria-labelledby={`venue-tab-${selected}`} className="venue-panel"><span className="eyebrow">ЗАХОДИ. МЫ РЯДОМ.</span><p>{venue.address}<br /><span>{venue.metro}</span></p><a href={`https://yandex.ru/maps/?text=${encodeURIComponent(`Москва, ${venue.address}`)}`} target="_blank" rel="noreferrer" className="text-link">НА КАРТЕ <Arrow diagonal /></a></div>
    </div>
    <div className="clock-hours"><span className="status-dot" /><span className="eyebrow">КАЖДЫЙ ДЕНЬ<br /><strong>{venue.hours}</strong></span></div>
    <span className="clock-handwritten handwritten" aria-hidden="true">ты вовремя</span>
  </section>;
}
