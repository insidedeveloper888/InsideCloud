/**
 * Malaysia GeoJSON Data
 * Simplified GeoJSON for Malaysian states
 * Coordinates are approximate for visualization purposes
 */

export const MALAYSIA_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Johor' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [103.3, 1.3], [104.3, 1.3], [104.5, 2.0], [103.8, 2.5],
          [103.3, 2.3], [102.8, 2.0], [102.5, 1.5], [103.3, 1.3]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Melaka' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [102.0, 2.0], [102.6, 2.0], [102.6, 2.5], [102.0, 2.5], [102.0, 2.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Negeri Sembilan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [101.7, 2.5], [102.8, 2.5], [102.8, 3.0], [102.3, 3.3],
          [101.7, 3.2], [101.7, 2.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Selangor' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.8, 2.8], [101.9, 2.8], [101.9, 3.7], [101.2, 3.8],
          [100.8, 3.5], [100.8, 2.8]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Kuala Lumpur' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [101.6, 3.0], [101.75, 3.0], [101.75, 3.2], [101.6, 3.2], [101.6, 3.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Putrajaya' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [101.65, 2.85], [101.75, 2.85], [101.75, 2.95], [101.65, 2.95], [101.65, 2.85]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Pahang' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [101.9, 2.8], [103.5, 2.5], [103.8, 3.2], [104.0, 4.5],
          [103.0, 4.8], [102.3, 4.5], [101.9, 3.8], [101.9, 2.8]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Perak' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.3, 3.5], [101.5, 3.5], [101.9, 4.8], [101.5, 5.6],
          [100.8, 5.8], [100.2, 5.2], [100.0, 4.5], [100.3, 3.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Penang' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.1, 5.2], [100.5, 5.2], [100.5, 5.5], [100.1, 5.5], [100.1, 5.2]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Kedah' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.6, 5.5], [100.9, 5.5], [100.9, 6.7], [100.2, 6.7],
          [100.0, 6.0], [99.6, 5.8], [99.6, 5.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Perlis' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.1, 6.4], [100.5, 6.4], [100.5, 6.7], [100.1, 6.7], [100.1, 6.4]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Kelantan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [101.2, 4.5], [102.8, 4.0], [102.8, 6.2], [101.8, 6.2],
          [101.5, 5.8], [101.2, 5.0], [101.2, 4.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Terengganu' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [102.5, 4.0], [103.5, 3.8], [103.8, 5.8], [102.8, 6.0],
          [102.5, 5.5], [102.5, 4.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Sabah' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [115.5, 4.0], [119.5, 4.5], [119.0, 7.5], [116.5, 7.5],
          [115.5, 6.5], [115.5, 4.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Sarawak' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [109.5, 0.8], [115.5, 1.0], [115.5, 5.0], [113.0, 5.5],
          [110.5, 4.5], [109.5, 2.5], [109.5, 0.8]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Labuan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [115.2, 5.2], [115.35, 5.2], [115.35, 5.35], [115.2, 5.35], [115.2, 5.2]
        ]]
      }
    }
  ]
};
