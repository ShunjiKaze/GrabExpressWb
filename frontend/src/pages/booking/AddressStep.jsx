import { useState } from 'react';
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

  const pickup   = bookingData.pickupAddress;
  const delivery = bookingData.deliveryAddress;

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

  const InputWithSuggestions = ({ field, label, placeholder, value, dotColor }) => (
    <div className="form-group" style={{ position: 'relative' }}>
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
        }}
        onFocus={() => setFocused(field)}
        onBlur={() => setTimeout(() => setFocused(null), 160)}
        autoComplete="off"
        style={errors[field] ? { borderColor: 'var(--red)' } : {}}
      />
      {errors[field] && <span style={{ fontSize: '12px', color: 'var(--red)', display: 'block', marginTop: '3px' }}>{errors[field]}</span>}

      {/* Suggestions dropdown */}
      {focused === field && getSuggestions(field, value).length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
          background: 'var(--surface)', border: `1.5px solid ${dotColor}`,
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
            Suggested locations
          </div>
          {getSuggestions(field, value).map(s => (
            <div
              key={s}
              onMouseDown={() => pickSuggestion(field, s)}
              style={{ padding: '11px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = field === 'pickup' ? 'var(--primary-light)' : '#FFF1F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {field === 'pickup'
                ? <MapPinIcon size={14} color={dotColor} style={{ flexShrink: 0 }} />
                : <FlagIcon   size={14} color={dotColor} style={{ flexShrink: 0 }} />}
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container" style={{ maxWidth: '620px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <StepBar steps={STEPS} currentStep={0} />

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Where to & from?</h2>
        <p className="text-sm text-muted mb-28">Set your pickup and delivery locations to get started.</p>

        {/* Visual route indicator + inputs */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* Dot line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '36px', flexShrink: 0 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
            <div style={{ width: 2, height: '96px', background: 'repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 5px, transparent 5px, transparent 10px)', margin: '4px 0' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--red)' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <InputWithSuggestions
              field="pickup"
              label="Pickup Address"
              placeholder="Where should we pick up?"
              value={pickup}
              dotColor="var(--primary)"
            />
            <InputWithSuggestions
              field="delivery"
              label="Delivery Address"
              placeholder="Where are we delivering to?"
              value={delivery}
              dotColor="var(--red)"
            />
          </div>
        </div>

        <div className="flex gap-12 mt-28">
          <button onClick={() => navigate('/book')} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
          <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>Continue to Details →</button>
        </div>
      </div>
    </div>
  );
}

export default AddressStep;
