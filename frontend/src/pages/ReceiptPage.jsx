import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { VEHICLE_BASE, SIZE_ADD, TIER_ADD } from '../context/BookingContext';
import {
  MapPinIcon, FlagIcon, MotorcycleIcon, CarIcon, VanIcon,
  UserIcon, PhoneIcon, BuildingIcon, PackageIcon,
  CreditCardIcon, WalletIcon, BanknoteIcon, HandshakeIcon,
  ShieldIcon, ShieldCheckIcon, CrownIcon,
  ClockIcon, StarIcon, LinkIcon, PrinterIcon, FileTextIcon,
  CheckCircleIcon, XCircleIcon, AlertTriangleIcon,
} from '../components/Icons';

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const PAYMENT_OPTIONS = {
  grabpay:        { Icon: WalletIcon,      title: 'GrabPay Wallet' },
  card:           { Icon: CreditCardIcon,  title: 'Credit / Debit Card' },
  cash_sender:    { Icon: BanknoteIcon,    title: 'Cash by Sender' },
  cash_recipient: { Icon: HandshakeIcon,   title: 'Cash by Recipient' },
};

const VEHICLE_ICON = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };

const GUARANTEE_ICON = { Basic: ShieldIcon, Standard: ShieldCheckIcon, Premium: CrownIcon };

