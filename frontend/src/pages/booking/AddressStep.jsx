import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import StepBar from '../../components/StepBar';
import { MapPinIcon, FlagIcon } from '../../components/Icons';

const STEPS = ['Address', 'Details', 'Item', 'Review'];

const SUGGESTIONS = {
  pickup: [
    'Ayala Center Cebu, Archbishop Reyes Ave, Cebu City',
    'SM City Cebu, North Reclamation Area, Cebu City',
    'IT Park, Lahug, Cebu City',
    'Fuente Osmeña Circle, Cebu City',
    'Carbon Market, Parian, Cebu City',
    'Colon Street, Downtown Cebu City',
  ],
  delivery: [
    'Robinsons Galleria Cebu, Gen. Maxilom Ave, Cebu City',
    'Elizabeth Mall, MJ Cuenco Ave, Cebu City',
    'Mactan Newtown, Lapu-Lapu City',
    'Mandaue City Hall, Mandaue City',
    'Talisay City Public Market, Talisay City',
    'Consolacion Public Market, Consolacion, Cebu',
  ],
};

function AddressStep() {
  const navigate = useNavigate();
  const { bookingData, updateBooking } = useBooking();
  const [focused, setFocused] = useState(null);
  const [errors, setErrors]   = useState({});
  const pickupRef   = useRef(null);
  const deliveryRef = useRef(null);

  const pickup   = bookingData.pickupAddress;
  const delivery = bookingData.deliveryAddress;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickupRef.current   && !pickupRef.current.contains(e.target) &&
        deliveryRef.current && !deliveryRef.current.contains(e.target)
      ) {
        setFocused(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pickSuggestion = (field, val) => {
    const key = field === 'pickup' ? 'pickupAddress' : 'deliveryAddress';
    updateBooking({ [key]: val });
    setErrors(prev => ({ ...prev, [field]: '' }));
    setFocused(null);
  };

  const getSuggestions = (field, val) =>
    SUGGESTIONS[field].filter(s => !val || s.toLowerCase().includes(val.toLowerCase()));

  const validate = () => {
    const e = {};
    if (!pickup.trim())         e.pickup   = 'Pickup address is required.';
    if (!delivery.trim())       e.delivery = 'Delivery address is required.';
    if (pickup.trim().length < 5 && !e.pickup)
                                e.pickup   = 'Please enter a more specific address.';
    if (delivery.trim().length < 5 && !e.delivery)
                                e.delivery = 'Please enter a more specific address.';
    if (pickup.trim().toLowerCase() === delivery.trim().toLowerCase() && !e.pickup && !e.delivery)
                                e.delivery = 'Pickup and delivery addresses cannot be the same.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) navigate('/book/new/details');
  };

  // ── Shared hover colors per field (dark-mode safe) ──
  const hoverBg = { pickup: '#003D1F', delivery: '#3B0A0A' };
  const hoverText = '#FFFFFF';

  const InputWithSuggestions = ({ field, label, placeholder, value, dotColor, containerRef }) => (
    <div className="form-group" style={{ position: 'relative', marginBottom: 0 }} ref={containerRef}>
      <label className="form-label">{label} <span className="req">*</span></label>
      <input
        className="form-input"
        placeholder={placeholder}
        value={value}
        maxLength={200}
        onChange={e => {
          const key = field === 'pickup' ? 'pickupAddress' : 'deliveryAddress';
          updateBooking({ [key]: e.target.value });
          setErrors(prev => ({ ...prev, [field]: '' }));
          if (!focused) setFocused(field);
        }}
        onFocus={() => setFocused(field)}
        autoComplete="off"
        style={{
          borderColor: errors[field] ? 'var(--red)' : focused === field ? dotColor : undefined,
          boxShadow: focused === field ? `0 0 0 3px ${dotColor}25` : undefined,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
      {errors[field] && <span style={{ fontSize: '12px', color: 'var(--red)', display: 'block', marginTop: '4px' }}>{errors[field]}</span>}

      {/* Suggestions dropdown */}
      {focused === field && getSuggestions(field, value).length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)',
          border: `1.5px solid ${dotColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 300,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 14px', fontSize: '10px', fontWeight: 800,
            color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            Suggested Locations
          </div>
          {getSuggestions(field, value).map(s => (
            <div
              key={s}
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(field, s); }}
              onMouseEnter={e => {
                e.currentTarget.style.background = hoverBg[field];
                e.currentTarget.querySelector('span').style.color = hoverText;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.querySelector('span').style.color = 'var(--text)';
              }}
              style={{
                padding: '11px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                display: 'flex', gap: '10px', alignItems: 'center',
                transition: 'background 0.12s',
              }}
            >
              {field === 'pickup'
                ? <MapPinIcon size={14} color={dotColor} style={{ flexShrink: 0 }} />
                : <FlagIcon   size={14} color={dotColor} style={{ flexShrink: 0 }} />}
              <span style={{
                flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontSize: '13px', fontWeight: 500, color: 'var(--text)',
                transition: 'color 0.12s',
              }}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <div className="card" style={{ padding: '36px' }}>
        <StepBar steps={STEPS} currentStep={0} />

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Address Details</h2>
        <p className="text-sm text-muted mb-28">Set your pickup and delivery locations to get started.</p>

        {/* Visual route indicator + inputs */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
          {/* Dot line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '38px', flexShrink: 0 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 3px var(--primary-light)' }} />
            <div style={{ width: 2, flex: 1, minHeight: '60px', background: 'repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 5px, transparent 5px, transparent 10px)', margin: '6px 0' }} />
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 0 3px #FFF1F233' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <InputWithSuggestions
              field="pickup"
              label="Pickup Address"
              placeholder="Where should we pick up?"
              value={pickup}
              dotColor="var(--primary)"
              containerRef={pickupRef}
            />
            <InputWithSuggestions
              field="delivery"
              label="Delivery Address"
              placeholder="Where are we delivering to?"
              value={delivery}
              dotColor="var(--red)"
              containerRef={deliveryRef}
            />
          </div>
        </div>

        {/* Extra breathing room before buttons */}
        <div style={{ height: '32px' }} />

        <div className="flex gap-12">
          <button onClick={() => navigate('/book')} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
          <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>Continue to Details →</button>
        </div>
      </div>
    </div>
  );
}

export default AddressStep;
