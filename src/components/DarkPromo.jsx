import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animation';
import RevealTitle from './RevealTitle';
import AssetImage from './AssetImage';
import CoffeeSteam from './CoffeeSteam';
import Arrow from './Arrow';

const beans = [
  [8, 7, -30, 19], [41, 10, 35, 15], [82, 5, 65, 24], [93, 25, -22, 14], [64, 22, -52, 19], [28, 32, 15, 13],
  [73, 47, 40, 26], [94, 63, 70, 18], [50, 60, -30, 16], [9, 66, 55, 22], [36, 79, -50, 15], [82, 82, 30, 25],
];

export default function DarkPromo({ ready, reducedMotion, mobile, navigate }) {
  const root = useRef(null);
  const glow = useRef(null);
  const beanLayer = useRef(null);
  const lifestyle = useRef(null);

  useLayoutEffect(() => {
    if (!ready || reducedMotion) return;
    const ctx = gsap.context(() => {
      const factor = mobile ? 0.25 : 1;
      // Boolean scrub follows the scroll position directly, without a catch-up
      // tween continuing after scrolling stops. The cup itself stays in flow.
      gsap.timeline({ scrollTrigger: { id: 'dark-parallax', trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }, defaults: { ease: 'none', duration: 1 } })
        .fromTo(root.current.querySelectorAll('.promo-title .line-content'), { yPercent: 112 }, { yPercent: 0, duration: 0.2, stagger: 0.035 }, 0.04)
        .fromTo(glow.current, { y: 40 * factor }, { y: -70 * factor, scale: 1.08 }, 0)
        .fromTo(beanLayer.current, { y: 70 * factor }, { y: -150 * factor }, 0)
        .fromTo(lifestyle.current, { y: 30 * factor, scale: 1.08 }, { y: -55 * factor, scale: 1 }, 0);
    }, root);
    return () => ctx.revert();
  }, [ready, reducedMotion, mobile]);

  return <><section id="story" className="dark-promo" ref={root} aria-labelledby="story-title">
    <div className="promo-glow" ref={glow} aria-hidden="true" />
    <div className="promo-beans" ref={beanLayer} aria-hidden="true">{beans.map(([left, top, rotation, width], i) => <span className={`coffee-bean coffee-bean--${i % 4} coffee-bean-depth--${i % 3}`} key={i} style={{ left: `${left}%`, top: `${top}%`, width: width * 1.55, '--bean-rotation': `${rotation}deg` }} />)}</div>
    <div className="promo-opening"><span className="eyebrow">/ 05 — В НАШЕМ РИТМЕ</span><RevealTitle id="story-title" lines={['БОЛЬШОЙ ДЕНЬ', 'НАЧИНАЕТСЯ', 'С МАЛЕНЬКОЙ ПАУЗЫ', 'НА КОФЕ.']} ready={ready} reducedMotion={reducedMotion} animate={false} className="promo-title" /></div>
    <div className="promo-cup-viewport"><div className="promo-cup"><div className="promo-cup-spin"><AssetImage name="promo-cup" alt="Рельефный сливочный стакан кофе РИТМ с коричневой крышкой и логотипом со звуковой волной, снятый почти на уровне глаз" sizes="(max-width: 700px) 74vw, (max-width: 1050px) 46vw, 37vw" /></div></div></div>
    <div className="promo-manifesto"><span className="handwritten">пауза — тоже движение</span><p>Останься поболтать.<br />Или забери кофе с собой.<br />Мы приготовим — ты выберешь ритм.</p><span className="eyebrow">ХОРОШИЙ КОФЕ.<br />БЕЗ СЛОЖНОСТЕЙ.<br />БЕЗ ОЖИДАНИЯ.</span></div>
  </section><section className="lifestyle-stage" aria-labelledby="lifestyle-title"><div ref={lifestyle} className="lifestyle-image"><AssetImage name="lifestyle" alt="Тёплый солнечный свет на столе кофейни с кофе, свежей выпечкой и книгой" sizes="100vw" /><CoffeeSteam ready={ready} reducedMotion={reducedMotion} /></div><div className="lifestyle-shade" /><div className="lifestyle-copy"><span className="eyebrow">/ 06 — МАЛЕНЬКИЕ ПАУЗЫ. БОЛЬШИЕ ДНИ.</span><RevealTitle id="lifestyle-title" lines={['КОФЕ.', 'ПРЯМО', 'СЕЙЧАС.']} ready={ready} reducedMotion={reducedMotion} /></div><div className="lifestyle-side"><p>Мы работаем с небольшими фермами,<br />бережно обжариваем зерно<br />и помним, как ты любишь свой кофе.</p><a className="text-link" href="#locations" onClick={(e) => { e.preventDefault(); navigate('locations'); }}>ВСТРЕТИМСЯ ЗА КОФЕ <Arrow diagonal /></a></div></section></>;
}
