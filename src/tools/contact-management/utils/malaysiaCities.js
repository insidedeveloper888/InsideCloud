/**
 * Malaysian Cities Coordinates Database
 * Comprehensive list of major cities with latitude/longitude for geocoding
 */

export const MALAYSIA_CITIES = [
  // Johor
  { city: 'Johor Bahru', state: 'Johor', lat: 1.4927, lng: 103.7414 },
  { city: 'Batu Pahat', state: 'Johor', lat: 1.8548, lng: 102.9325 },
  { city: 'Muar', state: 'Johor', lat: 2.0442, lng: 102.5689 },
  { city: 'Kluang', state: 'Johor', lat: 2.0308, lng: 103.3186 },
  { city: 'Segamat', state: 'Johor', lat: 2.5154, lng: 102.8154 },
  { city: 'Pontian', state: 'Johor', lat: 1.4872, lng: 103.3897 },
  { city: 'Kulai', state: 'Johor', lat: 1.6583, lng: 103.6000 },
  { city: 'Kota Tinggi', state: 'Johor', lat: 1.7375, lng: 103.8989 },
  { city: 'Mersing', state: 'Johor', lat: 2.4311, lng: 103.8400 },

  // Kedah
  { city: 'Alor Setar', state: 'Kedah', lat: 6.1248, lng: 100.3678 },
  { city: 'Sungai Petani', state: 'Kedah', lat: 5.6471, lng: 100.4877 },
  { city: 'Kulim', state: 'Kedah', lat: 5.3647, lng: 100.5617 },
  { city: 'Langkawi', state: 'Kedah', lat: 6.3500, lng: 99.8000 },
  { city: 'Kubang Pasu', state: 'Kedah', lat: 6.4231, lng: 100.4867 },
  { city: 'Pendang', state: 'Kedah', lat: 6.0167, lng: 100.5000 },
  { city: 'Yan', state: 'Kedah', lat: 5.7833, lng: 100.3833 },
  { city: 'Baling', state: 'Kedah', lat: 5.6667, lng: 100.9167 },

  // Kelantan
  { city: 'Kota Bharu', state: 'Kelantan', lat: 6.1256, lng: 102.2381 },
  { city: 'Pasir Mas', state: 'Kelantan', lat: 6.0467, lng: 102.1394 },
  { city: 'Tanah Merah', state: 'Kelantan', lat: 5.8000, lng: 102.1500 },
  { city: 'Machang', state: 'Kelantan', lat: 5.7667, lng: 102.2167 },
  { city: 'Kuala Krai', state: 'Kelantan', lat: 5.5333, lng: 102.2000 },
  { city: 'Gua Musang', state: 'Kelantan', lat: 4.8833, lng: 101.9667 },
  { city: 'Bachok', state: 'Kelantan', lat: 6.0167, lng: 102.4333 },

  // Melaka
  { city: 'Melaka', state: 'Melaka', lat: 2.1896, lng: 102.2501 },
  { city: 'Alor Gajah', state: 'Melaka', lat: 2.3803, lng: 102.2089 },
  { city: 'Jasin', state: 'Melaka', lat: 2.3167, lng: 102.4167 },
  { city: 'Masjid Tanah', state: 'Melaka', lat: 2.3500, lng: 102.1167 },

  // Negeri Sembilan
  { city: 'Seremban', state: 'Negeri Sembilan', lat: 2.7297, lng: 101.9381 },
  { city: 'Port Dickson', state: 'Negeri Sembilan', lat: 2.5389, lng: 101.8019 },
  { city: 'Nilai', state: 'Negeri Sembilan', lat: 2.8208, lng: 101.7972 },
  { city: 'Bahau', state: 'Negeri Sembilan', lat: 2.8067, lng: 102.1256 },
  { city: 'Tampin', state: 'Negeri Sembilan', lat: 2.4708, lng: 102.2306 },
  { city: 'Kuala Pilah', state: 'Negeri Sembilan', lat: 2.7383, lng: 102.2483 },
  { city: 'Rembau', state: 'Negeri Sembilan', lat: 2.5833, lng: 102.0833 },

  // Pahang
  { city: 'Kuantan', state: 'Pahang', lat: 3.8077, lng: 103.3260 },
  { city: 'Temerloh', state: 'Pahang', lat: 3.4500, lng: 102.4167 },
  { city: 'Bentong', state: 'Pahang', lat: 3.5167, lng: 101.9000 },
  { city: 'Raub', state: 'Pahang', lat: 3.7908, lng: 101.8575 },
  { city: 'Pekan', state: 'Pahang', lat: 3.4922, lng: 103.3947 },
  { city: 'Jerantut', state: 'Pahang', lat: 3.9333, lng: 102.3667 },
  { city: 'Kuala Lipis', state: 'Pahang', lat: 4.1833, lng: 102.0500 },
  { city: 'Cameron Highlands', state: 'Pahang', lat: 4.4706, lng: 101.3784 },
  { city: 'Mentakab', state: 'Pahang', lat: 3.4833, lng: 102.3500 },

  // Penang
  { city: 'George Town', state: 'Penang', lat: 5.4141, lng: 100.3288 },
  { city: 'Butterworth', state: 'Penang', lat: 5.3991, lng: 100.3637 },
  { city: 'Bukit Mertajam', state: 'Penang', lat: 5.3631, lng: 100.4664 },
  { city: 'Nibong Tebal', state: 'Penang', lat: 5.1656, lng: 100.4778 },
  { city: 'Kepala Batas', state: 'Penang', lat: 5.5167, lng: 100.4333 },
  { city: 'Permatang Pauh', state: 'Penang', lat: 5.3956, lng: 100.4000 },
  { city: 'Balik Pulau', state: 'Penang', lat: 5.3500, lng: 100.2333 },

  // Perak
  { city: 'Ipoh', state: 'Perak', lat: 4.5975, lng: 101.0901 },
  { city: 'Taiping', state: 'Perak', lat: 4.8500, lng: 100.7333 },
  { city: 'Teluk Intan', state: 'Perak', lat: 4.0275, lng: 101.0211 },
  { city: 'Sitiawan', state: 'Perak', lat: 4.2167, lng: 100.7000 },
  { city: 'Kuala Kangsar', state: 'Perak', lat: 4.7667, lng: 100.9333 },
  { city: 'Kampar', state: 'Perak', lat: 4.3167, lng: 101.1500 },
  { city: 'Tapah', state: 'Perak', lat: 4.1983, lng: 101.2589 },
  { city: 'Batu Gajah', state: 'Perak', lat: 4.4667, lng: 101.0500 },
  { city: 'Lumut', state: 'Perak', lat: 4.2325, lng: 100.6297 },
  { city: 'Parit Buntar', state: 'Perak', lat: 5.1333, lng: 100.4833 },
  { city: 'Tanjung Malim', state: 'Perak', lat: 3.6833, lng: 101.5167 },

  // Perlis
  { city: 'Kangar', state: 'Perlis', lat: 6.4414, lng: 100.1986 },
  { city: 'Arau', state: 'Perlis', lat: 6.4333, lng: 100.2667 },
  { city: 'Padang Besar', state: 'Perlis', lat: 6.6608, lng: 100.3200 },

  // Selangor
  { city: 'Shah Alam', state: 'Selangor', lat: 3.0733, lng: 101.5185 },
  { city: 'Petaling Jaya', state: 'Selangor', lat: 3.1073, lng: 101.6067 },
  { city: 'Subang Jaya', state: 'Selangor', lat: 3.0444, lng: 101.5867 },
  { city: 'Subang', state: 'Selangor', lat: 3.0444, lng: 101.5867 }, // Same as Subang Jaya
  { city: 'Klang', state: 'Selangor', lat: 3.0333, lng: 101.4500 },
  { city: 'Ampang', state: 'Selangor', lat: 3.1500, lng: 101.7667 },
  { city: 'Cheras', state: 'Selangor', lat: 3.0833, lng: 101.7500 },
  { city: 'Sri Petaling', state: 'Selangor', lat: 3.0778, lng: 101.7028 },
  { city: 'Bukit Jalil', state: 'Selangor', lat: 3.0573, lng: 101.6978 },
  { city: 'Kepong', state: 'Selangor', lat: 3.2189, lng: 101.6389 },
  { city: 'Setia Alam', state: 'Selangor', lat: 3.1014, lng: 101.4444 },
  { city: 'Sunway', state: 'Selangor', lat: 3.0683, lng: 101.6069 },
  { city: 'Sunway Pyramid', state: 'Selangor', lat: 3.0683, lng: 101.6069 }, // Landmark/Shopping area
  { city: 'Kajang', state: 'Selangor', lat: 2.9922, lng: 101.7883 },
  { city: 'Selayang', state: 'Selangor', lat: 3.2617, lng: 101.6500 },
  { city: 'Rawang', state: 'Selangor', lat: 3.3214, lng: 101.5769 },
  { city: 'Sepang', state: 'Selangor', lat: 2.7297, lng: 101.7414 },
  { city: 'Kuala Selangor', state: 'Selangor', lat: 3.3392, lng: 101.2525 },
  { city: 'Banting', state: 'Selangor', lat: 2.8136, lng: 101.5011 },
  { city: 'Jenjarom', state: 'Selangor', lat: 2.9667, lng: 101.5000 },
  { city: 'Cyberjaya', state: 'Selangor', lat: 2.9167, lng: 101.6500 },
  { city: 'Puchong', state: 'Selangor', lat: 3.0167, lng: 101.6167 },
  { city: 'Seri Kembangan', state: 'Selangor', lat: 3.0167, lng: 101.7167 },
  { city: 'Bandar Sunway', state: 'Selangor', lat: 3.0683, lng: 101.6069 },
  { city: 'Damansara', state: 'Selangor', lat: 3.1333, lng: 101.6000 },
  { city: 'Kota Damansara', state: 'Selangor', lat: 3.1547, lng: 101.5892 },
  { city: 'Bangi', state: 'Selangor', lat: 2.9264, lng: 101.7731 },
  { city: 'Semenyih', state: 'Selangor', lat: 2.9500, lng: 101.8500 },

  // Terengganu
  { city: 'Kuala Terengganu', state: 'Terengganu', lat: 5.3302, lng: 103.1408 },
  { city: 'Kemaman', state: 'Terengganu', lat: 4.2333, lng: 103.4167 },
  { city: 'Dungun', state: 'Terengganu', lat: 4.7667, lng: 103.4167 },
  { city: 'Marang', state: 'Terengganu', lat: 5.2083, lng: 103.2111 },
  { city: 'Kuala Besut', state: 'Terengganu', lat: 5.8294, lng: 102.5575 },
  { city: 'Jerteh', state: 'Terengganu', lat: 5.7333, lng: 102.5000 },

  // Kuala Lumpur
  { city: 'Kuala Lumpur', state: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
  { city: 'Bangsar', state: 'Kuala Lumpur', lat: 3.1283, lng: 101.6731 },
  { city: 'Bukit Bintang', state: 'Kuala Lumpur', lat: 3.1478, lng: 101.7125 },
  { city: 'Sentul', state: 'Kuala Lumpur', lat: 3.1833, lng: 101.6833 },
  { city: 'Titiwangsa', state: 'Kuala Lumpur', lat: 3.1833, lng: 101.7000 },

  // Putrajaya
  { city: 'Putrajaya', state: 'Putrajaya', lat: 2.9264, lng: 101.6964 },

  // Labuan
  { city: 'Labuan', state: 'Labuan', lat: 5.2831, lng: 115.2308 },

  // Sabah
  { city: 'Kota Kinabalu', state: 'Sabah', lat: 5.9804, lng: 116.0735 },
  { city: 'Sandakan', state: 'Sabah', lat: 5.8402, lng: 118.1179 },
  { city: 'Tawau', state: 'Sabah', lat: 4.2481, lng: 117.8933 },
  { city: 'Lahad Datu', state: 'Sabah', lat: 5.0322, lng: 118.3400 },
  { city: 'Keningau', state: 'Sabah', lat: 5.3394, lng: 116.1631 },
  { city: 'Semporna', state: 'Sabah', lat: 4.4783, lng: 118.6111 },
  { city: 'Kudat', state: 'Sabah', lat: 6.8833, lng: 116.8333 },
  { city: 'Beaufort', state: 'Sabah', lat: 5.3472, lng: 115.7481 },
  { city: 'Papar', state: 'Sabah', lat: 5.7333, lng: 115.9333 },
  { city: 'Ranau', state: 'Sabah', lat: 5.9500, lng: 116.6833 },

  // Sarawak
  { city: 'Kuching', state: 'Sarawak', lat: 1.5535, lng: 110.3593 },
  { city: 'Miri', state: 'Sarawak', lat: 4.3997, lng: 113.9914 },
  { city: 'Sibu', state: 'Sarawak', lat: 2.2973, lng: 111.8295 },
  { city: 'Bintulu', state: 'Sarawak', lat: 3.1667, lng: 113.0333 },
  { city: 'Limbang', state: 'Sarawak', lat: 4.7500, lng: 115.0000 },
  { city: 'Sarikei', state: 'Sarawak', lat: 2.1167, lng: 111.5167 },
  { city: 'Kapit', state: 'Sarawak', lat: 2.0167, lng: 112.9333 },
  { city: 'Sri Aman', state: 'Sarawak', lat: 1.2333, lng: 111.4667 },
  { city: 'Betong', state: 'Sarawak', lat: 1.0833, lng: 111.5500 },
  { city: 'Mukah', state: 'Sarawak', lat: 2.9000, lng: 112.0833 },
];

/**
 * Get city coordinates by city name (case-insensitive)
 */
export function getCityCoordinates(cityName) {
  if (!cityName) return null;

  const normalized = cityName.trim().toLowerCase();
  const city = MALAYSIA_CITIES.find(c => c.city.toLowerCase() === normalized);

  return city ? { lat: city.lat, lng: city.lng, state: city.state } : null;
}

/**
 * Get all cities for a specific state
 */
export function getCitiesByState(stateName) {
  return MALAYSIA_CITIES.filter(c => c.state === stateName);
}

/**
 * Search cities by partial name
 */
export function searchCities(query) {
  if (!query) return [];

  const normalized = query.trim().toLowerCase();
  return MALAYSIA_CITIES.filter(c =>
    c.city.toLowerCase().includes(normalized) ||
    c.state.toLowerCase().includes(normalized)
  );
}
