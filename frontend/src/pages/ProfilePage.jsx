import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useToast } from '../components/Toast';

const VEHICLE_ICONS = { motorcycle: '🛵', car: '🚗', van: '🚐' };
const ROLE_CONFIG = {
  customer: { label: 'Customer', color: '#15803D', bg: '#DCFCE7', dot: '#22C55E' },
  driver:   { label: 'Driver',   color: '#1E40AF', bg: '#DBEAFE', dot: '#3B82F6' },
  admin:    { label: 'Admin',    color: '#B91C1C', bg: '#FEE2E2', dot: '#EF4444' },
};

function ProfilePage({ dbUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name,  setName]  = useState(dbUser?.full_name || '');
  const [phone, setPhone] = useState(dbUser?.phone || '');
  const [saving, setSaving] = useState(false);
  const [stats,  setStats]  = useState(null);
  /* local display values so the header updates immediately after save */
  const [displayName,  setDisplayName]  = useState(dbUser?.full_name || '');
  const [displayPhone, setDisplayPhone] = useState(dbUser?.phone || '');
  const { showToast }  = useToast();
  const firebaseUser   = auth.currentUser;
  const role           = dbUser?.role;
  const roleCfg        = ROLE_CONFIG[role] || ROLE_CONFIG.customer;

  useEffect(() => {
    if (!dbUser?.user_id) return;
    (async () => {
      try {
        const field = role === 'driver' ? 'driverId' : 'customerId';
        const snap  = await getDocs(query(collection(db, 'bookings'), where(field, '==', dbUser.user_id)));
        const all   = snap.docs.map(d => d.data());
        const done  = all.filter(b => ['delivered', 'completed'].includes(b.status));
        const ratings = done
          .filter(b => role === 'driver' ? b.customerRating : b.driverRating)
          .map(b => role === 'driver' ? b.customerRating : b.driverRating);
        const avg = ratings.length
          ? (ratings.reduce((a, v) => a + v, 0) / ratings.length).toFixed(1)
          : null;
        setStats({ total: all.length, completed: done.length, cancelled: all.filter(b => b.status === 'cancelled').length, avg, ratingCount: ratings.length });
      } catch (err) { console.error(err); }
    })();
  }, [dbUser?.user_id, role]);

  const handleSave = async () => {
    const trimmedName  = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) { showToast('Name cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      const updates = { full_name: trimmedName };
      if (trimmedPhone) updates.phone = trimmedPhone;
      await updateDoc(doc(db, 'users', dbUser.user_id), updates);
      setDisplayName(trimmedName);
      if (trimmedPhone) setDisplayPhone(trimmedPhone);
      showToast('Profile saved!', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
      showToast('Failed to save. Check your connection and try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(displayName);
    setPhone(displayPhone);
    setIsEditing(false);
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const initial = (dbUser?.full_name || 'U')[0].toUpperCase();

  /* shared read-only display field style */
  const readField = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px',
    color: 'var(--navy)', fontWeight: 500,
  };

  const statItems = role === 'driver'
    ? [
        { v: stats?.total     ?? '—', l: 'Total Orders'  },
        { v: stats?.completed ?? '—', l: 'Delivered'      },
        { v: stats?.avg ? `${stats.avg} ★` : '—', l: `Rating (${stats?.ratingCount ?? 0})` },
      ]
    : [
        { v: stats?.total     ?? '—', l: 'Total Bookings' },
        { v: stats?.completed ?? '—', l: 'Completed'      },
        { v: stats?.cancelled ?? '—', l: 'Cancelled'      },
        { v: stats?.avg ? `${stats.avg} ★` : '—', l: 'Avg Rating'  },
      ];

  return (
    <div className="page-enter" style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px 56px' }}>

      {/* ── Main Card ────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>

        {/* Banner */}
        <div style={{ height: '120px', background: 'linear-gradient(120deg, #0A1223 0%, #0F2040 40%, #003D1F 75%, #00B14F22 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.12), transparent 65%)' }} />
        </div>

        {/* Avatar + Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 32px 28px', borderBottom: '1px solid var(--border)', marginTop: '-36px' }}>
          {/* Avatar */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid white', overflow: 'hidden', background: 'var(--primary)', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {firebaseUser?.photoURL
              ? <img src={firebaseUser.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '30px', fontWeight: 900 }}>{initial}</div>
            }
          </div>
          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>{displayName}</h1>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: roleCfg.bg, color: roleCfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleCfg.label}</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '3px 0 0' }}>{firebaseUser?.email}</p>
          </div>
          {/* Edit / Save */}
          <div style={{ paddingTop: '40px', flexShrink: 0, display: 'flex', gap: '8px' }}>
            {isEditing
              ? <>
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">{saving ? 'Saving…' : '✓ Save Changes'}</button>
                  <button onClick={handleCancel} className="btn btn-secondary btn-sm">Cancel</button>
                </>
              : <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">✏️ Edit Profile</button>
            }
          </div>
        </div>

        {/* ── 2-column form grid ──── */}
        <div style={{ padding: '28px 32px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Personal Information</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Full Name</label>
              {isEditing
                ? <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                : <div style={readField}>{displayName || '—'}</div>
              }
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Phone Number</label>
              {isEditing
                ? <input className="form-input" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" />
                : <div style={readField}>{displayPhone || <span style={{ color: 'var(--text-3)' }}>Not set</span>}</div>
              }
            </div>

            {/* Account Role */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Account Role</label>
              <div style={readField}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: roleCfg.dot, display: 'inline-block' }} />
                  {roleCfg.label}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Member Since</label>
              <div style={readField}>{formatDate(dbUser?.created_at)}</div>
            </div>

            {/* Driver-only fields */}
            {role === 'driver' && dbUser?.vehicle_type && <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Vehicle Type</label>
                <div style={readField}>{VEHICLE_ICONS[dbUser.vehicle_type]} {dbUser.vehicle_type?.charAt(0).toUpperCase() + dbUser.vehicle_type?.slice(1)}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Plate Number</label>
                <div style={readField}>{dbUser.vehicle_plate || '—'}</div>
              </div>
            </>}
          </div>
        </div>

        {/* ── Stats strip ──── */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          {statItems.map((s, i, arr) => (
            <div key={s.l} style={{ flex: 1, padding: '20px 16px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '6px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default ProfilePage;
