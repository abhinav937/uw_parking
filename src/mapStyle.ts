export function createMapStyle(isDarkMode: boolean): string {
  return isDarkMode
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/streets-v12';
}
