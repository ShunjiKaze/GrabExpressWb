import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { XIcon, MapPinIcon } from './Icons';

function MapMoveTracker({ onMoveEnd }) {
  const map = useMap();
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    };
    map.on('moveend', handleMoveEnd);
    return () => map.off('moveend', handleMoveEnd);
  }, [map, onMoveEnd]);
  return null;
}

// Build a clean address string from Photon reverse-geocode properties
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
  const seen = new Set();
  return parts.filter(v => { if (seen.has(v)) return false; seen.add(v); return true; }).join(', ');
}

// Photon reverse geocode (primary) — free, OSM-based, no API key, browser-friendly
// Falls back to BigDataCloud if Photon has no result for the pinned location.
async function reverseGeocode(lat, lng, signal) {
  // --- 1. Photon (street-level, best quality) ---
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1&lang=en`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      const feat = data.features?.[0];
      if (feat) {
        const addr = formatPhotonAddress(feat.properties);
        if (addr) return { address: addr, error: null };
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // --- 2. BigDataCloud fallback (admin-level, always returns something) ---
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal }
    );
    if (res.ok) {
      const d = await res.json();
      const parts = [d.locality || d.city, d.principalSubdivision, d.countryName].filter(Boolean);
      const full  = parts.join(', ');
      if (full) return { address: full, error: null };
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  return { address: null, error: 'Could not fetch address for this location.' };
}

export default function MapModal({ initialLat, initialLng, onClose, onConfirm }) {
  const [centerLat, setCenterLat] = useState(initialLat || 10.3157);
  const [centerLng, setCenterLng] = useState(initialLng || 123.8854);
  const [address,   setAddress]   = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const abortRef = useRef(null);

  const fetchAddress = useCallback(async (lat, lng) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setFetchError(null);
    try {
      const { address: addr, error } = await reverseGeocode(lat, lng, abortRef.current.signal);
      if (error) {
        setAddress('');
        setFetchError(error);
      } else {
        setAddress(addr);
        setFetchError(null);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setAddress('');
        setFetchError('Could not fetch address. Please try moving the map.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddress(centerLat, centerLng);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapMoveEnd = useCallback((lat, lng) => {
    setCenterLat(lat);
    setCenterLng(lng);
    fetchAddress(lat, lng);
  }, [fetchAddress]);

  const handleConfirm = () => {
    if (loading) return;
    // Always pass coordinates; fall back to a coordinate label if geocoding failed
    onConfirm({
      address: address || `${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`,
      lat: centerLat,
      lng: centerLng,
    });
  };

  const canConfirm = !loading;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--surface)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>Choose on Map</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <XIcon size={24} color="var(--text-2)" />
        </button>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          minZoom={10}
          maxBounds={[[9.4, 123.2], [11.4, 124.2]]}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapMoveTracker onMoveEnd={handleMapMoveEnd} />
        </MapContainer>

        {/* Fixed pin */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -100%)', zIndex: 1000,
          pointerEvents: 'none',
        }}>
          <MapPinIcon size={40} color="var(--primary)" />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '24px', background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Selected Location
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-3)', fontSize: '14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Fetching address…
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loading && address && (
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{address}</div>
          )}

          {!loading && fetchError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '13px', color: 'var(--error, #ef4444)', fontWeight: 500 }}>
                ⚠ {fetchError}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                Coordinates: {centerLat.toFixed(6)}, {centerLng.toFixed(6)}
              </div>
              <button
                onClick={() => fetchAddress(centerLat, centerLng)}
                style={{ marginTop: '4px', alignSelf: 'flex-start', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          className="btn btn-primary btn-full btn-lg"
          disabled={!canConfirm}
          title={fetchError ? 'Will use coordinates since address could not be fetched' : undefined}
        >
          {fetchError ? 'Confirm with Coordinates' : 'Confirm Location'}
        </button>
      </div>
    </div>
  );
}
