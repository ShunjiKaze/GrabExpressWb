import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Logo from '../components/Logo';
import { PageShell, Field, SelectField, ErrorBanner, SubmitBtn, Divider, GoogleBtn, EyeOpen, EyeOff } from './LoginPage';
import { useTheme } from '../context/ThemeContext';
import { sanitizeName, isValidName } from '../utils/validate';

const SUFFIXES = [
  { value: '',     label: 'Suffix (optional)' },
  { value: 'Jr.',  label: 'Jr.' },
  { value: 'Sr.',  label: 'Sr.' },
  { value: 'I',    label: 'I' },
  { value: 'II',   label: 'II' },
  { value: 'III',  label: 'III' },
  { value: 'IV',   label: 'IV' },
];

function RegisterPage() {
  const [suffix,  setSuffix]  = useState('');
  const [first,   setFirst]   = useState('');
  const [last,    setLast]    = useState('');
  const [middle,  setMiddle]  = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [pw,      setPw]      = useState('');
  const [cpw,     setCpw]     = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!isValidName(first)) e.first = 'First name must be at least 2 letters. No numbers or special characters.';
    if (!isValidName(last))  e.last  = 'Last name must be at least 2 letters. No numbers or special characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!/^09\d{9}$/.test(phone)) e.phone = 'Phone must be in format 09XXXXXXXXX (11 digits).';
    if (pw.length < 8) e.pw  = 'Password must be at least 8 characters.';
    if (pw !== cpw)    e.cpw = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fullName = () => [first.trim(), middle.trim() ? middle.trim() + '.' : '', last.trim(), suffix].filter(Boolean).join(' ');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const name = fullName();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        email:      cred.user.email,
        full_name:  name,
        phone:      phone.trim(),
        role:       'customer',
        created_at: serverTimestamp(),
      });
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      const c = err.code;
      if (c === 'auth/email-already-in-use')
        setErrors({ email: 'This email is already registered. Try signing in.' });
      else if (c === 'auth/weak-password')
        setErrors({ pw: 'Password is too weak. Use at least 8 characters.' });
      else if (c === 'auth/invalid-email')
        setErrors({ email: 'Invalid email address.' });
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
        setErrors({ general: 'Google sign-up failed. Please try again.' });
    } finally {
      setGLoading(false);
    }
  };

  const { dark } = useTheme();

  const eyeBtn = (show, setShow) => (
    <button type="button" onClick={() => setShow(v => !v)} style={{ background: 'none', border: 'none', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
      {show ? <EyeOff /> : <EyeOpen />}
    </button>
  );

  return (
    <PageShell wide>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Logo size="md" textColor={dark ? 'white' : '#0F172A'} />
        <p style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: '13px', marginTop: '8px' }}>
          Create your account to get started.
        </p>
      </div>

      {errors.general && <ErrorBanner msg={errors.general} />}

      <form onSubmit={handleSubmit} noValidate>

        {/* First Name + Middle Initial */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '12px' }}>
          <Field label="First Name" value={first} onChange={e => setFirst(sanitizeName(e.target.value))} placeholder="Juan" error={errors.first} />
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              M.I. <span style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', fontWeight: 400, textTransform: 'none', fontSize: '11px' }}>(opt.)</span>
            </label>
            <input
              value={middle} onChange={e => setMiddle(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
              placeholder="M" maxLength={1} className="auth-input"
              style={{ width: '100%', padding: '11px 14px', textAlign: 'center', background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', border: dark ? '1.5px solid rgba(255,255,255,0.13)' : '1.5px solid rgba(0,0,0,0.15)', borderRadius: '10px', fontSize: '16px', fontWeight: 700, color: dark ? 'white' : '#0F172A' }}
            />
          </div>
        </div>

        {/* Last Name + Suffix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
          <Field label="Last Name" value={last} onChange={e => setLast(sanitizeName(e.target.value))} placeholder="dela Cruz" error={errors.last} />
          <SelectField label="Suffix" value={suffix} onChange={e => setSuffix(e.target.value)} options={SUFFIXES} />
        </div>

        <Field label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" error={errors.email} />

        <Field
          label="Phone Number" value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" error={errors.phone}
        />

        <Field
          label="Password" type={showPw ? 'text' : 'password'} value={pw}
          onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" error={errors.pw}
          rightEl={eyeBtn(showPw, setShowPw)}
        />
        <Field
          label="Confirm Password" type={showCpw ? 'text' : 'password'} value={cpw}
          onChange={e => setCpw(e.target.value)} placeholder="Re-enter your password" error={errors.cpw}
          rightEl={eyeBtn(showCpw, setShowCpw)}
        />

        <SubmitBtn loading={loading} label="Create Account" loadingLabel="Creating account…" />
      </form>

      <Divider />
      <GoogleBtn loading={gLoading} onClick={handleGoogle} />

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#00B14F', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
      </p>
    </PageShell>
  );
}

export default RegisterPage;
