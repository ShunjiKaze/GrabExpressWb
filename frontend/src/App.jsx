import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Normalize Firestore user doc: Android uses camelCase, web uses snake_case.
// Always produce both so the rest of the app can read snake_case safely.
function normalizeUser(uid, data) {
  return {
    ...data,
    user_id:       uid,
    full_name:     data.full_name     || data.fullName     || '',
    vehicle_type:  data.vehicle_type  || data.vehicleType  || '',
    vehicle_plate: data.vehicle_plate || data.vehiclePlate || '',
  };
}

import { BookingProvider } from './context/BookingContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';

import Home              from './pages/Home';
import AdminDashboard    from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AddressStep       from './pages/booking/AddressStep';
import DeliveryDetailsStep from './pages/booking/DeliveryDetailsStep';
import ItemDetailsStep   from './pages/booking/ItemDetailsStep';
import ReviewOrder       from './pages/booking/ReviewOrder';
import TrackingPage      from './pages/TrackingPage';
import RatingPage        from './pages/RatingPage';
import ReceiptPage       from './pages/ReceiptPage';
import DriverDeliveries  from './pages/DriverDeliveries';
import DriverActiveOrder from './pages/DriverActiveOrder';
import DriverVehiclePage from './pages/DriverVehiclePage';
import OrderHistory      from './pages/OrderHistory';
import ProfilePage       from './pages/ProfilePage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import AboutPage         from './pages/AboutPage';
import FAQPage           from './pages/FAQPage';
import ContactPage       from './pages/ContactPage';

import './index.css';

function ProtectedRoute({ allow, children }) {
  return allow ? children : <Navigate to="/" replace />;
}

function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser]             = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (unsubDoc) { unsubDoc(); unsubDoc = null; }

      if (currentUser) {
        try {
          const ref  = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(ref);

          if (!snap.exists()) {
            const newData = {
              email:      currentUser.email,
              full_name:  currentUser.displayName || currentUser.email.split('@')[0],
              photoURL:   currentUser.photoURL || null,
              role:       'customer',
              created_at: serverTimestamp(),
            };
            await setDoc(ref, newData);
            setDbUser(normalizeUser(currentUser.uid, newData));
          } else {
            // Set dbUser immediately so ProtectedRoute has the role before loading ends
            setDbUser(normalizeUser(currentUser.uid, snap.data()));
            if (currentUser.photoURL && !snap.data().photoURL) {
              await setDoc(ref, { photoURL: currentUser.photoURL }, { merge: true });
            }
          }

          // Live listener — keeps dbUser in sync for subsequent changes (e.g. photo upload)
          unsubDoc = onSnapshot(ref, (s) => {
            if (s.exists()) setDbUser(normalizeUser(currentUser.uid, s.data()));
          });
        } catch (err) {
          console.error('Auth sync error:', err);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => { unsubAuth(); if (unsubDoc) unsubDoc(); };
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '32px', background: 'var(--bg)' }}>
        <style>{`
          @keyframes ge-pulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }
          @keyframes ge-ring  { 0%{transform:scale(0.5);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
          @keyframes ge-bounce{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes ge-dots  { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
          .ge-dot1{animation:ge-dots 1.4s infinite 0s}
          .ge-dot2{animation:ge-dots 1.4s infinite 0.2s}
          .ge-dot3{animation:ge-dots 1.4s infinite 0.4s}
        `}</style>

        {/* Icon + pulse rings */}
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[0, 0.5, 1].map(delay => (
            <span key={delay} style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid #00b14f',
              animation: `ge-ring 2s ease-out ${delay}s infinite`,
            }} />
          ))}
          {/* Brand circle */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00b14f 0%, #00823a 100%)',
            boxShadow: '0 8px 32px rgba(0,177,79,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ge-pulse 2s ease-in-out infinite',
          }}>
            {/* Scooter SVG */}
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'ge-bounce 2s ease-in-out infinite' }}>
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M8 17.5h7"/>
              <path d="M15 17.5V9l-3-3H8l-2 5.5"/>
              <path d="M15 9h3l1.5 4"/>
              <path d="M10 6V4"/>
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
            Grab<span style={{ color: '#00b14f' }}>Express</span>
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
            Loading
            <span className="ge-dot1" style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-3)' }} />
            <span className="ge-dot2" style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-3)' }} />
            <span className="ge-dot3" style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-3)' }} />
          </p>
        </div>
      </div>
    );
  }

  const isCustomer = firebaseUser && dbUser?.role === 'customer';
  const isDriver   = firebaseUser && dbUser?.role === 'driver';
  const isAdmin    = firebaseUser && dbUser?.role === 'admin';
  const isLoggedIn = !!firebaseUser;

  return (
    <ThemeProvider>
    <ToastProvider>
      <BookingProvider>
        <Router>
          <Navbar user={firebaseUser} dbUser={dbUser} />

          <Routes>
            {/* Auth */}
            <Route path="/login"    element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={isLoggedIn && dbUser ? <Navigate to="/" replace /> : <RegisterPage />} />

            {/* Public */}
            <Route path="/" element={
              isAdmin ? <Navigate to="/admin/dashboard" replace /> :
              isDriver ? <Navigate to="/driver/deliveries" replace /> : <Home user={firebaseUser} dbUser={dbUser} />
            } />
            <Route path="/about"   element={<AboutPage />} />
            <Route path="/faq"     element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allow={isAdmin}><AdminDashboard /></ProtectedRoute>
            } />

            {/* Customer - booking dashboard */}
            <Route path="/book" element={
              <ProtectedRoute allow={isCustomer}><CustomerDashboard dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Customer - booking flow steps */}
            <Route path="/book/new/address" element={
              <ProtectedRoute allow={isCustomer}><AddressStep /></ProtectedRoute>
            } />
            <Route path="/book/new/details" element={
              <ProtectedRoute allow={isCustomer}><DeliveryDetailsStep /></ProtectedRoute>
            } />
            <Route path="/book/new/items" element={
              <ProtectedRoute allow={isCustomer}><ItemDetailsStep /></ProtectedRoute>
            } />
            <Route path="/book/new/review" element={
              <ProtectedRoute allow={isCustomer}><ReviewOrder dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Tracking — accessible by customer and driver */}
            <Route path="/book/tracking/:id" element={
              <ProtectedRoute allow={isLoggedIn}><TrackingPage dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Rating */}
            <Route path="/rate/:id" element={
              <ProtectedRoute allow={isLoggedIn}><RatingPage dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Receipt */}
            <Route path="/receipt/:id" element={
              <ProtectedRoute allow={isLoggedIn}><ReceiptPage dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Driver */}
            <Route path="/driver/deliveries" element={
              <ProtectedRoute allow={isDriver}><DriverDeliveries dbUser={dbUser} /></ProtectedRoute>
            } />
            <Route path="/driver/active" element={
              <ProtectedRoute allow={isDriver}><DriverActiveOrder dbUser={dbUser} /></ProtectedRoute>
            } />
            <Route path="/driver/vehicles" element={
              <ProtectedRoute allow={isDriver}><DriverVehiclePage dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* History */}
            <Route path="/history" element={
              <ProtectedRoute allow={isCustomer || isDriver}><OrderHistory dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Profile */}
            <Route path="/profile" element={
              <ProtectedRoute allow={isLoggedIn}><ProfilePage dbUser={dbUser} firebaseUser={firebaseUser} /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </BookingProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
