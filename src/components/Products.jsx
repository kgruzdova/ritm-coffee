import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/animation';
import { products, money } from '../data/menu';
import AssetImage from './AssetImage';
import RevealTitle from './RevealTitle';
import Arrow from './Arrow';
import useMediaQuery from '../hooks/useMediaQuery';

function ProductCard({ product, onAdd, interactive }) {
  const frame = useRef(null);
  const card = useRef(null);
  const image = useRef(null);
  useLayoutEffect(() => {
    if (!interactive) return;
    const element = frame.current;
    let move, reset, update;
    let pointer = null;
    let scrollFrame = 0;
    const ctx = gsap.context(() => {
      const options = { duration: 0.25, ease: 'power2.out' };
      const motions = [
        gsap.quickTo(card.current, 'rotationX', options),
        gsap.quickTo(card.current, 'rotationY', options),
        gsap.quickTo(image.current, 'x', options),
        gsap.quickTo(image.current, 'y', options),
      ];
      const follow = (values, duration) => motions.forEach((motion, index) => {
        motion.tween.duration(duration);
        motion(values[index]);
      });
      reset = () => {
        pointer = null;
        follow([0, 0, 0, 0], 0.4);
      };
      update = () => {
        if (!pointer) return;
        // Measure the stationary frame, never the tilted surface.
        const bounds = element.getBoundingClientRect();
        if (pointer.x < bounds.left || pointer.x > bounds.right || pointer.y < bounds.top || pointer.y > bounds.bottom) {
          reset();
          return;
        }
        const nx = gsap.utils.clamp(-1, 1, (pointer.x - bounds.left) / bounds.width * 2 - 1);
        const ny = gsap.utils.clamp(-1, 1, (pointer.y - bounds.top) / bounds.height * 2 - 1);
        follow([-ny * 3, nx * 4, nx * 5, ny * 4], 0.25);
      };
      move = event => {
        if (event.pointerType === 'touch') return;
        pointer = { x: event.clientX, y: event.clientY };
        update();
      };
    }, element);
    const scroll = () => {
      if (!pointer || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; update(); });
    };
    element.addEventListener('pointerenter', move);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    window.addEventListener('scroll', scroll, { passive: true, capture: true });
    window.addEventListener('blur', reset);
    return () => {
      cancelAnimationFrame(scrollFrame);
      element.removeEventListener('pointerenter', move);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('blur', reset);
      ctx.revert();
    };
  }, [interactive]);

  return <div className="product-card-reveal" ref={frame} role="listitem"><article ref={card} className={`product-card product-card--${product.id}`}>
    <div className="product-top"><span className="eyebrow">/{product.number}</span><span className="product-note">{product.note}</span></div>
    <button className="product-image-button" onClick={() => onAdd(product.id)} aria-label={`Добавить ${product.name.toLowerCase()} в список`}>
      <div className="product-image-parallax" ref={image}><AssetImage name={product.image} alt={product.alt} className="product-image" sizes="(max-width: 700px) 80vw, 25vw" /></div>
      <span className="product-add" aria-hidden="true">+</span>
    </button>
    <div className="product-meta"><h3>{product.name}</h3><span>{money(product.price)}</span></div>
    <div className="product-small"><span>{product.volume}</span><span>{product.details}</span></div>
  </article></div>;
}

export default function Products({ ready, reducedMotion, onAdd, onOrder }) {
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const track = useRef(null);
  const [position, setPosition] = useState({ start: true, end: false, index: 0, visible: 4 });
  const measure = () => {
    const element = track.current;
    const css = getComputedStyle(element);
    const step = element.firstElementChild.getBoundingClientRect().width + parseFloat(css.columnGap);
    const width = element.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    return { step, visible: Math.max(1, Math.floor((width + parseFloat(css.columnGap) + 1) / step)) };
  };
  useLayoutEffect(() => {
    const element = track.current;
    const update = () => {
      const { step, visible } = measure();
      const next = { start: element.scrollLeft <= 2, end: element.scrollWidth - element.clientWidth - element.scrollLeft <= 2, index: Math.round(element.scrollLeft / step), visible };
      setPosition(old => Object.keys(next).every(key => old[key] === next[key]) ? old : next);
    };
    const resize = new ResizeObserver(update);
    resize.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    // Let horizontal trackpad gestures reach native scrolling, while vertical
    // gestures still belong to the page's smooth-scroll controller.
    const wheel = event => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.stopPropagation(); };
    element.addEventListener('wheel', wheel, { passive: true });
    update();
    return () => { resize.disconnect(); element.removeEventListener('scroll', update); element.removeEventListener('wheel', wheel); };
  }, []);
  const move = direction => {
    const { step, visible } = measure();
    track.current.scrollBy({ left: direction * step * visible, behavior: reducedMotion ? 'instant' : 'smooth' });
  };
  const keydown = event => {
    if (event.target !== track.current) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); track.current.scrollTo({ left: event.key === 'Home' ? 0 : track.current.scrollWidth, behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  };

  return <section id="menu" className="products paper-section" aria-labelledby="menu-title">
    <div className="paper-mark" aria-hidden="true">Р</div>
    <div className="section-topline"><span className="eyebrow">/ 02 — ТО, ЧТО ЛЮБИШЬ</span><span className="eyebrow">ХОРОШИЙ КОФЕ. БЕЗ ЛИШНИХ СЛОВ.</span></div>
    <div className="products-heading"><RevealTitle id="menu-title" lines={['ЛЮБИМОЕ', 'КАЖДЫЙ', 'ДЕНЬ.']} ready={ready} reducedMotion={reducedMotion} /><div className="products-intro"><span className="handwritten">ну что, как обычно?</span><p>От первого глотка эспрессо<br />до последней крошки.<br />Выбирай то, что делает тебя собой.</p></div></div>
    <div className="product-carousel" role="region" aria-roledescription="карусель" aria-label="Меню кофейни">
      <div className="product-grid" id="product-carousel-track" ref={track} role="list" tabIndex={0} aria-label="Товары. Используйте стрелки для прокрутки" onKeyDown={keydown}>{products.map(product => <ProductCard key={product.id} product={product} onAdd={onAdd} interactive={ready && !reducedMotion && finePointer} />)}</div>
      <div className="product-carousel-controls"><span className="eyebrow">ЛИСТАЙ СВОЙ ВКУС</span><div className="product-carousel-navigation"><span className="eyebrow" aria-live="polite">{String(position.index + 1).padStart(2, '0')} — {String(Math.min(products.length, position.index + position.visible)).padStart(2, '0')} / {String(products.length).padStart(2, '0')}</span><button className="carousel-arrow is-previous" aria-label="Предыдущие товары" aria-controls="product-carousel-track" disabled={position.start} onClick={() => move(-1)}><Arrow /></button><button className="carousel-arrow" aria-label="Следующие товары" aria-controls="product-carousel-track" disabled={position.end} onClick={() => move(1)}><Arrow /></button></div></div>
    </div>
    <div className="products-bottom"><span className="eyebrow">НА РАСТИТЕЛЬНОМ МОЛОКЕ? ЛЕГКО.</span><button className="text-link" onClick={onOrder}>СОБРАТЬ СВОЮ ПАУЗУ <Arrow diagonal /></button></div>
  </section>;
}
