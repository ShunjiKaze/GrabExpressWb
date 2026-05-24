import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import riderIllustration from '../assets/rider-illustration.jpg';
import { SearchIcon, MotorcycleIcon, PackageIcon, ZapIcon, CheckCircleIcon, XCircleIcon,
         MapPinIcon, FlagIcon, StarIcon, ClockIcon } from '../components/Icons';

const STATUS_CONFIG = {
  searching:  { label: 'Searching Driver', badge: 'badge-amber',  Icon: SearchIcon },
  accepted:   { label: 'Driver Assigned',  badge: 'badge-blue',   Icon: MotorcycleIcon },
  picked_up:  { label: 'Picked Up',        badge: 'badge-purple', Icon: PackageIcon },
  in_transit: { label: 'In Transit',       badge: 'badge-blue',   Icon: ZapIcon },
  delivered:  { label: 'Delivered',        badge: 'badge-green',  Icon: CheckCircleIcon },
  completed:  { label: 'Completed',        badge: 'badge-green',  Icon: CheckCircleIcon },
  cancelled:  { label: 'Cancelled',        badge: 'badge-red',    Icon: XCircleIcon },
};

function CustomerDashboard({ dbUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!dbUser || !dbUser.user_id) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', dbUser.user_id),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching bookings:", err);
      setLoading(false);
    });
    
    return () => unsub();
  }, [dbUser]);

  const active    = bookings.filter(b => !['delivered', 'completed', 'cancelled'].includes(b.status));
  const past      = bookings.filter(b =>  ['delivered', 'completed', 'cancelled'].includes(b.status));
  const completed = past.filter(b => ['delivered', 'completed'].includes(b.status)).length;

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const BookingCard = ({ b }) => {
    const cfg        = STATUS_CONFIG[b.status] || { label: b.status, badge: 'badge-gray', Icon: PackageIcon };
    const isActive   = !['delivered', 'completed', 'cancelled'].includes(b.status);
    const isCancelled= b.status === 'cancelled';
    const isComplete = ['delivered', 'completed'].includes(b.status);
    const needsRating= isComplete && !b.driverRating;

    return (
      <div
        className="history-card"
        style={{ cursor: isCancelled ? 'default' : 'pointer' }}
        onClick={() => !isCancelled && navigate(`/book/tracking/${b.id}`)}
      >
        <div className="history-icon" style={{
          background: isActive ? 'var(--primary-light)' : isCancelled ? 'var(--red-light)' : 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <cfg.Icon size={22} color={isActive ? 'var(--primary)' : isCancelled ? 'var(--red)' : 'var(--text-3)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-sm text-muted">{formatDate(b.createdAt)}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPinIcon size={13} color="var(--primary)" style={{ flexShrink: 0 }} /> {b.pickupAddress}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FlagIcon size={13} color="var(--red)" style={{ flexShrink: 0 }} /> {b.deliveryAddress}
          </div>
          <div className="flex items-center gap-12 mt-8">
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>₱{Number(b.totalAmount).toFixed(2)}</span>
            <span className="badge badge-gray">{b.vehicleType}</span>
            {b.itemType && <span className="badge badge-gray">{b.itemType}</span>}
            {needsRating && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '2px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <StarIcon size={11} color="var(--amber)" filled /> Rate Driver
              </span>
            )}
            {isComplete && b.driverRating && (
              <span style={{ fontSize: '12px', color: 'var(--amber)', display: 'flex', gap: '1px' }}>
                {Array.from({ length: b.driverRating }, (_, i) => <StarIcon key={i} size={12} color="#F59E0B" filled />)}
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

  /* ── Shown when user has history but no active orders (so the page isn't blank) ── */
  const IdlePanel = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
      {/* Quick-book CTA card */}
      <div style={{
        background: 'linear-gradient(135deg, #00B14F 0%, #009140 100%)',
        borderRadius: 'var(--radius-xl)', padding: '28px 28px 24px', color: 'white',
        display: 'flex', flexDirection: 'column', minHeight: '180px',
        boxShadow: '0 8px 24px rgba(0,177,79,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '8px' }}>Ready to ship?</div>
          <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1.2, marginBottom: '6px' }}>Book your next delivery</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '20px' }}>Riders available now in Cebu City</div>
          <Link to="/book/new/address" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'white', color: 'var(--primary)', fontWeight: 800,
            fontSize: '13px', padding: '10px 20px', borderRadius: '10px',
            textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s',
          }}>
            + New Booking
          </Link>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircleIcon size={22} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>{completed}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '3px' }}>Deliveries Completed</div>
          </div>
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClockIcon size={22} color="var(--amber)" />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>{bookings.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '3px' }}>Total Bookings</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 className="page-title">My Deliveries</h1>
          <p className="page-subtitle">Hi {dbUser.full_name?.split(' ')[0] || 'there'} — manage and track your packages</p>
        </div>
        <Link to="/book/new/address" className="btn btn-primary btn-lg">
          + New Booking
        </Link>
      </div>

      {/* Active Orders */}
      {active.length > 0 && (
        <div className="mb-24">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
            Active Orders ({active.length})
          </h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {active.map(b => <BookingCard key={b.id} b={b} />)}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
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
      ) : active.length === 0 ? (
        /* Show idle panel when there are no active deliveries, even if it's their first time */
        <IdlePanel />
      ) : null}
    </div>
  );
}

export default CustomerDashboard;
