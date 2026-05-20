import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UsersIcon, MotorcycleIcon, PackageIcon, ActivityIcon, XCircleIcon,
         SearchIcon, ZapIcon, CheckCircleIcon, BanknoteIcon } from '../components/Icons';

const STATUS_CONFIG = {
  searching:  { label: 'Searching',  badge: 'badge-amber',  Icon: SearchIcon },
  accepted:   { label: 'Accepted',   badge: 'badge-blue',   Icon: MotorcycleIcon },
  picked_up:  { label: 'Picked Up',  badge: 'badge-purple', Icon: PackageIcon },
  in_transit: { label: 'In Transit', badge: 'badge-blue',   Icon: ZapIcon },
  delivered:  { label: 'Delivered',  badge: 'badge-green',  Icon: CheckCircleIcon },
  completed:  { label: 'Completed',  badge: 'badge-green',  Icon: CheckCircleIcon },
  cancelled:  { label: 'Cancelled',  badge: 'badge-red',    Icon: XCircleIcon },
};

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');
  const [updatingRole, setUpdatingRole] = useState(null);

  useEffect(() => {
    const bUnsub = onSnapshot(
      query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100)),
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); }
    );
    const uUnsub = onSnapshot(
      query(collection(db, 'users'), limit(100)),
      snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const pUnsub = onSnapshot(
      query(collection(db, 'payments'), limit(200)),
      snap => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { bUnsub(); uUnsub(); pUnsub(); };
  }, []);

  const changeRole = async (userId, role) => {
    setUpdatingRole(userId);
    try { await updateDoc(doc(db, 'users', userId), { role }); }
    catch (err) { console.error(err); }
    setUpdatingRole(null);
  };

  const stats = {
    customers: users.filter(u => u.role === 'customer').length,
    drivers:   users.filter(u => u.role === 'driver').length,
    total:     bookings.length,
    active:    bookings.filter(b => !['delivered','completed','cancelled'].includes(b.status)).length,
    revenue:    bookings.filter(b => ['delivered','completed'].includes(b.status)).reduce((s, b) => s + (b.totalAmount || 0), 0),
    cancelled:  bookings.filter(b => b.status === 'cancelled').length,
    commission: payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.platformComm || 0), 0),
  };

  const formatDate = ts => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const STAT_CARDS = [
    { label: 'Customers',   value: stats.customers, Icon: UsersIcon,      cls: 'green'  },
    { label: 'Drivers',     value: stats.drivers,   Icon: MotorcycleIcon,  cls: 'blue'   },
    { label: 'Total Orders',value: stats.total,     Icon: PackageIcon,     cls: 'purple' },
    { label: 'Active Now',  value: stats.active,    Icon: ActivityIcon,    cls: 'amber'  },
    { label: 'Cancelled',   value: stats.cancelled,                           Icon: XCircleIcon,    cls: 'green'  },
    { label: 'Commission',  value: `₱${stats.commission.toLocaleString()}`,   Icon: BanknoteIcon,   cls: 'amber'  },
  ];

  return (
    <div className="dashboard-container">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: 'var(--radius-xl)', padding: '32px', color: 'white', marginBottom: '28px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Panel</div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, marginTop: '6px' }}>GrabExpress Dashboard</h1>
          </div>
          <div style={{ background: 'rgba(0,177,79,0.15)', border: '1px solid rgba(0,177,79,0.3)', borderRadius: 'var(--radius-md)', padding: '16px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#4ADE80' }}>₱{stats.revenue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-28">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.Icon size={28} />
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['overview','Overview'],['bookings','All Bookings'],['users','Users']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              color: tab === val ? 'var(--primary)' : 'var(--text-3)',
              borderBottom: tab === val ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'var(--transition)',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-2 gap-20">
          {/* Recent Bookings */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Bookings</h3>
              <button onClick={() => setTab('bookings')} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
            </div>
            {loading ? <div style={{ padding: '20px', color: 'var(--text-3)' }}>Loading…</div> : (
              bookings.slice(0, 8).map(b => {
                const cfg = STATUS_CONFIG[b.status] || { badge: 'badge-gray', label: b.status };
                return (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>{b.pickupAddress}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>→ {b.deliveryAddress?.substring(0, 40)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px' }}>₱{b.totalAmount}</div>
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Users breakdown */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>User Breakdown</h3>
            </div>
            {['customer','driver','admin'].map(role => {
              const count = users.filter(u => u.role === role).length;
              const pct   = users.length ? Math.round(count / users.length * 100) : 0;
              const colors = { customer: 'var(--primary)', driver: 'var(--blue)', admin: 'var(--red)' };
              return (
                <div key={role} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                  <div className="flex justify-between mb-8">
                    <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>{role}s</span>
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[role], borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}

            {/* Status breakdown */}
            <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '12px' }}>Order Status Split</div>
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const count = bookings.filter(b => b.status === status).length;
                if (!count) return null;
                return (
                  <div key={status} className="flex justify-between mb-6">
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: All Bookings */}
      {tab === 'bookings' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Pickup</th>
                <th>Delivery</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }}>Loading…</td></tr>
              ) : bookings.map(b => {
                const cfg = STATUS_CONFIG[b.status] || { badge: 'badge-gray', label: b.status };
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>#{b.id.slice(-8).toUpperCase()}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.pickupAddress}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.deliveryAddress}</td>
                    <td style={{ textTransform: 'capitalize' }}>{b.vehicleType}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₱{b.totalAmount}</td>
                    <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{formatDate(b.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Users */}
      {tab === 'users' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const roleColors = { admin: 'badge-red', driver: 'badge-blue', customer: 'badge-green' };
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.full_name || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '13px' }}>{u.email}</td>
                    <td><span className={`badge ${roleColors[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                    <td>
                      <select
                        value={u.role}
                        disabled={updatingRole === u.id}
                        onChange={e => changeRole(u.id, e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: '13px', background: 'var(--surface)', cursor: 'pointer' }}
                      >
                        <option value="customer">Customer</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
