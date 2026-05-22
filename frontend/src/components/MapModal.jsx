import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { XIcon, MapPinIcon } from './Icons';

// This component hooks into the map to track when it moves
function MapMoveTracker({ onMoveEnd }) {
  const map = useMap();
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onMoveEnd]);
  return null;
}

export default function MapModal({ initialLat, initialLng, onClose, onConfirm }) {
  // Default to Cebu City if no initial coordinates are provided
  const [centerLat, setCenterLat] = useState(initialLat || 10.3157);
  const [centerLng, setCenterLng] = useState(initialLng || 123.8854);
  const [address, setAddress] = useState('Fetching address...');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  // Function to reverse geocode lat/lng to an address
  const fetchAddress = useCallback(async (lat, lng) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({
          format: 'json',
          lat: lat,
          lon: lng,
          zoom: 18,
          addressdetails: 1,
        });
      
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: { 'Accept-Language': 'en', 'User-Agent': 'GrabExpressApp/1.0' },
      });
      const data = await res.json();
      setAddress(data.display_name || 'Unknown location');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Reverse geocode error:', err);
        setAddress('Could not fetch address. Please try moving the map.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch address for initial position
  useEffect(() => {
    fetchAddress(centerLat, centerLng);
  }, []);

  // Called when user stops dragging the map
  const handleMapMoveEnd = (lat, lng) => {
    setCenterLat(lat);
    setCenterLng(lng);
    fetchAddress(lat, lng);
  };

  const handleConfirm = () => {
    onConfirm({
      address: address,
      lat: centerLat,
      lng: centerLng
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--surface)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.2s ease'
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
          maxBounds={[[9.4, 123.2], [11.4, 124.2]]} // Strictly restrict panning to Cebu province
          maxBoundsViscosity={1.0} // Gives it a solid bounce-back effect
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapMoveTracker onMoveEnd={handleMapMoveEnd} />
        </MapContainer>

        {/* Fixed Pin in the center */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -100%)', zIndex: 1000,
          pointerEvents: 'none' // Let clicks pass through to map
        }}>
          <MapPinIcon size={40} color="var(--primary)" />
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ padding: '24px', background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Selected Location</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            {loading ? 'Loading...' : address}
          </div>
        </div>
        <button 
          onClick={handleConfirm} 
          className="btn btn-primary btn-full btn-lg"
          disabled={loading}
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}
