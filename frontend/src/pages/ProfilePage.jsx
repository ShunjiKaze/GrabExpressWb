import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useToast } from '../components/Toast';
import { CameraIcon, EditIcon, CheckIcon, MotorcycleIcon, CarIcon, VanIcon, StarIcon } from '../components/Icons';

const VEHICLE_ICON_MAP = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
const ROLE_CONFIG = {
  customer: { label: 'Customer', color: '#15803D', bg: '#DCFCE7', dot: '#22C55E' },
  driver:   { label: 'Driver',   color: '#1E40AF', bg: '#DBEAFE', dot: '#3B82F6' },
  admin:    { label: 'Admin',    color: '#B91C1C', bg: '#FEE2E2', dot: '#EF4444' },
};

function ProfilePage({ dbUser, firebaseUser: fbUserProp }) {
  const [isEditing, setIsEditing]         = useState(false);
  const [name,  setName]                  = useState(dbUser?.full_name || '');
  const [phone, setPhone]                 = useState(dbUser?.phone || '');
  const [saving, setSaving]               = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [stats, setStats]                 = useState(null);
  const [displayName,  setDisplayName]    = useState(dbUser?.full_name || '');
  const [displayPhone, setDisplayPhone]   = useState(dbUser?.phone || '');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const showToast = useToast();
  // Use prop (from App state) first, fall back to auth.currentUser
  const firebaseUser  = fbUserProp || auth.currentUser;
  const role          = dbUser?.role;
  const roleCfg       = ROLE_CONFIG[role] || ROLE_CONFIG.customer;
  // Firestore photoURL wins (user may have uploaded a custom one); fall back to Google's
  const photoURL      = dbUser?.photoURL || firebaseUser?.photoURL || null;
  const isGoogleUser  = firebaseUser?.providerData?.some(p => p.providerId === 'google.com');

  useEffect(() => {
    if (!dbUser?.user_id) return;
    (async () => {
      try {
        const field = role === 'driver' ? 'driverId' : 'customerId';
        const snap  = await getDocs(query(collection(db, 'bookings'), where(field, '==', dbUser.user_id)));
        const all   = snap.docs.map(d => d.data());
        const done  = all.filter(b => ['delivered', 'completed'].includes(b.status));
        const ratings = done
          .filter(b => role === 'driver' ? b.driverRating : b.customerRating)
          .map(b => role === 'driver' ? b.driverRating : b.customerRating);
        const avg = ratings.length
          ? (ratings.reduce((a, v) => a + v, 0) / ratings.length).toFixed(1)
          : null;
        setStats({ total: all.length, completed: done.length, cancelled: all.filter(b => b.status === 'cancelled').length, avg, ratingCount: ratings.length });
      } catch (err) { console.error(err); }
    })();
  }, [dbUser?.user_id, role]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('Image must be under 5MB.', 'error'); return; }

    setPhotoUploading(true);
    try {
      const storageRef = ref(storage, `profile-photos/${dbUser.user_id}`);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject({ code: 'storage/timeout' }), 15000)
      );
      await Promise.race([uploadBytes(storageRef, file), timeout]);
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(firebaseUser, { photoURL: downloadURL });
      await updateDoc(doc(db, 'users', dbUser.user_id), { photoURL: downloadURL });
      showToast('Profile photo updated!', 'success');
    } catch (err) {
      console.error('Photo upload error:', err);
      if (err.code === 'storage/unauthorized') {
        showToast('Upload blocked: update Firebase Storage rules to allow authenticated uploads.', 'error');
      } else if (err.code === 'storage/timeout') {
        showToast('Upload timed out — Firebase Storage rules may be blocking uploads. Check the console.', 'error');
      } else {
        showToast(`Upload failed: ${err.message || err.code || 'unknown error'}`, 'error');
      }
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    const trimmedName  = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) { showToast('Name cannot be empty.', 'error'); return; }
    setSaving(true);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    try {
      const updates = { full_name: trimmedName };
      if (trimmedPhone) updates.phone = trimmedPhone;
      await Promise.race([updateDoc(doc(db, 'users', dbUser.user_id), updates), timeout]);
      try { await updateProfile(firebaseUser, { displayName: trimmedName }); } catch {}
      setDisplayName(trimmedName);
      if (trimmedPhone) setDisplayPhone(trimmedPhone);
      showToast('Profile saved!', 'success');
      setSaving(false);
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
      showToast(err?.message === 'timeout' ? 'Save timed out — check your connection.' : 'Failed to save. Try again.', 'error');
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

  const initial  = (dbUser?.full_name || 'U')[0].toUpperCase();
  const readField = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px',
    color: 'var(--navy)', fontWeight: 500,
  };

  const statItems = role === 'driver'
    ? [
        { v: stats?.total     ?? '—', l: 'Total Orders' },
        { v: stats?.completed ?? '—', l: 'Delivered' },
        { v: stats?.avg ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>{stats.avg}<StarIcon size={16} color="#F59E0B" filled /></span> : '—', l: `Rating (${stats?.ratingCount ?? 0})` },
      ]
    : [
        { v: stats?.total     ?? '—', l: 'Total Bookings' },
        { v: stats?.completed ?? '—', l: 'Completed' },
        { v: stats?.cancelled ?? '—', l: 'Cancelled' },
        { v: stats?.avg ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>{stats.avg}<StarIcon size={16} color="#F59E0B" filled /></span> : '—', l: 'Avg Rating' },
      ];

  return (
    <div className="page-enter" style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px 56px' }}>

      {/* ── Main Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>

        {/* Banner */}
        <div style={{ height: '120px', background: 'linear-gradient(120deg, #0A1223 0%, #0F2040 40%, #003D1F 75%, #00B14F22 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.12), transparent 65%)' }} />
        </div>

        {/* Avatar + Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 32px 28px', borderBottom: '1px solid var(--border)', marginTop: '-36px' }}>

          {/* Clickable Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid white', overflow: 'hidden', background: 'var(--primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: photoUploading ? 'not-allowed' : 'pointer' }}
              onClick={() => !photoUploading && fileInputRef.current?.click()}
              title="Change profile photo"
            >
              {photoURL
                ? <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: photoUploading ? 0.4 : 1, transition: 'opacity 0.2s' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '30px', fontWeight: 900, opacity: photoUploading ? 0.4 : 1 }}>{initial}</div>
              }
            </div>
            <div
              onClick={() => !photoUploading && fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: photoUploading ? '#aaa' : 'var(--primary)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: photoUploading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
            >
              <CameraIcon size={13} color="white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>

          {/* Name */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: '40px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>{displayName}</h1>
          </div>

          {/* Edit / Save / Sign Out / Delete */}
          <div style={{ paddingTop: '40px', flexShrink: 0, display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            {isEditing
              ? <>
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {saving ? 'Saving…' : <><CheckIcon size={13} color="white" /> Save Changes</>}
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary btn-sm">Cancel</button>
                </>
              : <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <EditIcon size={13} /> Edit Profile
                </button>
            }
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="btn btn-sm"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 2-column form grid */}
        <div style={{ padding: '28px 32px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Personal Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Full Name</label>
              {isEditing
                ? <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                : <div style={readField}>{displayName || '—'}</div>
              }
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Phone Number</label>
              {isEditing
                ? <input className="form-input" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" />
                : <div style={readField}>{displayPhone || <span style={{ color: 'var(--text-3)' }}>Not set</span>}</div>
              }
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Email Address</label>
              <div style={readField}>{firebaseUser?.email || '—'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Member Since</label>
              <div style={readField}>{formatDate(dbUser?.created_at)}</div>
            </div>
            {role === 'driver' && dbUser?.vehicle_type && <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Vehicle Type</label>
                <div style={{ ...readField, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {VEHICLE_ICON_MAP[dbUser.vehicle_type] && (() => { const Icon = VEHICLE_ICON_MAP[dbUser.vehicle_type]; return <Icon size={15} color="var(--text-2)" />; })()}
                  {dbUser.vehicle_type?.charAt(0).toUpperCase() + dbUser.vehicle_type?.slice(1)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Plate Number</label>
                <div style={readField}>{dbUser.vehicle_plate || '—'}</div>
              </div>
            </>}
          </div>
        </div>

        {/* Stats strip — only for customer and driver */}
        {role !== 'admin' && (
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            {statItems.map((s, i, arr) => (
              <div key={s.l} style={{ flex: 1, padding: '20px 16px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '6px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sign Out Confirmation Modal ── */}
      {showSignOutConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>Sign Out?</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
              Are you sure you want to sign out of your account?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowSignOutConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={() => signOut(auth)}
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProfilePage;