function VehicleIcon({ type, size = 20, color = 'var(--primary)' }) {
  const Icon = VEHICLE_ICON[type] || MotorcycleIcon;
  return <Icon size={size} color={color} />;
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '18px 20px', marginBottom: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>{icon}{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function ReceiptPage({ dbUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking]     = useState(null);
  const [paymentDoc, setPaymentDoc] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'bookings', id));
        if (!snap.exists()) { setError('not_found'); return; }
        setBooking({ id: snap.id, ...snap.data() });
        const paySnap = await getDocs(query(collection(db, 'payments'), where('bookingId', '==', id)));
        setPaymentDoc(paySnap.empty ? null : paySnap.docs[0].data());
      } catch {
        setError('failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '680px', textAlign: 'center', paddingTop: '80px' }}>
        <div className="processing-ring" />
        <p style={{ color: 'var(--text-3)', marginTop: '16px', fontSize: '14px' }}>Loading receipt…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '480px', textAlign: 'center', paddingTop: '60px' }}>
        <div className="card" style={{ padding: '40px 32px' }}>
          <AlertTriangleIcon size={48} color="var(--red)" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: '16px 0 8px' }}>Receipt Not Found</h2>
          <p style={{ color: 'var(--text-3)', fontSize: '14px', marginBottom: '24px' }}>
            {error === 'not_found' ? "This order doesn't exist or may have been removed." : 'Something went wrong. Please try again.'}
          </p>
          <button onClick={() => navigate('/book')} className="btn btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const isOwner  = dbUser?.user_id === booking.customerId;
  const isDriver = dbUser?.role === 'driver' && dbUser?.user_id === booking.driverId;
  const isAdmin  = dbUser?.role === 'admin';
  if (!isOwner && !isDriver && !isAdmin) return <Navigate to="/" replace />;

  const base    = VEHICLE_BASE[booking.vehicleType] ?? 60;
  const sizeAdd = SIZE_ADD[booking.itemSize] ?? 0;
  const tierAdd = TIER_ADD[booking.guaranteeTier] ?? 0;

  const shortId = booking.id.slice(-8).toUpperCase();
  const payment = PAYMENT_OPTIONS[booking.paymentMethod] || PAYMENT_OPTIONS.cash_sender;
  const GuaranteeIcon = GUARANTEE_ICON[booking.guaranteeTier] || ShieldIcon;

  const isDelivered  = ['delivered', 'completed'].includes(booking.status);
  const isCancelled  = booking.status === 'cancelled';

  const handleCopy = () => {
    navigator.clipboard.writeText(shortId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #0F2040 60%, #003D1F 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 28px 24px',
        marginBottom: '14px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Delivery Receipt</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>GrabExpress</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isDelivered
                ? <CheckCircleIcon size={36} color="#4ADE80" />
                : <XCircleIcon size={36} color="#F87171" />
              }
            </div>
          </div>

          {/* Order ID row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Order ID</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'white', letterSpacing: '0.04em', fontFamily: 'monospace' }}>#{shortId}</div>
            </div>
            <button
              onClick={handleCopy}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600 }}
            >
              {copied ? <CheckCircleIcon size={13} color="#4ADE80" /> : <LinkIcon size={13} color="white" />}
              {copied ? 'Copied!' : 'Copy ID'}
            </button>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Date</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{formatDate(booking.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS BANNER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: '14px',
        background: isDelivered ? 'rgba(0,177,79,0.1)' : isCancelled ? 'var(--red-light)' : 'rgba(248,191,0,0.1)',
        border: `1px solid ${isDelivered ? 'rgba(0,177,79,0.25)' : isCancelled ? 'rgba(239,68,68,0.25)' : 'rgba(248,191,0,0.3)'}`,
      }}>
        {isDelivered
          ? <CheckCircleIcon size={18} color="var(--primary)" />
          : <XCircleIcon size={18} color="var(--red)" />
        }
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: isDelivered ? 'var(--primary)' : isCancelled ? 'var(--red)' : '#B45309' }}>
            {isDelivered ? 'Delivery Successful' : isCancelled ? 'Order Cancelled' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
          </div>
          {isCancelled && booking.cancelReason && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(239,68,68,0.25)', fontSize: '13px', color: 'var(--text-2)' }}>
              <div>Reason: {booking.cancelReason}</div>
              {booking.cancelledBy && <div style={{ marginTop: '2px', color: 'var(--text-3)' }}>Cancelled by: {booking.cancelledBy}</div>}
              {booking.cancelNote && <div style={{ marginTop: '2px', fontStyle: 'italic', color: 'var(--text-3)' }}>"{booking.cancelNote}"</div>}
            </div>
          )}
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* LEFT COLUMN */}
        <div>
          {/* ── ROUTE ── */}
          <Section title="Route">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0, marginTop: '3px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                <div style={{ width: 1.5, height: 30, background: 'repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 5px, transparent 5px, transparent 10px)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <MapPinIcon size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{booking.pickupAddress}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FlagIcon size={13} color="var(--red)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{booking.deliveryAddress}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* ── SENDER & RECIPIENT ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {[
              { title: 'Sender', name: booking.senderName, phone: booking.senderPhone, floor: booking.senderFloor, color: 'var(--primary)' },
              { title: 'Recipient', name: booking.recipientName, phone: booking.recipientPhone, floor: booking.recipientFloor, color: 'var(--red)' },
            ].map(p => (
              <div key={p.title} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>{p.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <UserIcon size={12} color={p.color} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: p.floor ? '6px' : 0 }}>
                  <PhoneIcon size={12} color="var(--text-3)" />
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{p.phone}</span>
                </div>
                {p.floor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BuildingIcon size={12} color="var(--text-3)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{p.floor}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── PACKAGE DETAILS ── */}
          <Section title="Package Details">
            <Row label="Vehicle" value={booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)} icon={<VehicleIcon type={booking.vehicleType} size={13} color="var(--text-3)" />} />
            <Row label="Item Type" value={booking.itemType} icon={<PackageIcon size={13} color="var(--text-3)" />} />
            <Row label="Size" value={booking.itemSize} />
            <Row label="Weight" value={`${booking.itemWeight} kg`} />
            <Row label="Guarantee" value={booking.guaranteeTier} icon={<GuaranteeIcon size={13} color="var(--text-3)" />} />
          </Section>

          {/* ── DELIVERY PROOF ── */}
          {(booking.pickupProofURL || booking.deliveryProofURL) && (
            <Section title="Delivery Proof">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {booking.pickupProofURL && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>Pickup</div>
                    <img src={booking.pickupProofURL} alt="Pickup proof" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                  </div>
                )}
                {booking.deliveryProofURL && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>Delivery</div>
                    <img src={booking.deliveryProofURL} alt="Delivery proof" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── DRIVER INFO ── */}
          {booking.driverName && (
            <Section title="Driver">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <VehicleIcon type={booking.vehicleType} size={22} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>{booking.driverName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {booking.driverVehicle?.charAt(0).toUpperCase()}{booking.driverVehicle?.slice(1)}
                    {booking.driverPlate ? ` · ${booking.driverPlate}` : ''}
                  </div>
                </div>
                {booking.driverRating && (
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} size={14} color="#F59E0B" filled={i < booking.driverRating} />
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* ── PRICE BREAKDOWN ── */}
          <div style={{ background: '#0F172A', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '14px', color: 'white' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Price Breakdown</div>
            {[
              [`Base Fare (${booking.vehicleType})`, `₱${Number(base).toFixed(2)}`],
              [`Size (${booking.itemSize})`,          sizeAdd > 0 ? `+₱${Number(sizeAdd).toFixed(2)}` : '₱0.00'],
              [`Guarantee (${booking.guaranteeTier})`, tierAdd > 0 ? `+₱${Number(tierAdd).toFixed(2)}` : '₱0.00'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '8px' }}>
                <span>{l}</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{v}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '24px', color: '#4ADE80' }}>₱{Number(booking.totalAmount).toFixed(2)}</span>
            </div>
          </div>



          {/* ── PAYMENT METHOD ── */}
          <Section title="Payment">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: paymentDoc ? '14px' : 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <payment.Icon size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{payment.title}</div>
                {(paymentDoc || isCancelled) && (
                  <span className={`badge ${isCancelled ? 'badge-red' : paymentDoc?.status === 'paid' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                    {isCancelled ? 'Cancelled' : paymentDoc?.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                )}
              </div>
            </div>
            {paymentDoc && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                {(isDriver || isAdmin) && <Row label="Your Earnings" value={`₱${Number(paymentDoc.driverEarn).toFixed(2)}`} />}
                {isAdmin && <Row label="Platform Commission (20%)" value={`₱${Number(paymentDoc.platformComm).toFixed(2)}`} />}
                {paymentDoc.paidAt && <Row label="Paid At" value={formatDate(paymentDoc.paidAt)} icon={<ClockIcon size={13} color="var(--text-3)" />} />}
              </div>
            )}
          </Section>

          {/* ── TIMESTAMPS ── */}
          <Section title="Timeline">
            {[
              { label: 'Booked',     ts: booking.createdAt },
              { label: 'Accepted',   ts: booking.acceptedAt },
              { label: 'Picked Up',  ts: booking.pickedUpAt },
              { label: 'In Transit', ts: booking.transitAt },
              { label: 'Delivered',  ts: booking.deliveredAt },
              { label: 'Cancelled',  ts: booking.cancelledAt },
            ].filter(e => e.ts).map(e => (
              <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '13px' }}>
                <ClockIcon size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-3)', width: '80px', flexShrink: 0 }}>{e.label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatDate(e.ts)}</span>
              </div>
            ))}
          </Section>
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex gap-12 receipt-no-print" style={{ marginBottom: '14px' }}>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <PrinterIcon size={16} /> Print Receipt
        </button>
        <button
          onClick={() => navigate(dbUser?.role === 'driver' ? '/driver/deliveries' : '/book')}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>GrabExpress Cebu</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>support@grabexpress.ph · Mon–Sun, 7AM–10PM</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>This is an official delivery receipt. Please keep for your records.</div>
      </div>
    </div>
  );
}

export default ReceiptPage;
