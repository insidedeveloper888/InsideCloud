import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapDataPath = path.join(__dirname, 'map_data.txt');
const targetPath = path.join(__dirname, '../../src/tools/contact-management/utils/malaysiaSVGMap.js');

const mapData = fs.readFileSync(mapDataPath, 'utf8');

// Extract the relevant parts
const pathsMatch = mapData.match(/export const MALAYSIA_SVG_PATHS = \{[\s\S]*?\};/);
const labelsMatch = mapData.match(/export const STATE_LABEL_POSITIONS = \{[\s\S]*?\};/);

if (pathsMatch && labelsMatch) {
    const newContent = `/**
 * Malaysia SVG Map Data
 * Accurate SVG paths for Malaysian states and federal territories
 * Generated from GeoJSON data
 */

${pathsMatch[0]}

// Viewbox and dimensions for the map
export const MAP_CONFIG = {
  viewBox: '0 0 600 500',
  width: 600,
  height: 500,
};

${labelsMatch[0]}

// Helper function to get label position
export function getLabelPosition(stateName) {
  return STATE_LABEL_POSITIONS[stateName] || { x: 0, y: 0 };
}
`;

    fs.writeFileSync(targetPath, newContent);
    console.log('Successfully updated malaysiaSVGMap.js');
} else {
    console.error('Failed to extract data from map_data.txt');
    if (!pathsMatch) console.error('Paths not found');
    if (!labelsMatch) console.error('Labels not found');
}
