import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const FAQS = [
  {
    category: 'Booking & Delivery',
    items: [
      {
        q: 'How do I book a delivery?',
        a: 'Sign in to your account, go to "Book Delivery", enter your pickup and drop-off address, fill in the item details, then confirm your booking. A driver will be matched to your order in minutes.',
      },
      {
        q: 'What areas does GrabExpress cover?',
        a: 'We currently serve Cebu City and Metro Cebu, including Mandaue, Lapu-Lapu, Talisay, Minglanilla, and nearby municipalities. Coverage is expanding — check back regularly.',
      },
      {
        q: 'How long does a delivery take?',
        a: 'Most deliveries within the same city are completed within 1–3 hours depending on distance and driver availability. You can track your order in real-time once a driver accepts it.',
      },
      {
        q: 'Can I schedule a delivery in advance?',
        a: 'Currently, deliveries are on-demand and dispatched immediately. Scheduled bookings are on our roadmap and coming soon.',
      },
      {
        q: 'What items are prohibited?',
        a: 'We do not carry illegal substances, firearms, hazardous materials, live animals, perishable food requiring cold chain, or items exceeding our vehicle weight limits. When in doubt, contact support.',
      },
    ],
  },
  {
    category: 'Pricing & Payment',
    items: [
      {
        q: 'How is the delivery fee calculated?',
        a: 'Fees are based on distance, vehicle type (motorcycle, car, or van), and your selected guarantee tier. You will see the exact price before confirming any booking — no hidden charges.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We currently support Cash on Delivery (COD) and GCash. More payment options are being added.',
      },
      {
        q: 'What is the Guarantee Tier?',
        a: 'Our guarantee tiers let you choose coverage for your item\'s value — from Basic (up to ₱500) to Premium (up to ₱10,000). Higher tiers include additional insurance coverage in case of loss or damage.',
      },
      {
        q: 'Are there any cancellation fees?',
        a: 'You can cancel a booking for free before a driver accepts it. Once a driver is on the way, a small cancellation fee may apply.',
      },
    ],
  },
  {
    category: 'Tracking & Updates',
    items: [
      {
        q: 'How do I track my order?',
        a: 'Once a driver accepts your booking, you\'ll see a real-time status tracker on the tracking page — from Accepted → Picked Up → In Transit → Delivered.',
      },
      {
        q: 'Will I be notified when my package is delivered?',
        a: 'Yes. Your order status updates automatically on the tracking page. The driver also submits a proof-of-delivery photo upon drop-off.',
      },
      {
        q: 'What if my driver is taking too long?',
        a: 'Check the live status page for updates. If the delivery is significantly delayed, contact our support team via the Contact Us page and we will assist you.',
      },
    ],
  },
  {
    category: 'Drivers',
    items: [
      {
        q: 'How do I register as a driver?',
        a: 'Sign in with a customer account first, then click "Become a Driver" on the homepage. You\'ll submit your vehicle details and valid IDs. Approval is typically within 24–48 hours.',
      },
      {
        q: 'What vehicles are accepted?',
        a: 'We accept motorcycles (125cc and up), cars (sedan/SUV), and vans/trucks for bulk deliveries. Your vehicle must have a valid registration and insurance.',
      },
      {
        q: 'How and when do drivers get paid?',
        a: 'Earnings are tallied per completed delivery and paid out weekly via GCash or bank transfer. You can view your earnings history in the Driver portal.',
      },
    ],
  },
  {
    category: 'Account & Security',
    items: [
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the login page, click "Forgot Password" (or contact support). We\'ll send a password reset link to your registered email.',
      },
      {
        q: 'Can I have multiple roles (customer and driver)?',
        a: 'Yes. If you register as a driver, you keep your customer access as well. You can switch between booking deliveries and accepting orders from the same account.',
      },
      {
        q: 'How is my personal data protected?',
        a: 'Your data is stored securely on Google Firebase with industry-standard encryption. We never sell your personal information to third parties. See our Privacy Policy for full details.',
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', textAlign: 'left' }}
      >
        <span style={{ fontSize: '15px', fontWeight: 700, color: open ? '#4ADE80' : 'white', transition: 'color 0.2s', lineHeight: 1.45 }}>{q}</span>
        <span style={{ fontSize: '18px', color: open ? '#4ADE80' : 'rgba(255,255,255,0.3)', transition: 'transform 0.25s, color 0.2s', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0, fontWeight: 300 }}>+</span>
      </button>
      <div style={{ maxHeight: open ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <p style={{ paddingBottom: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(FAQS[0].category);

  return (
    <div style={{ background: '#0A1223', minHeight: '100vh', marginTop: '-68px', paddingTop: '68px' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0A1223 0%, #0F2040 60%, #003D1F 100%)', position: 'relative', overflow: 'hidden', padding: '80px 32px 72px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.1), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,177,79,0.12)', border: '1px solid rgba(0,177,79,0.25)', borderRadius: '40px', padding: '6px 16px', color: '#4ADE80', fontSize: '12px', fontWeight: 700, marginBottom: '20px' }}>
            ❓ Help Center
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 900, color: 'white', letterSpacing: '-0.025em', marginBottom: '14px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px', lineHeight: 1.7 }}>
            Everything you need to know about GrabExpress. Can't find your answer?{' '}
            <Link to="/contact" style={{ color: '#4ADE80', textDecoration: 'none', fontWeight: 700 }}>Contact us</Link>.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '56px 32px 96px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '48px', alignItems: 'start' }} className="faq-grid">

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: '88px' }} className="faq-sidebar">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Categories</div>
          {FAQS.map(cat => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: activeCategory === cat.category ? 'rgba(0,177,79,0.12)' : 'none',
                border: 'none', borderLeft: `2px solid ${activeCategory === cat.category ? '#4ADE80' : 'transparent'}`,
                padding: '10px 14px', borderRadius: '0 8px 8px 0', color: activeCategory === cat.category ? '#4ADE80' : 'rgba(255,255,255,0.45)',
                fontSize: '13px', fontWeight: activeCategory === cat.category ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', marginBottom: '2px',
              }}
            >{cat.category}</button>
          ))}
          <div style={{ marginTop: '32px', padding: '18px', background: 'rgba(0,177,79,0.07)', border: '1px solid rgba(0,177,79,0.18)', borderRadius: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>Still need help?</div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '12px' }}>Our team is available Mon–Sun, 7AM–10PM.</p>
            <Link to="/contact" style={{ display: 'inline-block', background: '#00B14F', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Contact Support</Link>
          </div>
        </div>

        {/* FAQ items */}
        <div>
          {FAQS.filter(cat => cat.category === activeCategory).map(cat => (
            <div key={cat.category}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{cat.category}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '28px' }}>{cat.items.length} questions</p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0 24px' }}>
                {cat.items.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .faq-sidebar { position: static !important; }
        }
      `}</style>
    </div>
  );
}

export default FAQPage;
