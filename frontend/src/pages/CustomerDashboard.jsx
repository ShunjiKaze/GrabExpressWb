import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import riderIllustration from '../assets/rider-illustration.jpg';

const STATUS_CONFIG = {
  searching:  { label: 'Searching Driver', badge: 'badge-amber',  icon: '🔍' },
  accepted:   { label: 'Driver Assigned',  badge: 'badge-blue',   icon: '🛵' },
  picked_up:  { label: 'Picked Up',        badge: 'badge-purple', icon: '📦' },
  in_transit: { label: 'In Transit',       badge: 'badge-blue',   icon: '🚀' },
  delivered:  { label: 'Delivered',        badge: 'badge-green',  icon: '✅' },
  completed:  { label: 'Completed',        badge: 'badge-green',  icon: '✅' },
  cancelled:  { label: 'Cancelled',        badge: 'badge-red',    icon: '❌' },
};

function CustomerDashboard({ dbUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', dbUser.user_id),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [dbUser.user_id]);

  const active = bookings.filter(b => !['delivered', 'completed', 'cancelled'].includes(b.status));
  const past   = bookings.filter(b =>  ['delivered', 'completed', 'cancelled'].includes(b.status));

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const BookingCard = ({ b }) => {
    const cfg = STATUS_CONFIG[b.status] || { label: b.status, badge: 'badge-gray', icon: '📦' };
    const isActive    = !['delivered', 'completed', 'cancelled'].includes(b.status);
    const isCancelled = b.status === 'cancelled';
    const isComplete  = ['delivered', 'completed'].includes(b.status);
    const needsRating = isComplete && !b.driverRating;

    return (
      <div
        className="history-card"
        style={{ cursor: isCancelled ? 'default' : 'pointer' }}
        onClick={() => !isCancelled && navigate(`/book/tracking/${b.id}`)}
      >
        <div className="history-icon" style={{ background: isActive ? 'var(--primary-light)' : isCancelled ? 'var(--red-light)' : 'var(--surface-2)' }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-sm text-muted">{formatDate(b.createdAt)}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📍 {b.pickupAddress}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🏁 {b.deliveryAddress}
          </div>
          <div className="flex items-center gap-12 mt-8">
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>₱{b.totalAmount}</span>
            <span className="badge badge-gray">{b.vehicleType}</span>
            {b.itemType && <span className="badge badge-gray">{b.itemType}</span>}
            {needsRating && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '2px 10px' }}>
                ⭐ Rate Driver
              </span>
            )}
            {isComplete && b.driverRating && (
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {'⭐'.repeat(b.driverRating)}
              </span>
            )}
          </div>
        </div>
        {!isCancelled && (
          <div style={{ flexShrink: 0, alignSelf: 'center' }}>
            <span style={{ fontSize: '14px', color: isActive ? 'var(--primary)' : 'var(--text-3)', fontWeight: 600 }}>
              {isActive ? 'Track →' : needsRating ? 'Rate →' : 'View →'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 className="page-title">My Deliveries</h1>
          <p className="page-subtitle">Hi {dbUser.full_name?.split(' ')[0] || 'there'} 👋 — manage and track your packages</p>
        </div>
        <Link to="/book/new/address" className="btn btn-primary btn-lg">
          + New Booking
        </Link>
      </div>

      {/* Active Orders */}
      {active.length > 0 && (
        <div className="mb-24">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
            🔴 Active Orders ({active.length})
          </h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {active.map(b => <BookingCard key={b.id} b={b} />)}
          </div>
        </div>
      )}

      {/* Empty / loading */}
      {loading ? (
        <div className="card" style={{ padding: '40px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton mb-8" style={{ height: 14, width: '40%' }} />
                <div className="skeleton mb-4" style={{ height: 12, width: '80%' }} />
                <div className="skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ position: 'relative', marginBottom: '24px', display: 'inline-block' }}>
              <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 0 0 8px rgba(252,228,236,0.5), 0 16px 48px rgba(236,72,153,0.15)' }}>
                <img src={riderIllustration} alt="Delivery rider" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,177,79,0.4), 0 0 0 3px white' }}>🛵</div>
            </div>
            <div className="empty-state-title">No deliveries yet</div>
            <div className="empty-state-desc">Book your first delivery and we'll match you with a nearby rider in minutes!</div>
            <Link to="/book/new/address" className="btn btn-primary mt-16">Book Now</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Past Orders */}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                📋 Past Orders ({past.length})
              </h2>
              <div className="card" style={{ overflow: 'hidden' }}>
                {past.map(b => <BookingCard key={b.id} b={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CustomerDashboard;
