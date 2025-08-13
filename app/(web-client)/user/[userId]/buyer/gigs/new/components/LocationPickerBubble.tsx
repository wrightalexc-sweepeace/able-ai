"use client";

import React, { useState } from 'react';
import styles from './LocationPickerBubble.module.css';

interface LocationPickerBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => Promise<void>;
  disabled?: boolean;
  showConfirm?: boolean;
}

// Helper function to extract coordinates from Google Maps URL
function extractCoordsFromGoogleMapsUrl(url: string) {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

const LocationPickerBubble: React.FC<LocationPickerBubbleProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  disabled
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [useCoordinates, setUseCoordinates] = useState(false);
  const [error, setError] = useState('');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    setError('');
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLatitude(val);
    setError('');
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLongitude(val);
    setError('');
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coordinatesString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onChange(coordinatesString);
          setError('');
        },
        () => {
          setError('Unable to get your current location');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleUrlBlur = () => {
    const coords = extractCoordsFromGoogleMapsUrl(urlInput);
    if (coords) {
      const coordinatesString = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      onChange(coordinatesString);
      setError('');
    } else if (urlInput) {
      setError('Could not extract coordinates from this URL');
    }
  };

  const handleSubmit = () => {
    if (!disabled) {
      if (useCoordinates) {
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

        // Format as coordinates string
        const coordinatesString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onChange(coordinatesString);
      }
      setIsEditing(false);
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={styles.locationBubbleWrapper}>
      {label && <label htmlFor={id || name} className={styles.label}>{label}</label>}
      <div className={styles.locationInputContainer}>
        {isEditing ? (
          <div className={styles.inputWrapper}>
            {/* Use Current Location Button */}
            <button
              onClick={handleUseCurrentLocation}
              className={styles.currentLocationButton}
              disabled={disabled}
              type="button"
            >
              Use Current Location
            </button>

            {/* Google Maps URL Input */}
            <div className={styles.urlInputContainer}>
              <input
                type="url"
                placeholder="Paste Google Maps URL"
                value={urlInput}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                className={styles.urlInput}
                disabled={disabled}
              />
            </div>

            {/* Manual Coordinates Toggle */}
            <button
              onClick={() => setUseCoordinates(!useCoordinates)}
              className={`${styles.coordinatesToggle} ${useCoordinates ? styles.coordinatesToggleActive : ''}`}
              disabled={disabled}
              type="button"
            >
              {useCoordinates ? 'Hide Manual Coordinates' : 'Enter Coordinates Manually'}
            </button>

            {useCoordinates && (
              <div className={styles.coordinatesContainer}>
                <div className={styles.coordinateInput}>
                  <label htmlFor="latitude">Latitude:</label>
                  <input
                    type="number"
                    id="latitude"
                    value={latitude}
                    onChange={handleLatitudeChange}
                    onKeyDown={handleKeyDown}
                    className={styles.coordinateField}
                    placeholder="e.g., 51.5074"
                    step="any"
                    disabled={disabled}
                  />
                </div>
                <div className={styles.coordinateInput}>
                  <label htmlFor="longitude">Longitude:</label>
                  <input
                    type="number"
                    id="longitude"
                    value={longitude}
                    onChange={handleLongitudeChange}
                    onKeyDown={handleKeyDown}
                    className={styles.coordinateField}
                    placeholder="e.g., -0.1278"
                    step="any"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            <div className={styles.locationActions}>
              <button
                onClick={() => setIsEditing(false)}
                className={styles.cancelButton}
                disabled={disabled}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={styles.confirmButton}
                disabled={disabled}
                type="button"
              >
                Confirm
              </button>
            </div>
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        ) : (
          <div 
            className={styles.displayAddress} 
            onClick={() => !disabled && setIsEditing(true)}
          >
            {value || "Click to set location"}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerBubble;
