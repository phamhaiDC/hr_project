'use client';

import { useEffect, useState, useCallback } from 'react';

export type GeoStatus =
  | 'acquiring'   // waiting for first fix
  | 'success'     // coordinates available
  | 'denied'      // user or system rejected permission (code 1)
  | 'unavailable' // GPS hardware / signal unavailable (code 2)
  | 'timeout'     // timed out before a fix was obtained (code 3)
  | 'unsupported'; // browser has no geolocation API

export interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  status: GeoStatus;
  retry: () => void;
}

type GeoCoords = Omit<GeoState, 'retry'>;

// Single options object used for both getCurrentPosition and watchPosition.
// enableHighAccuracy: true  → forces GPS chip, not cell/WiFi triangulation
// timeout: 10_000           → fail fast if GPS can't lock in 10 s
// maximumAge: 0             → never serve a cached position
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

function codeToStatus(code: number): GeoStatus {
  if (code === 1) return 'denied';
  if (code === 3) return 'timeout';
  return 'unavailable';
}

function geoErrorMessage(code: number): string {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return (
        'Location access was denied.\n' +
        'To allow it:\n' +
        '• iOS: Settings → Privacy → Location Services → [Browser] → While Using\n' +
        '• Android: Browser settings → Site permissions → Location → Allow\n' +
        '• Desktop: Click the lock icon in the address bar → Location → Allow'
      );
    case 2: // POSITION_UNAVAILABLE
      return (
        'GPS signal unavailable.\n' +
        'Make sure Location Services are enabled on your device and try again.'
      );
    case 3: // TIMEOUT
      return (
        'Location request timed out.\n' +
        'Move to an area with better GPS signal (near a window or outdoors) and tap Retry.'
      );
    default:
      return 'Failed to get location. Please try again.';
  }
}

/**
 * Geolocation hook.
 *
 * Acquisition strategy:
 *  1. getCurrentPosition — immediate high-accuracy fix (shows coordinates as soon as GPS locks)
 *  2. watchPosition      — continuous updates using the same strict options
 *
 * Both phases use identical options (enableHighAccuracy: true, maximumAge: 0) so a
 * stale cell-tower fix can never be served in place of a real GPS position.
 *
 * `status` gives callers a precise state machine value:
 *   acquiring → success | denied | unavailable | timeout | unsupported
 *
 * Calling retry() resets all state and re-runs both phases from scratch.
 */
export function useGeolocation(): GeoState {
  const [coords, setCoords] = useState<GeoCoords>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
    status: 'acquiring',
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset to acquiring on every attempt (including retries)
    setCoords({ lat: null, lng: null, accuracy: null, error: null, loading: true, status: 'acquiring' });

    // Detect insecure context — on mobile browsers geolocation is blocked over HTTP
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const isInsecureContext =
        typeof window !== 'undefined' &&
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost';

      setCoords({
        lat: null,
        lng: null,
        accuracy: null,
        error: isInsecureContext
          ? 'GPS requires a secure connection (HTTPS).\nOpen this page over HTTPS to enable location check-in.'
          : 'Geolocation is not supported by your browser.',
        loading: false,
        status: 'unsupported',
      });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
        error: null,
        loading: false,
        status: 'success',
      });
    };

    const onError = (err: GeolocationPositionError) => {
      setCoords((s) => ({
        ...s,
        error: geoErrorMessage(err.code),
        loading: false,
        status: codeToStatus(err.code),
      }));
    };

    // Phase 1: one-shot fix — surfaces coordinates as soon as GPS locks
    navigator.geolocation.getCurrentPosition(onSuccess, onError, GEO_OPTIONS);

    // Phase 2: continuous watch — refines accuracy and keeps coordinates fresh
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, GEO_OPTIONS);

    return () => navigator.geolocation.clearWatch(watchId);
  }, [retryCount]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  return { ...coords, retry };
}
