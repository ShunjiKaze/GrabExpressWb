import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking, vehicleForSize } from '../../context/BookingContext';
import StepBar from '../../components/StepBar';
import ProhibitedModal from '../../components/ProhibitedModal';
import { BanIcon, CameraIcon, CheckCircleIcon, ShieldIcon, ShieldCheckIcon, CrownIcon,
         MotorcycleIcon, CarIcon, VanIcon, PackageIcon,
         DocumentIcon, FoodIcon, ShirtIcon, LaptopIcon, FrameIcon, HeartPulseIcon } from '../../components/Icons';

const STEPS = ['Address', 'Details', 'Item', 'Review'];

const SIZES = [
  { id: 'S',  Icon: DocumentIcon, title: 'Small',  desc: 'Small parcel',      weight: '1 – 5 kg',   minKg: 1,  maxKg: 5,  vehicle: 'motorcycle' },
  { id: 'M',  Icon: PackageIcon,  title: 'Medium', desc: 'Shoebox to bag',    weight: '6 – 15 kg',  minKg: 6,  maxKg: 15, vehicle: 'car' },
  { id: 'L',  Icon: PackageIcon,  title: 'Large',  desc: 'Luggage / box',     weight: '16 – 30 kg', minKg: 16, maxKg: 30, vehicle: 'van' },
  { id: 'XL', Icon: VanIcon,      title: 'XL',     desc: 'Oversized / bulky', weight: '31 – 50 kg', minKg: 31, maxKg: 50, vehicle: 'van' },
];

const ITEM_TYPES = [
  { id: 'Document',    Icon: DocumentIcon  },
  { id: 'Food',        Icon: FoodIcon      },
  { id: 'Clothing',    Icon: ShirtIcon     },
  { id: 'Electronics', Icon: LaptopIcon    },
  { id: 'Fragile',     Icon: FrameIcon     },
  { id: 'Medical',     Icon: HeartPulseIcon},
  { id: 'Others',      Icon: PackageIcon   },
];

const TIERS = [
  { id: 'Basic',    Icon: ShieldIcon,      title: 'Basic',    coverage: 'No extra coverage',  add: 0,   color: 'var(--text-3)' },
  { id: 'Standard', Icon: ShieldCheckIcon, title: 'Standard', coverage: 'Up to ₱3,000',       add: 50,  color: 'var(--blue)' },
  { id: 'Premium',  Icon: CrownIcon,       title: 'Premium',  coverage: 'Up to ₱10,000',      add: 100, color: 'var(--amber)' },
];

const VEHICLE_LABEL = { motorcycle: 'Motorcycle', car: 'Car', van: 'Van' };
const VEHICLE_ICON  = { motorcycle: MotorcycleIcon, car: CarIcon, van: VanIcon };

