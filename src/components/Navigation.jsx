import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/animation';
import Arrow from './Arrow';

export default function Navigation({ ready, reducedMotion, navigate, onOrder, onMenuChange, orderCount }) {
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    const ctx = gsap.context(() => { gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.35 }); }, root);
    return () => ctx.revert();
  }, [ready, reducedMotion]);
  useEffect(() => { onMenuChange(open); return () => onMenuChange(false); }, [open, onMenuChange]);
  useEffect(() => {
    if (!open) return;
    panelRef.current.querySelector('a')?.focus();
    const keydown = (e) => {
      if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
      if (e.key === 'Tab') {
        const items = [toggleRef.current, ...panelRef.current.querySelectorAll('a,button')];
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
      }
    };
    const resize = () => { if (window.innerWidth > 700) setOpen(false); };
    document.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    return () => { document.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); };
  }, [open]);
  const link = (event, id) => { event.preventDefault(); setOpen(false); navigate(id); };

  return <>
    <header ref={root} className={`navigation ${!ready ? 'navigation--loading' : ''}`}>
      <nav className="nav-links" aria-label="Главная навигация"><a href="#menu" onClick={(e) => link(e, 'menu')}>МЕНЮ</a><a href="#story" onClick={(e) => link(e, 'story')}>О НАС</a><a href="#locations" onClick={(e) => link(e, 'locations')}>АДРЕСА</a></nav>
      <a className="wordmark nav-logo" href="#home" onClick={(e) => link(e, 'home')} aria-label="РИТМ — на главную">РИТМ<span className="logo-dot">®</span></a>
      <button className="nav-order" onClick={onOrder}>КОФЕ С СОБОЙ {orderCount > 0 && <span>({orderCount})</span>}<Arrow diagonal /></button>
      <button ref={toggleRef} className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>{open ? 'ЗАКРЫТЬ' : 'МЕНЮ'}<span>{open ? '−' : '+'}</span></button>
    </header>
    {open && <nav id="mobile-navigation" ref={panelRef} className="mobile-navigation" aria-label="Мобильная навигация" data-lenis-prevent><span className="eyebrow">/ НАЙДИ СВОЙ РИТМ</span><a href="#menu" onClick={(e) => link(e, 'menu')}>МЕНЮ <Arrow diagonal /></a><a href="#story" onClick={(e) => link(e, 'story')}>О НАС <Arrow diagonal /></a><a href="#locations" onClick={(e) => link(e, 'locations')}>АДРЕСА <Arrow diagonal /></a><button onClick={() => { setOpen(false); onOrder(); }}>КОФЕ С СОБОЙ <Arrow /></button><span className="eyebrow">МОСКВА · КАЖДЫЙ ДЕНЬ · 08:00—22:00</span></nav>}
  </>;
}
