import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobeIcon } from '../components/Icons';

function CustomerBooking({ dbUser }) {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vehicle, setVehicle] = useState('motorcycle');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Hardcoded prices for demonstration
  const prices = { motorcycle: 50, car: 120, van: 300 };
  const estimatedPrice = prices[vehicle];

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!pickup || !dropoff) {
      setMessage({ type: 'error', text: 'Please fill in both pickup and dropoff locations.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: dbUser.user_id, // We get this from our MySQL sync!
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          vehicleType: vehicle,
          totalAmount: estimatedPrice
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Booking successful! Finding a driver...' });
        // After 2 seconds, we could redirect them to a tracking page
        setTimeout(() => navigate('/history'), 2000);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to connect to server.' });
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <h2 style={{ color: '#0F172A', marginBottom: '20px' }}>Book a Delivery</h2>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Booking Form */}
        <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleBooking}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#475569' }}>Pickup Location</label>
              <input 
                type="text" 
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Where should we pick it up?" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#475569' }}>Dropoff Location</label>
              <input 
                type="text" 
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Where are we delivering to?" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#475569' }}>Vehicle Type</label>
              <select 
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white' }}
              >
                <option value="motorcycle">Motorcycle (Fast, small items)</option>
                <option value="car">Car (Medium items)</option>
                <option value="van">Van (Large items, furniture)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#F8FAFC', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600, color: '#64748B' }}>Estimated Price:</span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#00B14F' }}>â‚±{estimatedPrice}</span>
            </div>

            {message && (
              <div style={{ padding: '12px', marginBottom: '15px', borderRadius: '8px', background: message.type === 'error' ? '#FEF2F2' : '#F0FDF4', color: message.type === 'error' ? '#DC2626' : '#16A34A' }}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: '#00B14F', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        {/* Map Placeholder */}
        <div style={{ flex: 1, minWidth: '300px', background: '#E2E8F0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <GlobeIcon size={48} color="#94A3B8" />
            <p style={{ marginTop: '10px' }}>Google Maps Integration<br/>(Coming Soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerBooking;

