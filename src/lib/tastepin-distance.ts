export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => degrees * (Math.PI / 180);

export function distanceInMeters(origin: Coordinates, destination: Coordinates) {
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude)
      * Math.cos(destinationLatitude)
      * Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.max(10, Math.round(distanceMeters / 10) * 10)}m`;
  return `${(distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0)}km`;
}
