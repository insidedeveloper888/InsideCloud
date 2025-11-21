import fetch from 'node-fetch';
import * as d3 from 'd3-geo';

const GEOJSON_URL = 'https://raw.githubusercontent.com/mptwaktusolat/jakim.geojson/master/malaysia.state.geojson';

// Map state codes/names from GeoJSON to our application's state names
const STATE_MAPPING = {
    'JHR': 'Johor',
    'KDH': 'Kedah',
    'KTN': 'Kelantan',
    'MLK': 'Melaka',
    'NSN': 'Negeri Sembilan',
    'PHG': 'Pahang',
    'PNG': 'Penang',
    'PRK': 'Perak',
    'PLS': 'Perlis',
    'SBH': 'Sabah',
    'SWK': 'Sarawak',
    'SGR': 'Selangor',
    'TRG': 'Terengganu',
    'KUL': 'Kuala Lumpur',
    'LBN': 'Labuan',
    'PJY': 'Putrajaya'
};

async function generatePaths() {
    console.log('Fetching GeoJSON...');
    const response = await fetch(GEOJSON_URL);
    const geojson = await response.json();

    // Create a projection
    // Use fitSize to automatically scale and center the map within the 600x500 viewbox
    const projection = d3.geoMercator()
        .fitSize([600, 500], geojson);

    const pathGenerator = d3.geoPath().projection(projection);

    const paths = {};

    console.log('Generating paths...');
    geojson.features.forEach(feature => {
        const stateCode = feature.properties.state || feature.id;
        const stateName = STATE_MAPPING[stateCode];

        if (stateName) {
            const d = pathGenerator(feature);
            paths[stateName] = d;
            console.log(`Generated path for ${stateName}`);
        } else {
            console.warn(`Unknown state code: ${stateCode}`);
        }
    });

    // Output the result in a format we can copy-paste
    console.log('\n\n// Copy this into malaysiaSVGMap.js');
    console.log('export const MALAYSIA_SVG_PATHS = {');
    Object.entries(paths).forEach(([name, d]) => {
        console.log(`  '${name}': '${d}',`);
    });
    console.log('};');

    // Also output label positions (centroids)
    console.log('\n// Label positions (centroids)');
    console.log('export const STATE_LABEL_POSITIONS = {');
    geojson.features.forEach(feature => {
        const stateCode = feature.properties.state || feature.id;
        const stateName = STATE_MAPPING[stateCode];
        if (stateName) {
            const centroid = pathGenerator.centroid(feature);
            console.log(`  '${stateName}': { x: ${Math.round(centroid[0])}, y: ${Math.round(centroid[1])} },`);
        }
    });
    console.log('};');
}

generatePaths().catch(console.error);
