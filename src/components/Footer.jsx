import { venues } from '../data/menu';
import Arrow from './Arrow';

export default function Footer({ navigate, onOrder }) {
  return <footer className="footer">
    <span className="eyebrow footer-kicker">/ 07 — ВСТРЕТИМСЯ ЗА КОФЕ</span>
    <div className="footer-top"><a href="#home" className="wordmark footer-logo" onClick={(e) => { e.preventDefault(); navigate('home'); }}>РИТМ<span className="logo-dot">®</span></a><p>Всё хорошее<br />начинается с кофе.</p><div className="footer-links"><a href="#menu" onClick={(e) => { e.preventDefault(); navigate('menu'); }}>МЕНЮ</a><a href="#story" onClick={(e) => { e.preventDefault(); navigate('story'); }}>О НАС</a><a href="#locations" onClick={(e) => { e.preventDefault(); navigate('locations'); }}>АДРЕСА</a></div><button className="text-link footer-order" onClick={onOrder}>КОФЕ С СОБОЙ <Arrow diagonal /></button></div>
    <div className="footer-addresses">{venues.map((venue) => <a key={venue.name} href={`https://yandex.ru/maps/?text=${encodeURIComponent(`Москва, ${venue.address}`)}`} target="_blank" rel="noreferrer"><span className="eyebrow">МОСКВА / {venue.number}</span><span>{venue.address}</span><small>{venue.hours}</small></a>)}<span className="footer-note">СВЕЖЕЕ ЗЕРНО.<br />ТЁПЛЫЕ ВСТРЕЧИ.<br />КАЖДЫЙ ДЕНЬ.</span></div>
    <div className="footer-bottom"><span>© РИТМ, {new Date().getFullYear()}</span><span>СДЕЛАНО С ЗАБОТОЙ И КОФЕ</span><a href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>НАВЕРХ ↑</a></div>
  </footer>;
}
