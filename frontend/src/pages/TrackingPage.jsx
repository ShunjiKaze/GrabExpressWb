import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { SearchIcon, MotorcycleIcon, CarIcon, VanIcon, PackageIcon, ZapIcon,
         CheckCircleIcon, XCircleIcon, PhoneIcon, StarIcon, LinkIcon, ClockIcon, SparklesIcon, FileTextIcon } from '../components/Icons';

function VehicleIcon({ type, size = 22, color = 'rgba(255,255,255,0.8)' }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon = icons[type] || MotorcycleIcon;
  return <Icon size={size} color={color} />;
}

const STATUS_STEPS = [
  { key: 'searching',  label: 'Searching for a driver',      Icon: SearchIcon,      desc: 'We are finding the nearest available rider for you.' },
  { key: 'accepted',   label: 'Driver accepted your order',  Icon: MotorcycleIcon,  desc: 'Your rider is heading to the pickup location.' },
  { key: 'picked_up',  label: 'Item has been picked up',     Icon: PackageIcon,     desc: 'The rider has collected your package and is preparing to deliver.' },
  { key: 'in_transit', label: 'En route to destination',     Icon: ZapIcon,         desc: 'Your package is on the way to the recipient.' },
  { key: 'delivered',  label: 'Delivered!',                   Icon: CheckCircleIcon, desc: 'Your package has been delivered successfully.' },
];

const STATUS_ORDER = ['searching', 'accepted', 'picked_up', 'in_transit', 'delivered'];

const PAYMENT_LABELS = {
  grabpay:        'GrabPay Wallet',
  card:           'Credit/Debit Card',
  cash_sender:    'Cash by Sender',
  cash_recipient: 'Cash by Recipient',
};

function ETABadge({ status }) {
  const etaMap = { accepted: '8–12 min', picked_up: '10–15 min', in_transit: '5–10 min' };
  const eta = etaMap[status];
  if (!eta) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,177,79,0.15)', border: '1px solid rgba(0,177,79,0.3)', borderRadius: '20px', padding: '5px 12px', fontSize: '13px', fontWeight: 700, color: '#4ADE80' }}>
      <ClockIcon size={13} color="#4ADE80" /> ETA: {eta}
    </div>
  );
}

const CANCEL_REASONS_CUSTOMER = ['Changed my mind', 'Wrong address entered', 'Driver taking too long', 'Emergency', 'Other'];

