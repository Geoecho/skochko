export function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 30000 });
  });
}
