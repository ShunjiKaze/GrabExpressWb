import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking, DELIVERY_ADD } from '../../context/BookingContext';
import StepBar from '../../components/StepBar';
import { isValidPhone, isValidName, digitsOnly, sanitizeName } from '../../utils/validate';
import { ZapIcon, CalendarIcon, PackageIcon, UserIcon, PhoneIcon } from '../../components/Icons';

const STEPS = ['Address', 'Details', 'Item', 'Review'];

const DELIVERY_TYPES = [
  { id: 'instant',  Icon: ZapIcon,      title: 'Instant',     desc: 'Within the hour',  disabled: false },
  { id: 'same_day', Icon: CalendarIcon, title: 'Same-Day',    desc: 'By end of day',    disabled: true },
  { id: 'bulk',     Icon: PackageIcon,  title: 'Bulk Orders', desc: 'Multiple items',   disabled: true },
];

function Field({ label, required, optional, error, hint, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
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

function PersonSection({ title, prefix, fields, onUpdate, errors, onClearError, iconColor }) {
  const nameKey  = `${prefix}Name`;
  const phoneKey = `${prefix}Phone`;
  const floorKey = `${prefix}Floor`;
  const noteKey  = `${prefix}Note`;
  const saveKey  = `save${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`;

  return (
    <div style={{
      background: 'var(--surface-2)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      border: `1.5px solid transparent`,
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <UserIcon size={15} color={iconColor} /> {title}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Contact Name" required error={errors[nameKey]}>
          <input
            className="form-input"
            placeholder="Full name"
            value={fields[nameKey]}
            maxLength={60}
            onChange={e => { onUpdate({ [nameKey]: sanitizeName(e.target.value) }); onClearError(nameKey); }}
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
            onChange={e => { onUpdate({ [phoneKey]: digitsOnly(e.target.value) }); onClearError(phoneKey); }}
            style={errors[phoneKey] ? { borderColor: 'var(--red)' } : {}}
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Floor / Unit No." optional>
          <input
            className="form-input"
            placeholder="e.g. Unit 3B, 2nd Floor"
            value={fields[floorKey]}
            maxLength={60}
            onChange={e => onUpdate({ [floorKey]: e.target.value })}
          />
        </Field>
        <Field label="Note to Driver" optional>
          <input
            className="form-input"
            placeholder="e.g. Leave at the guard post"
            value={fields[noteKey]}
            maxLength={120}
            onChange={e => onUpdate({ [noteKey]: e.target.value })}
          />
        </Field>
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
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <StepBar steps={STEPS} currentStep={1} />

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Delivery Details</h2>
        <p className="text-sm text-muted mb-24">Fill in the sender and recipient information for this delivery.</p>

        {/* Route summary – two separate boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            background: 'var(--primary-light)', border: '1.5px solid rgba(0,177,79,0.25)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{
              color: 'var(--primary)', fontWeight: 800, fontSize: '11px',
              background: 'rgba(0,177,79,0.15)', borderRadius: '6px',
              padding: '2px 8px', flexShrink: 0, marginTop: '2px', letterSpacing: '0.04em',
            }}>FROM</span>
            <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '13px', lineHeight: 1.4 }}>
              {bookingData.pickupAddress}
            </span>
          </div>
          <div style={{
            background: 'var(--red-light)', border: '1.5px solid rgba(220,38,38,0.25)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{
              color: 'var(--red)', fontWeight: 800, fontSize: '11px',
              background: 'rgba(220,38,38,0.15)', borderRadius: '6px',
              padding: '2px 8px', flexShrink: 0, marginTop: '2px', letterSpacing: '0.04em',
            }}>TO</span>
            <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '13px', lineHeight: 1.4 }}>
              {bookingData.deliveryAddress}
            </span>
          </div>
        </div>

        {/* Delivery Type */}
        <div className="form-group mb-24">
          <label className="form-label">Delivery Type</label>
          <div className="option-grid option-grid-3">
            {DELIVERY_TYPES.map(t => (
              <div
                key={t.id}
                className={`option-card${bookingData.deliveryType === t.id ? ' selected' : ''}${t.disabled ? ' disabled' : ''}`}
                onClick={() => !t.disabled && updateBooking({ deliveryType: t.id })}
              >
                <div className="option-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <t.Icon size={24} color={bookingData.deliveryType === t.id ? 'var(--primary)' : 'var(--text-3)'} />
                </div>
                <div className="option-title">{t.title}</div>
                <div className="option-desc">{t.desc}</div>
                <div className="option-price" style={{ color: t.disabled ? 'var(--text-3)' : 'var(--primary)' }}>
                  {DELIVERY_ADD[t.id] === 0 ? 'Included' : `+₱${DELIVERY_ADD[t.id]}`}
                </div>
                {t.disabled && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>Coming soon</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Sender & Recipient side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <PersonSection
            title="Sender's Details"
            prefix="sender"
            iconColor="var(--primary)"
            fields={bookingData}
            onUpdate={updateBooking}
            errors={errors}
            onClearError={clearError}
          />
          <PersonSection
            title="Recipient's Details"
            prefix="recipient"
            iconColor="var(--red)"
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
