/**
 * Haversine formula to calculate distance between two lat/lng coordinates
 * Returns distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Simple geocoding approximation using known city coordinates
 * In production, use Google Maps Geocoding API
 */
const CITY_COORDS = {
  'dehradun': { lat: 30.3165, lng: 78.0322 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'haridwar': { lat: 29.9457, lng: 78.1642 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
};

function approximateCoordsFromAddress(address) {
  if (!address) return null;

  const lower = address.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) {
      // Add small random offset to make it realistic
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.02,
        lng: coords.lng + (Math.random() - 0.5) * 0.02
      };
    }
  }
  return null;
}

function getDistanceLabel(km) {
  if (km < 0.5) return { label: 'Very Close', color: 'success', risk: 'low' };
  if (km < 2) return { label: 'Nearby', color: 'success', risk: 'low' };
  if (km < 5) return { label: 'Moderate Distance', color: 'warning', risk: 'medium' };
  if (km < 15) return { label: 'Far', color: 'warning', risk: 'medium' };
  return { label: 'Very Far', color: 'danger', risk: 'high' };
}

function analyzeGeoTagging(photos, residenceAddress, officeAddress) {
  const results = [];

  const residenceCoords = approximateCoordsFromAddress(residenceAddress);
  const officeCoords = approximateCoordsFromAddress(officeAddress);

  for (const photo of photos) {
    if (!photo.lat || !photo.lng) continue;

    let referenceCoords = null;
    let referenceAddress = null;

    if (photo.type === 'residence') {
      referenceCoords = residenceCoords;
      referenceAddress = residenceAddress;
    } else if (photo.type === 'office' || photo.type === 'business') {
      referenceCoords = officeCoords;
      referenceAddress = officeAddress;
    }

    if (!referenceCoords) continue;

    const distanceKm = haversineDistance(photo.lat, photo.lng, referenceCoords.lat, referenceCoords.lng);
    const { label, color, risk } = getDistanceLabel(distanceKm);

    results.push({
      photoType: photo.type,
      photoUrl: photo.url,
      photoCapturedAt: photo.timestamp,
      photoCoords: { lat: photo.lat, lng: photo.lng },
      referenceAddress,
      referenceCoords,
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceLabel: label,
      riskColor: color,
      riskLevel: risk,
    });
  }

  return results;
}

module.exports = { haversineDistance, analyzeGeoTagging, approximateCoordsFromAddress };
