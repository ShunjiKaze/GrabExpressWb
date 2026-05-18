import { Link } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';
import driverPhoto from '../assets/driver-photo.png';
import customerDelivery from '../assets/customer-delivery.jpg';

const VALUES = [
  { icon: '⚡', title: 'Speed First',       desc: 'We believe every minute matters. Our platform is built to dispatch drivers and complete deliveries as fast as humanly possible.' },
  { icon: '🔒', title: 'Trust & Safety',    desc: 'From verified drivers to guarantee tiers covering item value, we put safety at the center of every delivery.' },
  { icon: '🌱', title: 'Community Driven',  desc: 'We are built for Cebu, by people who live here. Every driver and customer is part of the GrabExpress community.' },
  { icon: '📡', title: 'Transparent Tech',  desc: 'Real-time tracking, live status updates, and proof of delivery — because you deserve to know exactly where your package is.' },
];

const TEAM = [
  { name: 'Operations', icon: '🏢', desc: 'Cebu City, Philippines' },
  { name: 'Drivers',    icon: '🛵', desc: '200+ active riders across Metro Cebu' },
  { name: 'Support',    icon: '🎧', desc: 'Mon–Sun, 7AM–10PM' },
];

function AboutPage() {
  return (
    <div style={{ background: '#0A1223', minHeight: '100vh', marginTop: '-68px', paddingTop: '68px' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0A1223 0%, #0F2040 60%, #003D1F 100%)', position: 'relative', overflow: 'hidden', padding: '90px 32px 80px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.09), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.12)', border: '1px solid rgba(0,177,79,0.25)', borderRadius: '40px', padding: '6px 16px', color: '#4ADE80', fontSize: '12px', fontWeight: 700, marginBottom: '22px' }}>
            🏢 About Us
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: 1.1 }}>
            Cebu's Trusted<br /><span style={{ color: '#4ADE80' }}>Delivery Partner</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 36px' }}>
            GrabExpress was born from a simple idea: everyone in Cebu deserves fast, affordable, and trustworthy parcel delivery — without the hassle.
          </p>
          <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['🛵','200+ Drivers'],['📦','10K+ Deliveries'],['⭐','4.8 Avg Rating'],['🏙️','Metro Cebu']].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '80px 32px', background: '#0D1829', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'center' }} className="about-grid">
          <ScrollReveal direction="left">
            <div style={{ borderRadius: '22px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', position: 'relative' }}>
              <img src={customerDelivery} alt="Customer receiving delivery" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent 50%)' }} />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.12)', border: '1px solid rgba(0,177,79,0.25)', borderRadius: '40px', padding: '5px 14px', color: '#4ADE80', fontSize: '12px', fontWeight: 700, marginBottom: '18px' }}>📖 Our Story</div>
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: '18px' }}>Built for Cebu, by Cebuanos</h2>
              <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px' }}>
                We started GrabExpress because we experienced firsthand how frustrating local deliveries could be — unreliable riders, no tracking, no accountability. We knew there was a better way.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px' }}>
                Today, we connect hundreds of verified drivers with customers across Metro Cebu — from sending documents to delivering packages for small businesses. Every booking is tracked, every driver is rated, and every delivery is backed by our guarantee system.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '15px', lineHeight: 1.8 }}>
                We are just getting started — more cities, more vehicle types, and more features are on the way.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 32px', background: '#0A1223', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <ScrollReveal direction="up">
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.12)', border: '1px solid rgba(0,177,79,0.25)', borderRadius: '40px', padding: '5px 14px', color: '#4ADE80', fontSize: '12px', fontWeight: 700, marginBottom: '18px' }}>💡 What We Stand For</div>
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Our Values</h2>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {VALUES.map((v, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 70}>
                <div style={{ padding: '28px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: '100%', transition: 'background 0.25s, border-color 0.25s, transform 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,177,79,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,177,79,0.25)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ fontSize: '30px', marginBottom: '16px' }}>{v.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>{v.title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7 }}>{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section style={{ padding: '80px 32px', background: '#070D1A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.07), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', position: 'relative', zIndex: 1 }} className="about-grid">
          <ScrollReveal direction="left">
            <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', position: 'relative' }}>
              <img src={driverPhoto} alt="GrabExpress drivers" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(7,13,26,0.2), transparent 40%)' }} />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '40px', padding: '5px 14px', color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 700, marginBottom: '20px' }}>🛵 Join the Team</div>
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: '14px' }}>Drive with Us, Earn More</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.75, marginBottom: '28px' }}>
                Whether you ride a motorcycle, drive a car, or operate a van — GrabExpress has orders for you. No fixed schedule, no monthly fees. Just deliver and earn.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/" style={{ background: '#00B14F', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#00a046'}
                  onMouseLeave={e => e.currentTarget.style.background = '#00B14F'}
                >Become a Driver</Link>
                <Link to="/faq" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                >Learn More</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </div>
  );
}

export default AboutPage;
