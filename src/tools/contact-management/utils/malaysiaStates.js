/**
 * Malaysia States Constants
 * List of all Malaysian states and federal territories
 */

export const MALAYSIA_STATES = [
  // States (13)
  { value: 'Johor', label: 'Johor', type: 'state' },
  { value: 'Kedah', label: 'Kedah', type: 'state' },
  { value: 'Kelantan', label: 'Kelantan', type: 'state' },
  { value: 'Melaka', label: 'Melaka', type: 'state' },
  { value: 'Negeri Sembilan', label: 'Negeri Sembilan', type: 'state' },
  { value: 'Pahang', label: 'Pahang', type: 'state' },
  { value: 'Penang', label: 'Penang', type: 'state' },
  { value: 'Perak', label: 'Perak', type: 'state' },
  { value: 'Perlis', label: 'Perlis', type: 'state' },
  { value: 'Sabah', label: 'Sabah', type: 'state' },
  { value: 'Sarawak', label: 'Sarawak', type: 'state' },
  { value: 'Selangor', label: 'Selangor', type: 'state' },
  { value: 'Terengganu', label: 'Terengganu', type: 'state' },
  // Federal Territories (3)
  { value: 'Kuala Lumpur', label: 'Kuala Lumpur', type: 'federal_territory' },
  { value: 'Labuan', label: 'Labuan', type: 'federal_territory' },
  { value: 'Putrajaya', label: 'Putrajaya', type: 'federal_territory' },
];

export const MALAYSIA_STATES_BY_TYPE = {
  states: MALAYSIA_STATES.filter(s => s.type === 'state'),
  federalTerritories: MALAYSIA_STATES.filter(s => s.type === 'federal_territory'),
};

export const STATE_VALUES = MALAYSIA_STATES.map(s => s.value);
