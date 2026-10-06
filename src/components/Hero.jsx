import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animation';
import AssetImage from './AssetImage';
import RevealTitle from './RevealTitle';
import Receipt from './Receipt';
import Arrow from './Arrow';
import DrinkTicker from './DrinkTicker';
import useMediaQuery from '../hooks/useMediaQuery';
import { socials } from '../data/socials';

export default function Hero({ ready, reducedMotion, mobile, navigate }) {
  const root = useRef(null);
  const background = useRef(null);
  const copy = useRef(null);
  const receiptLayer = useRef(null);
  const receiptIntro = useRef(null);
  const cupLayer = useRef(null);
  const cupIntro = useRef(null);
  const receiptPointer = useRef(null);
  const cupPointer = useRef(null);
  const details = useRef(null);
  const sticker = useRef(null);
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(receiptIntro.current, { y: 500, rotation: 8 }, { y: 0, rotation: 0, duration: 1.35 }, 0)
        .fromTo(cupIntro.current, { y: 400, rotation: -5 }, { y: 0, rotation: 0, duration: 1.4 }, 0.1)
        .fromTo(details.current.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.9 }, 0.4)
        .fromTo(sticker.current, { x: 35, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8 }, 0.7);
    }, root);
    return () => ctx.revert();
  }, [ready, reducedMotion]);

  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    const ctx = gsap.context(() => {
      const factor = mobile ? 0.3 : 1;
      gsap.timeline({ scrollTrigger: { id: 'hero-parallax', trigger: root.current, start: 'top top', end: 'bottom top', scrub: 1 }, defaults: { ease: 'none' } })
        .to(receiptLayer.current, { y: -60 * factor }, 0)
        .to(cupLayer.current, { y: -120 * factor, rotation: mobile ? -8 : -12 }, 0)
        .to(copy.current, { y: -40 * factor }, 0)
        .to(background.current, { scale: 1.03 }, 0)
        .to(sticker.current, { y: -90 * factor }, 0);
    }, root);
    return () => ctx.revert();
  }, [ready, reducedMotion, mobile]);

  useLayoutEffect(() => {
    if (!ready || reducedMotion || mobile || !finePointer) return;
    const element = root.current;
    let move;
    let reset;
    const ctx = gsap.context(() => {
      const cupX = gsap.quickTo(cupPointer.current, 'x', { duration: 0.7, ease: 'power3.out' });
      const cupY = gsap.quickTo(cupPointer.current, 'y', { duration: 0.7, ease: 'power3.out' });
      const cupRotation = gsap.quickTo(cupPointer.current, 'rotation', { duration: 0.85, ease: 'power3.out' });
      const receiptX = gsap.quickTo(receiptPointer.current, 'x', { duration: 1, ease: 'power3.out' });
      const receiptY = gsap.quickTo(receiptPointer.current, 'y', { duration: 1, ease: 'power3.out' });
      const receiptRotation = gsap.quickTo(receiptPointer.current, 'rotation', { duration: 1, ease: 'power3.out' });
      reset = () => { cupX(0); cupY(0); cupRotation(0); receiptX(0); receiptY(0); receiptRotation(0); };
      move = (event) => {
        if (event.pointerType !== 'mouse') return;
        const bounds = element.getBoundingClientRect();
        const areaLeft = bounds.left + bounds.width * 0.46;
        if (event.clientX < areaLeft || event.target.closest('a, button')) { reset(); return; }
        const x = gsap.utils.clamp(-1, 1, (event.clientX - areaLeft) / (bounds.width * 0.54) * 2 - 1);
        const y = gsap.utils.clamp(-1, 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
        cupX(x * 18); cupY(y * 14); cupRotation(x * 1.8);
        receiptX(-x * 10); receiptY(-y * 8); receiptRotation(-x * 1);
      };
    }, root);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      ctx.revert();
    };
  }, [ready, reducedMotion, mobile, finePointer]);

  return <section id="home" className={`hero ${!ready ? 'hero--loading' : ''}`} ref={root} aria-labelledby="hero-title">
    <div ref={background} className="hero-background" aria-hidden="true" />
    <div ref={copy} className="hero-copy">
      <p className="eyebrow hero-eyebrow"><span className="status-dot" /> / 01 — ТОЧНО ВО ВКУС. МИМО СУЕТЫ.</p>
      <RevealTitle as="h1" id="hero-title" lines={['КОФЕ.', 'В ТВОЁМ', 'РИТМЕ.']} ready={ready} reducedMotion={reducedMotion} intro className="hero-title" />
      <span className="hero-handwritten" aria-hidden="true">и никуда не спеши</span>
      <div className="hero-details" ref={details}>
        <p className="hero-description">Большой город. Маленькая пауза.<br />Свежеобжаренный кофе и всё, что нужно,<br />чтобы день стал немного лучше.</p>
        <a className="text-link hero-cta" href="#menu" onClick={(e) => { e.preventDefault(); navigate('menu'); }}>НАЙТИ СВОЙ КОФЕ <Arrow diagonal /></a>
        <div className="hero-info"><span>КАЖДЫЙ ДЕНЬ<br /><strong>08:00 — 22:00</strong></span><a href="#locations" onClick={(e) => { e.preventDefault(); navigate('locations'); }}>ПОКРОВКА, 14<br /><strong>И ЕЩЁ ДВА МЕСТА ↗</strong></a><div className="hero-socials" aria-label="Социальные сети">{socials.map(social => <a key={social.id} href={social.href || '#'} aria-disabled={!social.href} title={!social.href ? 'Ссылка появится позже' : undefined} target={social.href ? '_blank' : undefined} rel={social.href ? 'noreferrer' : undefined} onClick={e => { if (!social.href) e.preventDefault(); }}>{social.label} <span aria-hidden="true">↗</span></a>)}</div></div>
      </div>
    </div>
    <div className="hero-composition" aria-hidden="true">
      <div ref={receiptLayer} className="hero-receipt-layer"><div ref={receiptPointer} className="hero-pointer-layer"><div ref={receiptIntro} className="hero-receipt-intro"><Receipt /></div></div></div>
      <div ref={cupLayer} className="hero-cup-layer"><div ref={cupPointer} className="hero-pointer-layer"><div ref={cupIntro} className="hero-cup-intro"><AssetImage name="hero-cup" eager sizes="(max-width: 370px) 92vw, (max-width: 700px) 84vw, (max-width: 1050px) 51vw, 39vw" /></div></div></div>
      <div ref={sticker} className="hero-sticker"><span className="eyebrow">/ ВАШ ЕЖЕДНЕВНЫЙ РИТУАЛ</span><DrinkTicker ready={ready} reducedMotion={reducedMotion} /></div>
    </div>
    <div className="hero-bottom"><span className="eyebrow">МОСКВА, В ТВОЁМ РИТМЕ</span><a href="#menu" onClick={(e) => { e.preventDefault(); navigate('menu'); }} aria-label="Прокрутить к меню">ЛИСТАЙ МЕДЛЕННО <span>↓</span></a></div>
  </section>;
}
