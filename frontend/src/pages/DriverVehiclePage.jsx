import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc,
         writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MotorcycleIcon, CarIcon, VanIcon, CheckCircleIcon,
         TrashIcon, CalendarIcon, ShieldIcon } from '../components/Icons';

function VehicleTypeCard({ type, selected, onSelect }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon  = icons[type];
  return (
    <div
      onClick={() => onSelect(type)}
      style={{
        flex: 1, padding: '14px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        background: selected ? 'var(--primary-light)' : 'var(--surface)',
        transition: 'var(--transition)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
        <Icon size={28} color={selected ? 'var(--primary)' : 'var(--text-3)'} />
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'capitalize', color: selected ? 'var(--primary)' : 'var(--text-2)' }}>
        {type}
      </div>
    </div>
  );
}

const PLATE_RULES = {
  motorcycle: { pattern: /^\d{3}\s?[A-Z]{3}$/i, hint: '123 ABC' },
  car:        { pattern: /^[A-Z]{3}\s?\d{4}$/i,  hint: 'ABC 1234' },
  van:        { pattern: /^[A-Z]{3}\s?\d{4}$/i,  hint: 'ABC 1234' },
};

function validatePlate(type, plate) {
  const rule = PLATE_RULES[type];
  if (!rule) return true;
  return rule.pattern.test(plate.trim());
}

function formatPlateInput(type, val) {
  let cleaned = val.replace(/\s+/g, '').toUpperCase();
  if (type === 'motorcycle') {
    if (cleaned.length > 3) return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
  } else {
    if (cleaned.length > 3) return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 7);
  }
  return cleaned;
}

