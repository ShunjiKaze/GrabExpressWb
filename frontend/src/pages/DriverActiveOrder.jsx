import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MotorcycleIcon, CarIcon, VanIcon, MapPinIcon, FlagIcon, PackageIcon,
         CheckCircleIcon, CameraIcon, UserIcon, PhoneIcon, BuildingIcon, MessageIcon, XIcon } from '../components/Icons';

function VehicleIcon({ type, size = 20, color = 'currentColor' }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon = icons[type] || MotorcycleIcon;
  return <Icon size={size} color={color} />;
}

const ACTION_STEPS = {
  accepted:   { btn: "Arrived at Pickup Location",   next: 'picked_up',  color: 'var(--blue)',    Icon: MapPinIcon },
  picked_up:  { btn: 'Take Proof & Start Delivery',  next: 'in_transit', color: 'var(--purple)',  Icon: PackageIcon },
  in_transit: { btn: 'Mark as Delivered',            next: 'delivered',  color: 'var(--primary)', Icon: CheckCircleIcon },
};

function StatusBadge({ status }) {
  const map = {
    accepted:   { label: 'Driver Accepted', bg: 'var(--blue-light)', color: '#1D4ED8' },
    picked_up:  { label: 'Item Picked Up',  bg: 'var(--purple-light)', color: '#6D28D9' },
    in_transit: { label: 'In Transit',      bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
  };
  const cfg = map[status] || { label: status, bg: 'var(--surface-2)', color: 'var(--text-3)' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
      {cfg.label}
    </span>
  );
}

function ProofCaptureModal({ onCapture, onClose, label }) {
  const [captured, setCaptured] = useState(false);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CameraIcon size={18} /> {label}
          </div>
          <button className="modal-close" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div
            onClick={() => setCaptured(true)}
            style={{
              border: `3px dashed ${captured ? 'var(--primary)' : 'var(--border)'}`,
              background: captured ? 'var(--primary-light)' : 'var(--surface-2)',
              borderRadius: 'var(--radius-lg)', padding: '40px 24px', cursor: 'pointer', marginBottom: '20px', transition: 'var(--transition)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              {captured
                ? <CheckCircleIcon size={52} color="var(--primary)" />
                : <CameraIcon size={52} color="var(--text-3)" />
              }
            </div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: captured ? 'var(--primary)' : 'var(--text-2)' }}>
              {captured ? 'Photo Captured!' : 'Tap to Take Photo'}
            </div>
            <div className="text-sm text-muted mt-8">
              {captured ? 'Proof recorded successfully' : 'Take a clear photo of the package'}
            </div>
          </div>
          <button
            onClick={() => captured && onCapture()}
            className={`btn btn-full btn-lg ${captured ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!captured}
          >
            {captured ? 'Confirm & Continue' : 'Take Photo First'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DriverActiveOrder({ dbUser }) {
  const navigate = useNavigate();
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(false);
  const [showProof, setShowProof]   = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('driverId', '==', dbUser.user_id),
      where('status', 'in', ['accepted', 'picked_up', 'in_transit'])
    );
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrder(docs.length > 0 ? docs[0] : null);
      setLoading(false);
    });
    return unsub;
  }, [dbUser.user_id]);

  const progressToStatus = async (nextStatus) => {
    if (!order) return;
    const needsProof = nextStatus === 'in_transit' || nextStatus === 'delivered';
    if (needsProof) {
      setPendingStatus(nextStatus);
      setShowProof(true);
      return;
    }
    await doUpdate(nextStatus);
  };

  const doUpdate = async (nextStatus) => {
    setUpdating(true);
    setShowProof(false);
    try {
      const timestamps = {
        picked_up:  { pickedUpAt: serverTimestamp() },
        in_transit: { transitAt: serverTimestamp() },
        delivered:  { deliveredAt: serverTimestamp() },
      };
      await updateDoc(doc(db, 'bookings', order.id), {
        status: nextStatus,
        ...(timestamps[nextStatus] || {}),
      });
      if (nextStatus === 'delivered') {
        navigate(`/rate/${order.id}`);
      }
    } catch (err) { console.error(err); }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div className="processing-ring" />
        <p className="text-muted mt-16">Loading…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '500px', paddingTop: '60px' }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <MotorcycleIcon size={64} color="var(--text-3)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>No Active Order</h2>
          <p className="text-muted mb-24">You don't have an active delivery right now. Find new orders to start earning!</p>
          <button onClick={() => navigate('/driver/deliveries')} className="btn btn-primary btn-lg btn-full">Find Orders</button>
        </div>
      </div>
    );
  }

  const action = ACTION_STEPS[order.status];

  return (
    <div className="dashboard-container" style={{ maxWidth: '720px' }}>
      {showProof && (
        <ProofCaptureModal
          label={pendingStatus === 'in_transit' ? 'Proof of Pickup' : 'Proof of Delivery'}
          onCapture={() => doUpdate(pendingStatus)}
          onClose={() => { setShowProof(false); setPendingStatus(null); }}
        />
      )}

      {/* Mission header */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: 'white', marginBottom: '20px' }}>
        <div className="flex items-center justify-between mb-16">
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current Mission</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginTop: '4px' }}>Order #{order.id.slice(-8).toUpperCase()}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#4ADE80' }}>₱{order.totalAmount}</div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #4ADE80, #22C55E)',
            width: order.status === 'accepted' ? '33%' : order.status === 'picked_up' ? '66%' : '100%',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
          <span>Accepted</span><span>Picked Up</span><span>In Transit</span><span>Delivered</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Route */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '16px' }}>Delivery Route</div>

            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', padding: '16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(0,177,79,0.2)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPinIcon size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '3px' }}>Pickup From</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>{order.pickupAddress}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserIcon size={12} /> {order.senderName}</span>
                  <span>•</span>
                  <a href={`tel:${order.senderPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><PhoneIcon size={12} /> {order.senderPhone}</a>
                </div>
                {order.senderFloor && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><BuildingIcon size={12} /> {order.senderFloor}</div>}
                {order.senderNote && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageIcon size={12} /> "{order.senderNote}"</div>}
              </div>
            </div>

            <div style={{ width: 2, height: 20, background: 'var(--border)', margin: '0 17px 0' }} />

            <div style={{ display: 'flex', gap: '14px', padding: '16px', background: '#FFF1F2', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FlagIcon size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '3px' }}>Deliver To</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>{order.deliveryAddress}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserIcon size={12} /> {order.recipientName}</span>
                  <span>•</span>
                  <a href={`tel:${order.recipientPhone}`} style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><PhoneIcon size={12} /> {order.recipientPhone}</a>
                </div>
                {order.recipientFloor && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><BuildingIcon size={12} /> {order.recipientFloor}</div>}
                {order.recipientNote && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageIcon size={12} /> "{order.recipientNote}"</div>}
              </div>
            </div>
          </div>

          {/* Action button */}
          {action && (
            <button
              onClick={() => progressToStatus(action.next)}
              disabled={updating}
              className="btn btn-lg btn-full"
              style={{ background: action.color, color: 'white', fontWeight: 800, fontSize: '16px', padding: '18px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', boxShadow: `0 4px 16px ${action.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {updating
                ? 'Updating…'
                : <><action.Icon size={20} color="white" /> {action.btn}</>
              }
            </button>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Package */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '14px' }}>Package</div>
            {[
              ['Vehicle',   order.vehicleType],
              ['Item',      order.itemType],
              ['Size',      order.itemSize],
              ['Weight',    order.itemWeight ? `${order.itemWeight}kg` : '—'],
              ['Guarantee', order.guaranteeTier],
              ['Payment',   (order.paymentMethod || '').replace(/_/g, ' ')],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between mb-8">
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{l}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Earnings */}
          <div style={{ background: 'linear-gradient(135deg, #052e16, #15803d)', borderRadius: 'var(--radius-md)', padding: '20px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Your Earnings</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#4ADE80' }}>₱{order.totalAmount}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Upon successful delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverActiveOrder;
