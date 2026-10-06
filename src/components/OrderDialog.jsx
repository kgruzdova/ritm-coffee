import { useEffect, useRef, useState } from 'react';
import { products, venues, money } from '../data/menu';
import Arrow from './Arrow';

export default function OrderDialog({ open, onClose, quantities, setQuantities }) {
  const dialog = useRef(null);
  const location = useRef(null);
  const downloadCleanup = useRef(null);
  const [venue, setVenue] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const total = products.reduce((sum, p) => sum + p.price * (quantities[p.id] || 0), 0);

  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) { element.showModal(); setSaved(false); setError(''); }
    if (!open && element.open) element.close();
    return () => { if (element.open) element.close(); };
  }, [open]);
  useEffect(() => () => downloadCleanup.current?.(), []);

  const change = (id, delta) => {
    setSaved(false);
    setError('');
    setQuantities((old) => ({ ...old, [id]: Math.max(0, Math.min(20, (old[id] || 0) + delta)) }));
  };
  const save = () => {
    setSaved(false);
    setError('');
    if (!total) return;
    if (!venues[venue] || !location.current.reportValidity()) { setError('Выберите кофейню для вашего списка.'); return; }
    let url;
    try {
      const lines = ['РИТМ — моя кофейная пауза', '', `Кофейня: Москва, ${venues[venue].address}`, ...products.filter((p) => quantities[p.id]).map((p) => `${p.name} × ${quantities[p.id]} — ${money(p.price * quantities[p.id])}`), '', `Итого: ${money(total)}`, '', 'Список для бариста. Заказ оформляется и оплачивается в кофейне.'];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ritm-my-coffee.txt';
      document.body.append(link);
      try { link.click(); } finally { link.remove(); }
      downloadCleanup.current?.();
      const timer = setTimeout(() => { URL.revokeObjectURL(url); downloadCleanup.current = null; }, 1000);
      downloadCleanup.current = () => { clearTimeout(timer); URL.revokeObjectURL(url); };
      setSaved(true);
    } catch {
      if (url) URL.revokeObjectURL(url);
      setError('Не удалось сохранить список. Попробуйте ещё раз.');
    }
  };

  return <dialog ref={dialog} className="order-dialog" aria-labelledby="order-title" onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} data-lenis-prevent>
    <div className="order-content"><div className="order-top"><span className="eyebrow">/ ТВОЯ МАЛЕНЬКАЯ ПАУЗА</span><button aria-label="Закрыть список" onClick={onClose}>×</button></div><h2 id="order-title">ТВОЙ КОФЕ.<br />ТВОЙ ВЫБОР.</h2><p className="order-description">Собери список и покажи его бариста.<br />Приготовим и рассчитаем тебя в кофейне.</p>
      <div className="order-items">{products.map((p) => <div className="order-item" key={p.id}><span><strong>{p.name}</strong><small>{money(p.price)} · {p.volume}</small></span><div className="quantity-controls"><button onClick={() => change(p.id, -1)} disabled={!quantities[p.id]} aria-label={`Убрать один ${p.name.toLowerCase()}`}>−</button><output aria-label={`Количество: ${p.name.toLowerCase()}`}>{quantities[p.id] || 0}</output><button onClick={() => change(p.id, 1)} disabled={quantities[p.id] >= 20} aria-label={`Добавить один ${p.name.toLowerCase()}`}>+</button></div></div>)}</div>
      <label className="order-location">ГДЕ ВСТРЕТИМСЯ?<select ref={location} required value={venue} onChange={(e) => { setVenue(Number(e.target.value)); setSaved(false); setError(''); }}>{venues.map((v, i) => <option value={i} key={v.name}>{v.address}</option>)}</select></label><div className="order-total"><span>ТВОЯ ПАУЗА</span><strong>{money(total)}</strong></div><button className="order-save" disabled={!total} onClick={save}>СОХРАНИТЬ СПИСОК <Arrow diagonal /></button><p className={`order-status ${error ? 'has-error' : ''}`} role={error ? 'alert' : 'status'}>{error || (!total ? 'Список пока пуст. Добавьте напиток или десерт из меню.' : saved ? 'Список подготовлен к скачиванию. Встретимся за кофе!' : 'Список скачивается файлом. Оплата — в кофейне.')}</p>
    </div>
  </dialog>;
}
