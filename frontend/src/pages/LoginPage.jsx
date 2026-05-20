import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [pw,       setPw]       = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!pw) e.pw = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      navigate('/');
    } catch (err) {
      const c = err.code;
      if (c === 'auth/wrong-password' || c === 'auth/invalid-credential') {
        setPw('');
        setErrors({ general: 'Incorrect email or password. Please try again.' });
      }
      else if (c === 'auth/user-not-found')
        setErrors({ email: 'No account found with this email.' });
      else if (c === 'auth/invalid-email')
        setErrors({ email: 'Invalid email address.' });
      else if (c === 'auth/too-many-requests')
        setErrors({ general: 'Too many attempts. Please wait a moment and try again.' });
      else
        setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const ref  = doc(db, 'users', result.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          email:      result.user.email,
          full_name:  result.user.displayName || result.user.email.split('@')[0],
          photoURL:   result.user.photoURL || null,
          role:       'customer',
          created_at: serverTimestamp(),
        });
      } else if (result.user.photoURL && !snap.data().photoURL) {
        await setDoc(ref, { photoURL: result.user.photoURL }, { merge: true });
      }
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setErrors({ general: 'Google sign-in failed. Please try again.' });
    } finally {
      setGLoading(false);
    }
  };

  const { dark } = useTheme();
  return (
    <PageShell>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Logo size="md" textColor={dark ? 'white' : '#0F172A'} />
        <p style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: '13px', marginTop: '8px' }}>
          Welcome back! Sign in to continue.
        </p>
      </div>

      {errors.general && <ErrorBanner msg={errors.general} />}

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" error={errors.email} />
        <Field
          label="Password" type={showPw ? 'text' : 'password'} value={pw}
          onChange={e => setPw(e.target.value)} placeholder="••••••••" error={errors.pw}
          rightEl={
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          }
        />
        <SubmitBtn loading={loading} label="Sign In" loadingLabel="Signing in…" />
      </form>

      <Divider />
      <GoogleBtn loading={gLoading} onClick={handleGoogle} />

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#00B14F', fontWeight: 700, textDecoration: 'none' }}>Register here</Link>
      </p>
    </PageShell>
  );
}

/* ── Shared components (also used by RegisterPage) ───────────── */

export function PageShell({ children, wide = false }) {
  const { dark } = useTheme();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 24px 56px',
      paddingTop: '108px',
      marginTop: '-68px',
      background: dark
        ? 'linear-gradient(135deg, #0A1223 0%, #0F2040 50%, #003D1F 100%)'
        : 'linear-gradient(135deg, #f0fdf4 0%, #e8f4fd 60%, #f0fdf4 100%)',
    }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.08), transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07), transparent 65%)', pointerEvents: 'none' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: wide ? '520px' : '440px',
        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,177,79,0.15)',
        borderRadius: '20px', padding: '40px 36px',
        boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.1)',
        animation: 'authCardIn 0.35s cubic-bezier(0.4,0,0.2,1) both',
      }}>
        {children}
      </div>
      <style>{`
        @keyframes authCardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        input::placeholder { color: ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'}; }
        input, select { caret-color: #00B14F; }
        .auth-btn-primary { transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important; }
        .auth-btn-primary:hover:not(:disabled) { background: #00a046 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,177,79,0.35); }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0) !important; box-shadow: none !important; }
        .auth-btn-google { transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important; }
        .auth-btn-google:hover:not(:disabled) { background: ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)'} !important; transform: translateY(-1px); }
        .auth-btn-google:active:not(:disabled) { transform: translateY(0) !important; }
        .auth-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .auth-input:focus { border-color: rgba(0,177,79,0.7) !important; box-shadow: 0 0 0 3px rgba(0,177,79,0.12); outline: none; }
        .auth-select { transition: border-color 0.2s; }
        .auth-select:focus { border-color: rgba(0,177,79,0.7) !important; outline: none; }
      `}</style>
    </div>
  );
}

