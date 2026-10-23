/**
 * Worldwide Location Data Service for CareerFast HR
 * 
 * Provides clean, single-city name search (e.g. "Chennai", "Bangalore", "Mumbai")
 * using local curated hubs, Indian cities database, and filtered OpenStreetMap Geocoding.
 */
import { City } from 'country-state-city';

// In-memory cache to avoid duplicate requests
const locationCache = new Map();

// Curated clean single city names (India & Worldwide Tech/Business hubs)
export const TOP_INDIAN_LOCATIONS = [
  'Bangalore',
  'Bengaluru',
  'Chennai',
  'Mumbai',
  'Hyderabad',
  'Pune',
  'Delhi',
  'Delhi NCR',
  'Noida',
  'Gurgaon',
  'Gurugram',
  'Kolkata',
  'Ahmedabad',
  'Kochi',
  'Coimbatore',
  'Chandigarh',
  'Jaipur',
  'Indore',
  'Thiruvananthapuram',
  'Trivandrum',
  'Lucknow',
  'Surat',
  'Vadodara',
  'Nagpur',
  'Visakhapatnam',
  'Bhopal',
  'Patna',
  'Mysore',
  'Mangalore',
  'Madurai',
  'Vijayawada',
  'Bhubaneswar',
  'Varanasi',
  'Amritsar',
  'Jamshedpur',
  'Ranchi',
  'Guwahati',
  'Dehradun',
  'Navi Mumbai',
  'Thane',
  'Ghaziabad',
  'Faridabad',
  'Greater Noida',
  'Remote / Work from Anywhere',
  'Singapore',
  'Dubai',
  'London',
  'San Francisco',
  'New York',
  'Seattle',
  'Austin',
  'Toronto',
  'Berlin',
  'Tokyo',
  'Sydney',
];

// Helper to format string into Title Case
function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Clean raw city name to remove unwanted junk / suffixes
function cleanCityName(rawName) {
  if (!rawName) return '';
  let cleaned = rawName.trim();

  // Strip state or country if comma-separated (e.g. "Chennai, Tamil Nadu" -> "Chennai")
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim();
  }

  // Remove common administrative suffixes
  cleaned = cleaned.replace(/\s+(District|Division|Urban|Rural|Corporation|City|Municipality)$/i, '').trim();

  return toTitleCase(cleaned);
}

/**
 * Returns initial locations list for default dropdown display
 */
export const getInitialLocations = () => {
  return [...TOP_INDIAN_LOCATIONS];
};

/**
 * Fetches clean single city names (e.g. "Chennai", "Bangalore")
 * 
 * @param {string} query Search text
 * @returns {Promise<string[]>} Array of clean single-name city strings
 */
export const fetchWorldwideLocations = async (query = '') => {
  const trimmed = (query || '').trim();

  // If query is empty, return top curated hubs
  if (!trimmed) {
    return getInitialLocations();
  }

  const cacheKey = trimmed.toLowerCase();
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  const results = [];
  const seen = new Set();

  const addName = (name) => {
    const clean = cleanCityName(name);
    if (!clean || clean.length < 2) return;
    const lower = clean.toLowerCase();

    // Skip POIs and non-city keywords
    if (
      /(airport|port|station|museum|mall|institute|university|hospital|park|hotel|building|center|centre|temple|church|mosque|road|street|terminal|metro|lake|fort|beach|bridge|hall)/i.test(
        lower
      )
    ) {
      return;
    }

    if (!seen.has(lower)) {
      seen.add(lower);
      results.push(clean);
    }
  };

  // 1. Check if query matches 'remote'
  if ('remote'.includes(cacheKey)) {
    addName('Remote / Work from Anywhere');
  }

  // 2. Exact / Prefix matches from curated top cities
  for (const city of TOP_INDIAN_LOCATIONS) {
    if (city.toLowerCase().startsWith(cacheKey)) {
      addName(city);
    }
  }

  // 3. Substring matches from curated top cities
  for (const city of TOP_INDIAN_LOCATIONS) {
    if (city.toLowerCase().includes(cacheKey)) {
      addName(city);
    }
  }

  // 4. Matches from Indian Cities Database (country-state-city)
  try {
    const inCities = City.getCitiesOfCountry('IN') || [];
    for (const c of inCities) {
      if (c?.name && c.name.toLowerCase().startsWith(cacheKey)) {
        addName(c.name);
      }
      if (results.length >= 20) break;
    }
  } catch (err) {
    // Ignore fallback notice
  }

  // 5. Query Photon OpenStreetMap Geocoding API for global/specialized city matches
  if (results.length < 10) {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lang=en&limit=15`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });

      if (response.ok) {
        const data = await response.json();
        const features = data.features || [];

        for (const f of features) {
          const p = f.properties || {};
          const type = (p.type || '').toLowerCase();
          const osm = (p.osm_value || '').toLowerCase();

          // Only accept actual settlements (cities or towns)
          const isSettlement =
            type === 'city' ||
            type === 'town' ||
            osm === 'city' ||
            osm === 'town' ||
            osm === 'administrative';

          if (isSettlement && p.name) {
            addName(p.name);
          }
        }
      }
    } catch (err) {
      // Fallback in place
    }
  }

  // 6. If user typed a valid custom city name not in list, allow them to pick it
  const typedTitle = toTitleCase(trimmed);
  if (typedTitle && !seen.has(typedTitle.toLowerCase()) && typedTitle.length > 2) {
    addName(typedTitle);
  }

  const finalResults = results.slice(0, 20);
  locationCache.set(cacheKey, finalResults);
  return finalResults;
};
