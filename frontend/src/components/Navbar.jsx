import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';

function NavAvatar({ photoURL, name, isHome }) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || 'U')[0].toUpperCase();
  const border  = isHome ? '2px solid rgba(0,177,79,0.5)' : '2px solid var(--primary-light)';
  const base    = { width: 30, height: 30, borderRadius: '50%', border, flexShrink: 0 };

  if (photoURL && !imgError) {
    return <img src={photoURL} alt="" style={{ ...base, objectFit: 'cover' }} onError={() => setImgError(true)} />;
  }
  return (
    <div style={{ ...base, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 800 }}>
      {initial}
    </div>
  );
}

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
  const { dark, toggle } = useTheme();

  const handleLogout = () => { signOut(auth); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const isHome = ['/', '/login', '/register', '/about', '/faq', '/contact'].includes(location.pathname);
  const ROLE_BADGE = isHome ? ROLE_BADGE_DARK : ROLE_BADGE_LIGHT;

  const isPublicPage = ['/', '/about', '/faq', '/contact'].includes(location.pathname);
  const MoonIcon = ({ color }) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={color} style={{ display: 'block', flexShrink: 0 }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
  const SunIcon = ({ color }) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );

  const navStyle = isHome ? {
    background: dark ? 'rgba(10,18,35,0.78)' : 'rgba(244,247,244,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,24,39,0.08)'}`,
    boxShadow: 'none',
  } : {};

  const linkColor = isHome
    ? (dark ? 'rgba(255,255,255,0.65)' : 'rgba(17,24,39,0.65)')
    : undefined;
  const linkHoverBg = isHome
    ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.06)')
    : 'var(--primary-light)';
  const activeBg = isHome
    ? (dark ? 'rgba(0,177,79,0.15)' : 'rgba(0,177,79,0.1)')
    : undefined;
  const activeColor = isHome ? (dark ? '#4ADE80' : '#00a846') : undefined;

  const cls = (path) => `nav-link-custom${isActive(path) ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`;

  const NavLinks = () => (
    <>
      <Link to="/" className={`nav-link-custom${location.pathname === '/' ? ' active' : ''}${isHome ? ' nav-link-on-dark' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>

      {dbUser?.role === 'admin' && (
        <Link to="/admin/dashboard" className={cls('/admin')} onClick={() => setMenuOpen(false)}>Dashboard</Link>
      )}

      {dbUser?.role === 'customer' && (
        <>
          <Link to="/book"    className={cls('/book')}    onClick={() => setMenuOpen(false)}>Book Delivery</Link>
          <Link to="/history" className={cls('/history')} onClick={() => setMenuOpen(false)}>History</Link>
        </>
      )}

      {dbUser?.role === 'driver' && (
        <>
          <Link to="/driver/deliveries" className={cls('/driver/deliveries')} onClick={() => setMenuOpen(false)}>Find Orders</Link>
          <Link to="/driver/active"     className={cls('/driver/active')}     onClick={() => setMenuOpen(false)}>Active Order</Link>
          <Link to="/history"           className={cls('/history')}           onClick={() => setMenuOpen(false)}>History</Link>
        </>
      )}

      <Link to="/about" className={cls('/about')} onClick={() => setMenuOpen(false)}>About</Link>
      <Link to="/faq"   className={cls('/faq')}   onClick={() => setMenuOpen(false)}>FAQ</Link>
    </>
  );

  const toggleBtnColor = isHome
    ? (dark ? 'rgba(255,255,255,0.7)' : 'rgba(17,24,39,0.65)')
    : 'var(--text-2)';

  const ThemeToggle = ({ mobile }) => (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: isHome
          ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.07)')
          : 'var(--surface-2)',
        border: isHome
          ? (dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(17,24,39,0.14)')
          : '1px solid var(--border)',
        borderRadius: '8px',
        width: mobile ? '100%' : 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
        gap: mobile ? '8px' : 0,
        padding: mobile ? '0 14px' : 0,
      }}
    >
      {dark
        ? <SunIcon color={isHome ? 'rgba(255,255,255,0.75)' : '#94a3b8'} />
        : <MoonIcon color={isHome ? 'rgba(17,24,39,0.6)' : '#475569'} />
      }
      {mobile && <span style={{ fontSize: '13px', fontWeight: 600, color: toggleBtnColor }}>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );

  return (
    <nav className="navbar-custom" style={navStyle}>
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="brand-name" onClick={() => setMenuOpen(false)} style={{ gap: '12px', color: isHome ? (dark ? 'white' : '#111827') : undefined }}>
          <Logo size="sm" textColor={dark ? 'white' : '#111827'} />
        </Link>

        {/* Desktop nav */}
        <div className="nav-links" style={{ display: 'flex' }}>
          <NavLinks />
          {user && dbUser && (
            <>
              <div className="nav-divider" style={isHome ? { background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.1)' } : {}} />
              <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '5px 8px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background = linkHoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <NavAvatar photoURL={dbUser?.photoURL || user.photoURL} name={dbUser?.full_name} isHome={isHome} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isHome ? (dark ? 'rgba(255,255,255,0.75)' : 'rgba(17,24,39,0.75)') : 'var(--text-2)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dbUser.full_name?.split(' ')[0] || 'User'}
                </span>
              </Link>
            </>
          )}
          {!user && (
            <>
              <div className="nav-divider" style={isHome ? { background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.1)' } : {}} />
              <Link to="/login" className="btn-primary-custom" style={{ background: 'transparent', color: isHome ? (dark ? 'rgba(255,255,255,0.8)' : 'rgba(17,24,39,0.75)') : 'var(--text-2)', border: isHome ? (dark ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(17,24,39,0.18)') : '1px solid var(--border)' }}>Sign In</Link>
              <Link to="/register" className="btn-primary-custom">Register</Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px', color: isHome ? (dark ? 'white' : '#111827') : 'var(--text)' }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={isHome
          ? { background: dark ? 'rgba(10,18,35,0.97)' : 'rgba(244,247,244,0.97)', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)'}`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }
          : { background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }
        }>
          <NavLinks />
          <div style={{ height: '1px', background: isHome ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)') : 'var(--border)', margin: '8px 0' }} />
          {!user && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn-primary-custom" style={{ background: 'transparent', color: isHome ? (dark ? 'rgba(255,255,255,0.8)' : 'rgba(17,24,39,0.75)') : 'var(--text-2)', border: isHome ? (dark ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(17,24,39,0.18)') : '1px solid var(--border)' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn-primary-custom" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}
          <ThemeToggle mobile />
        </div>
      )}

      <style>{`
        .nav-link-on-dark { color: ${dark ? 'rgba(255,255,255,0.65)' : 'rgba(17,24,39,0.65)'} !important; }
        .nav-link-on-dark:hover { background: ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.06)'} !important; color: ${dark ? 'white' : '#111827'} !important; }
        .nav-link-on-dark.active { background: ${dark ? 'rgba(0,177,79,0.15)' : 'rgba(0,177,79,0.1)'} !important; color: ${dark ? '#4ADE80' : '#00a846'} !important; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
