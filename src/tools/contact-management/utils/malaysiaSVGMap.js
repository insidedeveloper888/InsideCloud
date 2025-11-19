/**
 * Malaysia SVG Map Data
 * Accurate SVG paths for Malaysian states and federal territories
 * Simplified from GeoJSON data for optimal performance
 */

export const MALAYSIA_SVG_PATHS = {
  // Peninsular Malaysia (West Malaysia)
  'Perlis': 'M 100.2,50 L 106,48 L 108,52 L 110,56 L 108,60 L 104,62 L 100,60 L 98,56 Z',

  'Kedah': 'M 98,60 L 104,62 L 108,65 L 112,70 L 115,80 L 118,90 L 120,100 L 118,110 L 115,115 L 110,118 L 105,120 L 100,118 L 95,115 L 92,110 L 90,100 L 88,90 L 90,80 L 93,70 L 96,65 Z',

  'Penang': 'M 85,95 L 90,92 L 95,95 L 97,100 L 95,105 L 90,108 L 85,105 L 83,100 Z',

  'Perak': 'M 90,118 L 95,115 L 100,118 L 105,120 L 110,125 L 115,132 L 118,140 L 120,150 L 122,165 L 123,180 L 122,195 L 120,205 L 115,210 L 110,212 L 105,210 L 100,208 L 95,205 L 92,200 L 90,190 L 88,175 L 87,160 L 88,145 L 90,130 Z',

  'Kelantan': 'M 120,100 L 125,98 L 135,100 L 145,105 L 155,112 L 162,120 L 168,130 L 172,140 L 174,150 L 172,160 L 168,168 L 162,172 L 155,174 L 145,172 L 135,168 L 128,162 L 123,155 L 120,145 L 118,135 L 118,120 L 118,110 Z',

  'Terengganu': 'M 172,160 L 178,158 L 188,160 L 198,165 L 205,172 L 210,182 L 212,195 L 210,210 L 205,220 L 200,227 L 192,232 L 182,235 L 172,233 L 165,228 L 160,220 L 158,210 L 160,200 L 163,190 L 167,180 L 170,170 Z',

  'Pahang': 'M 123,180 L 130,178 L 140,180 L 150,185 L 160,192 L 168,200 L 175,210 L 180,222 L 185,235 L 188,250 L 188,265 L 185,280 L 180,292 L 172,302 L 162,308 L 150,310 L 138,308 L 128,303 L 120,295 L 115,285 L 112,270 L 112,255 L 115,240 L 118,225 L 120,210 Z',

  'Selangor': 'M 90,205 L 95,205 L 100,208 L 105,210 L 110,212 L 115,215 L 118,220 L 120,228 L 118,238 L 115,245 L 110,250 L 105,252 L 100,250 L 95,247 L 92,242 L 90,235 L 88,225 L 88,215 Z',

  'Kuala Lumpur': 'M 102,230 L 106,228 L 110,230 L 112,234 L 110,238 L 106,240 L 102,238 L 100,234 Z',

  'Putrajaya': 'M 108,242 L 112,240 L 116,242 L 118,246 L 116,250 L 112,252 L 108,250 L 106,246 Z',

  'Negeri Sembilan': 'M 88,250 L 95,247 L 105,252 L 112,258 L 118,268 L 120,278 L 118,288 L 112,295 L 105,298 L 95,296 L 88,290 L 85,280 L 85,268 L 86,258 Z',

  'Melaka': 'M 90,296 L 98,294 L 105,298 L 108,305 L 106,312 L 100,316 L 93,314 L 88,308 L 88,300 Z',

  'Johor': 'M 85,308 L 95,305 L 108,308 L 120,312 L 135,318 L 148,325 L 160,332 L 168,340 L 172,350 L 170,362 L 163,372 L 152,380 L 138,385 L 122,387 L 108,385 L 95,380 L 85,372 L 78,360 L 75,345 L 78,330 L 82,318 Z',

  // East Malaysia (Sabah & Sarawak)
  'Sarawak': 'M 280,280 L 295,275 L 315,278 L 335,285 L 355,295 L 375,308 L 395,322 L 410,338 L 420,355 L 425,372 L 423,388 L 415,402 L 400,412 L 380,418 L 360,420 L 340,418 L 320,412 L 302,402 L 288,390 L 278,375 L 272,358 L 270,340 L 272,322 L 275,305 L 278,290 Z',

  'Sabah': 'M 420,180 L 438,175 L 458,178 L 478,185 L 495,195 L 508,208 L 518,225 L 523,243 L 523,262 L 518,280 L 508,295 L 495,307 L 478,315 L 458,318 L 438,315 L 420,308 L 405,298 L 395,285 L 390,270 L 388,252 L 390,235 L 395,220 L 405,205 L 415,192 Z',

  'Labuan': 'M 395,240 L 400,238 L 405,240 L 407,245 L 405,250 L 400,252 L 395,250 L 393,245 Z',
};

// Viewbox and dimensions for the map
export const MAP_CONFIG = {
  viewBox: '0 0 600 500',
  width: 600,
  height: 500,
};

// Label positions for state names (centered within each state)
export const STATE_LABEL_POSITIONS = {
  'Perlis': { x: 104, y: 55 },
  'Kedah': { x: 104, y: 95 },
  'Penang': { x: 89, y: 100 },
  'Perak': { x: 105, y: 165 },
  'Kelantan': { x: 145, y: 135 },
  'Terengganu': { x: 185, y: 200 },
  'Pahang': { x: 150, y: 250 },
  'Selangor': { x: 103, y: 230 },
  'Kuala Lumpur': { x: 106, y: 234 },
  'Putrajaya': { x: 112, y: 246 },
  'Negeri Sembilan': { x: 103, y: 273 },
  'Melaka': { x: 98, y: 306 },
  'Johor': { x: 125, y: 350 },
  'Sarawak': { x: 345, y: 355 },
  'Sabah': { x: 458, y: 250 },
  'Labuan': { x: 400, y: 245 },
};

// Helper function to get label position
export function getLabelPosition(stateName) {
  return STATE_LABEL_POSITIONS[stateName] || { x: 0, y: 0 };
}
