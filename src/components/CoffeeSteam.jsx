import { useEffect, useId, useRef } from 'react';

// Coordinates are measured on the 1440 × 960 lifestyle photograph.
// The SVG uses the same cover crop as the image, including its parallax.
const cups = [
  { name: 'front', x: 816, y: 551, scale: 1, wisps: [
    { path: 'M -20 0 C -29 -22 -5 -38 -12 -60 S -33 -98 -12 -142', duration: 7.2, delay: -2.8, drift: 11, peak: 0.22, width: 7 },
    { path: 'M 3 0 C -8 -18 18 -37 8 -60 S -7 -96 14 -127', duration: 8.9, delay: -6.1, drift: -9, peak: 0.18, width: 9 },
    { path: 'M 24 0 C 10 -22 33 -46 20 -69 S 13 -102 28 -146', duration: 6.4, delay: -0.7, drift: 7, peak: 0.15, width: 6 },
  ] },
  { name: 'back', x: 951, y: 445, scale: 0.82, wisps: [
    { path: 'M -16 0 C -3 -24 -25 -40 -13 -65 S 7 -97 -5 -141', duration: 9.7, delay: -7.2, drift: -12, peak: 0.18, width: 8 },
    { path: 'M 4 0 C 17 -19 -5 -43 7 -67 S 27 -99 12 -132', duration: 7.8, delay: -1.9, drift: 8, peak: 0.21, width: 7 },
    { path: 'M 20 0 C 5 -26 30 -45 18 -68 S 6 -105 22 -149', duration: 6.9, delay: -4.3, drift: -6, peak: 0.14, width: 5 },
  ] },
];

export default function CoffeeSteam({ ready, reducedMotion }) {
  const root = useRef(null);
  const id = useId().replace(/:/g, '');
  const gradient = `steam-gradient-${id}`;
  const blur = `steam-blur-${id}`;

  useEffect(() => {
    if (!ready || reducedMotion || !root.current) return;
    const element = root.current;
    let visible = false;
    const update = () => { element.dataset.active = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element.closest('.lifestyle-stage') || element);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [ready, reducedMotion]);

  if (!ready || reducedMotion) return null;
  return <div className="coffee-steam" ref={root} data-active="false" aria-hidden="true">
    <svg viewBox="0 0 1440 960" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-150">
          <stop offset="0" stopColor="#f2e6d4" stopOpacity="0.12" />
          <stop offset="0.2" stopColor="#f2e6d4" stopOpacity="0.85" />
          <stop offset="0.65" stopColor="#eee7dc" stopOpacity="0.45" />
          <stop offset="1" stopColor="#eee7dc" stopOpacity="0" />
        </linearGradient>
        <filter id={blur} x="-100%" y="-30%" width="300%" height="160%"><feGaussianBlur stdDeviation="2.8" /></filter>
      </defs>
      {cups.map(cup => <g className={`steam-emitter steam-emitter--${cup.name}`} key={cup.name} transform={`translate(${cup.x} ${cup.y}) scale(${cup.scale})`}>
        {cup.wisps.map((wisp, index) => <g className="steam-wisp" key={index} style={{ '--steam-duration': `${wisp.duration}s`, '--steam-delay': `${wisp.delay}s`, '--steam-drift': `${wisp.drift}px`, '--steam-peak': wisp.peak }}>
          <path d={wisp.path} fill="none" stroke={`url(#${gradient})`} strokeWidth={wisp.width} strokeLinecap="round" filter={`url(#${blur})`} />
        </g>)}
      </g>)}
    </svg>
  </div>;
}
