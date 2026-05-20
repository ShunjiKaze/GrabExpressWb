import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useBooking, calcTotal, VEHICLE_BASE, SIZE_ADD, TIER_ADD, DELIVERY_ADD } from '../../context/BookingContext';
import StepBar from '../../components/StepBar';
import { MotorcycleIcon, CarIcon, VanIcon, WalletIcon, CreditCardIcon, BanknoteIcon, HandshakeIcon } from '../../components/Icons';

const STEPS = ['Address', 'Details', 'Item', 'Review'];


function VehicleIcon({ type, size = 20, color = 'currentColor' }) {
  const icons = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };
  const Icon = icons[type] || MotorcycleIcon;
  return <Icon size={size} color={color} />;
}

const PAYMENT_OPTIONS = [
  { id: 'grabpay',        Icon: WalletIcon,      title: 'GrabPay Wallet',      desc: 'Pay with your GrabPay balance' },
  { id: 'card',           Icon: CreditCardIcon,  title: 'Credit / Debit Card', desc: 'Visa, Mastercard, etc.' },
  { id: 'cash_sender',    Icon: BanknoteIcon,    title: 'Cash by Sender',      desc: 'You pay the driver on pickup' },
  { id: 'cash_recipient', Icon: HandshakeIcon,   title: 'Cash by Recipient',   desc: 'Recipient pays on delivery' },
];

