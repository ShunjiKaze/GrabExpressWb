import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import DriverRegistrationModal from '../components/DriverRegistrationModal';
import Logo from '../components/Logo';
import ScrollReveal from '../components/ScrollReveal';
import { useTheme, palette } from '../context/ThemeContext';
import { MapPinIcon, ClipboardIcon, CreditCardIcon, MotorcycleIcon, ZapIcon, LockIcon, WifiIcon,
         CarIcon, StarIcon, CameraIcon, PackageIcon, CheckCircleIcon, CheckIcon,
         MailIcon, PhoneIcon, ClockIcon, UsersIcon } from '../components/Icons';

import heroBg           from '../assets/hero-bg.jpg';
import heroRider        from '../assets/hero-rider.png';
import driverPhoto      from '../assets/driver-photo.png';
import customerDelivery from '../assets/customer-delivery.jpg';

function Home({ user, dbUser }) {
  const [showDriverModal, setShowDriverModal] = useState(false);
  const { dark } = useTheme();
  const t = palette(dark);

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleDriverSuccess = () => { setShowDriverModal(false); window.location.reload(); };

  const steps = [
    { Icon: MapPinIcon,     title: 'Set Pickup & Delivery',  desc: 'Enter your pickup and recipient address — fast and simple.' },
    { Icon: ClipboardIcon,  title: 'Fill in Details',         desc: 'Sender/recipient info, item type, and your guarantee tier.' },
    { Icon: CreditCardIcon, title: 'Review & Confirm',        desc: 'Check your order summary, pick payment, confirm booking.' },
    { Icon: MotorcycleIcon, title: 'Track in Real-Time',      desc: 'Live status updates from pickup all the way to delivered.' },
  ];

  const features = [
    { Icon: ZapIcon,        title: 'Instant Pickup',     desc: 'Items collected within minutes — no waiting, no hassle.' },
    { Icon: LockIcon,       title: 'Safe & Secured',     desc: 'Guarantee tiers protect your items up to ₱10,000.' },
    { Icon: WifiIcon,       title: 'Live Tracking',      desc: 'Real-time status from accepted all the way to delivered.' },
    { Icon: CarIcon,        title: 'Multiple Vehicles',  desc: 'Motorcycle, Car, or Van — matched to your package size.' },
    { Icon: StarIcon,       title: 'Rated Drivers',      desc: 'Community-rated drivers ensure quality every single time.' },
    { Icon: CameraIcon,     title: 'Proof of Delivery',  desc: 'Photo proof at pickup and drop-off for peace of mind.' },
  ];

  return (
    <div style={{ background: t.bg1, marginTop: '-68px' }}>
      {showDriverModal && dbUser && (
        <DriverRegistrationModal
          userId={dbUser.user_id}
          existingPhone={dbUser.phone || ''}
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
        <div style={{ position: 'absolute', inset: 0, background: t.heroOverlay }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: t.dot, backgroundSize: '28px 28px' }} />

        {/* grid */}
        <div className="hero-grid" style={{ position: 'relative', zIndex: 1, maxWidth: '1140px', margin: '0 auto', padding: '110px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', width: '100%' }}>

          {/* left */}
          <ScrollReveal direction="up" delay={100}>
          <div>
            <h1 style={{ fontSize: 'clamp(34px, 4.5vw, 62px)', fontWeight: 900, color: t.text, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '20px' }}>
              Deliver Anything,<br />
              <span style={{ color: t.accent }}>Anywhere in Cebu</span>
            </h1>

            <p style={{ color: t.textMuted, fontSize: '17px', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
              Book a delivery in under 2 minutes. Real drivers, real-time updates, and guaranteed safe delivery — right at your fingertips.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '52px' }}>
              {!user && <Link to="/login" className="btn btn-primary btn-lg">Get Started — Sign In Free</Link>}
              {user && dbUser?.role === 'customer' && <Link to="/book" className="btn btn-primary btn-lg">Book a Delivery Now</Link>}
              {user && dbUser?.role === 'driver'   && <Link to="/driver/deliveries" className="btn btn-primary btn-lg">Find Available Orders</Link>}
              {user && dbUser?.role === 'admin'    && <Link to="/admin/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>}
              <a href="#how-it-works" className="btn btn-lg" style={{ background: t.howBtn.bg, color: t.howBtn.color, border: t.howBtn.border, backdropFilter: 'blur(6px)' }}>
                How It Works ↓
              </a>
            </div>

            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[
                [MotorcycleIcon, '200+ Drivers'],
                [PackageIcon,    '10K+ Deliveries'],
                [StarIcon,       '4.8 Rating'],
                [WifiIcon,       'Cebu-wide'],
              ].map(([Icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: t.textStat, fontSize: '13px', fontWeight: 600 }}>
                  <Icon size={16} color={t.accent} /> {text}
                </div>
              ))}
            </div>
          </div>
          </ScrollReveal>

          {/* right — rider + floating cards */}
          <ScrollReveal direction="right" delay={250} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
            <div style={{ position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)', width: '440px', height: '440px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.26) 0%, rgba(0,177,79,0.07) 55%, transparent 72%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(0,177,79,0.18)', pointerEvents: 'none' }} />

            <img src={heroRider} alt="GrabExpress rider" style={{ width: '100%', maxWidth: '480px', objectFit: 'contain', filter: 'drop-shadow(0 32px 80px rgba(0,177,79,0.4))', mixBlendMode: dark ? 'lighten' : 'multiply', position: 'relative', zIndex: 2 }} />

            {/* pickup card */}
            <div className="float-anim" style={{ position: 'absolute', top: '22%', left: '-16px', zIndex: 10, background: t.floatCardBg, backdropFilter: 'blur(16px)', border: `1px solid ${t.floatCardBorder}`, borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: t.floatIconBg, border: `1px solid ${t.floatCardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PackageIcon size={18} color={t.accent} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: t.floatText, lineHeight: 1 }}>Package picked up!</div>
                <div style={{ fontSize: '10px', color: t.floatMuted, marginTop: '3px' }}>En route · 3 min away</div>
              </div>
            </div>

            {/* rating card */}
            <div className="float-anim-delay" style={{ position: 'absolute', bottom: '28%', right: '-8px', zIndex: 10, background: t.floatCardBg, backdropFilter: 'blur(16px)', border: `1px solid ${dark ? 'rgba(255,255,255,0.09)' : '#e5e7eb'}`, borderRadius: '16px', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: '10px', color: t.floatMuted, fontWeight: 600, marginBottom: '4px' }}>Driver Rating</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: t.floatText, lineHeight: 1 }}>4.9</span>
                <div>
                  <div style={{ display: 'flex', gap: '1px' }}>{[1,2,3,4,5].map(i => <StarIcon key={i} size={11} color="#F59E0B" filled />)}</div>
                  <div style={{ fontSize: '10px', color: t.floatMuted, marginTop: '1px' }}>2,841 trips</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: t.fade1, pointerEvents: 'none' }} />
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 32px', background: t.bg2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: t.dot, backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '500px', height: '1px', background: `linear-gradient(to right, transparent, ${t.accentLine}, transparent)` }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* photo */}
          <ScrollReveal direction="left">
          <div style={{ position: 'relative', paddingBottom: '20px', paddingRight: '20px' }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', borderRadius: '20px', background: 'rgba(0,177,79,0.07)', border: '1.5px solid rgba(0,177,79,0.2)' }} />
            <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: 72, height: 72, zIndex: 0 }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: t.stepConnector, left: (i % 4) * 18, top: Math.floor(i / 4) * 18 }} />
              ))}
            </div>
            <div
              style={{ position: 'relative', zIndex: 2, borderRadius: '20px', overflow: 'hidden', boxShadow: dark ? '0 40px 80px rgba(0,0,0,0.5)' : '0 24px 60px rgba(0,0,0,0.14)', transform: 'rotate(-1.5deg)', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.01)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-1.5deg)'}
            >
              <img src={customerDelivery} alt="Customer receiving delivery" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 45%)' }} />
            </div>

            {/* delivered badge */}
            <div style={{ position: 'absolute', bottom: '8px', left: '16px', zIndex: 5, background: t.floatCardBg, backdropFilter: 'blur(16px)', border: `1px solid ${t.floatCardBorder}`, borderRadius: '14px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: t.floatIconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckCircleIcon size={18} color={t.accent} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: t.floatText, lineHeight: 1 }}>Package Delivered!</div>
                <div style={{ fontSize: '10px', color: t.floatMuted, marginTop: '3px' }}>Ayala Center, Cebu · Just now</div>
              </div>
            </div>

            {/* ETA badge */}
            <div style={{ position: 'absolute', top: '16px', right: '8px', zIndex: 5, background: t.floatCardBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.floatCardBorder}`, borderRadius: '14px', padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ fontSize: '10px', color: t.floatMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>ETA</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: t.accent, lineHeight: 1 }}>12 min</div>
            </div>
          </div>
          </ScrollReveal>

          {/* steps */}
          <ScrollReveal direction="right">
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: t.text, letterSpacing: '-0.02em', marginBottom: '10px' }}>How GrabExpress Works</h2>
            <p style={{ color: t.textMuted, fontSize: '15px', lineHeight: 1.65, marginBottom: '44px' }}>
              From booking to doorstep in 4 simple steps.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: i < steps.length - 1 ? '28px' : 0, position: 'relative' }}>
                  {i < steps.length - 1 && (
                    <div style={{ position: 'absolute', left: '25px', top: '50px', width: '2px', height: 'calc(100% - 22px)', background: `linear-gradient(to bottom, ${t.stepConnector}, rgba(0,177,79,0.04))`, zIndex: 0 }} />
                  )}
                  <div style={{ width: 50, height: 50, borderRadius: '14px', flexShrink: 0, background: i === 0 ? t.stepIconFirst.bg : t.stepIconRest, border: i !== 0 ? t.stepIconBorder : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: i === 0 ? t.stepIconFirst.shadow : 'none', position: 'relative', zIndex: 1 }}>
                    <step.Icon size={24} color={i === 0 ? 'white' : t.accent} />
                  </div>
                  <div style={{ paddingTop: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: t.text, marginBottom: '5px' }}>
                      <span style={{ color: t.accent, marginRight: '6px' }}>0{i + 1}.</span>{step.title}
                    </div>
                    <div style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ScrollReveal>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: t.fade2, pointerEvents: 'none' }} />
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', background: t.bg1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: t.dot, backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '500px', height: '1px', background: `linear-gradient(to right, transparent, ${t.accentLine}, transparent)` }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <ScrollReveal direction="up">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: t.text, letterSpacing: '-0.02em' }}>Everything You Need</h2>
            <p style={{ color: t.textFaint, marginTop: '10px', fontSize: '15px' }}>Built for speed, safety, and simplicity.</p>
          </div>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 60}>
              <div
                style={{ padding: '28px 24px', borderRadius: '20px', background: t.cardBg, border: `1px solid ${t.cardBorder}`, transition: 'transform 0.25s, background 0.25s, border-color 0.25s', position: 'relative', overflow: 'hidden', cursor: 'default', boxShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.background = t.cardHoverBg; e.currentTarget.style.borderColor = t.cardHoverBorder.split(' ').pop(); }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = t.cardBg; e.currentTarget.style.borderColor = t.cardBorder; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, #00b14f, rgba(0,177,79,0.2), transparent)` }} />
                <div style={{ width: 52, height: 52, borderRadius: '14px', background: t.featureIconBg, border: `1px solid ${t.featureIconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <f.Icon size={26} color={t.accent} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: t.text, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: t.textMuted, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: t.fade3, pointerEvents: 'none' }} />
      </section>

      {/* ── BECOME A DRIVER ──────────────────────────────────── */}
      <section style={{ padding: '100px 32px', background: t.bg3, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: t.dot, backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* left */}
          <ScrollReveal direction="left">
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: t.text, marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Earn Money Delivering with GrabExpress
            </h2>
            <p style={{ color: t.textMuted, fontSize: '15px', lineHeight: 1.75, marginBottom: '30px' }}>
              Be your own boss. Accept orders anytime, anywhere in Cebu. The more you deliver, the more you earn — no monthly fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', marginBottom: '32px' }}>
              {['Earn ₱60–₱250 per delivery', 'Flexible hours — work when you want', 'Motorcycle, car, or van accepted', 'Real-time order notifications'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', color: t.textMuted, fontSize: '14px' }}>
                  <CheckIcon size={14} color={t.accent} style={{ flexShrink: 0 }} /> {item}
                </div>
              ))}
            </div>

            {!user && <button onClick={handleLogin} className="btn btn-primary btn-lg">Sign In to Register as Driver</button>}
            {user && dbUser?.role === 'customer' && (
              <button onClick={() => setShowDriverModal(true)} className="btn btn-primary btn-lg">Become a Driver Now</button>
            )}
            {user && dbUser?.role === 'driver' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: t.alreadyDriverBg, border: `1px solid ${t.alreadyDriverBorder}`, borderRadius: '14px', padding: '13px 22px', color: t.alreadyDriverText, fontWeight: 700, fontSize: '14px' }}>
                <CheckCircleIcon size={16} color={t.alreadyDriverText} /> You are already registered as a driver!
              </div>
            )}
          </div>
          </ScrollReveal>

          {/* right — driver photo */}
          <ScrollReveal direction="right" delay={150}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-24px', borderRadius: '24px', background: 'radial-gradient(ellipse at 60% 50%, rgba(0,177,79,0.18), transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ borderRadius: '22px', overflow: 'hidden', boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,177,79,0.18)' : '0 24px 60px rgba(0,0,0,0.15)', position: 'relative' }}>
              <img src={driverPhoto} alt="GrabExpress drivers" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: dark ? 'linear-gradient(to right, rgba(7,13,26,0.3) 0%, transparent 25%, transparent 75%, rgba(7,13,26,0.25) 100%)' : 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: dark ? 'linear-gradient(to top, rgba(7,13,26,0.6), transparent)' : 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)' }} />
            </div>

            {/* earnings badge */}
            <div style={{ position: 'absolute', bottom: '-14px', right: '20px', background: t.driverBadgeBg, border: `1px solid ${t.driverBadgeBorder}`, borderRadius: '14px', padding: '12px 18px', boxShadow: '0 8px 28px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: t.driverBadgeText, lineHeight: 1 }}>₱250</div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: t.driverBadgeLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Up to</div>
                <div style={{ fontSize: '10px', color: t.driverBadgeSub, marginTop: '1px' }}>per delivery</div>
              </div>
            </div>

            {/* drivers badge */}
            <div style={{ position: 'absolute', bottom: '-14px', left: '20px', background: t.driversBadgeBg, backdropFilter: 'blur(16px)', border: `1px solid ${t.driversBadgeBorder}`, borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {['#4ADE80','#60A5FA','#F59E0B'].map((c, i) => (
                  <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${t.driversBadgeBg.includes('255') ? 'white' : '#eaefe9'}`, marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i }} />
                ))}
              </div>
              <div style={{ fontWeight: 700, fontSize: '12px', color: t.driversBadgeText }}>200+ Drivers</div>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: t.footerBg, borderTop: `1px solid ${t.footerBorder}`, color: t.textFaint, fontSize: '13px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px' }} className="footer-grid">

          {/* Brand column */}
          <div>
            <Logo size="sm" textColor={dark ? 'rgba(255,255,255,0.85)' : '#111827'} />
            <p style={{ marginTop: '14px', lineHeight: 1.75, color: t.textFaint, fontSize: '13px', maxWidth: '240px' }}>
              Fast, reliable parcel delivery across Cebu City and Metro Cebu. Book in under 2 minutes.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {[{ label: 'FB', href: '#' }, { label: 'IG', href: '#' }, { label: 'TW', href: '#' }].map(s => (
                <a key={s.label} href={s.href} style={{ width: 34, height: 34, borderRadius: '8px', background: t.cardBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textFaint, fontSize: '11px', fontWeight: 800, textDecoration: 'none', transition: 'background 0.2s, color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,177,79,0.15)'; e.currentTarget.style.color = t.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.cardBg; e.currentTarget.style.color = t.textFaint; }}
                >{s.label}</a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>Quick Links</div>
            {[
              { label: 'Home', to: '/', show: true },
              { label: 'Sign In', to: '/login', show: !user },
              { label: 'Register', to: '/register', show: !user },
              { label: 'Book a Delivery', to: '/book', show: dbUser?.role === 'customer' },
              { label: 'My Orders', to: '/history', show: dbUser?.role === 'customer' || dbUser?.role === 'driver' },
              { label: 'Find Orders', to: '/driver/deliveries', show: dbUser?.role === 'driver' },
              { label: 'Dashboard', to: '/admin/dashboard', show: dbUser?.role === 'admin' },
            ].filter(l => l.show).map(l => (
              <Link key={l.label} to={l.to} style={{ display: 'block', color: t.textMuted, marginBottom: '10px', textDecoration: 'none', fontSize: '13px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = t.accent}
                onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
              >{l.label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>Company</div>
            {[
              { label: 'About Us', to: '/about' },
              { label: 'FAQ / Help', to: '/faq' },
              { label: 'Contact Us', to: '/contact' },
            ].map(l => (
              <Link key={l.label} to={l.to} style={{ display: 'block', color: t.textMuted, marginBottom: '10px', textDecoration: 'none', fontSize: '13px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = t.accent}
                onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
              >{l.label}</Link>
            ))}
          </div>

          {/* Contact Info */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>Contact</div>
            {[
              { Icon: MapPinIcon, text: 'Cebu City, Philippines' },
              { Icon: MailIcon,   text: 'support@grabexpress.ph' },
              { Icon: PhoneIcon,  text: '+63 32 000 0000' },
              { Icon: ClockIcon,  text: 'Mon–Sun, 7AM–10PM' },
            ].map(c => (
              <div key={c.text} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px', color: t.textMuted, fontSize: '13px' }}>
                <c.Icon size={14} color={t.textMuted} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* bottom bar */}
        <div style={{ borderTop: `1px solid ${t.footerBorder}`, padding: '20px 32px', maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ margin: 0, color: t.footerText, fontSize: '12px' }}>© 2026 GrabExpress Cebu. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[{ label: 'Privacy Policy', to: '/faq' }, { label: 'Terms of Service', to: '/faq' }].map(l => (
              <Link key={l.label} to={l.to} style={{ color: t.footerText, fontSize: '12px', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = t.textMuted}
                onMouseLeave={e => e.currentTarget.style.color = t.footerText}
              >{l.label}</Link>
            ))}
          </div>
        </div>
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
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default Home;
