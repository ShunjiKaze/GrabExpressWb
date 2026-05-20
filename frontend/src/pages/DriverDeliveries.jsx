import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MotorcycleIcon, CarIcon, VanIcon, PackageIcon, CreditCardIcon, ShieldIcon } from '../components/Icons';

function VehicleIcon({ type, size = 20, color = 'var(--primary)' }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon = icons[type] || PackageIcon;
  return <Icon size={size} color={color} />;
}

const SIZE_LABEL    = { S: 'Small', M: 'Medium', L: 'Large', XL: 'XL' };


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
      const vSnap = await getDocs(query(
        collection(db, 'vehicles'),
        where('driverId', '==', dbUser.user_id),
        where('status',   '==', 'active')
      ));
      const activeVehicle = vSnap.empty ? null : vSnap.docs[0].data();
      await updateDoc(doc(db, 'bookings', delivery.id), {
        driverId:      dbUser.user_id,
        driverName:    dbUser.full_name || 'Driver',
        driverPhone:   dbUser.phone || '—',
        driverVehicle: activeVehicle?.type    || delivery.vehicleType,
        driverPlate:   activeVehicle?.plateNo || dbUser.vehicle_plate || '—',
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

  const FILTER_TABS = [
    { val: 'all', label: 'All Vehicles', Icon: null },
    { val: 'motorcycle', label: 'Motorcycle', Icon: MotorcycleIcon },
    { val: 'car', label: 'Car', Icon: CarIcon },
    { val: 'van', label: 'Van', Icon: VanIcon },
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: 'white', marginBottom: '24px' }}>
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
        {FILTER_TABS.map(({ val, label, Icon }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', transition: 'var(--transition)',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: filter === val ? 'var(--primary)' : 'var(--surface)',
              color: filter === val ? 'white' : 'var(--text-2)',
              boxShadow: filter === val ? '0 2px 8px var(--primary-glow)' : 'var(--shadow-xs)',
            }}
          >
            {Icon && <Icon size={14} color={filter === val ? 'white' : 'var(--text-2)'} />}
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
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MotorcycleIcon size={48} color="var(--text-3)" />
            </div>
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
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <VehicleIcon type={d.vehicleType} size={28} color="var(--primary)" />
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PackageIcon size={13} /> {d.itemWeight ? `${d.itemWeight}kg` : '—'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCardIcon size={13} /> {d.paymentMethod?.replace(/_/g, ' ')}
                  </span>
                  {d.guaranteeTier && d.guaranteeTier !== 'Basic' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldIcon size={13} /> {d.guaranteeTier} guarantee
                    </span>
                  )}
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
