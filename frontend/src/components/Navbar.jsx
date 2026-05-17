import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Logo from './Logo';

const ROLE_BADGE_LIGHT = {
  admin:    { bg: '#FEE2E2', color: '#B91C1C' },
  driver:   { bg: '#DBEAFE', color: '#1E40AF' },
  customer: { bg: '#DCFCE7', color: '#15803D' },
};
const ROLE_BADGE_DARK = {
  admin:    { bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  driver:   { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  customer: { bg: 'rgba(0,177,79,0.15)',   color: '#4ADE80' },
};

function Navbar({ user, dbUser }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin  = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleLogout = () => { signOut(auth); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const isHome = location.pathname === '/';
  const ROLE_BADGE = isHome ? ROLE_BADGE_DARK : ROLE_BADGE_LIGHT;

  const NavLinks = () => (
    <>
      <Link to="/" className={`nav-link-custom${location.pathname === '/' ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>

      {dbUser?.role === 'admin' && (
        <Link to="/admin/dashboard" className={`nav-link-custom${isActive('/admin') ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>Dashboard</Link>
      )}

      {dbUser?.role === 'customer' && (
        <>
          <Link to="/book" className={`nav-link-custom${isActive('/book') ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>Book Delivery</Link>
          <Link to="/history" className={`nav-link-custom${isActive('/history') ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>History</Link>
        </>
      )}

      {dbUser?.role === 'driver' && (
        <>
          <Link to="/driver/deliveries" className={`nav-link-custom${isActive('/driver/deliveries') ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>Find Orders</Link>
          <Link to="/driver/active" className={`nav-link-custom${isActive('/driver/active') ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>Active Order</Link>
          <Link to="/history" className={`nav-link-custom${isActive('/history') ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>History</Link>
        </>
      )}
    </>
  );

  return (
    <nav
      className="navbar-custom"
      style={isHome ? {
        background: 'rgba(10,18,35,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'none',
      } : {}}
    >
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="brand-name" onClick={() => setMenuOpen(false)} style={{ gap: '12px', color: isHome ? 'white' : undefined }}>
          <Logo size="sm" textColor={isHome ? 'white' : undefined} />
          {dbUser && (
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', ...ROLE_BADGE[dbUser.role] }}>
              {dbUser.role}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="nav-links" style={{ display: 'flex' }}>
          <NavLinks />
          {user && dbUser && (
            <>
              <div className="nav-divider" style={isHome ? { background: 'rgba(255,255,255,0.12)' } : {}} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '5px 8px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = isHome ? 'rgba(255,255,255,0.08)' : 'var(--primary-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', border: isHome ? '2px solid rgba(0,177,79,0.5)' : '2px solid var(--primary-light)' }} />
                    : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 800 }}>{(dbUser.full_name || 'U')[0].toUpperCase()}</div>
                  }
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isHome ? 'rgba(255,255,255,0.75)' : 'var(--text-2)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dbUser.full_name?.split(' ')[0] || 'User'}
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn btn-sm" style={isHome ? { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' } : { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>Sign Out</button>
              </div>
            </>
          )}
          {!user && (
            <>
              <div className="nav-divider" style={isHome ? { background: 'rgba(255,255,255,0.12)' } : {}} />
              <button onClick={handleLogin} className="btn-primary-custom">Sign In with Google</button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px', color: isHome ? 'white' : 'var(--text)' }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={isHome ? { background: 'rgba(10,18,35,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' } : { background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLinks />
          <div style={{ height: '1px', background: isHome ? 'rgba(255,255,255,0.08)' : 'var(--border)', margin: '8px 0' }} />
          {user ? (
            <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }}>Sign Out</button>
          ) : (
            <button onClick={handleLogin} className="btn-primary-custom" style={{ alignSelf: 'flex-start' }}>Sign In with Google</button>
          )}
        </div>
      )}

      <style>{`
        .nav-link-on-dark { color: rgba(255,255,255,0.65) !important; }
        .nav-link-on-dark:hover { background: rgba(255,255,255,0.08) !important; color: white !important; }
        .nav-link-on-dark.active { background: rgba(0,177,79,0.15) !important; color: #4ADE80 !important; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
