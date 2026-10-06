export default function Arrow({ diagonal = false, className = '' }) {
  return <svg className={`arrow-icon ${className}`} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={diagonal ? { transform: 'rotate(-45deg)' } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
