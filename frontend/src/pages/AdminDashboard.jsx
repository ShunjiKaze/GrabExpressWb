import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UsersIcon, MotorcycleIcon, PackageIcon, ActivityIcon, XCircleIcon,
         SearchIcon, ZapIcon, CheckCircleIcon, BanknoteIcon, LogOutIcon, FileTextIcon } from '../components/Icons';
import { useToast } from '../components/Toast';

const STATUS_CONFIG = {
  searching:  { label: 'Searching',  badge: 'badge-amber',  Icon: SearchIcon },
  accepted:   { label: 'Accepted',   badge: 'badge-blue',   Icon: MotorcycleIcon },
  picked_up:  { label: 'Picked Up',  badge: 'badge-purple', Icon: PackageIcon },
  in_transit: { label: 'In Transit', badge: 'badge-blue',   Icon: ZapIcon },
  delivered:  { label: 'Delivered',  badge: 'badge-green',  Icon: CheckCircleIcon },
  completed:  { label: 'Completed',  badge: 'badge-green',  Icon: CheckCircleIcon },
  cancelled:  { label: 'Cancelled',  badge: 'badge-red',    Icon: XCircleIcon },
};

function AdminDashboard() {
  const showToast = useToast();
  const [bookings, setBookings] = useState([]);
  const [users, setUsers]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');
  const [activeRequestTab, setActiveRequestTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [reviewingUser, setReviewingUser] = useState(null);
  const [reviewingType, setReviewingType] = useState('');

  // Filters
  const [filterBookings, setFilterBookings] = useState('all');
  const [filterCustomerSearch, setFilterCustomerSearch] = useState('');
  const [filterDriverStatus, setFilterDriverStatus] = useState('all');
  const [filterRequestType, setFilterRequestType] = useState('all');

  // Pagination
  const PAGE_SIZE = 20;
  const [pageBookings,   setPageBookings]   = useState(0);
  const [pageCustomers,  setPageCustomers]  = useState(0);
  const [pageDrivers,    setPageDrivers]    = useState(0);
  const [pageRequests,   setPageRequests]   = useState(0);

  const Pagination = ({ page, setPage, total }) => {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage(p => p - 1)} disabled={page === 0}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: page === 0 ? 'var(--surface-2)' : 'var(--surface)', color: page === 0 ? 'var(--text-3)' : 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
          >← Prev</button>
          <button
            onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: page >= totalPages - 1 ? 'var(--surface-2)' : 'var(--surface)', color: page >= totalPages - 1 ? 'var(--text-3)' : 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
          >Next →</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const bUnsub = onSnapshot(
      query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100)),
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); }
    );
    const uUnsub = onSnapshot(
      query(collection(db, 'users'), limit(100)),
      snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const pUnsub = onSnapshot(
      query(collection(db, 'payments'), limit(200)),
      snap => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const vUnsub = onSnapshot(
      collection(db, 'vehicles'),
      snap => setVehicles(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, plateNo: data.plateNo || data.plate || '' };
      }))
    );
    return () => { bUnsub(); uUnsub(); pUnsub(); vUnsub(); };
  }, []);

  const handleVehicleRequest = async (vehicle, action) => {
    try {
      if (action === 'approve') {
        if (vehicle.status === 'pending_add') {
          // Approved vehicle addition → make it inactive (ready to be set active by driver)
          await updateDoc(doc(db, 'vehicles', vehicle.id), { status: 'inactive', adminStatus: 'approved', adminProcessedAt: new Date().toISOString() });
        } else {
          // Approved vehicle deletion → soft delete so history is preserved
          await updateDoc(doc(db, 'vehicles', vehicle.id), { status: 'deleted', adminStatus: 'approved', adminProcessedAt: new Date().toISOString() });
        }
      } else {
        if (vehicle.status === 'pending_add') {
          await updateDoc(doc(db, 'vehicles', vehicle.id), { status: 'rejected', adminStatus: 'rejected', adminProcessedAt: new Date().toISOString() });
        } else {
          // Rejected vehicle deletion → restore to inactive
          await updateDoc(doc(db, 'vehicles', vehicle.id), { status: 'inactive', adminStatus: 'rejected', adminProcessedAt: new Date().toISOString() });
        }
      }
      const driverUser = users.find(u => u.user_id === vehicle.driverId || u.id === vehicle.driverId);
      if (driverUser) {
        const isAdd = vehicle.status === 'pending_add';
        const notif = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          read: false,
          title: action === 'approve'
            ? (isAdd ? 'Vehicle Approved' : 'Vehicle Removal Approved')
            : (isAdd ? 'Vehicle Rejected' : 'Vehicle Removal Rejected'),
          message: action === 'approve'
            ? (isAdd
                ? `Your vehicle ${vehicle.plateNo} (${vehicle.type}) has been approved and added to your fleet.`
                : `Your request to remove ${vehicle.plateNo} has been approved.`)
            : (isAdd
                ? `Your vehicle registration for ${vehicle.plateNo} was rejected. Please review your details and reapply.`
                : `Your request to remove ${vehicle.plateNo} was rejected.`),
        };
        await updateDoc(doc(db, 'users', driverUser.id), { notifications: arrayUnion(notif) });
      }
      showToast(action === 'approve' ? 'Vehicle request approved.' : 'Vehicle request rejected.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Action failed. Please try again.', 'error');
    }
  };

  const handleRequest = async (userId, type, action, details) => {
    try {
      const updates = {};
      const newNotification = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      if (type === 'driver_application') {
        if (action === 'approve') {
          // Assign a random fixed location within Metro Cebu bounds
          const randLat = 10.2500 + Math.random() * (10.4000 - 10.2500); // ~10.25 to 10.40 lat
          const randLng = 123.8200 + Math.random() * (124.0200 - 123.8200); // ~123.82 to 124.02 lng
          updates.role = 'driver';
          updates.driverApplicationStatus = 'approved';
          updates.vehicle_type  = details.vehicleType;
          updates.vehicle_plate = details.plateNo;
          updates.vehicleType   = details.vehicleType;  // Android compatibility
          updates.vehiclePlate  = details.plateNo;       // Android compatibility
          updates.accountStatus = 'active';
          updates.assignedLat = parseFloat(randLat.toFixed(6));
          updates.assignedLng = parseFloat(randLng.toFixed(6));
          // Create the vehicle document so it appears on the driver's Vehicles page
          await addDoc(collection(db, 'vehicles'), {
            driverId:        userId,
            type:            details.vehicleType,
            plateNo:         details.plateNo,
            year:            details.year || null,
            insuranceExpiry: details.insuranceExpiry || null,
            status:          'inactive',
            adminStatus:     'approved',
            adminProcessedAt: new Date().toISOString(),
            createdAt:       serverTimestamp(),
          });
          newNotification.title = 'Application Approved';
          newNotification.message = 'Congratulations! Your driver application has been approved. You can now accept deliveries.';
        } else {
          updates.driverApplicationStatus = 'rejected';
          newNotification.title = 'Application Rejected';
          newNotification.message = 'Your driver application has been rejected.';
        }
      } else if (type === 'deactivation') {
        updates.accountStatus = action === 'approve' ? 'deactivated' : 'active';
        updates.deactivationRequestStatus = action === 'approve' ? 'approved' : 'rejected';
        newNotification.title = action === 'approve' ? 'Deactivation Approved' : 'Deactivation Rejected';
        newNotification.message = action === 'approve'
          ? 'Your account has been successfully deactivated.'
          : 'Your request to deactivate your account was rejected.';
      } else if (type === 'reactivation') {
        updates.accountStatus = action === 'approve' ? 'active' : 'deactivated';
        updates.reactivationRequestStatus = action === 'approve' ? 'approved' : 'rejected';
        newNotification.title = action === 'approve' ? 'Reactivation Approved' : 'Reactivation Rejected';
        newNotification.message = action === 'approve'
          ? 'Your account has been successfully reactivated. Welcome back!'
          : 'Your request to reactivate your account was rejected.';
      }

      updates.notifications = arrayUnion(newNotification);
      await updateDoc(doc(db, 'users', userId), updates);
      showToast(action === 'approve' ? 'Request approved.' : 'Request rejected.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Action failed. Please try again.', 'error');
    }
  };

  const getRequests = (statusFilter) => {
    const userRequests = [];
    users.forEach(u => {
      if (statusFilter === 'pending') {
        if (u.driverApplicationStatus === 'pending') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'driver_application' });
        if (u.accountStatus === 'pending_deactivation') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'deactivation' });
        if (u.accountStatus === 'pending_reactivation') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'reactivation' });
      } else if (statusFilter === 'approved') {
        if (u.driverApplicationStatus === 'approved') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'driver_application' });
        if (u.deactivationRequestStatus === 'approved') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'deactivation' });
        if (u.reactivationRequestStatus === 'approved') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'reactivation' });
      } else if (statusFilter === 'rejected') {
        if (u.driverApplicationStatus === 'rejected') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'driver_application' });
        if (u.deactivationRequestStatus === 'rejected') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'deactivation' });
        if (u.reactivationRequestStatus === 'rejected') userRequests.push({ ...u, _itemType: 'user', _typeKey: 'reactivation' });
      }
    });

    const vehicleRequests = vehicles
      .filter(v => {
        if (statusFilter === 'pending') return v.status === 'pending_add' || v.status === 'pending_delete';
        if (statusFilter === 'approved') return v.adminStatus === 'approved';
        if (statusFilter === 'rejected') return v.adminStatus === 'rejected';
        return false;
      })
      .map(v => ({ ...v, _itemType: 'vehicle' }));

    return [...userRequests, ...vehicleRequests];
  };

  const ReviewRequestModal = () => {
    if (!reviewingUser) return null;
    const u = reviewingUser;
    const t = reviewingType;

    let title = '';
    let detailsUI = null;
    if (t === 'driver_application') {
      title = 'Review Driver Application';
      detailsUI = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
          <div><strong style={{ color: 'var(--text-2)' }}>Name:</strong> <span style={{ fontWeight: 600 }}>{u.full_name}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Email:</strong> <span style={{ fontWeight: 600 }}>{u.email}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Vehicle Type:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{u.driverApplicationDetails?.vehicleType}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Plate Number:</strong> <span style={{ fontWeight: 600 }}>{u.driverApplicationDetails?.plateNo}</span></div>
          {u.driverApplicationDetails?.year && <div><strong style={{ color: 'var(--text-2)' }}>Vehicle Year:</strong> <span style={{ fontWeight: 600 }}>{u.driverApplicationDetails.year}</span></div>}
          {u.driverApplicationDetails?.insuranceExpiry && <div><strong style={{ color: 'var(--text-2)' }}>Insurance Expiry:</strong> <span style={{ fontWeight: 600 }}>{u.driverApplicationDetails.insuranceExpiry}</span></div>}
          <div><strong style={{ color: 'var(--text-2)' }}>License Number:</strong> <span style={{ fontWeight: 600 }}>{u.driverApplicationDetails?.licenseNo}</span></div>
          
          <div style={{ marginTop: '8px', color: 'var(--text-2)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>Documents Submitted</div>
          <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileTextIcon size={18} color="var(--text-3)" /> Driver's License Photo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}><FileTextIcon size={18} color="var(--text-3)" /> Selfie with ID</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}><FileTextIcon size={18} color="var(--text-3)" /> Vehicle OR/CR</div>
          </div>
        </div>
      );
    } else if (t === 'deactivation') {
      title = 'Review Deactivation Request';
      detailsUI = <div style={{ marginBottom: '24px', textAlign: 'left', lineHeight: 1.6, color: 'var(--text-2)' }}><span style={{ fontWeight: 700, color: 'var(--text)' }}>{u.full_name}</span> ({u.email}) is requesting to deactivate their driver account. They will not be able to accept any orders until reactivated.</div>;
    } else if (t === 'reactivation') {
      title = 'Review Reactivation Request';
      detailsUI = <div style={{ marginBottom: '24px', textAlign: 'left', lineHeight: 1.6, color: 'var(--text-2)' }}><span style={{ fontWeight: 700, color: 'var(--text)' }}>{u.full_name}</span> ({u.email}) is requesting to reactivate their driver account and resume accepting orders.</div>;
    } else if (t === 'vehicle_add') {
      const driver = users.find(d => d.user_id === u.driverId || d.id === u.driverId);
      title = 'Review Vehicle Registration';
      detailsUI = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
          <div><strong style={{ color: 'var(--text-2)' }}>Driver:</strong> <span style={{ fontWeight: 600 }}>{driver?.full_name || u.driverId}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Plate Number:</strong> <span style={{ fontWeight: 600 }}>{u.plateNo}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Vehicle Type:</strong> <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{u.type}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Year:</strong> <span style={{ fontWeight: 600 }}>{u.year}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Insurance Expiry:</strong> <span style={{ fontWeight: 600 }}>{u.insuranceExpiry}</span></div>
        </div>
      );
    } else if (t === 'vehicle_delete') {
      const driver = users.find(d => d.user_id === u.driverId || d.id === u.driverId);
      title = 'Review Vehicle Removal';
      detailsUI = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
          <div><strong style={{ color: 'var(--text-2)' }}>Driver:</strong> <span style={{ fontWeight: 600 }}>{driver?.full_name || u.driverId}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Plate Number:</strong> <span style={{ fontWeight: 600 }}>{u.plateNo}</span></div>
          <div><strong style={{ color: 'var(--text-2)' }}>Vehicle Type:</strong> <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{u.type}</span></div>
          <div style={{ padding: '10px 14px', background: 'var(--red-light)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
            This driver is requesting to permanently remove this vehicle from their fleet.
          </div>
        </div>
      );
    }

    const isVehicleRequest = t === 'vehicle_add' || t === 'vehicle_delete';

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setReviewingUser(null)}>
        <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.2s ease', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>{title}</h2>
          {detailsUI}

          {activeRequestTab === 'pending' ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { isVehicleRequest ? handleVehicleRequest(u, 'reject') : handleRequest(u.id, t, 'reject', u.driverApplicationDetails); setReviewingUser(null); }} className="btn btn-secondary" style={{ flex: 1, color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}>Reject</button>
              <button onClick={() => { isVehicleRequest ? handleVehicleRequest(u, 'approve') : handleRequest(u.id, t, 'approve', u.driverApplicationDetails); setReviewingUser(null); }} className="btn btn-primary" style={{ flex: 1 }}>Approve</button>
            </div>
          ) : (
            <button onClick={() => setReviewingUser(null)} className="btn btn-secondary btn-full">Close Details</button>
          )}
        </div>
      </div>
    );
  };
  const stats = {
    customers: users.filter(u => u.role === 'customer').length,
    drivers:   users.filter(u => u.role === 'driver').length,
    total:     bookings.length,
    active:    bookings.filter(b => !['delivered','completed','cancelled'].includes(b.status)).length,
    revenue:    bookings.filter(b => ['delivered','completed'].includes(b.status)).reduce((s, b) => s + (b.totalAmount || 0), 0),
    cancelled:  bookings.filter(b => b.status === 'cancelled').length,
    commission: payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.platformComm || 0), 0),
  };

  const formatDate = ts => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const STAT_CARDS = [
    { label: 'Customers',   value: stats.customers, Icon: UsersIcon,      cls: 'green'  },
    { label: 'Drivers',     value: stats.drivers,   Icon: MotorcycleIcon,  cls: 'blue'   },
    { label: 'Total Orders',value: stats.total,     Icon: PackageIcon,     cls: 'purple' },
    { label: 'Cancelled',   value: stats.cancelled, Icon: XCircleIcon,    cls: 'green'  },
    { label: 'Commission',  value: `₱${stats.commission.toLocaleString()}`,   Icon: BanknoteIcon,   cls: 'amber'  },
  ];

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', alignItems: 'start' }}>
      
      {/* Sidebar */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', position: 'sticky', top: '100px', height: 'calc(100vh - 140px)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>Admin Menu</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {[
            ['overview', 'Overview', ActivityIcon],
            ['bookings', 'All Bookings', PackageIcon],
            ['customers', 'Customers', UsersIcon],
            ['drivers', 'Drivers', MotorcycleIcon],
            ['requests', 'Requests', FileTextIcon]
          ].map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: tab === val ? 'var(--primary-light)' : 'transparent',
                border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                color: tab === val ? 'var(--primary)' : 'var(--text-2)', textAlign: 'left', transition: 'var(--transition)'
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
        
        {/* Admin Info & Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
              {(auth.currentUser?.displayName || 'A')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {auth.currentUser?.displayName || 'Grab Admin'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {auth.currentUser?.email || 'admin@grabexpress.com'}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px 16px', background: 'var(--red-light)',
              color: 'var(--red)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--red-light)'}
          >
            <LogOutIcon size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-container" style={{ margin: 0, padding: 0, maxWidth: 'none' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: 'var(--radius-xl)', padding: '32px', color: 'white', marginBottom: '28px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Panel</div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, marginTop: '6px' }}>GrabExpress Dashboard</h1>
            </div>
            <div style={{ background: 'rgba(0,177,79,0.15)', border: '1px solid rgba(0,177,79,0.3)', borderRadius: 'var(--radius-md)', padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#4ADE80' }}>₱{stats.revenue.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Total Revenue</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '28px' }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={28} />
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-2 gap-20">
          {/* Recent Bookings */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Bookings</h3>
              <button onClick={() => setTab('bookings')} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
            </div>
            {loading ? <div style={{ padding: '20px', color: 'var(--text-3)' }}>Loading…</div> : (
              bookings.slice(0, 8).map(b => {
                const cfg = STATUS_CONFIG[b.status] || { badge: 'badge-gray', label: b.status };
                return (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>{b.pickupAddress}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>→ {b.deliveryAddress?.substring(0, 40)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px' }}>₱{Number(b.totalAmount).toFixed(2)}</div>
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Users breakdown */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>User Breakdown</h3>
            </div>
            {['customer','driver','admin'].map(role => {
              const count = users.filter(u => u.role === role).length;
              const pct   = users.length ? Math.round(count / users.length * 100) : 0;
              const colors = { customer: 'var(--primary)', driver: 'var(--blue)', admin: 'var(--red)' };
              return (
                <div key={role} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                  <div className="flex justify-between mb-8">
                    <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>{role}s</span>
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[role], borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}

            {/* Status breakdown */}
            <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '12px' }}>Order Status Split</div>
              {(() => {
                const total = bookings.length || 1;
                const barColors = {
                  completed: 'var(--primary)', delivered: 'var(--primary)',
                  cancelled: 'var(--red)',
                  searching: '#F59E0B',
                  accepted: 'var(--blue)', in_transit: 'var(--blue)', picked_up: 'var(--blue)',
                };
                return Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                  const count = bookings.filter(b => b.status === status).length;
                  if (!count) return null;
                  const pct = Math.round((count / total) * 100);
                  const barColor = barColors[status] || 'var(--text-3)';
                  return (
                    <div key={status} style={{ marginBottom: '10px' }}>
                      <div className="flex justify-between" style={{ marginBottom: '4px' }}>
                        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tab: All Bookings */}
      {tab === 'bookings' && (() => {
        const filteredBookings = bookings.filter(b => {
          if (filterBookings === 'all') return true;
          if (filterBookings === 'searching') return b.status === 'searching';
          if (filterBookings === 'accepted') return b.status === 'accepted';
          if (filterBookings === 'in_transit') return ['picked_up', 'in_transit'].includes(b.status);
          if (filterBookings === 'completed') return ['delivered', 'completed'].includes(b.status);
          if (filterBookings === 'cancelled') return b.status === 'cancelled';
          return true;
        });
        const pagedBookings = filteredBookings.slice(pageBookings * PAGE_SIZE, (pageBookings + 1) * PAGE_SIZE);
        return (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Filter:</span>
              <select value={filterBookings} onChange={e => { setFilterBookings(e.target.value); setPageBookings(0); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: '13px', fontWeight: 600, color: 'var(--text)', outline: 'none' }}>
                <option value="all">All Bookings</option>
                <option value="searching">Searching</option>
                <option value="accepted">Accepted</option>
                <option value="in_transit">In Transit / Picked Up</option>
                <option value="completed">Completed / Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }}>Loading…</td></tr>
                ) : pagedBookings.map(b => {
                const cfg = STATUS_CONFIG[b.status] || { badge: 'badge-gray', label: b.status };
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>#{b.id.slice(-8).toUpperCase()}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.pickupAddress}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.deliveryAddress}</td>
                    <td style={{ textTransform: 'capitalize' }}>{b.vehicleType}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₱{Number(b.totalAmount).toFixed(2)}</td>
                    <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{formatDate(b.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={pageBookings} setPage={setPageBookings} total={filteredBookings.length} />
        </div>
        );
      })()}

      {/* Tab: Customers */}
      {tab === 'customers' && (() => {
        const customers = users.filter(u => u.role === 'customer');
        const filteredCustomers = customers.filter(c =>
          (c.full_name || '').toLowerCase().includes(filterCustomerSearch.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(filterCustomerSearch.toLowerCase())
        );
        const pagedCustomers = filteredCustomers.slice(pageCustomers * PAGE_SIZE, (pageCustomers + 1) * PAGE_SIZE);
        return (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Search:</span>
              <input type="text" placeholder="Search by name or email..." value={filterCustomerSearch} onChange={e => { setFilterCustomerSearch(e.target.value); setPageCustomers(0); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: '13px', color: 'var(--text)', outline: 'none', width: '250px' }} />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }}>No customers found</td></tr>
                ) : pagedCustomers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.full_name || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '13px' }}>{u.email}</td>
                    <td><span className="badge badge-green">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={pageCustomers} setPage={setPageCustomers} total={filteredCustomers.length} />
          </div>
        );
      })()}

      {/* Tab: Drivers */}
      {tab === 'drivers' && (() => {
        const drivers = users.filter(u => u.role === 'driver');
        const filteredDrivers = drivers.filter(d => {
          if (filterDriverStatus === 'all') return true;
          const status = d.accountStatus || 'active';
          return status === filterDriverStatus;
        });
        const pagedDrivers = filteredDrivers.slice(pageDrivers * PAGE_SIZE, (pageDrivers + 1) * PAGE_SIZE);
        return (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Filter:</span>
              <select value={filterDriverStatus} onChange={e => { setFilterDriverStatus(e.target.value); setPageDrivers(0); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: '13px', fontWeight: 600, color: 'var(--text)', outline: 'none' }}>
                <option value="all">All Drivers</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="pending_deactivation">Pending Deactivation</option>
                <option value="pending_reactivation">Pending Reactivation</option>
              </select>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedDrivers.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }}>No drivers found</td></tr>
                ) : pagedDrivers.map(u => {
                  const status = u.accountStatus || 'active';
                  const badgeCls = status === 'deactivated' ? 'badge-red' : status.startsWith('pending') ? 'badge-amber' : 'badge-blue';
                  const displayStatus = status === 'deactivated' ? 'Deactivated' : status.startsWith('pending') ? 'Pending' : 'Active';
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>{u.full_name || '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: '13px' }}>{u.email}</td>
                      <td><span className={`badge ${badgeCls}`}>{displayStatus}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={pageDrivers} setPage={setPageDrivers} total={filteredDrivers.length} />
          </div>
        );
      })()}

      {/* Tab: Requests */}
      {tab === 'requests' && (() => {
        const rawReqs = getRequests(activeRequestTab);
        const filteredReqs = rawReqs.filter(r => {
          if (filterRequestType === 'all') return true;
          let type = '';
          if (r._itemType === 'vehicle') type = r._typeKey || (r.status === 'pending_add' ? 'vehicle_add' : 'vehicle_delete');
          else type = r._typeKey || '';
          return type === filterRequestType;
        });
        const pagedReqs = filteredReqs.slice(pageRequests * PAGE_SIZE, (pageRequests + 1) * PAGE_SIZE);

        return (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['pending', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => { setActiveRequestTab(status); setPageRequests(0); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
                    color: activeRequestTab === status ? 'var(--primary)' : 'var(--text-3)',
                    transition: 'color 0.2s'
                  }}
                >
                  {status} ({getRequests(status).length})
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Type:</span>
              <select value={filterRequestType} onChange={e => setFilterRequestType(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: '13px', fontWeight: 600, color: 'var(--text)', outline: 'none' }}>
                <option value="all">All Types</option>
                <option value="driver_application">Driver Application</option>
                <option value="deactivation">Account Deactivation</option>
                <option value="reactivation">Account Reactivation</option>
                <option value="vehicle_add">Vehicle Registration</option>
                <option value="vehicle_delete">Vehicle Removal</option>
              </select>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Request Type</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedReqs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>No {activeRequestTab} requests for selected type</td></tr>
              ) : pagedReqs.map(item => {
                let reqType = '';
                let details = '';
                let typeKey = '';
                let displayName = '';
                let displaySub = '';

                if (item._itemType === 'vehicle') {
                  const driver = users.find(u => u.user_id === item.driverId || u.id === item.driverId);
                  displayName = driver?.full_name || 'Unknown Driver';
                  displaySub = driver?.email || item.driverId;
                  typeKey = item._typeKey || (item.status === 'pending_add' ? 'vehicle_add' : 'vehicle_delete');
                  reqType = typeKey === 'vehicle_add' ? 'Vehicle Registration' : 'Vehicle Removal';
                  details = `${item.plateNo} — ${item.type}${item.year ? ` (${item.year})` : ''}`;
                } else {
                  displayName = item.full_name || '—';
                  displaySub = item.email;
                  typeKey = item._typeKey || '';
                  if (typeKey === 'driver_application') {
                    reqType = 'Driver Application';
                    const vType = item.driverApplicationDetails?.vehicleType;
                    const plate = item.driverApplicationDetails?.plateNo;
                    details = [vType && vType.charAt(0).toUpperCase() + vType.slice(1), plate].filter(Boolean).join(' · ');
                  } else if (typeKey === 'deactivation') {
                    reqType = 'Account Deactivation';
                    details = 'Account deactivation request';
                  } else if (typeKey === 'reactivation') {
                    reqType = 'Account Reactivation';
                    details = 'Account reactivation request';
                  }
                }

                let badgeCls = 'badge-amber';
                if (activeRequestTab === 'approved') badgeCls = 'badge-green';
                if (activeRequestTab === 'rejected') badgeCls = 'badge-red';

                return (
                  <tr key={`${item.id}-${typeKey}`}>
                    <td style={{ fontWeight: 700 }}>
                      <div>{displayName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>{displaySub}</div>
                    </td>
                    <td><span className={`badge ${badgeCls}`}>{reqType}</span></td>
                    <td style={{ maxWidth: '300px', fontSize: '13px', color: 'var(--text-2)' }}>{details}</td>
                    <td>
                      <button
                        onClick={() => { setReviewingUser(item); setReviewingType(typeKey); }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px' }}
                      >
                        {activeRequestTab === 'pending' ? 'Review Request' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={pageRequests} setPage={setPageRequests} total={filteredReqs.length} />
        </div>
        );
      })()}

      </div>
    </div>
    
    {/* Render the modal outside of dashboard-container so it isn't constrained by its CSS transform/animations */}
    <ReviewRequestModal />
    </>
  );
}

export default AdminDashboard;
