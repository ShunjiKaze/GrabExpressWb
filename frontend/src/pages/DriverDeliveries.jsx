import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MotorcycleIcon, CarIcon, VanIcon, PackageIcon, CreditCardIcon, ShieldIcon, CheckCircleIcon, MapPinIcon } from '../components/Icons';

const PROXIMITY_KM = 5;

// Haversine formula — returns distance in km between two coordinates
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function VehicleIcon({ type, size = 20, color = 'var(--primary)' }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon = icons[type] || PackageIcon;
  return <Icon size={size} color={color} />;
}

const SIZE_LABEL = { S: 'Small', M: 'Medium', L: 'Large', XL: 'XL' };

function DriverDeliveries({ dbUser }) {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    // 1. Fetch available orders
    const qDeliveries = query(collection(db, 'bookings'), where('status', '==', 'searching'));
    const unsubDeliveries = onSnapshot(qDeliveries, snap => {
      setDeliveries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch driver's active vehicle
    const qVehicle = query(collection(db, 'vehicles'), where('driverId', '==', dbUser.user_id), where('status', '==', 'active'));
    const unsubVehicle = onSnapshot(qVehicle, snap => {
      setActiveVehicle(snap.empty ? null : snap.docs[0].data());
    });

    // 3. Fetch driver's active order to prevent multiple accepts
    const qActiveOrder = query(collection(db, 'bookings'), where('driverId', '==', dbUser.user_id), where('status', 'in', ['accepted', 'picked_up', 'in_transit']));
    const unsubActiveOrder = onSnapshot(qActiveOrder, snap => {
      setHasActiveOrder(!snap.empty);
      setLoading(false);
    });

    return () => {
      unsubDeliveries();
      unsubVehicle();
      unsubActiveOrder();
    };
  }, [dbUser.user_id]);

  const handleAccept = async (delivery) => {
    if (hasActiveOrder) return;
    setAccepting(delivery.id);
    try {
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

  // Filter by vehicle type AND 5km proximity to driver's assigned location
  const driverLat = dbUser?.assignedLat;
  const driverLng = dbUser?.assignedLng;

  const filtered = activeVehicle
    ? deliveries
        .filter(d => d.vehicleType === activeVehicle.type)
        .filter(d => {
          // If driver has no assigned location, show all (fallback)
          if (!driverLat || !driverLng) return true;
          // If booking has no coordinates, show it (fallback for old bookings)
          if (!d.pickupLat || !d.pickupLng) return true;
          const dist = haversineKm(driverLat, driverLng, d.pickupLat, d.pickupLng);
          return dist <= PROXIMITY_KM;
        })
        .map(d => ({
          ...d,
          _distKm: (driverLat && driverLng && d.pickupLat && d.pickupLng)
            ? haversineKm(driverLat, driverLng, d.pickupLat, d.pickupLng)
            : null,
        }))
    : [];

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: 'white', marginBottom: '24px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Driver Mode</div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>Available Orders</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>
              {loading ? 'Loading…' : !activeVehicle ? 'No active vehicle set.' : hasActiveOrder ? 'You have an ongoing delivery.' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''} within ${PROXIMITY_KM}km of your location`}
            </p>
            {driverLat && (
              <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, color: '#4ADE80' }}>
                <MapPinIcon size={12} color="#4ADE80" /> Proximity: {PROXIMITY_KM}km radius active
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(0,177,79,0.2)', border: '1px solid rgba(0,177,79,0.4)', borderRadius: 'var(--radius-md)', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#4ADE80' }}>{!activeVehicle || hasActiveOrder ? 0 : filtered.length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Available</div>
            </div>
          </div>
        </div>
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
      ) : dbUser.accountStatus === 'deactivated' || dbUser.accountStatus === 'pending_reactivation' ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldIcon size={48} color="var(--red)" />
            </div>
            <div className="empty-state-title">Account Deactivated</div>
            <div className="empty-state-desc">Your account is currently deactivated. You are in viewing mode and cannot accept new orders. Please request reactivation from your profile.</div>
            <button onClick={() => navigate('/profile')} className="btn btn-primary mt-16">Go to Profile</button>
          </div>
        </div>
      ) : !activeVehicle ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MotorcycleIcon size={48} color="var(--text-3)" />
            </div>
            <div className="empty-state-title">No Active Vehicle</div>
            <div className="empty-state-desc">You need to set a vehicle as "Active" in My Vehicles before you can find orders.</div>
            <button onClick={() => navigate('/driver/vehicles')} className="btn btn-primary mt-16">Go to My Vehicles</button>
          </div>
        </div>
      ) : hasActiveOrder ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <CheckCircleIcon size={48} />
            </div>
            <div className="empty-state-title">You have an ongoing delivery!</div>
            <div className="empty-state-desc">You must complete your current active order before accepting a new one.</div>
            <button onClick={() => navigate('/driver/active')} className="btn btn-primary mt-16">View Active Order</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VehicleIcon type={activeVehicle.type} size={48} color="var(--text-3)" />
            </div>
            <div className="empty-state-title">No {activeVehicle.type} orders available</div>
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
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary)', marginBottom: '6px' }}>₱{Number(d.totalAmount).toFixed(2)}</div>
                {d._distKm !== null && (
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <MapPinIcon size={11} color="var(--text-3)" /> {d._distKm.toFixed(1)} km away
                  </div>
                )}
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
