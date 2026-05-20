import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { XIcon, InfoIcon, MotorcycleIcon, CarIcon, VanIcon } from './Icons';

const VEHICLE_OPTIONS = [
  { id: 'motorcycle', Icon: MotorcycleIcon, title: 'Motorcycle', desc: 'Best for small packages, fastest' },
  { id: 'car',        Icon: CarIcon,        title: 'Car',        desc: 'Medium items, comfortable' },
  { id: 'van',        Icon: VanIcon,        title: 'Van',        desc: 'Large or bulk items' },
];

function DriverRegistrationModal({ userId, existingPhone, onSuccess, onClose }) {
  const [step, setStep]               = useState(1);
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [phone, setPhone]             = useState(existingPhone || '');
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);

  const validateStep1 = () => {
    const e = {};
    if (!vehicleType) e.vehicleType = 'Please select a vehicle type.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    const plateClean = vehiclePlate.trim().toUpperCase();
    if (!plateClean) {
      e.vehiclePlate = 'Vehicle plate is required.';
    } else if (!/^[A-Z]{2,3}\s?\d{3,4}$/.test(plateClean)) {
      e.vehiclePlate = 'Invalid plate format. Example: ABC 1234';
    }

    const phoneClean = phone.trim();
    if (!phoneClean) {
      e.phone = 'Phone number is required.';
    } else if (!/^(09)\d{9}$/.test(phoneClean)) {
      e.phone = 'Must be an 11-digit PH number starting with 09. Example: 09123456789';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role:          'driver',
        vehicle_type:  vehicleType,
        vehicle_plate: vehiclePlate.trim().toUpperCase(),
        phone:         phone.trim(),
        driver_since:  new Date().toISOString(),
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MotorcycleIcon size={20} color="var(--primary)" /> Become a GrabExpress Driver
            </div>
            <p className="text-sm text-muted mt-8">
              Step {step} of 2 — {step === 1 ? 'Choose your vehicle' : 'Enter your details'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2].map(n => (
              <div key={n} style={{ flex: 1, height: '4px', borderRadius: '2px', background: n <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>

          {step === 1 && (
            <>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '16px' }}>
                What vehicle will you use for deliveries?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {VEHICLE_OPTIONS.map(v => (
                  <div
                    key={v.id}
                    onClick={() => { setVehicleType(v.id); setErrors({}); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                      border: `2px solid ${vehicleType === v.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: vehicleType === v.id ? 'var(--primary-light)' : 'var(--surface)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
                      <v.Icon size={32} color={vehicleType === v.id ? 'var(--primary)' : 'var(--text-2)'} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{v.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{v.desc}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${vehicleType === v.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: vehicleType === v.id ? 'var(--primary)' : 'transparent',
                      flexShrink: 0,
                    }} />
                  </div>
                ))}
              </div>
              {errors.vehicleType && <div className="alert alert-error mb-16">{errors.vehicleType}</div>}
              <button onClick={handleNext} className="btn btn-primary btn-full btn-lg">
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '20px' }}>
                Tell us about your vehicle and how customers can reach you.
              </p>

              <div className="form-group mb-16">
                <label className="form-label">
                  Vehicle Plate Number <span className="req">*</span>
                </label>
                <input
                  className={`form-input${errors.vehiclePlate ? ' input-error' : ''}`}
                  placeholder="e.g. ABC 1234"
                  value={vehiclePlate}
                  maxLength={8}
                  onChange={e => {
                    const val = e.target.value.replace(/[^A-Za-z0-9 ]/g, '').toUpperCase();
                    setVehiclePlate(val);
                    setErrors(prev => ({ ...prev, vehiclePlate: '' }));
                  }}
                  style={errors.vehiclePlate ? { borderColor: 'var(--red)' } : {}}
                />
                {errors.vehiclePlate && (
                  <span style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{errors.vehiclePlate}</span>
                )}
                <span className="text-xs text-muted">Philippine plate format: ABC 1234</span>
              </div>

              <div className="form-group mb-20">
                <label className="form-label">
                  Mobile Number <span className="req">*</span>
                </label>
                <input
                  className={`form-input${errors.phone ? ' input-error' : ''}`}
                  placeholder="09XXXXXXXXX"
                  value={phone}
                  maxLength={11}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  inputMode="numeric"
                  style={errors.phone ? { borderColor: 'var(--red)' } : {}}
                />
                {errors.phone && (
                  <span style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>{errors.phone}</span>
                )}
                <span className="text-xs text-muted">
                  {existingPhone ? 'Pre-filled from your account — edit if needed.' : '11-digit PH number starting with 09'}
                </span>
              </div>

              {errors.submit && <div className="alert alert-error mb-16">{errors.submit}</div>}

              <div className="alert alert-info mb-20">
                <InfoIcon size={16} />
                <span>By registering as a driver, you agree to follow GrabExpress safety guidelines and maintain a professional standard of service.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Registering…' : 'Register as Driver'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverRegistrationModal;
