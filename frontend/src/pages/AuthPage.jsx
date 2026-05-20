import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Logo from '../components/Logo';
import { EyeIcon, EyeOffIcon } from '../components/Icons';

const validateEmail  = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone  = (v) => !v || /^09\d{9}$/.test(v);

function Field({ label, type = 'text', value, onChange, error, placeholder, maxLength, inputMode, rightEl }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '7px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          style={{
            width: '100%',
            padding: rightEl ? '11px 44px 11px 14px' : '11px 14px',
            background: 'rgba(255,255,255,0.07)',
            border: `1.5px solid ${error ? '#F87171' : 'rgba(255,255,255,0.13)'}`,
            borderRadius: '10px',
            fontSize: '14px',
            color: 'white',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = error ? '#F87171' : 'rgba(0,177,79,0.7)'}
          onBlur={e  => e.target.style.borderColor = error ? '#F87171' : 'rgba(255,255,255,0.13)'}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '16px', userSelect: 'none' }}>
            {rightEl}
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: '12px', color: '#F87171', marginTop: '5px', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

function AuthPage() {
  const [mode, setMode]       = useState('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [pw, setPw]           = useState('');
  const [cpw, setCpw]         = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const navigate = useNavigate();

  const clear = (m) => {
    setMode(m); setErrors({});
    setName(''); setEmail(''); setPhone(''); setPw(''); setCpw('');
  };

  const validate = () => {
    const e = {};
    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) e.name  = 'Full name must be at least 2 characters.';
      if (!validatePhone(phone))                  e.phone = 'Phone must be in format 09XXXXXXXXX (11 digits).';
    }
    if (!validateEmail(email))     e.email = 'Enter a valid email address.';
    if (pw.length < 8)             e.pw    = 'Password must be at least 8 characters.';
    if (mode === 'register' && pw !== cpw) e.cpw = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), pw);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
        await updateProfile(cred.user, { displayName: name.trim() });
        const newUser = {
          email:      cred.user.email,
          full_name:  name.trim(),
          phone:      phone.trim() || null,
          role:       'customer',
          created_at: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
      }
      navigate('/');
    } catch (err) {
      const c = err.code;
      if (c === 'auth/wrong-password' || c === 'auth/invalid-credential')
        setErrors({ pw: 'Incorrect password. Please try again.' });
      else if (c === 'auth/user-not-found')
        setErrors({ email: 'No account found with this email.' });
      else if (c === 'auth/email-already-in-use')
        setErrors({ email: 'This email is already registered. Try logging in.' });
      else if (c === 'auth/weak-password')
        setErrors({ pw: 'Password is too weak. Use at least 8 characters.' });
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
          role:       'customer',
          created_at: serverTimestamp(),
        });
      }
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setErrors({ general: 'Google sign-in failed. Please try again.' });
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A1223 0%, #0F2040 50%, #003D1F 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      marginTop: '-68px',
    }}>
      {/* Dot grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      {/* Glow orbs */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,79,0.08), transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07), transparent 65%)', pointerEvents: 'none' }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Logo size="md" textColor="white" />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '8px' }}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => clear(m)} style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: mode === m ? 'rgba(0,177,79,0.9)' : 'transparent',
              color:      mode === m ? 'white' : 'rgba(255,255,255,0.5)',
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* General error */}
        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px', color: '#F87171', fontSize: '13px', fontWeight: 500 }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <Field label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Juan dela Cruz" error={errors.name} />
          )}

          <Field label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" error={errors.email} />

          {mode === 'register' && (
            <Field
              label="Phone Number (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="09XXXXXXXXX"
              maxLength={11}
              inputMode="numeric"
              error={errors.phone}
            />
          )}

          <Field
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            error={errors.pw}
            rightEl={<span onClick={() => setShowPw(v => !v)} style={{ display: 'flex' }}>{showPw ? <EyeOffIcon size={16} color="rgba(255,255,255,0.5)" /> : <EyeIcon size={16} color="rgba(255,255,255,0.5)" />}</span>}
          />

          {mode === 'register' && (
            <Field
              label="Confirm Password"
              type={showCpw ? 'text' : 'password'}
              value={cpw}
              onChange={e => setCpw(e.target.value)}
              placeholder="Re-enter your password"
              error={errors.cpw}
              rightEl={<span onClick={() => setShowCpw(v => !v)} style={{ display: 'flex' }}>{showCpw ? <EyeOffIcon size={16} color="rgba(255,255,255,0.5)" /> : <EyeIcon size={16} color="rgba(255,255,255,0.5)" />}</span>}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
              background: loading ? 'rgba(0,177,79,0.5)' : 'var(--primary)',
              color: 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', transition: 'all 0.2s',
            }}
          >
            {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={gLoading}
          style={{
            width: '100%', padding: '11px', border: '1.5px solid rgba(255,255,255,0.13)', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: gLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.7 0 5.2 1 7.1 2.7l5.7-5.7C33.4 7.1 28.9 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.9 0 18.6-7.6 18.6-18.3 0-1.2-.1-2.5-.4-3.7z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.7 0 5.2 1 7.1 2.7l5.7-5.7C33.4 7.1 28.9 5 24 5 16.2 5 9.5 9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43c4.8 0 9.2-1.8 12.5-4.7l-6.1-5.2C28.7 34.6 26.4 35.5 24 35.5c-5.2 0-9.5-3.6-11.1-8.4l-6.6 5.1C9.2 38.6 16.1 43 24 43z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.1 5.2C40.7 35.8 43.5 30.3 43.5 24c0-1.2-.1-2.5-.4-3.7z" opacity=".9"/>
          </svg>
          {gLoading ? 'Connecting…' : 'Continue with Google'}
        </button>


      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.25); }
        input { caret-color: #00B14F; }
      `}</style>
    </div>
  );
}

export default AuthPage;
