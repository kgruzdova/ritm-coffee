import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/animation';
import { coffeeGuide } from '../data/coffeeGuide';
import AssetImage from './AssetImage';
import Arrow from './Arrow';

export default function CoffeeGuide({ reducedMotion, navigate }) {
  const root = useRef(null);
  const detail = useRef(null);
  const photos = useRef([]);
  const tabs = useRef([]);
  const request = useRef(0);
  const [selected, setSelected] = useState(3);
  const [error, setError] = useState('');
  const previous = useRef(selected);
  const coffee = coffeeGuide[selected];

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = selected;
    if (old === selected || reducedMotion) return;
    const ctx = gsap.context(() => {
      // Both pictures remain in the same fixed-size frame throughout the fade.
      gsap.fromTo(photos.current[old], { opacity: 1 }, { opacity: 0, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(photos.current[selected], { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(detail.current, { opacity: 0.4, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, [selected, reducedMotion]);

  useLayoutEffect(() => () => { request.current += 1; }, []);

  const choose = async index => {
    const ticket = ++request.current;
    setError('');
    // Keep the current image visible until the requested image is decoded.
    const image = photos.current[index]?.querySelector('img');
    try { if (image) await image.decode(); } catch {
      if (ticket === request.current) setError('Не удалось загрузить изображение. Попробуйте выбрать напиток ещё раз.');
      return;
    }
    if (ticket === request.current) setSelected(index);
  };
  const keydown = (event, index) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % coffeeGuide.length;
    else if (event.key === 'ArrowLeft') next = (index + coffeeGuide.length - 1) % coffeeGuide.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = coffeeGuide.length - 1;
    else return;
    event.preventDefault();
    tabs.current[next]?.focus();
    choose(next);
  };

  return <section id="coffee-guide" className="coffee-guide paper-section" ref={root} aria-labelledby="coffee-guide-title">
    <div className="coffee-guide-frame">
      <div className="coffee-guide-copy">
        <span className="eyebrow coffee-guide-kicker">/ 03 — КОФЕ ПО СЛОЯМ</span>
        <h2 id="coffee-guide-title">У КАЖДОГО<br />СВОЙ СОСТАВ.<span className="handwritten">У тебя — свой ритм.</span></h2>
        <div className="coffee-guide-tabs" role="tablist" aria-label="Виды кофе">
          {coffeeGuide.map((item, index) => <button key={item.id} ref={el => { tabs.current[index] = el; }} id={`coffee-tab-${item.id}`} type="button" role="tab" aria-selected={index === selected} aria-controls="coffee-guide-panel" tabIndex={index === selected ? 0 : -1} onClick={() => choose(index)} onKeyDown={event => keydown(event, index)}>{item.name}</button>)}
        </div>
        <p className="coffee-guide-status" role="status">{error}</p>
        <div id="coffee-guide-panel" className="coffee-guide-detail" role="tabpanel" aria-labelledby={`coffee-tab-${coffee.id}`} tabIndex={0} ref={detail}>
          <div className="coffee-guide-drink" aria-live="polite" aria-atomic="true"><h3>{coffee.name}</h3><span className="eyebrow">{coffee.character}</span></div>
          <p>{coffee.description}</p>
          <div className="coffee-guide-ingredients"><span className="eyebrow">КЛАССИЧЕСКИЙ СОСТАВ</span><ul aria-label={`Состав: ${coffee.name}`}>{coffee.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul></div>
        </div>
        <a className="text-link coffee-guide-link" href="#menu" onClick={event => { event.preventDefault(); navigate('menu'); }}>ВЫБРАТЬ ИЗ МЕНЮ <Arrow diagonal /></a>
      </div>
      <div className="coffee-guide-visual" aria-hidden="true">
        {coffeeGuide.map((item, index) => <div key={item.id} className={`coffee-guide-photo ${index === selected ? 'is-active' : ''}`} ref={el => { photos.current[index] = el; }}><AssetImage name={`coffee-guide-${item.id}`} alt="" sizes="(max-width: 700px) 100vw, 55vw" /></div>)}
        <span className="coffee-guide-image-note eyebrow">ПЯТЬ ХАРАКТЕРОВ. ОДИН РИТМ.</span>
      </div>
    </div>
  </section>;
}
