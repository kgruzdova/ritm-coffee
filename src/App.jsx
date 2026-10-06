import { useCallback, useEffect, useRef, useState } from 'react';
import useMediaQuery from './hooks/useMediaQuery';
import useSmoothScroll from './hooks/useSmoothScroll';
import Preloader from './components/Preloader';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Products from './components/Products';
import CoffeeGuide from './components/CoffeeGuide';
import ClockSection from './components/ClockSection';
import DarkPromo from './components/DarkPromo';
import Footer from './components/Footer';
import OrderDialog from './components/OrderDialog';

export default function App() {
  const page = useRef(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [navigationTarget, setNavigationTarget] = useState(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const mobile = useMediaQuery('(max-width: 700px)');
  const scrollTo = useSmoothScroll({ ready, reducedMotion, locked: menuOpen || orderOpen });
  const navigate = useCallback((id) => setNavigationTarget(id), []);
  useEffect(() => {
    if (!navigationTarget || menuOpen || orderOpen || !ready) return;
    // Let the menu unlock native scrolling before starting the anchor tween.
    const frame = requestAnimationFrame(() => {
      scrollTo(page.current?.querySelector(`#${navigationTarget}`));
      setNavigationTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [navigationTarget, menuOpen, orderOpen, ready, scrollTo]);
  const complete = useCallback(() => setReady(true), []);
  const openOrder = useCallback(() => setOrderOpen(true), []);
  const closeOrder = useCallback(() => setOrderOpen(false), []);
  const addProduct = useCallback((id) => {
    setQuantities((old) => ({ ...old, [id]: Math.min(20, (old[id] || 0) + 1) }));
    setOrderOpen(true);
  }, []);
  const orderCount = Object.values(quantities).reduce((a, b) => a + b, 0);
  const motionProps = { ready, reducedMotion, mobile };

  return <>
    {!ready && <Preloader onComplete={complete} reducedMotion={reducedMotion} />}
    <div ref={page} className="site-page" inert={!ready}>
      <a href="#main" className="skip-link">Перейти к содержимому</a>
      <Navigation {...motionProps} navigate={navigate} onOrder={openOrder} onMenuChange={setMenuOpen} orderCount={orderCount} />
      <main id="main"><Hero {...motionProps} navigate={navigate} /><Products {...motionProps} onAdd={addProduct} onOrder={openOrder} /><CoffeeGuide {...motionProps} navigate={navigate} /><ClockSection {...motionProps} /><DarkPromo {...motionProps} navigate={navigate} /></main>
      <Footer navigate={navigate} onOrder={openOrder} />
    </div>
    <OrderDialog open={orderOpen} onClose={closeOrder} quantities={quantities} setQuantities={setQuantities} />
  </>;
}
