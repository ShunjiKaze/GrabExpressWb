import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

import { BookingProvider } from './context/BookingContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import Home              from './pages/Home';
import AdminDashboard    from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AddressStep       from './pages/booking/AddressStep';
import DeliveryDetailsStep from './pages/booking/DeliveryDetailsStep';
import ItemDetailsStep   from './pages/booking/ItemDetailsStep';
import ReviewOrder       from './pages/booking/ReviewOrder';
import TrackingPage      from './pages/TrackingPage';
import RatingPage        from './pages/RatingPage';
import DriverDeliveries  from './pages/DriverDeliveries';
import DriverActiveOrder from './pages/DriverActiveOrder';
import OrderHistory      from './pages/OrderHistory';
import ProfilePage       from './pages/ProfilePage';

import './index.css';

function ProtectedRoute({ allow, children }) {
  return allow ? children : <Navigate to="/" replace />;
}

function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser]             = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        try {
          const ref  = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setDbUser({ user_id: currentUser.uid, ...snap.data() });
          } else {
            const newUser = {
              email:      currentUser.email,
              full_name:  currentUser.displayName || currentUser.email.split('@')[0],
              role:       'customer',
              created_at: serverTimestamp(),
            };
            await setDoc(ref, newUser);
            setDbUser({ user_id: currentUser.uid, ...newUser });
          }
        } catch (err) {
          console.error('Auth sync error:', err);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'var(--bg)' }}>
        <DotLottieReact
          src="https://lottie.host/a4f0b6f6-f57a-4950-aaee-23caf05964ff/C32He7vMVy.lottie"
          loop
          autoplay
          style={{ width: '340px', height: '340px' }}
        />
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontWeight: 600, marginTop: '-24px' }}>Loading GrabExpress…</p>
      </div>
    );
  }

  const isCustomer = firebaseUser && dbUser?.role === 'customer';
  const isDriver   = firebaseUser && dbUser?.role === 'driver';
  const isAdmin    = firebaseUser && dbUser?.role === 'admin';
  const isLoggedIn = !!firebaseUser;

  return (
    <ToastProvider>
      <BookingProvider>
        <Router>
          <Navbar user={firebaseUser} dbUser={dbUser} />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Home user={firebaseUser} dbUser={dbUser} />} />

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

            {/* Driver */}
            <Route path="/driver/deliveries" element={
              <ProtectedRoute allow={isDriver}><DriverDeliveries dbUser={dbUser} /></ProtectedRoute>
            } />
            <Route path="/driver/active" element={
              <ProtectedRoute allow={isDriver}><DriverActiveOrder dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* History */}
            <Route path="/history" element={
              <ProtectedRoute allow={isCustomer || isDriver}><OrderHistory dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Profile */}
            <Route path="/profile" element={
              <ProtectedRoute allow={isLoggedIn}><ProfilePage dbUser={dbUser} /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </BookingProvider>
    </ToastProvider>
  );
}

export default App;
