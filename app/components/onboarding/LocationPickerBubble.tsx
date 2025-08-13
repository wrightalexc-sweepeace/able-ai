import React, { useState } from 'react';

// FontAwesome icons (assume global or imported elsewhere)
// fa-location-dot, fa-map-location-dot, fa-building

interface LocationPickerBubbleProps {
  value?: any;
  onChange: (value: any) => void;
  showConfirm?: boolean;
  onConfirm?: () => void;
  role?: 'BUYER' | 'GIG_WORKER';
}

function extractCoordsFromGoogleMapsUrl(url: string) {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

const LocationPickerBubble: React.FC<LocationPickerBubbleProps> = ({ value, onChange, showConfirm, onConfirm, role = 'GIG_WORKER' }) => {
  const [urlInput, setUrlInput] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'geo' | 'url' | 'coordinates' | null>(null);
  const [useCoordinates, setUseCoordinates] = useState(false);

  // Get colors based on role
  const getColors = () => {
    if (role === 'BUYER') {
      return {
        primary: 'var(--secondary-color)',
        primaryDarker: 'var(--secondary-darker-color)',
        accent: '#0f766e'
      };
    } else {
      return {
        primary: 'var(--primary-color)',
        primaryDarker: 'var(--primary-darker-color)',
        accent: '#0f766e'
      };
    }
  };

  const colors = getColors();

  const handleGeo = () => {
    setError('');
    setSelectedMethod('geo');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Pass coordinates as an object to preserve lat/lng for backend storage
        onChange({ lat, lng, formatted_address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }, () => setError('Unable to get your location.'));
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleUrlBlur = () => {
    setSelectedMethod('url');
    const coords = extractCoordsFromGoogleMapsUrl(urlInput);
    if (coords) {
      setError('');
      // Pass coordinates as an object to preserve lat/lng for backend storage
      onChange({ lat: coords.lat, lng: coords.lng, formatted_address: `Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` });
    } else if (urlInput) {
      setError('Could not extract coordinates from this URL.');
    }
  };

  const handleCoordinatesSubmit = () => {
    setSelectedMethod('coordinates');
    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    // Pass coordinates as an object to preserve lat/lng for backend storage
    onChange({ lat, lng, formatted_address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && useCoordinates) {
      handleCoordinatesSubmit();
    }
  };

  return (
    <div style={{ background: '#232323', borderRadius: 12, padding: 16, margin: '12px 0', boxShadow: '0 2px 8px #0002', maxWidth: 400 }}>
      <style>{`
        input::placeholder {
          color: rgba(0, 0, 0, 0.7) !important;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: selectedMethod === 'geo' ? colors.primary : colors.primary, border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 16
          }}
          onClick={handleGeo}
        >
          <i className="fa-solid fa-location-dot" style={{ color: '#fff', fontSize: 20 }} />
          Use my current location
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', background: selectedMethod === 'url' ? colors.primary : colors.primary, borderRadius: 8, padding: '4px 8px' }}>
          <i className="fa-solid fa-map-location-dot" style={{ color: '#fff', fontSize: 18, marginRight: 8 }} />
          <input
            type="text"
            placeholder="Paste Google Maps URL"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onBlur={handleUrlBlur}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              color: '#fff', 
              fontSize: 15, 
              outline: 'none'
            }}
          />
        </div>

        {/* Manual Coordinates Toggle */}
        <button
          onClick={() => setUseCoordinates(!useCoordinates)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, 
            background: useCoordinates ? colors.primary : colors.primary, 
            border: 'none', borderRadius: 8, 
            padding: '8px 12px', fontWeight: 600, cursor: 'pointer', 
            fontSize: 16, transition: 'background-color 0.2s ease'
          }}
        >
          <i className="fa-solid fa-crosshairs" style={{ color: '#fff', fontSize: 18 }} />
          {useCoordinates ? 'Hide Manual Coordinates' : 'Enter Coordinates Manually'}
        </button>

        {useCoordinates && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: selectedMethod === 'coordinates' ? colors.primary : colors.primary, borderRadius: 8, padding: '8px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#fff', fontSize: 12, marginBottom: 4, display: 'block' }}>Latitude:</label>
                <input
                  type="number"
                  placeholder="e.g., 51.5074"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  onKeyDown={handleKeyDown}
                  step="any"
                  style={{ 
                    width: '100%', 
                    background: 'transparent', 
                    border: '1px solid rgba(255, 255, 255, 0.3)', 
                    color: '#fff', 
                    fontSize: 14, 
                    outline: 'none',
                    padding: '6px 8px',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#fff', fontSize: 12, marginBottom: 4, display: 'block' }}>Longitude:</label>
                <input
                  type="number"
                  placeholder="e.g., -0.1278"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  onKeyDown={handleKeyDown}
                  step="any"
                  style={{ 
                    width: '100%', 
                    background: 'transparent', 
                    border: '1px solid rgba(255, 255, 255, 0.3)', 
                    color: '#fff', 
                    fontSize: 14, 
                    outline: 'none',
                    padding: '6px 8px',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleCoordinatesSubmit}
              style={{
                background: colors.primary, border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 12, alignSelf: 'flex-start'
              }}
            >
              Set Coordinates
            </button>
          </div>
        )}

        {error && <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
        
        {value && (
          <div style={{ color: colors.primary, fontSize: 15, marginTop: 8 }}>
            Selected: {typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value && typeof value.lat === 'number' && typeof value.lng === 'number' 
              ? `Lat: ${value.lat.toFixed(6)}, Lng: ${value.lng.toFixed(6)}` 
              : String(value)}
          </div>
        )}
        
        {showConfirm && value && onConfirm && (
          <button
            style={{
              background: colors.primary, border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginTop: 8
            }}
            onClick={onConfirm}
          >
            Confirm Location
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationPickerBubble; 