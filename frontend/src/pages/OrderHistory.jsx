import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, MotorcycleIcon, CarIcon, VanIcon, PackageIcon, ZapIcon,
         CheckCircleIcon, XCircleIcon, MapPinIcon, FlagIcon, StarIcon,
         ClipboardIcon, ChevronUpIcon, ChevronDownIcon, FileTextIcon } from '../components/Icons';

function VehicleIcon({ type, size = 20, color = 'currentColor' }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon = icons[type] || PackageIcon;
  return <Icon size={size} color={color} />;
}

const STATUS_CONFIG = {
  searching:  { label: 'Searching',   badge: 'badge-amber',  Icon: SearchIcon },
  accepted:   { label: 'Accepted',    badge: 'badge-blue',   Icon: MotorcycleIcon },
  picked_up:  { label: 'Picked Up',   badge: 'badge-purple', Icon: PackageIcon },
  in_transit: { label: 'In Transit',  badge: 'badge-blue',   Icon: ZapIcon },
  delivered:  { label: 'Delivered',   badge: 'badge-green',  Icon: CheckCircleIcon },
  completed:  { label: 'Completed',   badge: 'badge-green',  Icon: CheckCircleIcon },
  cancelled:  { label: 'Cancelled',   badge: 'badge-red',    Icon: XCircleIcon },
};

function OrderHistory({ dbUser }) {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const field = dbUser.role === 'driver' ? 'driverId' : 'customerId';
    const q = query(
      collection(db, 'bookings'),
      where(field, '==', dbUser.user_id)
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setOrders(docs);
        setError(null);
        setLoading(false);
      },
      err => {
        console.error('OrderHistory query error:', err);
        setError('Failed to load orders. Please refresh the page.');
        setLoading(false);
      }
    );
    return unsub;
  }, [dbUser]);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' ||
      (filter === 'delivered' ? ['delivered', 'completed'].includes(o.status) :
       filter === 'active' ? ['accepted', 'picked_up', 'in_transit'].includes(o.status) :
       o.status === filter);
    const matchSearch = !search || [o.pickupAddress, o.deliveryAddress, o.id].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
          <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PackageIcon size={28} /></div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircleIcon size={28} /></div>
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completed}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircleIcon size={28} />
          </div>
          <div className="stat-label">Cancellations</div>
          <div className="stat-value">{orders.filter(o => o.status === 'cancelled').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-12 mb-16" style={{ flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
          <SearchIcon size={15} color="var(--text-3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            placeholder="Search by address or order ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {(dbUser.role === 'driver'
            ? [['all','All'],['active','Active'],['delivered','Completed'],['cancelled','Cancelled']]
            : [['all','All'],['searching','Searching'],['active','Active'],['delivered','Delivered'],['cancelled','Cancelled']]
          ).map(([val, label]) => (
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

      {/* Error */}
      {error && (
        <div className="card mb-16" style={{ padding: '16px 20px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontWeight: 600, fontSize: '14px' }}>
          {error}
        </div>
      )}

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
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardIcon size={48} color="var(--text-3)" />
            </div>
            <div className="empty-state-title">{search || filter !== 'all' ? 'No matching orders found' : 'No deliveries on record'}</div>
            <div className="empty-state-desc">
              {search ? 'No orders matched your search. Try a different address or order ID.' : filter !== 'all' ? 'No orders match the selected filter.' : dbUser.role === 'driver' ? 'Deliveries you complete will appear here.' : 'You have not placed any delivery orders yet. Your booking history will be shown here once a delivery has been made.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map(o => {
            const cfg = STATUS_CONFIG[o.status] || { label: o.status, badge: 'badge-gray', Icon: PackageIcon };
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
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: isActive ? 'var(--primary-light)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <VehicleIcon type={o.vehicleType} size={22} color={isActive ? 'var(--primary)' : 'var(--text-3)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-xs text-muted">{formatDate(o.createdAt)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPinIcon size={13} color="var(--primary)" style={{ flexShrink: 0 }} /> {o.pickupAddress}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FlagIcon size={13} color="var(--red)" style={{ flexShrink: 0 }} /> {o.deliveryAddress}
                    </div>
                    <div className="flex gap-12 mt-8">
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>₱{Number(o.totalAmount).toFixed(2)}</span>
                      <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{o.vehicleType}</span>
                      {o.itemType && <span className="badge badge-gray">{o.itemType}</span>}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-3)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </div>
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
                    {o.status === 'cancelled' && o.cancelReason && (
                      <div className="cancellation-block" style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--red-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '6px' }}>Cancellation</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{o.cancelReason}</div>
                        {o.cancelledBy && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>By: {o.cancelledBy}</div>}
                        {o.cancelNote && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', fontStyle: 'italic' }}>"{o.cancelNote}"</div>}
                      </div>
                    )}
                    {isActive && (
                      <button onClick={() => navigate(`/book/tracking/${o.id}`)} className="btn btn-primary btn-sm mt-16">
                        Track this Order →
                      </button>
                    )}
                    {['delivered', 'completed'].includes(o.status) && !o.driverRating && dbUser.role === 'customer' && (
                      <button onClick={() => navigate(`/rate/${o.id}`)} className="btn btn-secondary btn-sm mt-16" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StarIcon size={14} color="var(--amber)" /> Rate Driver
                      </button>
                    )}
                    {o.driverRating && (
                      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Your rating:</span>
                        <span style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: o.driverRating }, (_, i) => <StarIcon key={i} size={14} color="#F59E0B" filled />)}
                        </span>
                      </div>
                    )}
                    {['delivered', 'completed', 'cancelled'].includes(o.status) && (
                      <button onClick={() => navigate(`/receipt/${o.id}`)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                        <FileTextIcon size={14} color="var(--text-2)" /> View Receipt
                      </button>
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
