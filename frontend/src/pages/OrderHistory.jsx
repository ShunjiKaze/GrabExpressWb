import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  searching:  { label: 'Searching',   badge: 'badge-amber',  icon: '🔍' },
  accepted:   { label: 'Accepted',    badge: 'badge-blue',   icon: '🛵' },
  picked_up:  { label: 'Picked Up',   badge: 'badge-purple', icon: '📦' },
  in_transit: { label: 'In Transit',  badge: 'badge-blue',   icon: '🚀' },
  delivered:  { label: 'Delivered',   badge: 'badge-green',  icon: '✅' },
  completed:  { label: 'Completed',   badge: 'badge-green',  icon: '✅' },
  cancelled:  { label: 'Cancelled',   badge: 'badge-red',    icon: '❌' },
};

const VEHICLE_ICONS = { motorcycle: '🛵', car: '🚗', van: '🚐' };

function OrderHistory({ dbUser }) {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const field = dbUser.role === 'driver' ? 'driverId' : 'customerId';
    const q = query(
      collection(db, 'bookings'),
      where(field, '==', dbUser.user_id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [dbUser]);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const matchSearch = !search || [o.pickupAddress, o.deliveryAddress, o.id].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const total = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + (o.totalAmount || 0) : sum, 0);
  const completed = orders.filter(o => ['delivered', 'completed'].includes(o.status)).length;

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">{dbUser.role === 'driver' ? 'All deliveries you have completed' : 'All your past and active deliveries'}</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid mb-24" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card green">
          <div className="stat-icon">📦</div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completed}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">{dbUser.role === 'driver' ? '💰' : '💳'}</div>
          <div className="stat-label">{dbUser.role === 'driver' ? 'Total Earned' : 'Total Spent'}</div>
          <div className="stat-value" style={{ fontSize: '22px' }}>₱{total.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-12 mb-16" style={{ flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="🔍 Search by address or order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', maxWidth: '340px' }}
        />
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {[['all','All'],['searching','Searching'],['accepted','Active'],['delivered','Delivered'],['cancelled','Cancelled']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                background: filter === val ? 'var(--primary)' : 'var(--surface)',
                color: filter === val ? 'white' : 'var(--text-2)',
                boxShadow: filter === val ? '0 2px 8px var(--primary-glow)' : 'var(--shadow-xs)',
                transition: 'var(--transition)',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card" style={{ padding: '24px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-16 mb-20">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton mb-8" style={{ height: 14, width: '30%' }} />
                <div className="skeleton mb-4" style={{ height: 12, width: '70%' }} />
                <div className="skeleton"      style={{ height: 12, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No orders found</div>
            <div className="empty-state-desc">{search ? 'Try adjusting your search.' : 'Your order history will appear here once you start booking.'}</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map(o => {
            const cfg = STATUS_CONFIG[o.status] || { label: o.status, badge: 'badge-gray', icon: '📦' };
            const isOpen = expanded === o.id;
            const isActive = !['delivered', 'completed', 'cancelled'].includes(o.status);
            return (
              <div key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  className="flex gap-16 items-start"
                  style={{ padding: '18px 20px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: isActive ? 'var(--primary-light)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {VEHICLE_ICONS[o.vehicleType] || cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-xs text-muted">{formatDate(o.createdAt)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {o.pickupAddress}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🏁 {o.deliveryAddress}
                    </div>
                    <div className="flex gap-12 mt-8">
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>₱{o.totalAmount}</span>
                      <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{o.vehicleType}</span>
                      {o.itemType && <span className="badge badge-gray">{o.itemType}</span>}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-3)', fontSize: '18px', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: '0 20px 20px 80px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', animation: 'fadeInUp 0.2s ease' }}>
                    <div className="grid grid-2 gap-20 mt-16">
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Sender</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{o.senderName}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{o.senderPhone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Recipient</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{o.recipientName}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{o.recipientPhone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Package</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                          {o.itemType} • {o.itemSize} • {o.itemWeight}kg
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{o.guaranteeTier} guarantee</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Payment</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)', textTransform: 'capitalize' }}>{(o.paymentMethod || '').replace(/_/g, ' ')}</div>
                        {o.driverName && <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>Driver: {o.driverName}</div>}
                      </div>
                    </div>
                    {isActive && (
                      <button onClick={() => navigate(`/book/tracking/${o.id}`)} className="btn btn-primary btn-sm mt-16">
                        Track this Order →
                      </button>
                    )}
                    {['delivered', 'completed'].includes(o.status) && !o.driverRating && dbUser.role === 'customer' && (
                      <button onClick={() => navigate(`/rate/${o.id}`)} className="btn btn-secondary btn-sm mt-16">
                        ⭐ Rate Driver
                      </button>
                    )}
                    {o.driverRating && (
                      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Your rating:</span>
                        <span style={{ fontWeight: 700 }}>{'⭐'.repeat(o.driverRating)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
