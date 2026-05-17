import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import DriverRegistrationModal from '../components/DriverRegistrationModal';
import Logo from '../components/Logo';

import heroBg          from '../assets/hero-bg.jpg';
import heroRider       from '../assets/hero-rider.png';
import driverPhoto     from '../assets/driver-photo.png';
import customerDelivery from '../assets/customer-delivery.jpg';

/* shared dark section style */
const S = {
  dot: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  },
};

function Home({ user, dbUser }) {
  const [showDriverModal, setShowDriverModal] = useState(false);

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleDriverSuccess = () => { setShowDriverModal(false); window.location.reload(); };

  const steps = [
    { icon: '📍', title: 'Set Pickup & Delivery',  desc: 'Enter your pickup and recipient address — fast and simple.' },
    { icon: '📋', title: 'Fill in Details',         desc: 'Sender/recipient info, item type, and your guarantee tier.' },
    { icon: '💳', title: 'Review & Confirm',        desc: 'Check your order summary, pick payment, confirm booking.' },
    { icon: '🛵', title: 'Track in Real-Time',      desc: 'Live status updates from pickup all the way to delivered.' },
  ];

  const features = [
    { icon: '⚡', title: 'Instant Pickup',     desc: 'Items collected within minutes — no waiting, no hassle.' },
    { icon: '🔒', title: 'Safe & Secured',     desc: 'Guarantee tiers protect your items up to ₱10,000.' },
    { icon: '📡', title: 'Live Tracking',      desc: 'Real-time status from accepted all the way to delivered.' },
    { icon: '🚗', title: 'Multiple Vehicles',  desc: 'Motorcycle, Car, or Van — matched to your package size.' },
    { icon: '⭐', title: 'Rated Drivers',      desc: 'Community-rated drivers ensure quality every single time.' },
    { icon: '📸', title: 'Proof of Delivery',  desc: 'Photo proof at pickup and drop-off for peace of mind.' },
  ];

  return (
    <div style={{ background: '#0A1223', marginTop: '-68px' }}>
      {showDriverModal && dbUser && (
        <DriverRegistrationModal
          userId={dbUser.user_id}
          onSuccess={handleDriverSuccess}
          onClose={() => setShowDriverModal(false)}
        />
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(10,18,35,0.97) 0%, rgba(10,18,35,0.85) 55%, rgba(10,18,35,0.5) 100%)' }} />
        <div style={S.dot} />

        {/* logged-in pill */}
        {user && dbUser && (
          <div style={{
            position: 'absolute', top: '82px', right: '32px', zIndex: 10,
            background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.13)', borderRadius: '40px',
            padding: '10px 18px 10px 12px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(0,177,79,0.6)' }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'white', lineHeight: 1 }}>Hi, {dbUser.full_name?.split(' ')[0]}!</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', marginTop: '2px' }}>Signed in as {dbUser.role}</div>
            </div>
          </div>
        )}

        {/* grid */}
        <div className="hero-grid" style={{ position: 'relative', zIndex: 1, maxWidth: '1140px', margin: '0 auto', padding: '110px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', width: '100%' }}>

          {/* left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.15)', border: '1px solid rgba(0,177,79,0.3)', borderRadius: '40px', padding: '6px 14px', color: '#4ADE80', fontSize: '13px', fontWeight: 700, marginBottom: '24px' }}>
              🚀 GrabExpress Delivery — Cebu
            </div>

            <h1 style={{ fontSize: 'clamp(34px, 4.5vw, 62px)', fontWeight: 900, color: 'white', lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '20px' }}>
              Deliver Anything,<br />
              <span style={{ color: '#4ADE80' }}>Anywhere in Cebu</span>
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: '17px', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
              Book a delivery in under 2 minutes. Real drivers, real-time updates, and guaranteed safe delivery — right at your fingertips.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '52px' }}>
              {!user && <button onClick={handleLogin} className="btn btn-primary btn-lg">🚀 Get Started — Sign In Free</button>}
              {user && dbUser?.role === 'customer' && <Link to="/book" className="btn btn-primary btn-lg">📦 Book a Delivery Now</Link>}
              {user && dbUser?.role === 'driver'   && <Link to="/driver/deliveries" className="btn btn-primary btn-lg">🛵 Find Available Orders</Link>}
              {user && dbUser?.role === 'admin'    && <Link to="/admin/dashboard" className="btn btn-primary btn-lg">📊 Go to Dashboard</Link>}
              <a href="#how-it-works" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
                How It Works ↓
              </a>
            </div>

            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[['🛵','200+ Drivers'],['📦','10K+ Deliveries'],['⭐','4.8 Rating'],['🏙️','Cebu-wide']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ fontSize: '18px' }}>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>

          {/* right — rider + floating cards */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
            {/* glow orb */}
            <div style={{ position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)', width: '440px', height: '440px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.26) 0%, rgba(0,177,79,0.07) 55%, transparent 72%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(0,177,79,0.18)', pointerEvents: 'none' }} />

            <img src={heroRider} alt="GrabExpress rider" style={{ width: '100%', maxWidth: '480px', objectFit: 'contain', filter: 'drop-shadow(0 32px 80px rgba(0,177,79,0.4))', mixBlendMode: 'lighten', position: 'relative', zIndex: 2 }} />

            {/* pickup card */}
            <div style={{ position: 'absolute', top: '22%', left: '-16px', zIndex: 10, background: 'rgba(10,16,30,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,177,79,0.28)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(0,177,79,0.18)', border: '1px solid rgba(0,177,79,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📦</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'white', lineHeight: 1 }}>Package picked up!</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>En route · 3 min away</div>
              </div>
            </div>

            {/* rating card */}
            <div style={{ position: 'absolute', bottom: '28%', right: '-8px', zIndex: 10, background: 'rgba(10,16,30,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '4px' }}>Driver Rating</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1 }}>4.9</span>
                <div>
                  <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: '11px', color: '#F59E0B' }}>★</span>)}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>2,841 trips</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* section fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, transparent, #0D1829)', pointerEvents: 'none' }} />
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 32px', background: '#0D1829', position: 'relative', overflow: 'hidden' }}>
        <div style={S.dot} />
        {/* subtle horizontal accent */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '500px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,177,79,0.3), transparent)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* photo */}
          <div style={{ position: 'relative', paddingBottom: '20px', paddingRight: '20px' }}>
            {/* green offset frame */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', borderRadius: '20px', background: 'rgba(0,177,79,0.07)', border: '1.5px solid rgba(0,177,79,0.2)' }} />

            {/* dot accent */}
            <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: 72, height: 72, zIndex: 0 }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,177,79,0.35)', left: (i % 4) * 18, top: Math.floor(i / 4) * 18 }} />
              ))}
            </div>

            {/* image */}
            <div
              style={{ position: 'relative', zIndex: 2, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', transform: 'rotate(-1.5deg)', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.01)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-1.5deg)'}
            >
              <img src={customerDelivery} alt="Customer receiving delivery" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 45%)' }} />
            </div>

            {/* delivered badge */}
            <div style={{ position: 'absolute', bottom: '8px', left: '16px', zIndex: 5, background: 'rgba(10,16,30,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,177,79,0.28)', borderRadius: '14px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(0,177,79,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'white', lineHeight: 1 }}>Package Delivered!</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>Ayala Center, Cebu · Just now</div>
              </div>
            </div>

            {/* ETA badge */}
            <div style={{ position: 'absolute', top: '16px', right: '8px', zIndex: 5, background: 'rgba(10,16,30,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,177,79,0.3)', borderRadius: '14px', padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>ETA</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#4ADE80', lineHeight: 1 }}>12 min</div>
            </div>
          </div>

          {/* steps */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.12)', border: '1px solid rgba(0,177,79,0.25)', borderRadius: '40px', padding: '5px 14px', color: '#4ADE80', fontSize: '12px', fontWeight: 700, marginBottom: '18px' }}>🗺️ The Process</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: '10px' }}>How GrabExpress Works</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.65, marginBottom: '44px' }}>
              From booking to doorstep in 4 simple steps.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: i < steps.length - 1 ? '28px' : 0, position: 'relative' }}>
                  {i < steps.length - 1 && (
                    <div style={{ position: 'absolute', left: '25px', top: '50px', width: '2px', height: 'calc(100% - 22px)', background: 'linear-gradient(to bottom, rgba(0,177,79,0.4), rgba(0,177,79,0.04))', zIndex: 0 }} />
                  )}
                  <div style={{ width: 50, height: 50, borderRadius: '14px', flexShrink: 0, background: i === 0 ? 'var(--primary)' : 'rgba(0,177,79,0.1)', border: i !== 0 ? '1.5px solid rgba(0,177,79,0.22)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: i === 0 ? '0 6px 20px rgba(0,177,79,0.4)' : 'none', position: 'relative', zIndex: 1 }}>
                    {step.icon}
                  </div>
                  <div style={{ paddingTop: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'white', marginBottom: '5px' }}>
                      <span style={{ color: '#4ADE80', marginRight: '6px' }}>0{i + 1}.</span>{step.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, transparent, #0A1223)', pointerEvents: 'none' }} />
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', background: '#0A1223', position: 'relative', overflow: 'hidden' }}>
        <div style={S.dot} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '500px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,177,79,0.25), transparent)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.12)', border: '1px solid rgba(0,177,79,0.25)', borderRadius: '40px', padding: '5px 14px', color: '#4ADE80', fontSize: '12px', fontWeight: 700, marginBottom: '18px' }}>✨ Why Choose Us</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Everything You Need</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '10px', fontSize: '15px' }}>Built for speed, safety, and simplicity.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i}
                style={{ padding: '28px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.25s, background 0.25s, border-color 0.25s', position: 'relative', overflow: 'hidden', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.background = 'rgba(0,177,79,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,177,79,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, var(--primary), rgba(0,177,79,0.2), transparent)' }} />
                <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(0,177,79,0.15)', border: '1px solid rgba(0,177,79,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '18px' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, transparent, #070D1A)', pointerEvents: 'none' }} />
      </section>

      {/* ── BECOME A DRIVER ──────────────────────────────────── */}
      <section style={{ padding: '100px 32px', background: '#070D1A', position: 'relative', overflow: 'hidden' }}>
        <div style={S.dot} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '500px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '40px', padding: '5px 14px', color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 700, marginBottom: '20px' }}>🛵 For Riders</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: 'white', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Earn Money Delivering with GrabExpress
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.75, marginBottom: '30px' }}>
              Be your own boss. Accept orders anytime, anywhere in Cebu. The more you deliver, the more you earn — no monthly fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', marginBottom: '32px' }}>
              {['Earn ₱60–₱250 per delivery', 'Flexible hours — work when you want', 'Motorcycle, car, or van accepted', 'Real-time order notifications'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  <span style={{ color: '#4ADE80', fontWeight: 900, flexShrink: 0 }}>✓</span> {item}
                </div>
              ))}
            </div>

            {!user && <button onClick={handleLogin} className="btn btn-primary btn-lg">Sign In to Register as Driver</button>}
            {user && dbUser?.role === 'customer' && (
              <button onClick={() => setShowDriverModal(true)} className="btn btn-primary btn-lg">🛵 Become a Driver Now</button>
            )}
            {user && dbUser?.role === 'driver' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(0,177,79,0.15)', border: '1px solid rgba(0,177,79,0.35)', borderRadius: '14px', padding: '13px 22px', color: '#4ADE80', fontWeight: 700, fontSize: '14px' }}>
                ✅ You are already registered as a driver!
              </div>
            )}

            {/* accounts info */}
            <div style={{ marginTop: '36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>How Accounts Work</div>
              {[
                { role: 'Customer', icon: '👤', color: '#4ADE80', desc: 'Auto-assigned on first sign-in. Book deliveries immediately.' },
                { role: 'Driver',   icon: '🛵', color: '#60A5FA', desc: 'Click "Become a Driver" to register your vehicle.' },
                { role: 'Admin',    icon: '🛡️', color: '#F87171', desc: 'Assigned by an existing admin through the Admin Dashboard.' },
              ].map(item => (
                <div key={item.role} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: item.color, fontSize: '13px', marginBottom: '2px' }}>{item.role}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right — driver photo */}
          <div style={{ position: 'relative' }}>
            {/* glow */}
            <div style={{ position: 'absolute', inset: '-24px', borderRadius: '24px', background: 'radial-gradient(ellipse at 60% 50%, rgba(0,177,79,0.18), transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ borderRadius: '22px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,177,79,0.18)', position: 'relative' }}>
              <img src={driverPhoto} alt="GrabExpress drivers" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              {/* edge fades to blend into section */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(7,13,26,0.3) 0%, transparent 25%, transparent 75%, rgba(7,13,26,0.25) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(7,13,26,0.6), transparent)' }} />
            </div>

            {/* earnings badge — bottom-right, below image */}
            <div style={{ position: 'absolute', bottom: '-14px', right: '20px', background: 'linear-gradient(135deg, #052e16, #14532d)', border: '1px solid rgba(0,177,79,0.3)', borderRadius: '14px', padding: '12px 18px', boxShadow: '0 8px 28px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#4ADE80', lineHeight: 1 }}>₱250</div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Up to</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>per delivery</div>
              </div>
            </div>

            {/* drivers badge — bottom-left, below image */}
            <div style={{ position: 'absolute', bottom: '-14px', left: '20px', background: 'rgba(10,16,30,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {['#4ADE80','#60A5FA','#F59E0B'].map((c, i) => (
                  <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '2px solid rgba(10,16,30,0.9)', marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i }} />
                ))}
              </div>
              <div style={{ fontWeight: 700, fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>200+ Drivers</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: '#040810', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', padding: '36px 24px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <Logo size="sm" textColor="rgba(255,255,255,0.7)" />
        </div>
        <p>© 2026 GrabExpress Cebu. Built with React + Firebase Firestore.</p>
      </footer>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; padding: 90px 20px 48px !important; }
          .hero-grid > div:last-child { display: none !important; }
          #how-it-works > div,
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}

export default Home;
