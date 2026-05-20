import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, palette } from '../context/ThemeContext';
import { MapPinIcon, MailIcon, PhoneIcon, ClockIcon, CheckCircleIcon } from '../components/Icons';

const INFO = [
  { Icon: MapPinIcon, label: 'Address',       value: 'Cebu City, Philippines' },
  { Icon: MailIcon,   label: 'Email',         value: 'support@grabexpress.ph' },
  { Icon: PhoneIcon,  label: 'Phone',         value: '+63 32 000 0000' },
  { Icon: ClockIcon,  label: 'Support Hours', value: 'Monday – Sunday, 7AM – 10PM' },
];

function FormField({ label, type = 'text', value, onChange, placeholder, error, t }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.formLabel, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label} <span style={{ color: '#F87171' }}>*</span>
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', background: t.formInputBg, border: `1.5px solid ${error ? '#F87171' : t.formInputBorder}`, borderRadius: '10px', fontSize: '14px', color: t.formInputText, outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor = error ? '#F87171' : 'rgba(0,177,79,0.7)'}
        onBlur={e  => e.target.style.borderColor = error ? '#F87171' : t.formInputBorder}
      />
      {error && <p style={{ fontSize: '12px', color: '#F87171', marginTop: '4px', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

function ContactPage() {
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent]     = useState(false);
  const { dark } = useTheme();
  const t = palette(dark);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))  e.email = 'Enter a valid email address.';
    if (!form.subject.trim())                              e.subject = 'Please enter a subject.';
    if (form.message.trim().length < 10)                  e.message = 'Message must be at least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSent(true);
  };

  return (
    <div style={{ background: t.bg1, minHeight: '100vh', marginTop: '-68px', paddingTop: '68px' }}>

      {/* Header */}
      <div style={{ background: t.heroGrad, position: 'relative', overflow: 'hidden', padding: '80px 32px 72px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: t.dot, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '25%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.09), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 900, color: t.text, letterSpacing: '-0.025em', marginBottom: '14px' }}>Contact Us</h1>
          <p style={{ color: t.textMuted, fontSize: '16px', lineHeight: 1.7 }}>
            Questions, feedback, or delivery issues — our team is ready to help. You can also check our{' '}
            <Link to="/faq" style={{ color: t.accent, textDecoration: 'none', fontWeight: 700 }}>FAQ page</Link> for quick answers.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 32px 96px', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '48px', alignItems: 'start' }} className="contact-grid">

        {/* Info sidebar */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: t.text, marginBottom: '24px' }}>Reach Us</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {INFO.map(c => (
              <div key={c.label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', background: t.infoCardBg, border: `1px solid ${t.infoCardBorder}`, borderRadius: '14px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                <span style={{ flexShrink: 0, marginTop: '2px' }}><c.Icon size={20} color={t.accent} /></span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: t.infoLabel, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{c.label}</div>
                  <div style={{ fontSize: '14px', color: t.infoValue, fontWeight: 500 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '18px', background: t.helpBox, border: `1px solid ${t.helpBoxBorder}`, borderRadius: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: t.helpBoxTitle, marginBottom: '6px' }}>Common Questions?</div>
            <p style={{ fontSize: '12px', color: t.helpBoxText, lineHeight: 1.6, marginBottom: '12px' }}>Check the FAQ for instant answers — no waiting required.</p>
            <Link to="/faq" style={{ display: 'inline-block', background: '#00B14F', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Visit FAQ</Link>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: t.formCardBg, border: `1px solid ${t.formCardBorder}`, borderRadius: '20px', padding: '36px', boxShadow: dark ? 'none' : '0 4px 20px rgba(0,0,0,0.07)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><CheckCircleIcon size={56} color="#00B14F" /></div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: t.text, marginBottom: '8px' }}>Message Sent!</h3>
              <p style={{ color: t.textMuted, fontSize: '14px', lineHeight: 1.7 }}>
                Thanks for reaching out. Our support team will get back to you within 24 hours.
              </p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                style={{ marginTop: '24px', background: '#00B14F', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Send Another
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: t.text, marginBottom: '24px' }}>Send a Message</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '0px' }} className="form-row">
                  <FormField label="Your Name" value={form.name} onChange={set('name')} placeholder="Juan dela Cruz" error={errors.name} t={t} />
                  <FormField label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" error={errors.email} t={t} />
                </div>
                <FormField label="Subject" value={form.subject} onChange={set('subject')} placeholder="Delivery issue, feedback, etc." error={errors.subject} t={t} />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.formLabel, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Message <span style={{ color: '#F87171' }}>*</span>
                  </label>
                  <textarea
                    value={form.message} onChange={set('message')} rows={5}
                    placeholder="Describe your concern or question in detail..."
                    style={{ width: '100%', padding: '11px 14px', background: t.formInputBg, border: `1.5px solid ${errors.message ? '#F87171' : t.formInputBorder}`, borderRadius: '10px', fontSize: '14px', color: t.formInputText, resize: 'vertical', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = errors.message ? '#F87171' : 'rgba(0,177,79,0.7)'}
                    onBlur={e  => e.target.style.borderColor = errors.message ? '#F87171' : t.formInputBorder}
                    className="contact-textarea"
                  />
                  {errors.message && <p style={{ fontSize: '12px', color: '#F87171', marginTop: '4px', fontWeight: 500 }}>{errors.message}</p>}
                </div>
                <button type="submit" style={{ width: '100%', padding: '13px', background: '#00B14F', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#00a046'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#00B14F'; e.currentTarget.style.transform = ''; }}
                >Send Message</button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div style={{ background: t.footerBg, borderTop: `1px solid ${t.footerBorder}`, padding: '20px 32px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: t.footerText, fontSize: '12px' }}>© 2026 GrabExpress Cebu. All rights reserved.</p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .form-row { grid-template-columns: 1fr !important; }
        }
        .contact-textarea::placeholder { color: ${t.formPlaceholder}; }
      `}</style>
    </div>
  );
}

export default ContactPage;
