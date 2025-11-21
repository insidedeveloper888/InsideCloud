/**
 * Map View - Malaysia Customer Distribution (Choropleth)
 * Uses Leaflet to display a proper choropleth map with GeoJSON state boundaries
 */

import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MALAYSIA_STATES } from '../utils/malaysiaStates';
import malaysiaGeoJSON from '../../../assets/map/geoBoundaries-MYS-ADM1.geojson';

export default function MapView({ contacts = [] }) {
  const [hoveredState, setHoveredState] = useState(null);

  // Filter to customers only
  const customers = contacts.filter((c) => c.contact_type === 'customer');

  // Calculate customer count per state
  const stateData = useMemo(() => {
    const stateCounts = {};

    MALAYSIA_STATES.forEach((state) => {
      stateCounts[state.value] = {
        ...state,
        count: 0,
        customers: [],
      };
    });

    customers.forEach((customer) => {
      const state = customer.state;
      if (state && stateCounts[state]) {
        stateCounts[state].count++;
        stateCounts[state].customers.push(customer);
      }
    });

    return stateCounts;
  }, [customers]);

  const maxCount = Math.max(...Object.values(stateData).map((s) => s.count));

  // Map state names from GeoJSON to your application's state names
  const getStateNameFromFeature = (feature) => {
    const featureName = feature.properties?.shapeName;

    // Mapping from GeoJSON names to your application's state names
    const geoJSONToAppStateMapping = {
      'Malacca': 'Melaka',  // GeoJSON uses "Malacca", app uses "Melaka"
      'Penang': 'Penang',
      'Johor': 'Johor',
      'Kedah': 'Kedah',
      'Kelantan': 'Kelantan',
      'Negeri Sembilan': 'Negeri Sembilan',
      'Pahang': 'Pahang',
      'Perak': 'Perak',
      'Perlis': 'Perlis',
      'Selangor': 'Selangor',
      'Terengganu': 'Terengganu',
      'Sabah': 'Sabah',
      'Sarawak': 'Sarawak',
      'Kuala Lumpur': 'Kuala Lumpur',
      'Labuan': 'Labuan',
      'Putrajaya': 'Putrajaya',
    };

    return geoJSONToAppStateMapping[featureName] || featureName;
  };

  // Get color based on customer count
  const getColor = (count) => {
    if (count === 0 || maxCount === 0) return '#F3F4F6'; // gray-100

    // 9-step Blue scale from Tailwind
    const colors = [
      '#DBEAFE', // blue-100
      '#BFDBFE', // blue-200
      '#93C5FD', // blue-300
      '#60A5FA', // blue-400
      '#3B82F6', // blue-500
      '#2563EB', // blue-600
      '#1D4ED8', // blue-700
      '#1E40AF', // blue-800
      '#1E3A8A', // blue-900
    ];

    // Calculate index using square root for better distribution
    const ratio = count / maxCount;
    const index = Math.min(
      Math.floor(Math.sqrt(ratio) * colors.length),
      colors.length - 1
    );

    return colors[index];
  };

  // Style function for GeoJSON features
  const style = (feature) => {
    const stateName = getStateNameFromFeature(feature);
    const count = stateData[stateName]?.count || 0;

    return {
      fillColor: getColor(count),
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7,
    };
  };

  // Highlight feature on hover
  const highlightFeature = (e) => {
    const layer = e.target;
    const stateName = getStateNameFromFeature(layer.feature);

    layer.setStyle({
      weight: 3,
      color: '#1F2937',
      fillOpacity: 0.9,
    });

    layer.bringToFront();
    setHoveredState(stateName);
  };

  // Reset highlight
  const resetHighlight = (e) => {
    const layer = e.target;
    layer.setStyle(style(layer.feature));
    setHoveredState(null);
  };

  // Event handlers for each feature
  const onEachFeature = (feature, layer) => {
    const stateName = getStateNameFromFeature(feature);
    const count = stateData[stateName]?.count || 0;

    // Bind tooltip
    layer.bindTooltip(
      `<div style="font-weight: bold; margin-bottom: 4px;">${stateName}</div>
       <div>Customers: <strong>${count}</strong></div>`,
      {
        sticky: true,
        direction: 'top',
        className: 'custom-tooltip',
      }
    );

    // Attach event handlers
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  };

  const totalCustomers = customers.length;
  const customersWithState = customers.filter((c) => c.state).length;
  const customersWithoutState = totalCustomers - customersWithState;

  // Malaysia center coordinates
  const center = [4.2105, 101.9758];
  const zoom = 6;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">🗺️ Customer Distribution Map</h2>
        <div className="text-sm text-gray-600">
          {customersWithState} customers with location data ({customersWithoutState} without state)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '500px', width: '100%' }}
            scrollWheelZoom={false}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              data={malaysiaGeoJSON}
              style={style}
              onEachFeature={onEachFeature}
            />
          </MapContainer>

          {/* Legend */}
          <div className="p-6 flex flex-col items-center gap-2 bg-white border-t border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Density
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">Low</span>
              <div className="flex rounded-md overflow-hidden border border-gray-200">
                {['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A8A'].map((color) => (
                  <div key={color} className="w-8 h-4" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-xs text-gray-600">High</span>
            </div>
          </div>
        </div>

        {/* State List */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white flex flex-col h-[600px]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer by State</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {Object.values(stateData)
              .sort((a, b) => b.count - a.count)
              .map((data) => (
                <div
                  key={data.value}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border ${
                    hoveredState === data.value
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHoveredState(data.value)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: getColor(data.count) }}
                    />
                    <span className="text-sm font-medium text-gray-700">{data.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{data.count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* No Data Warning */}
      {customersWithState === 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 flex items-start gap-3">
          <div className="text-yellow-500 mt-0.5">⚠️</div>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">No location data available</h4>
            <p className="text-sm text-yellow-700 mt-1">
              None of your customers have state information recorded. Update customer profiles with
              their state to visualize the distribution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
