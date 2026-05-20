import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckIcon, CameraIcon, CheckCircleIcon, XIcon } from './Icons';
import { useToast } from './Toast';

function formatPlateInput(type, val) {
  let cleaned = val.replace(/\s+/g, '').toUpperCase();
  if (type === 'motorcycle') {
    if (cleaned.length > 3) return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
  } else {
    if (cleaned.length > 3) return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 7);
  }
  return cleaned;
}

function formatLicenseInput(val) {
  let cleaned = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length > 3 && cleaned.length <= 5) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else if (cleaned.length > 5) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 11)}`;
  }
  return cleaned;
}

function PhotoCaptureModal({ onCapture, onClose, label, desc }) {
  const [captured, setCaptured] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', textAlign: 'center', animation: 'fadeInUp 0.2s ease', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--navy)' }}>{label}</div>
           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}><XIcon size={18} color="var(--text-2)" /></button>
        </div>
        <div
          onClick={() => setCaptured(true)}
          style={{
            border: `3px dashed ${captured ? 'var(--primary)' : 'var(--border)'}`,
            background: captured ? 'var(--primary-light)' : 'var(--surface-2)',
            borderRadius: 'var(--radius-lg)', padding: '40px 24px',
            cursor: 'pointer', marginBottom: '20px', transition: 'var(--transition)'
          }}
        >
          {captured ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><CheckCircleIcon size={52} color="var(--primary)" /></div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--primary)' }}>Photo Taken!</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>Tap again to retake</div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><CameraIcon size={52} color="var(--text-3)" /></div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-2)' }}>Tap to Take Photo</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>{desc}</div>
            </>
          )}
        </div>
        <button
          onClick={() => { if(captured) onCapture(); }}
          className={`btn btn-full btn-lg ${captured ? 'btn-primary' : 'btn-secondary'}`}
          disabled={!captured}
        >
          {captured ? 'Confirm & Use Photo' : 'Take Photo First'}
        </button>
      </div>
    </div>
  );
}


function DriverRegistrationModal({ userId, existingPhone, onSuccess, onClose }) {
  const [appForm, setAppForm] = useState({ licenseNo: '', vehicleType: 'motorcycle', plateNo: '', licenseUploaded: false, selfieUploaded: false, orcrUploaded: false });
  const [saving, setSaving] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState(null); // 'license' | 'selfie' | 'orcr'
  const showToast = useToast();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handlePhotoCapture = () => {
    setAppForm(prev => ({ ...prev, [`${activePhotoModal}Uploaded`]: true }));
    setActivePhotoModal(null);
    showToast('Photo uploaded successfully!', 'success');
  };

  const submitDriverApplication = async () => {
    if (!appForm.licenseNo || !appForm.plateNo) { showToast('Please fill in all text fields.', 'error'); return; }
    if (!appForm.licenseUploaded || !appForm.selfieUploaded || !appForm.orcrUploaded) { showToast('Please upload all required photos.', 'error'); return; }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        driverApplicationStatus: 'pending',
        driverApplicationDetails: {
          licenseNo: appForm.licenseNo,
          vehicleType: appForm.vehicleType,
          plateNo: appForm.plateNo,
        }
      });
      showToast('Driver application submitted successfully!', 'success');
      onSuccess();
    } catch(err) {
      console.error(err);
      showToast('Failed to submit application.', 'error');
    }
    setSaving(false);
  };

  return (
    <>
      {activePhotoModal === 'license' && <PhotoCaptureModal label="Driver's License Photo" desc="Clear photo of the front of your license" onCapture={handlePhotoCapture} onClose={() => setActivePhotoModal(null)} />}
      {activePhotoModal === 'selfie' && <PhotoCaptureModal label="Selfie with ID" desc="Selfie holding your license" onCapture={handlePhotoCapture} onClose={() => setActivePhotoModal(null)} />}
      {activePhotoModal === 'orcr' && <PhotoCaptureModal label="Vehicle OR/CR" desc="Official Receipt & Certificate of Registration" onCapture={handlePhotoCapture} onClose={() => setActivePhotoModal(null)} />}

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
        <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.2s ease', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>Driver Application</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>Submit your details and simulate photo uploads of your documents.</p>

          <div className="form-group mb-16">
            <label className="form-label">Driver's License Number</label>
            <input className="form-input" placeholder="e.g. N01-12-123456" value={appForm.licenseNo} onChange={e => setAppForm({...appForm, licenseNo: formatLicenseInput(e.target.value)})} />
          </div>

          <div className="form-group mb-16">
            <label className="form-label">Vehicle Type</label>
            <select className="form-input" value={appForm.vehicleType} onChange={e => setAppForm({...appForm, vehicleType: e.target.value, plateNo: ''})} style={{ color: 'var(--text)', background: 'var(--surface)' }}>
              <option value="motorcycle" style={{ color: 'black', background: 'white' }}>Motorcycle</option>
              <option value="car" style={{ color: 'black', background: 'white' }}>Car</option>
              <option value="van" style={{ color: 'black', background: 'white' }}>Van</option>
            </select>
          </div>

          <div className="form-group mb-16">
            <label className="form-label">Vehicle Plate Number</label>
            <input className="form-input" placeholder="e.g. 123 ABC" value={appForm.plateNo} onChange={e => setAppForm({...appForm, plateNo: formatPlateInput(appForm.vehicleType, e.target.value)})} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Driver's License Photo</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Clear photo of the front of your license</div>
              </div>
              {appForm.licenseUploaded ? <CheckIcon size={20} color="var(--primary)" /> : <button onClick={() => setActivePhotoModal('license')} className="btn btn-secondary btn-sm">Upload a photo</button>}
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Selfie with ID</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Selfie holding your license</div>
              </div>
              {appForm.selfieUploaded ? <CheckIcon size={20} color="var(--primary)" /> : <button onClick={() => setActivePhotoModal('selfie')} className="btn btn-secondary btn-sm">Upload a photo</button>}
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Vehicle OR/CR</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Official Receipt & Certificate of Registration</div>
              </div>
              {appForm.orcrUploaded ? <CheckIcon size={20} color="var(--primary)" /> : <button onClick={() => setActivePhotoModal('orcr')} className="btn btn-secondary btn-sm">Upload a photo</button>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={submitDriverApplication} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DriverRegistrationModal;
