import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import StepBar from '../../components/StepBar';
import { isValidPhone, isValidName, digitsOnly, sanitizeName } from '../../utils/validate';

const STEPS = ['Address', 'Details', 'Item', 'Review'];

const VEHICLES = [
  { id: 'motorcycle', icon: '🛵', title: 'Motorcycle', desc: 'Up to 5 kg, small items',   price: '₱60' },
  { id: 'car',        icon: '🚗', title: 'Car',        desc: 'Up to 15 kg, medium items', price: '₱120' },
  { id: 'van',        icon: '🚐', title: 'Van',        desc: 'Up to 20 kg, large items',  price: '₱250' },
];

// Inline field with error display
function Field({ label, required, optional, error, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="req"> *</span>}
        {optional && <span className="opt"> (optional)</span>}
      </label>
      {children}
      {error  && <span style={{ fontSize: '12px', color: 'var(--red)',    marginTop: '3px', display: 'block' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px', display: 'block' }}>{hint}</span>}
    </div>
  );
}

function PersonSection({ title, prefix, fields, onUpdate, errors, onClearError }) {
  const nameKey  = `${prefix}Name`;
  const phoneKey = `${prefix}Phone`;
  const floorKey = `${prefix}Floor`;
  const noteKey  = `${prefix}Note`;
  const saveKey  = `save${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`;

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>{title}</h3>

      <div className="grid grid-2 gap-12 mb-12">
        <Field label="Contact Name" required error={errors[nameKey]}>
          <input
            className="form-input"
            placeholder="Full name"
            value={fields[nameKey]}
            maxLength={60}
            onChange={e => {
              onUpdate({ [nameKey]: sanitizeName(e.target.value) });
              onClearError(nameKey);
            }}
            style={errors[nameKey] ? { borderColor: 'var(--red)' } : {}}
          />
        </Field>

        <Field label="Contact Number" required error={errors[phoneKey]}>
          <input
            className="form-input"
            placeholder="09XXXXXXXXX"
            value={fields[phoneKey]}
            maxLength={11}
            inputMode="numeric"
            onChange={e => {
              onUpdate({ [phoneKey]: digitsOnly(e.target.value) });
              onClearError(phoneKey);
            }}
            style={errors[phoneKey] ? { borderColor: 'var(--red)' } : {}}
          />
        </Field>
      </div>

      <Field label="Floor / Unit No." optional>
        <input
          className="form-input"
          placeholder="e.g. Unit 3B, 2nd Floor"
          value={fields[floorKey]}
          maxLength={60}
          onChange={e => onUpdate({ [floorKey]: e.target.value })}
        />
      </Field>

      <div className="form-group mt-12 mb-12">
        <label className="form-label">Note to Driver <span className="opt">(optional)</span></label>
        <input
          className="form-input"
          placeholder="e.g. Leave at the guard post"
          value={fields[noteKey]}
          maxLength={120}
          onChange={e => onUpdate({ [noteKey]: e.target.value })}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-2)' }}>
        <input
          type="checkbox"
          checked={fields[saveKey]}
          onChange={e => onUpdate({ [saveKey]: e.target.checked })}
          style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
        />
        Save details for future bookings
      </label>
    </div>
  );
}

function DeliveryDetailsStep() {
  const navigate = useNavigate();
  const { bookingData, updateBooking } = useBooking();
  const [errors, setErrors] = useState({});

  const clearError = (key) => setErrors(prev => ({ ...prev, [key]: '' }));

  const validate = () => {
    const e = {};

    if (!isValidName(bookingData.senderName))
      e.senderName = 'Name must be at least 2 letters. No numbers or special characters.';

    if (!isValidPhone(bookingData.senderPhone))
      e.senderPhone = 'Enter a valid 11-digit PH number starting with 09.';

    if (!isValidName(bookingData.recipientName))
      e.recipientName = 'Name must be at least 2 letters. No numbers or special characters.';

    if (!isValidPhone(bookingData.recipientPhone))
      e.recipientPhone = 'Enter a valid 11-digit PH number starting with 09.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) navigate('/book/new/items');
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '760px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <StepBar steps={STEPS} currentStep={1} />

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Delivery Details</h2>
        <p className="text-sm text-muted mb-24">Fill in the sender and recipient information for this delivery.</p>

        {/* Route summary */}
        <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(0,177,79,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '24px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, width: '60px', flexShrink: 0 }}>FROM</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{bookingData.pickupAddress}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ color: 'var(--red)', fontWeight: 700, width: '60px', flexShrink: 0 }}>TO</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{bookingData.deliveryAddress}</span>
          </div>
        </div>

        {/* Delivery Type */}
        <div className="form-group mb-20">
          <label className="form-label">Delivery Type</label>
          <div className="option-grid option-grid-3">
            {[
              { id: 'instant',  icon: '⚡', title: 'Instant',     desc: 'Within the hour' },
              { id: 'same_day', icon: '📅', title: 'Same-Day',    desc: 'By end of day',  disabled: true },
              { id: 'bulk',     icon: '📦', title: 'Bulk Orders', desc: 'Multiple items', disabled: true },
            ].map(t => (
              <div
                key={t.id}
                className={`option-card${bookingData.deliveryType === t.id ? ' selected' : ''}${t.disabled ? ' disabled' : ''}`}
                onClick={() => !t.disabled && updateBooking({ deliveryType: t.id })}
              >
                <div className="option-icon">{t.icon}</div>
                <div className="option-title">{t.title}</div>
                <div className="option-desc">{t.desc}</div>
                {t.disabled && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>Coming soon</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle */}
        <div className="form-group mb-24">
          <label className="form-label">
            Vehicle Type
            <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '12px' }}> — auto-updated after item size selection</span>
          </label>
          <div className="option-grid option-grid-3">
            {VEHICLES.map(v => (
              <div
                key={v.id}
                className={`option-card${bookingData.vehicleType === v.id ? ' selected' : ''}`}
                onClick={() => updateBooking({ vehicleType: v.id })}
              >
                <div className="option-icon">{v.icon}</div>
                <div className="option-title">{v.title}</div>
                <div className="option-desc">{v.desc}</div>
                <div className="option-price">{v.price} base</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sender */}
        <div className="mb-16">
          <PersonSection
            title="📤 Sender's Details"
            prefix="sender"
            fields={bookingData}
            onUpdate={updateBooking}
            errors={errors}
            onClearError={clearError}
          />
        </div>

        {/* Recipient */}
        <div className="mb-16">
          <PersonSection
            title="📥 Recipient's Details"
            prefix="recipient"
            fields={bookingData}
            onUpdate={updateBooking}
            errors={errors}
            onClearError={clearError}
          />
        </div>

        <div className="flex gap-12">
          <button onClick={() => navigate('/book/new/address')} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
          <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>Continue to Item →</button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryDetailsStep;
