import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import StepBar from '../../components/StepBar';
import { MapPinIcon, FlagIcon } from '../../components/Icons';
import MapModal from '../../components/MapModal';

const STEPS = ['Address', 'Details', 'Item', 'Review'];

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Debounce helper
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

// Build a clean one-line address string from a Photon feature's properties
function formatPhotonAddress(p) {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const parts  = [
    p.name,
    street || null,
    p.district || p.suburb || null,
    p.city || p.town || p.village || null,
    p.state || null,
    p.country || null,
  ].filter(Boolean);
  // deduplicate (e.g. name === city)
  const seen = new Set();
  return parts.filter(v => { if (seen.has(v)) return false; seen.add(v); return true; }).join(', ');
}

// Photon autocomplete hook (Komoot Photon — free, OSM-based, browser-friendly, no API key)
function usePhoton(query) {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const abortRef                = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 3) { setResults([]); setSearchFailed(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setSearchFailed(false);
    try {
      // Cebu bounding box: SW lon, SW lat, NE lon, NE lat
      const url = `https://photon.komoot.io/api/?` + new URLSearchParams({
        q,
        limit: 6,
        bbox:  '123.30,9.80,124.10,11.35',
        lang:  'en',
      });
      const res  = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Normalise to the same shape AddressStep already expects
      const normalised = (data.features || []).map(f => ({
        place_id:     f.properties.osm_id,
        display_name: formatPhotonAddress(f.properties),
        lat:          String(f.geometry.coordinates[1]),
        lon:          String(f.geometry.coordinates[0]),
      }));
      setResults(normalised);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Photon search error:', err);
        setSearchFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return { results, loading, searchFailed };
}

function AddressStep() {
  const navigate = useNavigate();
  const { bookingData, updateBooking } = useBooking();
  const [focused, setFocused] = useState(null);
  const [errors, setErrors]   = useState({});
  const [activeMapModal, setActiveMapModal] = useState(null); // 'pickup' | 'delivery' | null
  const pickupRef   = useRef(null);
  const deliveryRef = useRef(null);

  // Track raw typed text separately for Nominatim queries
  const [pickupQuery,   setPickupQuery]   = useState(bookingData.pickupAddress   || '');
  const [deliveryQuery, setDeliveryQuery] = useState(bookingData.deliveryAddress || '');

  const { results: pickupResults,   loading: pickupLoading,   searchFailed: pickupFailed   } = usePhoton(focused === 'pickup'   ? pickupQuery   : '');
  const { results: deliveryResults, loading: deliveryLoading, searchFailed: deliveryFailed } = usePhoton(focused === 'delivery' ? deliveryQuery : '');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickupRef.current   && !pickupRef.current.contains(e.target) &&
        deliveryRef.current && !deliveryRef.current.contains(e.target)
      ) {
        setFocused(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pickSuggestion = (field, item) => {
    const address = item.display_name;
    const lat     = parseFloat(item.lat);
    const lng     = parseFloat(item.lon);

    if (field === 'pickup') {
      setPickupQuery(address);
      updateBooking({ pickupAddress: address, pickupLat: lat, pickupLng: lng });
      setErrors(prev => ({ ...prev, pickup: '' }));
    } else {
      setDeliveryQuery(address);
      updateBooking({ deliveryAddress: address, deliveryLat: lat, deliveryLng: lng });
      setErrors(prev => ({ ...prev, delivery: '' }));
    }
    setFocused(null);
  };

  const handleMapConfirm = (locationData) => {
    if (activeMapModal === 'pickup') {
      setPickupQuery(locationData.address);
      updateBooking({ pickupAddress: locationData.address, pickupLat: locationData.lat, pickupLng: locationData.lng });
      setErrors(prev => ({ ...prev, pickup: '' }));
    } else {
      setDeliveryQuery(locationData.address);
      updateBooking({ deliveryAddress: locationData.address, deliveryLat: locationData.lat, deliveryLng: locationData.lng });
      setErrors(prev => ({ ...prev, delivery: '' }));
    }
    setActiveMapModal(null);
  };

  const validate = () => {
    const e = {};
    const p = bookingData.pickupAddress.trim();
    const d = bookingData.deliveryAddress.trim();
    if (!p)                 e.pickup   = 'Pickup address is required.';
    if (!d)                 e.delivery = 'Delivery address is required.';
    if (p.length < 5 && !e.pickup)   e.pickup   = 'Please enter a more specific address.';
    if (d.length < 5 && !e.delivery) e.delivery = 'Please enter a more specific address.';
    if (p && d && p.toLowerCase() === d.toLowerCase() && !e.pickup && !e.delivery)
      e.delivery = 'Pickup and delivery addresses cannot be the same.';

    // Warn if no coordinates (user typed manually without picking)
    if (!bookingData.pickupLat && !e.pickup)
      e.pickup = 'Please select an address from the dropdown suggestions or the map.';
    if (!bookingData.deliveryLat && !e.delivery)
      e.delivery = 'Please select an address from the dropdown suggestions or the map.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) navigate('/book/new/details');
  };

  // Format display_name to show main name + secondary info separately
  const parseName = (display_name) => {
    const parts = display_name.split(',');
    const main  = parts.slice(0, 2).join(',').trim();
    const sub   = parts.slice(2, 5).join(',').trim();
    return { main, sub };
  };

  const hoverBg   = { pickup: '#003D1F', delivery: '#3B0A0A' };
  const dotColors = { pickup: 'var(--primary)', delivery: 'var(--red)' };

  const renderField = ({ field, label, placeholder, value, containerRef }) => {
    const results     = field === 'pickup' ? pickupResults   : deliveryResults;
    const loading     = field === 'pickup' ? pickupLoading   : deliveryLoading;
    const searchFailed = field === 'pickup' ? pickupFailed   : deliveryFailed;
    const dotColor = dotColors[field];
    const isFocused = focused === field;
    const showDropdown = isFocused && (loading || results.length > 0 || searchFailed || (value.length >= 3));

    return (
      <div className="form-group" style={{ position: 'relative', marginBottom: 0 }} ref={containerRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>{label} <span className="req">*</span></label>
            <button 
                type="button"
                onClick={() => setActiveMapModal(field)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', 
                    fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', cursor: 'pointer',
                    transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = dotColor}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
                <MapPinIcon size={14} color="currentColor" /> Choose on Map
            </button>
        </div>
        <input
          className="form-input"
          placeholder={placeholder}
          value={value}
          maxLength={300}
          autoComplete="off"
          onChange={e => {
            const val = e.target.value;
            if (field === 'pickup') {
              setPickupQuery(val);
              updateBooking({ pickupAddress: val, pickupLat: null, pickupLng: null });
            } else {
              setDeliveryQuery(val);
              updateBooking({ deliveryAddress: val, deliveryLat: null, deliveryLng: null });
            }
            setErrors(prev => ({ ...prev, [field]: '' }));
            if (!isFocused) setFocused(field);
          }}
          onFocus={() => setFocused(field)}
          style={{
            borderColor: errors[field] ? 'var(--red)' : isFocused ? dotColor : undefined,
            boxShadow:   errors[field]
              ? '0 0 0 3px rgba(239,68,68,0.15)'
              : isFocused ? `0 0 0 3px ${dotColor}25` : undefined,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        {errors[field] && (
          <span style={{ fontSize: '12px', color: 'var(--red)', display: 'block', marginTop: '4px' }}>
            {errors[field]}
          </span>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--surface)',
            border: `1.5px solid ${dotColor}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            zIndex: 300,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '8px 14px', fontSize: '10px', fontWeight: 800,
              color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: '1px solid var(--border)', background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              {loading ? (
                <>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    border: `2px solid ${dotColor}`, borderTopColor: 'transparent',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Searching locations…
                </>
              ) : (
                `${results.length} location${results.length !== 1 ? 's' : ''} found`
              )}
            </div>

            {/* Results */}
            {!loading && searchFailed && (
              <div style={{ padding: '16px 14px', fontSize: '13px', color: 'var(--red)', textAlign: 'center' }}>
                Search temporarily unavailable. Please try again.
              </div>
            )}
            {!loading && !searchFailed && results.length === 0 && value.length >= 3 && (
              <div style={{ padding: '16px 14px', fontSize: '13px', color: 'var(--text-3)', textAlign: 'center' }}>
                No locations found. Try a different search.
              </div>
            )}

            {results.map(item => {
              const { main, sub } = parseName(item.display_name);
              return (
                <div
                  key={item.place_id}
                  onMouseDown={e => { e.preventDefault(); pickSuggestion(field, item); }}
                  onMouseEnter={e => { e.currentTarget.style.background = hoverBg[field]; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    padding: '11px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    transition: 'background 0.12s',
                  }}
                >
                  {field === 'pickup'
                    ? <MapPinIcon size={14} color={dotColor} style={{ flexShrink: 0, marginTop: 2 }} />
                    : <FlagIcon   size={14} color={dotColor} style={{ flexShrink: 0, marginTop: 2 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {main}
                    </div>
                    {sub && (
                      <div style={{
                        fontSize: '11px', color: 'var(--text-3)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px',
                      }}>
                        {sub}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <div className="card" style={{ padding: '36px' }}>
        <StepBar steps={STEPS} currentStep={0} />

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Address Details</h2>
        <p className="text-sm text-muted mb-28">Set your pickup and delivery locations to get started.</p>

        {/* Visual route indicator + inputs */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
          {/* Dot line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '38px', flexShrink: 0 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 3px var(--primary-light)' }} />
            <div style={{ width: 2, flex: 1, minHeight: '60px', background: 'repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 5px, transparent 5px, transparent 10px)', margin: '6px 0' }} />
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 0 3px #FFF1F233' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {renderField({
              field:        'pickup',
              label:        'Pickup Address',
              placeholder:  'Where should we pick up?',
              value:        pickupQuery,
              containerRef: pickupRef,
            })}
            {renderField({
              field:        'delivery',
              label:        'Delivery Address',
              placeholder:  'Where are we delivering to?',
              value:        deliveryQuery,
              containerRef: deliveryRef,
            })}
          </div>
        </div>

        {/* Distance preview */}
        {bookingData.pickupLat && bookingData.deliveryLat && (() => {
          const km = haversineKm(
            bookingData.pickupLat, bookingData.pickupLng,
            bookingData.deliveryLat, bookingData.deliveryLng
          );
          return (
            <div style={{
              marginTop: '20px', padding: '12px 16px',
              background: 'var(--primary-light)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0,177,79,0.2)',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
            }}>
              <MapPinIcon size={15} color="var(--primary)" />
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                Estimated route distance: ~{km.toFixed(1)} km
              </span>
            </div>
          );
        })()}

        <div style={{ height: '32px' }} />

        <div className="flex gap-12">
          <button onClick={() => navigate('/book')} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
          <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>Continue to Details →</button>
        </div>
      </div>

      {activeMapModal && (
        <MapModal 
            initialLat={activeMapModal === 'pickup' ? bookingData.pickupLat : bookingData.deliveryLat}
            initialLng={activeMapModal === 'pickup' ? bookingData.pickupLng : bookingData.deliveryLng}
            onClose={() => setActiveMapModal(null)}
            onConfirm={handleMapConfirm}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default AddressStep;