export function Field({ label, type = 'text', value, onChange, error, placeholder, maxLength, inputMode, rightEl, required }) {
  const { dark } = useTheme();
  const labelColor = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const inputBg    = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const inputBorder = error ? '#F87171' : dark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.15)';
  const inputColor  = dark ? 'white' : '#0F172A';
  const eyeColor    = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  return (
    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required !== false && <span style={{ color: '#F87171', marginLeft: '3px' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          maxLength={maxLength} inputMode={inputMode}
          className="auth-input"
          style={{
            width: '100%', padding: rightEl ? '11px 42px 11px 14px' : '11px 14px',
            background: inputBg, border: `1.5px solid ${inputBorder}`,
            borderRadius: '10px', fontSize: '14px', color: inputColor,
          }}
        />
        {rightEl && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: eyeColor, display: 'flex' }}>{rightEl}</div>}
      </div>
      {error && <p style={{ fontSize: '12px', color: '#F87171', marginTop: '4px', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

export function SelectField({ label, value, onChange, error, options, required }) {
  const { dark } = useTheme();
  const labelColor = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const inputBg    = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const inputBorder = error ? '#F87171' : dark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.15)';
  const inputColor  = dark ? (value ? 'white' : 'rgba(255,255,255,0.25)') : (value ? '#0F172A' : 'rgba(0,0,0,0.35)');
  return (
    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#F87171', marginLeft: '3px' }}>*</span>}
      </label>
      <select value={value} onChange={onChange} className="auth-select" style={{
        width: '100%', padding: '11px 14px',
        background: inputBg, border: `1.5px solid ${inputBorder}`,
        borderRadius: '10px', fontSize: '14px', color: inputColor,
        appearance: 'none', cursor: 'pointer',
      }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: dark ? '#0F2040' : 'white', color: dark ? 'white' : '#0F172A' }}>{o.label}</option>)}
      </select>
      {error && <p style={{ fontSize: '12px', color: '#F87171', marginTop: '4px', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

export function ErrorBanner({ msg }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px', color: '#F87171', fontSize: '13px', fontWeight: 500, textAlign: 'left' }}>
      {msg}
    </div>
  );
}

export function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading} className="auth-btn-primary" style={{
      width: '100%', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '6px',
      background: loading ? 'rgba(0,177,79,0.5)' : '#00B14F',
      color: 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    }}>
      {loading ? loadingLabel : label}
    </button>
  );
}

export function Divider() {
  const { dark } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
      <div style={{ flex: 1, height: '1px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
      <span style={{ fontSize: '12px', color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', fontWeight: 600 }}>or continue with</span>
      <div style={{ flex: 1, height: '1px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
    </div>
  );
}

export function GoogleBtn({ loading, onClick }) {
  const { dark } = useTheme();
  return (
    <button onClick={onClick} disabled={loading} type="button" className="auth-btn-google" style={{
      width: '100%', padding: '11px',
      border: dark ? '1.5px solid rgba(255,255,255,0.13)' : '1.5px solid rgba(0,0,0,0.12)',
      borderRadius: '10px',
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      color: dark ? 'white' : '#0F172A', fontSize: '14px', fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    }}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.7 0 5.2 1 7.1 2.7l5.7-5.7C33.4 7.1 28.9 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.9 0 18.6-7.6 18.6-18.3 0-1.2-.1-2.5-.4-3.7z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.7 0 5.2 1 7.1 2.7l5.7-5.7C33.4 7.1 28.9 5 24 5 16.2 5 9.5 9 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 43c4.8 0 9.2-1.8 12.5-4.7l-6.1-5.2C28.7 34.6 26.4 35.5 24 35.5c-5.2 0-9.5-3.6-11.1-8.4l-6.6 5.1C9.2 38.6 16.1 43 24 43z"/>
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.1 5.2C40.7 35.8 43.5 30.3 43.5 24c0-1.2-.1-2.5-.4-3.7z" opacity=".9"/>
      </svg>
      {loading ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}

export { EyeOpen, EyeOff };
export default LoginPage;