function DriverVehiclePage({ dbUser }) {
  const [vehicles, setVehicles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [deleteModalVehicle, setDeleteModalVehicle] = useState(null);
  const [formType, setFormType]       = useState('motorcycle');
  const [formPlate, setFormPlate]     = useState('');
  const [formYear, setFormYear]       = useState('');
  const [formExpiry, setFormExpiry]   = useState('');
  const [formError, setFormError]     = useState('');

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), where('driverId', '==', dbUser.user_id));
    return onSnapshot(q, async snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Auto-migrate vehicle info from user doc if no vehicles registered yet
      if (docs.length === 0 && dbUser.vehicle_type && dbUser.vehicle_plate) {
        try {
          await addDoc(collection(db, 'vehicles'), {
            driverId:        dbUser.user_id,
            type:            dbUser.vehicle_type.toLowerCase(),
            plateNo:         dbUser.vehicle_plate.toUpperCase(),
            year:            null,
            insuranceExpiry: null,
            status:          'inactive',
            adminStatus:     'approved',
            migratedFromProfile: true,
            createdAt:       serverTimestamp(),
          });
        } catch (err) {
          console.error('vehicle migration error:', err);
        }
        // snapshot will re-fire with the new doc
        return;
      }
      setVehicles(docs.filter(v => v.status !== 'deleted' && v.status !== 'rejected'));
      setLoading(false);
    }, err => {
      console.error('vehicles snapshot error:', err);
      setLoading(false);
    });
  }, [dbUser.user_id]);

  const handleSetActive = async (vehicleId, plateNo, vehicleType) => {
    const batch = writeBatch(db);
    vehicles.forEach(v => batch.update(doc(db, 'vehicles', v.id), { status: 'inactive' }));
    batch.update(doc(db, 'vehicles', vehicleId), { status: 'active' });
    await batch.commit();
    await updateDoc(doc(db, 'users', dbUser.user_id), { vehicle_plate: plateNo, vehicle_type: vehicleType });
  };

  const handleAdd = async () => {
    setFormError('');
    if (!formPlate.trim()) { setFormError('Plate number is required.'); return; }
    if (!validatePlate(formType, formPlate)) {
      setFormError(`Invalid plate format for ${formType}. Expected format: ${PLATE_RULES[formType].hint}`);
      return;
    }
    const currentYear = new Date().getFullYear();
    if (!formYear || formYear.length !== 4) { setFormError('Enter a valid 4-digit year.'); return; }
    const yearNum = parseInt(formYear);
    if (yearNum < 2000 || yearNum > currentYear + 1) { setFormError(`Year must be between 2000 and ${currentYear + 1}.`); return; }
    if (!formExpiry) { setFormError('Insurance expiry date is required.'); return; }

    const hasSameType = vehicles.some(v => v.type === formType && v.status !== 'pending_delete');
    if (hasSameType) {
      setFormError(`You already have a ${formType}. Only one vehicle per type is allowed.`);
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'vehicles'), {
        driverId:        dbUser.user_id,
        type:            formType,
        plateNo:         formPlate.trim().toUpperCase(),
        year:            parseInt(formYear),
        insuranceExpiry: formExpiry,
        status:          'pending_add', // User requested: apply a request for new vehicle
        createdAt:       serverTimestamp(),
      });
      setShowForm(false);
      setFormPlate(''); setFormYear(''); setFormExpiry(''); setFormType('motorcycle');
    } catch (err) { console.error(err); setFormError('Failed to save. Please try again.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteModalVehicle) return;
    await updateDoc(doc(db, 'vehicles', deleteModalVehicle.id), { status: 'pending_delete' });
    setDeleteModalVehicle(null);
  };

  const VehicleIcon = ({ type, size = 20, color = 'currentColor' }) => {
    const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
    const Icon  = icons[type] || MotorcycleIcon;
    return <Icon size={size} color={color} />;
  };

  const modal = deleteModalVehicle ? createPortal(
    <div
      onClick={() => setDeleteModalVehicle(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: '20px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          animation: 'fadeInUp 0.22s ease',
        }}
      >
        {/* Red header banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2, #FFE4E4)',
          padding: '32px 28px 24px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(239,68,68,0.15)',
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '2px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <TrashIcon size={26} color="var(--red)" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#7F1D1D', marginBottom: '6px' }}>
            Request Vehicle Removal
          </div>
          <div style={{ fontSize: '13px', color: '#B91C1C', opacity: 0.75 }}>
            This will be reviewed by an admin before removal.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', borderRadius: '0 0 20px 20px' }}>
          {/* Vehicle pill */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '14px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <VehicleIcon type={deleteModalVehicle.type} size={22} color="var(--text-2)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '16px', letterSpacing: '0.08em', color: 'var(--text)' }}>
                {deleteModalVehicle.plateNo}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'capitalize', marginTop: '2px' }}>
                {deleteModalVehicle.type}{deleteModalVehicle.year ? ` · ${deleteModalVehicle.year}` : ''}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '24px', textAlign: 'center' }}>
            Once submitted, this vehicle will be marked as{' '}
            <strong style={{ color: 'var(--red)' }}>Deletion Pending</strong>{' '}
            and you will not be able to set it as active until the request is resolved.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setDeleteModalVehicle(null)}
              className="btn btn-secondary"
              style={{ flex: 1, borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{ flex: 1, borderRadius: '10px' }}
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f2544 0%, #1E3A5F 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Driver Portal</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>My Vehicles</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>Register and manage your delivery vehicles.</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError(''); }} className="btn btn-primary btn-sm">+ Add Vehicle</button>
      </div>

      {/* Add vehicle form */}
      {showForm && (
        <div className="card mb-20" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>Register a Vehicle</h3>

          <div className="form-group mb-20">
            <label className="form-label">Vehicle Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['motorcycle', 'car', 'van'].map(t => (
                <VehicleTypeCard key={t} type={t} selected={formType === t} onSelect={(type) => { setFormType(type); setFormPlate(''); }} />
              ))}
            </div>
          </div>

          <div className="form-group mb-16">
            <label className="form-label">Plate Number <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '12px' }}>({PLATE_RULES[formType].hint})</span></label>
            <input className="form-input" placeholder={`e.g. ${PLATE_RULES[formType].hint}`} value={formPlate} onChange={e => setFormPlate(formatPlateInput(formType, e.target.value))} style={{ textTransform: 'uppercase' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Year
                {formYear.length > 0 && formYear.length < 4 && (
                  <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 500, marginLeft: '6px' }}>
                    {4 - formYear.length} more digit{4 - formYear.length !== 1 ? 's' : ''} needed
                  </span>
                )}
                {formYear.length === 4 && (() => {
                  const y = parseInt(formYear);
                  const max = new Date().getFullYear() + 1;
                  if (y < 2000 || y > max) return <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 500, marginLeft: '6px' }}>Must be 2000–{max}</span>;
                  return <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 500, marginLeft: '6px' }}>✓ Valid</span>;
                })()}
              </label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2021"
                maxLength={4}
                value={formYear}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormYear(val);
                }}
                onBlur={() => {
                  if (formYear.length === 4) {
                    const y = parseInt(formYear);
                    const max = new Date().getFullYear() + 1;
                    if (y < 2000) setFormYear('2000');
                    if (y > max) setFormYear(String(max));
                  }
                }}
                style={{
                  borderColor: formYear.length === 4
                    ? (parseInt(formYear) >= 2000 && parseInt(formYear) <= new Date().getFullYear() + 1 ? 'var(--primary)' : 'var(--red)')
                    : formYear.length > 0 ? 'var(--red)' : undefined,
                  letterSpacing: '0.1em',
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Insurance Expiry</label>
              <input className="form-input" type="date" value={formExpiry} onChange={e => setFormExpiry(e.target.value)} />
            </div>
          </div>

          {formError && <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>{formError}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleAdd} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Vehicle'}
            </button>
          </div>
        </div>
      )}

      {/* Vehicle list */}
      {loading ? (
        <div className="card" style={{ padding: '24px' }}>
          {[1, 2].map(i => (
            <div key={i} className="flex gap-16 mb-16">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton mb-8" style={{ height: 14, width: '40%' }} />
                <div className="skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MotorcycleIcon size={48} color="var(--text-3)" />
            </div>
            <div className="empty-state-title">No Vehicles Registered</div>
            <div className="empty-state-desc">Add your first vehicle to get started with deliveries.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {vehicles.map(v => {
            const isActive = v.status === 'active';
            const isPendingAdd = v.status === 'pending_add';
            const isPendingDelete = v.status === 'pending_delete';
            return (
              <div key={v.id} className="card" style={{ padding: '20px', border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: isActive ? 'var(--primary-light)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <VehicleIcon type={v.type} size={24} color={isActive ? 'var(--primary)' : 'var(--text-3)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '16px', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{v.plateNo}</span>
                      <span className={`badge ${isActive ? 'badge-green' : isPendingAdd ? 'badge-amber' : isPendingDelete ? 'badge-red' : 'badge-gray'}`}>
                        {isActive ? 'Active' : isPendingAdd ? 'Approval Pending' : isPendingDelete ? 'Deletion Pending' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', textTransform: 'capitalize' }}>
                      {v.type} · {v.year}
                    </div>
                    {v.insuranceExpiry && (
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={11} color="var(--text-3)" /> Insurance expires: {v.insuranceExpiry}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {!isActive && !isPendingAdd && !isPendingDelete && (
                      <button onClick={() => handleSetActive(v.id, v.plateNo, v.type)} className="btn btn-primary btn-sm">
                        Set Active
                      </button>
                    )}
                    {isActive && !isPendingDelete && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginRight: '8px' }}>
                        <CheckCircleIcon size={16} color="var(--primary)" /> Active
                      </div>
                    )}
                    {!isPendingDelete && (
                      <button onClick={() => setDeleteModalVehicle(v)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }}>
                        <TrashIcon size={15} color="var(--text-3)" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
    {modal}
    </>
  );
}

export default DriverVehiclePage;