function ReviewSection({ title, children }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '18px 20px', marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between mb-8" style={{ fontSize: '14px' }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function ReviewOrder({ dbUser }) {
  const navigate = useNavigate();
  const { bookingData, updateBooking, resetBooking, total } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const base        = VEHICLE_BASE[bookingData.vehicleType] ?? 60;
  const sizeAdd     = SIZE_ADD[bookingData.itemSize] ?? 0;
  const tierAdd     = TIER_ADD[bookingData.guaranteeTier] ?? 0;
  const deliveryAdd = DELIVERY_ADD[bookingData.deliveryType] ?? 0;

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        customerId:     dbUser.user_id,
        driverId:       null,
        status:         'searching',
        pickupAddress:  bookingData.pickupAddress,
        deliveryAddress:bookingData.deliveryAddress,
        senderName:     bookingData.senderName,
        senderPhone:    bookingData.senderPhone,
        senderFloor:    bookingData.senderFloor,
        senderNote:     bookingData.senderNote,
        recipientName:  bookingData.recipientName,
        recipientPhone: bookingData.recipientPhone,
        recipientFloor: bookingData.recipientFloor,
        recipientNote:  bookingData.recipientNote,
        deliveryType:   bookingData.deliveryType,
        vehicleType:    bookingData.vehicleType,
        itemSize:       bookingData.itemSize,
        itemWeight:     parseFloat(bookingData.itemWeight) || 0,
        itemType:       bookingData.itemType,
        itemTypeOther:  bookingData.itemType === 'Others' ? bookingData.itemTypeOther : '',
        itemPhotoTaken: bookingData.itemPhotoTaken,
        guaranteeTier:  bookingData.guaranteeTier,
        paymentMethod:  bookingData.paymentMethod,
        baseFare:       base,
        totalAmount:    total,
        createdAt:      serverTimestamp(),
        driverName:     null,
        driverPhone:    null,
        driverVehicle:  null,
        driverPlate:    null,
        driverRating:   null,
        customerRating: null,
      });

      try {
        await addDoc(collection(db, 'payments'), {
          bookingId:    docRef.id,
          customerId:   dbUser.user_id,
          driverId:     null,
          amount:       total,
          paymentMethod: bookingData.paymentMethod,
          status:       'pending',
          platformComm: Math.round(total * 0.20),
          driverEarn:   Math.round(total * 0.80),
          createdAt:    serverTimestamp(),
          paidAt:       null,
        });
      } catch (payErr) {
        console.error('Payment record failed:', payErr);
      }

      resetBooking();
      navigate(`/book/tracking/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create booking. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <StepBar steps={STEPS} currentStep={3} />

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Review Your Order</h2>
        <p className="text-sm text-muted mb-24">Double-check everything before booking. Once booked, a driver will be assigned.</p>

        {/* Route */}
        <ReviewSection title="Route">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0, marginTop: '3px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ width: 1.5, height: 30, background: 'var(--border)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>{bookingData.pickupAddress}</div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{bookingData.deliveryAddress}</div>
            </div>
          </div>
        </ReviewSection>

        {/* Sender & Recipient */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <ReviewSection title="Sender">
            <DetailRow label="Name" value={bookingData.senderName} />
            <DetailRow label="Phone" value={bookingData.senderPhone} />
            {bookingData.senderFloor && <DetailRow label="Floor/Unit" value={bookingData.senderFloor} />}
          </ReviewSection>
          <ReviewSection title="Recipient">
            <DetailRow label="Name" value={bookingData.recipientName} />
            <DetailRow label="Phone" value={bookingData.recipientPhone} />
            {bookingData.recipientFloor && <DetailRow label="Floor/Unit" value={bookingData.recipientFloor} />}
          </ReviewSection>
        </div>

        {/* Options */}
        <ReviewSection title="Delivery Options">
          <DetailRow label="Delivery Type" value={bookingData.deliveryType === 'instant' ? 'Instant' : bookingData.deliveryType} />
          <DetailRow label="Vehicle" value={bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1)} />
          <DetailRow label="Item Size" value={bookingData.itemSize} />
          <DetailRow label="Item Type" value={bookingData.itemType === 'Others' && bookingData.itemTypeOther ? `Others – ${bookingData.itemTypeOther}` : bookingData.itemType} />
          <DetailRow label="Weight" value={`${bookingData.itemWeight} kg`} />
          <DetailRow label="Guarantee" value={bookingData.guaranteeTier} />
        </ReviewSection>

        {/* Payment + Price: 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', alignItems: 'start' }}>
          {/* Payment Selection */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PAYMENT_OPTIONS.map(p => (
                <div
                  key={p.id}
                  onClick={() => updateBooking({ paymentMethod: p.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                    border: `2px solid ${bookingData.paymentMethod === p.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: bookingData.paymentMethod === p.id ? 'var(--primary-light)' : 'var(--surface)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: bookingData.paymentMethod === p.id ? 'var(--primary)' : 'var(--surface-2)', flexShrink: 0 }}>
                    <p.Icon size={16} color={bookingData.paymentMethod === p.id ? 'white' : 'var(--text-2)'} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.desc}</div>
                  </div>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${bookingData.paymentMethod === p.id ? 'var(--primary)' : 'var(--border)'}`, background: bookingData.paymentMethod === p.id ? 'var(--primary)' : 'transparent', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div style={{ background: '#0F172A', borderRadius: 'var(--radius-md)', padding: '20px', color: 'white', height: 'fit-content' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '14px' }}>Price Breakdown</div>
            {[
              [`Base Fare (${bookingData.vehicleType})`, `₱${base}`],
              [`Size (${bookingData.itemSize})`, sizeAdd > 0 ? `+₱${sizeAdd}` : '₱0'],
              [`Delivery (${bookingData.deliveryType === 'instant' ? 'Instant' : bookingData.deliveryType})`, deliveryAdd > 0 ? `+₱${deliveryAdd}` : 'Included'],
              [`Guarantee (${bookingData.guaranteeTier})`, tierAdd > 0 ? `+₱${tierAdd}` : '₱0'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '8px' }}>
                <span>{l}</span><span style={{ fontWeight: 600, color: 'white' }}>{v}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '12px 0' }} />
            <div className="flex justify-between">
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '24px', color: '#4ADE80' }}>₱{total}</span>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error mb-16">{error}</div>}

        <div className="flex gap-12">
          <button onClick={() => navigate('/book/new/items')} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>← Back</button>
          <button onClick={handleBook} className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={loading}>
            {loading ? 'Booking...' : 'Book Delivery'}
          </button>
        </div>

        <p className="text-xs text-muted text-center mt-12">By booking, you agree to our Terms of Service. You can cancel before driver pickup.</p>
      </div>
    </div>
  );
}

export default ReviewOrder;
