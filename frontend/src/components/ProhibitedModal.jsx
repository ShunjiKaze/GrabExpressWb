import { createPortal } from 'react-dom';

function ProhibitedModal({ onClose }) {
  const items = [
    { icon: '🔫', title: 'Weapons & Firearms', desc: 'Guns, ammunition, explosives, knives intended as weapons, or any weapon component.' },
    { icon: '💊', title: 'Illegal Drugs & Substances', desc: 'Prohibited drugs, narcotics, or any substance that is illegal under Philippine law.' },
    { icon: '🐾', title: 'Live Animals', desc: 'Any live animal, bird, fish, or reptile. This includes pets and livestock.' },
    { icon: '☠️', title: 'Hazardous Materials', desc: 'Flammable, corrosive, toxic, or radioactive substances. Includes certain chemicals and batteries in bulk.' },
    { icon: '💵', title: 'Cash & Negotiable Items', desc: 'Large sums of cash, jewelry, precious metals, or negotiable instruments.' },
    { icon: '🍺', title: 'Alcohol without Permit', desc: 'Delivery of alcohol requires proper documentation and may be restricted by area.' },
    { icon: '🚬', title: 'Tobacco Products', desc: 'Cigarettes and tobacco products in commercial quantities may require special permits.' },
    { icon: '📦', title: 'Oversized Items', desc: 'Items exceeding 20kg or dimensions beyond the selected vehicle\'s capacity.' },
  ];

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">🚫 What's Prohibited?</div>
            <p className="text-sm text-muted mt-8">These items are NOT allowed for delivery through GrabExpress for the safety of our riders and recipients.</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {items.map((item, i) => (
            <div key={i} className="prohibited-item">
              <span className="prohibited-icon">{item.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>{item.desc}</div>
              </div>
            </div>
          ))}
          <div className="alert alert-warning mt-16">
            <span>⚠️</span>
            <span>Violations may result in order cancellation, account suspension, and possible legal action.</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ProhibitedModal;
