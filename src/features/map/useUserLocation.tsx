import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { getBrowserPosition } from '@/lib/browser-location';
import type { LatLng } from '@/types/domain';
import { LocationPrivacy } from './LocationPrivacy';

export const SKOPJE_CENTER: LatLng = { lat: 41.9965, lng: 21.4314 };

const CONSENT_KEY = 'skochko.location-consent.v1';
type Decision = 'allowed' | 'declined';
export type LocationIssue = 'insecure' | 'unsupported' | 'embedded' | 'denied' | 'unavailable';

type UserLocationState = {
  location: LatLng;
  userLocation: LatLng | null;
  locating: boolean;
  issue: LocationIssue | null;
  locate: () => void;
  openPrivacy: () => void;
};

const LocationContext = createContext<UserLocationState | null>(null);

export function UserLocationProvider({ children, ageConfirmed }: PropsWithChildren<{ ageConfirmed: boolean }>) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [privacyMode, setPrivacyMode] = useState<'consent' | 'recovery' | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [issue, setIssue] = useState<LocationIssue | null>(null);
  const consent = useRef<Decision | null>(null);
  const pending = useRef<Promise<void> | null>(null);
  const recoverOnFailure = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === 'allowed' || saved === 'declined') {
        consent.current = saved;
        setDecision(saved);
      }
    } catch {
      // Keep the choice in memory when storage is unavailable.
    }
    setReady(true);
  }, []);

  const requestLocation = useCallback((interactive = false) => {
    if (consent.current !== 'allowed') return;
    if (interactive) recoverOnFailure.current = true;
    if (pending.current) return;

    const showIssue = (problem: LocationIssue) => {
      setIssue(problem);
      if (recoverOnFailure.current) setPrivacyMode('recovery');
      recoverOnFailure.current = false;
    };

    if (!window.isSecureContext || !navigator.geolocation) {
      showIssue(window.isSecureContext ? 'unsupported' : 'insecure');
      return;
    }

    const policy = (document as Document & { featurePolicy?: { allowsFeature: (feature: string) => boolean } }).featurePolicy;
    if (window.self !== window.top && policy?.allowsFeature('geolocation') === false) {
      showIssue('embedded');
      return;
    }

    setLocating(true);
    const request = getBrowserPosition()
      .then(({ coords }) => {
        if (pending.current !== request) return;
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setIssue(null);
        setPrivacyMode(mode => mode === 'recovery' ? null : mode);
      })
      .catch((error: GeolocationPositionError) => {
        if (pending.current !== request) return;
        if (error.code === 1) setUserLocation(null);
        showIssue(error.code === 1 ? (window.self !== window.top ? 'embedded' : 'denied') : 'unavailable');
      })
      .finally(() => {
        if (pending.current !== request) return;
        pending.current = null;
        recoverOnFailure.current = false;
        setLocating(false);
      });
    pending.current = request;
  }, []);

  useEffect(() => {
    if (!ageConfirmed || decision !== 'allowed' || !window.isSecureContext || !navigator.permissions) return;
    let active = true;
    let status: PermissionStatus | undefined;
    const handleChange = () => {
      if (status?.state === 'granted') {
        requestLocation();
      } else {
        setUserLocation(null);
        if (!pending.current && status?.state === 'denied') setIssue('denied');
      }
    };
    void navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (!active) return;
      status = result;
      if (status.state === 'granted') requestLocation();
      status.addEventListener('change', handleChange);
    }).catch(() => {
      // The map control can still request access on browsers without this permission query.
    });
    return () => {
      active = false;
      status?.removeEventListener('change', handleChange);
    };
  }, [ageConfirmed, decision, requestLocation]);

  const openPrivacy = () => setPrivacyMode('consent');
  const locate = () => {
    if (consent.current === 'allowed') requestLocation(true);
    else openPrivacy();
  };

  const saveDecision = (choice: Decision) => {
    consent.current = choice;
    setDecision(choice);
    setPrivacyMode(null);
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // The current session still respects the choice.
    }
    if (choice === 'allowed') {
      requestLocation(true);
    } else {
      pending.current = null;
      recoverOnFailure.current = false;
      setUserLocation(null);
      setIssue(null);
      setLocating(false);
    }
  };

  const onboarding = ready && decision === null && pathname === '/';

  return (
    <LocationContext.Provider value={{
      location: userLocation ?? SKOPJE_CENTER,
      userLocation,
      locating,
      issue,
      locate,
      openPrivacy,
    }}>
      {children}
      <LocationPrivacy
        visible={ageConfirmed && (privacyMode !== null || onboarding)}
        issue={privacyMode === 'recovery' ? issue : null}
        locating={locating}
        allowed={decision === 'allowed'}
        onAllow={() => saveDecision('allowed')}
        onSkip={() => saveDecision('declined')}
        onRetry={() => requestLocation(true)}
        onClose={onboarding ? () => saveDecision('declined') : () => setPrivacyMode(null)}
      />
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  const location = useContext(LocationContext);
  if (!location) throw new Error('useUserLocation requires UserLocationProvider');
  return location;
}
