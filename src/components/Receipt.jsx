export default function Receipt({ compact = false }) {
  return <div className={`receipt ${compact ? 'receipt--compact' : ''}`} aria-hidden="true">
    <div className="receipt-topline"><span>ХОРОШИЙ ДЕНЬ</span><span>№ 001</span></div>
    <div className="receipt-brand">РИТМ<span>КОФЕЙНЯ</span></div>
    <div className="receipt-script">a little<br />coffee break</div>
    <div className="receipt-rule" />
    <div className="receipt-details"><div><span>ПРОИСХОЖДЕНИЕ</span><strong>БРАЗИЛИЯ<br />СЕРРАДО</strong></div><div><span>ВКУС</span><strong>ШОКОЛАД<br />КАРАМЕЛЬ<br />ХОРОШИЙ ДЕНЬ</strong></div></div>
    <div className="receipt-rule" />
    <div className="receipt-total"><span>ОДНА ПАУЗА</span><strong>БЕСЦЕННО</strong></div>
    <div className="barcode" />
    <div className="receipt-footer"><p className="receipt-foot">СПАСИБО, ЧТО ЗАМЕДЛИЛИСЬ.<br />ДАЛЬШЕ — В СВОЁМ РИТМЕ.</p><p className="receipt-care">ОБЖАРЕНО С ЗАБОТОЙ.<br />СВАРЕНО ДЛЯ ТЕБЯ.</p></div>
  </div>;
}