function ItemDetailsStep() {
  const navigate  = useNavigate();
  const { bookingData, updateBooking } = useBooking();
  const [errors, setErrors]     = useState({});
  const [showProhibited, setShowProhibited] = useState(false);

  const handleSizeChange = (sizeId) => {
    updateBooking({ itemSize: sizeId, vehicleType: vehicleForSize(sizeId) });
  };

  const handleWeightInput = (e) => {
    let val = e.target.value;
    val = val.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] !== undefined && parts[1].length > 2) val = parts[0] + '.' + parts[1].slice(0, 2);
    updateBooking({ itemWeight: val });
    setErrors(prev => ({ ...prev, itemWeight: '' }));
  };

  const validate = () => {
    const e = {};
    const sizeInfo = SIZES.find(s => s.id === bookingData.itemSize);
    if (!bookingData.itemWeight) {
      e.itemWeight = 'Please enter the item weight.';
    } else {
      const n = parseFloat(bookingData.itemWeight);
      if (isNaN(n) || n <= 0) {
        e.itemWeight = 'Weight must be a positive number.';
      } else if (sizeInfo && n < sizeInfo.minKg) {
        e.itemWeight = `Too light for ${sizeInfo.title} (${sizeInfo.weight}). Choose a smaller size.`;
      } else if (sizeInfo && n > sizeInfo.maxKg) {
        e.itemWeight = `Too heavy for ${sizeInfo.title} (${sizeInfo.weight}). Choose a larger size.`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) navigate('/book/new/review');
  };

  const VehicleRecommendIcon = VEHICLE_ICON[bookingData.vehicleType] || CarIcon;

  return (
    <div className="dashboard-container" style={{ maxWidth: '680px' }}>
      {showProhibited && <ProhibitedModal onClose={() => setShowProhibited(false)} />}

      <div className="card" style={{ padding: '32px' }}>
        <StepBar steps={STEPS} currentStep={2} />

        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)' }}>Item Details</h2>
          <button
            onClick={() => setShowProhibited(true)}
            style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid #FECACA', padding: '6px 12px', borderRadius: 'var(--radius-sm)', font: 'inherit', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <BanIcon size={13} color="var(--red)" /> What's Prohibited?
          </button>
        </div>
        <p className="text-sm text-muted mb-24">Tell us about your package so we can recommend the right vehicle.</p>

        {/* Size */}
        <div className="form-group mb-20">
          <label className="form-label">Package Size <span className="req">*</span></label>
          <div className="option-grid option-grid-4">
            {SIZES.map(s => (
              <div
                key={s.id}
                className={`option-card${bookingData.itemSize === s.id ? ' selected' : ''}`}
                onClick={() => handleSizeChange(s.id)}
              >
                <div className="option-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon size={22} color={bookingData.itemSize === s.id ? 'var(--primary)' : 'var(--text-3)'} />
                </div>
                <div className="option-title">{s.title}</div>
                <div className="option-desc">{s.desc}</div>
                <div className="option-desc" style={{ marginTop: '2px' }}>{s.weight}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-recommend notice */}
        <div className="alert alert-info mb-20">
          <VehicleRecommendIcon size={16} />
          <span>
            Size <strong>{bookingData.itemSize}</strong> → a <strong>{VEHICLE_LABEL[bookingData.vehicleType]}</strong> will be assigned for this delivery.
          </span>
        </div>

        {/* Weight */}
        <div className="form-group mb-20">
          <label className="form-label">Item Weight <span className="req">*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              placeholder="e.g. 1.5"
              value={bookingData.itemWeight}
              onChange={handleWeightInput}
              inputMode="decimal"
              style={{
                paddingRight: '52px',
                borderColor: errors.itemWeight ? 'var(--red)' : undefined,
              }}
            />
            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '13px', fontWeight: 600, pointerEvents: 'none' }}>kg</span>
          </div>
          {errors.itemWeight
            ? <span style={{ fontSize: '12px', color: 'var(--red)', marginTop: '3px', display: 'block' }}>{errors.itemWeight}</span>
            : <span className="text-xs text-muted">{SIZES.find(s => s.id === bookingData.itemSize)?.weight} for {SIZES.find(s => s.id === bookingData.itemSize)?.title}. Decimals allowed (e.g. 1.5)</span>
          }
        </div>

        {/* Item Type */}
        <div className="form-group mb-20">
          <label className="form-label">Item Type <span className="req">*</span></label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {ITEM_TYPES.map(t => {
              const selected = bookingData.itemType === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => updateBooking({ itemType: t.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px',
                    borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    border: selected ? '2px solid var(--primary)' : '2px solid var(--border)',
                    background: selected ? 'var(--primary-light)' : 'var(--surface)',
                    color: selected ? 'var(--primary)' : 'var(--text-2)',
                    transition: 'var(--transition)',
                  }}
                >
                  <t.Icon size={14} color={selected ? 'var(--primary)' : 'var(--text-3)'} /> {t.id}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo */}
        <div className="form-group mb-20">
          <label className="form-label">Item Photo <span className="opt">(optional)</span></label>
          <div
            onClick={() => updateBooking({ itemPhotoTaken: !bookingData.itemPhotoTaken })}
            style={{
              border: `2px dashed ${bookingData.itemPhotoTaken ? 'var(--primary)' : 'var(--border)'}`,
              background: bookingData.itemPhotoTaken ? 'var(--primary-light)' : 'var(--surface-2)',
              borderRadius: 'var(--radius-md)', padding: '28px', textAlign: 'center',
              cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              {bookingData.itemPhotoTaken
                ? <CheckCircleIcon size={36} color="var(--primary)" />
                : <CameraIcon size={36} color="var(--text-3)" />
              }
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: bookingData.itemPhotoTaken ? 'var(--primary)' : 'var(--text-2)' }}>
              {bookingData.itemPhotoTaken ? 'Photo confirmed' : 'Click to add item photo'}
            </div>
            <div className="text-xs text-muted mt-4">Proof of item contents for your protection</div>
          </div>
        </div>

        {/* Guarantee Tier */}
        <div className="form-group mb-24">
          <label className="form-label">Delivery Guarantee <span className="req">*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TIERS.map(tier => (
              <div
                key={tier.id}
                className={`tier-card${bookingData.guaranteeTier === tier.id ? ' selected' : ''}`}
                onClick={() => updateBooking({ guaranteeTier: tier.id })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-12">
                    <tier.Icon size={22} color={bookingData.guaranteeTier === tier.id ? tier.color : 'var(--text-3)'} />
                    <div>
                      <div className="tier-title" style={{ color: tier.color }}>{tier.title}</div>
                      <div className="tier-coverage">{tier.coverage}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tier-price">{tier.add === 0 ? 'Free' : `+₱${tier.add}`}</div>
                    {bookingData.guaranteeTier === tier.id && <CheckCircleIcon size={16} color="var(--primary)" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-12">
          <button onClick={() => navigate('/book/new/details')} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
          <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>Review Order →</button>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailsStep;