function CancelModal({ onConfirm, onClose, cancelling }) {
  const [reason, setReason] = useState('');
  const [note, setNote]     = useState('');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircleIcon size={18} color="var(--red)" /> Cancel Booking
          </div>
          <button className="modal-close" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircleIcon size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group mb-16">
            <label className="form-label">Reason for cancellation</label>
            <select className="form-input" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">Select a reason…</option>
              {CANCEL_REASONS_CUSTOMER.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group mb-24">
            <label className="form-label">Additional details <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></label>
            <textarea className="form-input form-textarea" rows={3} placeholder="Any additional context…" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Keep Booking</button>
            <button onClick={() => onConfirm(reason, note)} className="btn btn-danger" style={{ flex: 1 }} disabled={!reason || cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingPage({ dbUser }) {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [booking, setBooking]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [copied, setCopied]           = useState(false);
  const [cancelling, setCancelling]   = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'bookings', id), snap => {
      if (!snap.exists()) { navigate('/book'); return; }
      setBooking({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return unsub;
  }, [id, navigate]);

  const confirmCancel = async (reason, note) => {
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status:       'cancelled',
        cancelledAt:  serverTimestamp(),
        cancelReason: reason,
        cancelNote:   note.trim() || null,
        cancelledBy:  'customer',
      });
      const paySnap = await getDocs(query(collection(db, 'payments'), where('bookingId', '==', id)));
      if (!paySnap.empty) await updateDoc(paySnap.docs[0].ref, { status: 'cancelled' });
      navigate('/book');
    } catch { setCancelling(false); }
  };

  const handleShare = () => {
    const text = `Track my GrabExpress delivery (Order #${id.slice(-8).toUpperCase()}) in real-time on GrabExpress.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) return (
    <div style={{ height: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div className="processing-ring" />
      <p className="text-muted">Loading your order…</p>
    </div>
  );

  if (!booking) return null;

  const currentIdx  = STATUS_ORDER.indexOf(booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isComplete  = booking.status === 'delivered' || booking.status === 'completed';
  const canCancel   = ['searching', 'accepted'].includes(booking.status);
  const currentStep = isCancelled ? null : STATUS_STEPS[currentIdx] || STATUS_STEPS[STATUS_STEPS.length - 1];

  return (
    <>
      {showCancelModal && (
        <CancelModal
          onConfirm={confirmCancel}
          onClose={() => setShowCancelModal(false)}
          cancelling={cancelling}
        />
      )}
    <div className="dashboard-container" style={{ maxWidth: '860px' }}>

      {/* ── Main status card ───────────────────────────── */}
      <div style={{
        background: isCancelled
          ? 'linear-gradient(135deg, #450a0a, #7f1d1d)'
          : isComplete
            ? 'linear-gradient(135deg, #052e16, #166534)'
            : 'linear-gradient(135deg, #0F172A, #1E293B)',
        borderRadius: 'var(--radius-xl)', padding: '32px', color: 'white', marginBottom: '20px',
      }}>
        {/* Order ID + amount */}
        <div className="flex items-center justify-between mb-20">
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Order #{id.slice(-8).toUpperCase()}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isCancelled
                ? <><XCircleIcon size={24} color="#F87171" /> Order Cancelled</>
                : currentStep
                  ? <><currentStep.Icon size={24} color="white" /> {currentStep.label}</>
                  : <><CheckCircleIcon size={24} color="#4ADE80" /> Delivered!</>
              }
            </h1>
            {!isCancelled && !isComplete && currentStep && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '6px' }}>
                {currentStep.desc}
              </p>
            )}
            {!isCancelled && <div style={{ marginTop: '10px' }}><ETABadge status={booking.status} /></div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#4ADE80' }}>₱{booking.totalAmount}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', textTransform: 'capitalize' }}>
              {(booking.paymentMethod || '').replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Searching animation */}
        {booking.status === 'searching' && (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.97)',
              borderRadius: '24px',
              width: '300px',
              height: '300px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <DotLottieReact
                src="https://lottie.host/a4f0b6f6-f57a-4950-aaee-23caf05964ff/C32He7vMVy.lottie"
                loop
                autoplay
                style={{ width: '300px', height: '300px' }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '16px' }}>
              Connecting you with the nearest available rider…
            </p>
          </div>
        )}

        {/* Driver card — shown once accepted */}
        {booking.driverName && (
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>Your Driver</div>
            <div className="flex items-center gap-16">
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <VehicleIcon type={booking.vehicleType} size={24} color="rgba(255,255,255,0.8)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '17px' }}>{booking.driverName}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '2px', textTransform: 'capitalize' }}>
                  {booking.driverVehicle || booking.vehicleType}
                </div>
              </div>
              {booking.driverPlate && (
                <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontWeight: 800, fontSize: '15px', letterSpacing: '0.08em' }}>
                  {booking.driverPlate}
                </div>
              )}
              {booking.driverPhone && (
                <a href={`tel:${booking.driverPhone}`} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }} title="Call driver">
                  <PhoneIcon size={18} color="white" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* ── Status timeline ─────────────────────────── */}
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: '24px' }}>Delivery Progress</h3>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STATUS_STEPS.map((step, i) => {
              const done    = !isCancelled && i < currentIdx;
              const active  = !isCancelled && i === currentIdx;
              const isLast  = i === STATUS_STEPS.length - 1;

              return (
                <div key={step.key} style={{ display: 'flex', gap: '16px' }}>
                  {/* Dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', border: '2px solid',
                      borderColor: done || active ? 'var(--primary)' : 'var(--border)',
                      background: done || active ? 'var(--primary)' : 'var(--surface)',
                      boxShadow: active ? '0 0 0 4px var(--primary-glow)' : 'none',
                      animation: active ? 'pulse 2s infinite' : 'none',
                      flexShrink: 0,
                      transition: 'var(--transition)',
                    }} />
                    {!isLast && (
                      <div style={{ width: 2, height: '52px', background: done ? 'var(--primary)' : 'var(--border)', transition: 'background 0.4s' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ paddingBottom: isLast ? 0 : '28px', paddingTop: '0' }}>
                    <div style={{ marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                      <step.Icon size={16} color={done ? 'var(--primary)' : active ? 'var(--text)' : 'var(--text-3)'} />
                    </div>
                    <div style={{
                      fontWeight: done || active ? 700 : 500,
                      fontSize: '14px',
                      color: done ? 'var(--primary)' : active ? 'var(--text)' : 'var(--text-3)',
                    }}>
                      {step.label}
                    </div>
                    {active && (
                      <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '3px', lineHeight: '1.5' }}>
                        {step.desc}
                      </div>
                    )}
                    {step.key === 'picked_up' && done && booking.pickupProofURL && (
                      <img src={booking.pickupProofURL} alt="Pickup proof" style={{ width: '72px', height: '54px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '8px', border: '1px solid var(--border)', display: 'block' }} />
                    )}
                    {step.key === 'in_transit' && done && booking.deliveryProofURL && (
                      <img src={booking.deliveryProofURL} alt="Delivery proof" style={{ width: '72px', height: '54px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '8px', border: '1px solid var(--border)', display: 'block' }} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cancelled state */}
            {isCancelled && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--red)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircleIcon size={14} color="var(--red)" /> Order Cancelled
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>This booking was cancelled.</div>
                  {booking.cancelReason && (
                    <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '3px' }}>
                      Reason: {booking.cancelReason}{booking.cancelledBy === 'driver' && ' · Driver cancelled'}
                    </div>
                  )}
                  {booking.cancelNote && (
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', fontStyle: 'italic' }}>
                      "{booking.cancelNote}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rating CTA */}
          {isComplete && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,177,79,0.2)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                {booking.driverRating
                  ? <StarIcon size={28} color="#F59E0B" filled />
                  : <SparklesIcon size={28} color="var(--primary)" />
                }
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)', marginBottom: '6px' }}>Delivery Complete!</div>
              {booking.driverRating ? (
                <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px' }}>You rated your driver {booking.driverRating} star{booking.driverRating !== 1 ? 's' : ''}. Thanks for your feedback!</p>
              ) : (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '14px' }}>How was your delivery experience?</p>
                  <button onClick={() => navigate(`/rate/${id}`)} className="btn btn-primary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <StarIcon size={16} color="white" /> Rate Your Driver
                  </button>
                </>
              )}
              <button onClick={() => navigate(`/receipt/${id}`)} className="btn btn-secondary btn-full receipt-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FileTextIcon size={16} /> View Receipt
              </button>
            </div>
          )}
        </div>

        {/* ── Right sidebar ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Route */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Route</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0, marginTop: '3px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                <div style={{ width: 1.5, height: 28, background: 'var(--border)' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '16px', wordBreak: 'break-word' }}>{booking.pickupAddress}</div>
                <div style={{ fontWeight: 700, fontSize: '13px', wordBreak: 'break-word' }}>{booking.deliveryAddress}</div>
              </div>
            </div>
          </div>

          {/* Sender & Recipient */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Contacts</div>
            <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>SENDER</div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{booking.senderName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{booking.senderPhone}</div>
              {booking.senderFloor && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{booking.senderFloor}</div>}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', marginBottom: '4px' }}>RECIPIENT</div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{booking.recipientName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{booking.recipientPhone}</div>
              {booking.recipientFloor && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{booking.recipientFloor}</div>}
            </div>
          </div>

          {/* Package */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Package</div>
            {[
              ['Vehicle',   booking.vehicleType],
              ['Item',      booking.itemType],
              ['Size',      booking.itemSize],
              ['Weight',    booking.itemWeight ? `${booking.itemWeight} kg` : '—'],
              ['Guarantee', booking.guaranteeTier],
              ['Payment',   PAYMENT_LABELS[booking.paymentMethod] || booking.paymentMethod],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between mb-8">
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{l}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isCancelled && !isComplete && (
              <button onClick={handleShare} className="btn btn-secondary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {copied
                  ? <><CheckCircleIcon size={16} color="var(--primary)" /> Copied!</>
                  : <><LinkIcon size={16} /> Share Tracking Info</>
                }
              </button>
            )}
            {canCancel && (
              <button onClick={() => setShowCancelModal(true)} className="btn btn-danger btn-full" disabled={cancelling} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <XCircleIcon size={16} color="white" /> Cancel Booking
              </button>
            )}
            <button onClick={() => navigate('/book')} className="btn btn-ghost btn-full">← Dashboard</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default TrackingPage;
