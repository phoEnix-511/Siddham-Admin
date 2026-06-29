import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from 'leaflet';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

export interface LocationData {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface MapPickerProps {
  onLocationSelect: (data: LocationData) => void;
  defaultPosition?: [number, number]; // [lat, lng]
}

// Leaflet default icon fix for React/Next
const useLeafletIcons = () => {
  useEffect(() => {
    (async () => {
      const L = (await import('leaflet')).default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    })();
  }, []);
};

const LocationMarker = ({ position, setPosition, onLocationSelect }: any) => {
  const map = useMapEvents({
    click(e: any) {
      setPosition(e.latlng);
      fetchAddress(e.latlng);
    },
    locationfound(e: any) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      fetchAddress(e.latlng);
    },
  });

  const fetchAddress = async (latlng: LatLng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&email=hello@siddham.com`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const addressStr = data.display_name;
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const state = addr.state || '';
        const pincode = addr.postcode || '';

        onLocationSelect({
          address: addressStr,
          city,
          state,
          pincode,
        });
      }
    } catch (error) {
      console.warn('Error fetching reverse geocoding:', error);
    }
  };

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

export default function MapPicker({ onLocationSelect, defaultPosition = [20.5937, 78.9629] }: MapPickerProps) {
  useLeafletIcons();
  const [position, setPosition] = useState<any>(null); // Leaflet LatLng
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

  useEffect(() => {
    if (!hasRequestedLocation && navigator.geolocation) {
      setHasRequestedLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(latlng);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&email=hello@siddham.com`)
            .then(res => { if (res.ok) return res.json(); return null; })
            .then(data => {
              if (data && data.address) {
                const addr = data.address;
                onLocationSelect({
                  address: data.display_name,
                  city: addr.city || addr.town || addr.village || addr.county || '',
                  state: addr.state || '',
                  pincode: addr.postcode || '',
                });
              }
            })
            .catch(err => console.warn('Reverse geocoding error:', err));
        },
        (err) => {
          console.warn('Geolocation permission denied or failed:', err);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [hasRequestedLocation, onLocationSelect]);

  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-gray-200)', position: 'relative', zIndex: 1 }}>
      <MapContainer 
        center={defaultPosition as any} 
        zoom={5} 
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 999 }}>
        <button 
          type="button"
          className="btn btn-sm"
          style={{ background: 'white', color: 'black', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
          onClick={() => {
            // Geolocation API to find user's current location
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  setPosition(latlng);
                  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&email=hello@siddham.com`)
                    .then(res => { if (res.ok) return res.json(); return null; })
                    .then(data => {
                      if (data && data.address) {
                        const addr = data.address;
                        onLocationSelect({
                          address: data.display_name,
                          city: addr.city || addr.town || addr.village || addr.county || '',
                          state: addr.state || '',
                          pincode: addr.postcode || '',
                        });
                      }
                    })
                    .catch(err => console.warn('Reverse geocoding error:', err));
                },
                (err) => console.error(err)
              );
            }
          }}
        >
          📍 Current Location
        </button>
      </div>
    </div>
  );
}
