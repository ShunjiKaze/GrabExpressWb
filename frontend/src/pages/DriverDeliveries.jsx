import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const VEHICLE_ICONS = { motorcycle: '🛵', car: '🚗', van: '🚐' };
const SIZE_LABEL    = { S: 'Small', M: 'Medium', L: 'Large', XL: 'XL' };

const MOCK_DRIVER_NAMES = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia', 'Miguel Torres'];
const MOCK_PLATES = ['ABC 1234', 'XYZ 5678', 'DEF 9012', 'GHI 3456'];

function DriverDeliveries({ dbUser }) {
  const navigate    = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [accepting, setAccepting]   = useState(null);
  const [filter, setFilter]         = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('status', '==', 'searching'),
    );
    const unsub = onSnapshot(q, snap => {
      setDeliveries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAccept = async (delivery) => {
    setAccepting(delivery.id);
    try {
      const driverName  = dbUser.full_name || MOCK_DRIVER_NAMES[0];
      const driverPlate = dbUser.vehicle_plate || MOCK_PLATES[Math.floor(Math.random() * MOCK_PLATES.length)];
      await updateDoc(doc(db, 'bookings', delivery.id), {
        driverId:      dbUser.user_id,
        driverName,
        driverPhone:   dbUser.phone || '09XXXXXXXXX',
        driverVehicle: delivery.vehicleType,
        driverPlate,
        status:        'accepted',
        acceptedAt:    serverTimestamp(),
      });
      navigate('/driver/active');
    } catch (err) {
      console.error(err);
      setAccepting(null);
    }
  };

  const filtered = filter === 'all' ? deliveries : deliveries.filter(d => d.vehicleType === filter);

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #1E3A5F 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: 'white', marginBottom: '24px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Driver Mode</div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>Available Orders</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>
              {loading ? 'Loading…' : `${deliveries.length} order${deliveries.length !== 1 ? 's' : ''} waiting for a rider`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(0,177,79,0.2)', border: '1px solid rgba(0,177,79,0.4)', borderRadius: 'var(--radius-md)', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#4ADE80' }}>{deliveries.length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[['all', 'All Vehicles'], ['motorcycle', '🛵 Motorcycle'], ['car', '🚗 Car'], ['van', '🚐 Van']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', transition: 'var(--transition)',
              background: filter === val ? 'var(--primary)' : 'var(--surface)',
              color: filter === val ? 'white' : 'var(--text-2)',
              boxShadow: filter === val ? '0 2px 8px var(--primary-glow)' : 'var(--shadow-xs)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton mb-8" style={{ height: 14, width: '60%' }} />
                <div className="skeleton mb-8" style={{ height: 12, width: '80%' }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🛵</div>
            <div className="empty-state-title">No orders available</div>
            <div className="empty-state-desc">Orders appear here in real-time as customers book. Stay online and check back shortly!</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', border: '1px solid var(--border)', transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              {/* Vehicle icon */}
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                {VEHICLE_ICONS[d.vehicleType] || '📦'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-8 mb-8">
                  <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{d.vehicleType}</span>
                  {d.itemSize && <span className="badge badge-gray">{SIZE_LABEL[d.itemSize] || d.itemSize}</span>}
                  {d.itemType && <span className="badge badge-gray">{d.itemType}</span>}
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>#{d.id.slice(-6).toUpperCase()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '3px', display: 'inline-block' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.pickupAddress}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: '3px', display: 'inline-block' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.deliveryAddress}</span>
                </div>

                <div className="flex items-center gap-16 text-sm text-muted">
                  <span>📦 {d.itemWeight ? `${d.itemWeight}kg` : '—'}</span>
                  <span>💳 {d.paymentMethod?.replace(/_/g, ' ')}</span>
                  {d.guaranteeTier && d.guaranteeTier !== 'Basic' && <span>🛡️ {d.guaranteeTier} guarantee</span>}
                </div>
              </div>

              {/* Action */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary)', marginBottom: '10px' }}>₱{d.totalAmount}</div>
                <button
                  onClick={() => handleAccept(d)}
                  disabled={accepting === d.id}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {accepting === d.id ? 'Accepting…' : 'Accept Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverDeliveries;
