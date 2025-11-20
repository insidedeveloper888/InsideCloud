/**
 * Map View - Malaysia Customer Distribution
 * Real geographic map using Leaflet.js
 */

import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Map as MapIcon } from 'lucide-react';
import { MALAYSIA_STATES } from '../utils/malaysiaStates';
import { MALAYSIA_GEOJSON } from '../utils/malaysiaGeoJSON';
import { getCityCoordinates } from '../utils/malaysiaCities';

// Fix default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function MapViewLeaflet({ contacts = [] }) {
  const [hoveredState, setHoveredState] = useState(null);
  const [viewMode, setViewMode] = useState('city'); // 'state' or 'city'

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

  // Calculate color based on customer count
  const getColor = (count) => {
    if (count === 0) return '#E5E7EB'; // gray-200
    const maxCount = Math.max(...Object.values(stateData).map((s) => s.count));
    const intensity = count / maxCount;

    // Blue color scale
    if (intensity > 0.75) return '#1E40AF'; // blue-800
    if (intensity > 0.5) return '#3B82F6'; // blue-600
    if (intensity > 0.25) return '#60A5FA'; // blue-400
    return '#93C5FD'; // blue-300
  };

  // Style function for GeoJSON features
  const style = (feature) => {
    const stateName = feature.properties.name;
    const data = stateData[stateName];
    const count = data ? data.count : 0;

    return {
      fillColor: getColor(count),
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.8,
    };
  };

  // Interaction handlers
  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties.name;
    const data = stateData[stateName];

    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          fillOpacity: 0.9,
        });
        setHoveredState(stateName);
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: 'white',
          fillOpacity: 0.8,
        });
        setHoveredState(null);
      },
    });

    // Bind tooltip
    if (data) {
      const percentage = customers.length > 0
        ? ((data.count / customers.length) * 100).toFixed(1)
        : 0;

      layer.bindTooltip(
        `<div style="font-family: system-ui; padding: 4px;">
          <strong style="font-size: 14px;">${stateName}</strong><br/>
          <span style="font-size: 12px;">${data.count} customer${data.count !== 1 ? 's' : ''} (${percentage}%)</span>
        </div>`,
        { sticky: true }
      );
    }
  };

  // Group customers by city with coordinates
  const cityData = useMemo(() => {
    const cityGroups = {};

    customers.forEach((customer) => {
      const city = customer.city?.trim();
      if (!city) return;

      const coords = getCityCoordinates(city);
      if (!coords) return;

      const key = city.toLowerCase();
      if (!cityGroups[key]) {
        cityGroups[key] = {
          city: city,
          coordinates: coords,
          customers: [],
          count: 0,
        };
      }

      cityGroups[key].customers.push(customer);
      cityGroups[key].count++;
    });

    return Object.values(cityGroups);
  }, [customers]);

  const totalCustomers = customers.length;
  const customersWithState = customers.filter((c) => c.state).length;
  const customersWithCity = customers.filter((c) => c.city && getCityCoordinates(c.city)).length;
  const customersWithoutLocation = totalCustomers - (viewMode === 'city' ? customersWithCity : customersWithState);

  // Malaysia center coordinates
  const center = [4.2105, 101.9758];
  const zoom = 6;

  // Create custom icon with customer count
  const createNumberedIcon = (count) => {
    const size = count > 99 ? 38 : count > 9 ? 34 : 30;
    return L.divIcon({
      html: `<div style="
        background-color: #3B82F6;
        color: white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${count > 99 ? '11px' : '13px'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${count}</div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section - Responsive layout */}
      <div className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">🗺️ Customer Distribution Map</h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('state')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                viewMode === 'state'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 active:bg-gray-50'
              }`}
            >
              <MapIcon size={16} className="shrink-0" />
              <span>By State</span>
            </button>
            <button
              onClick={() => setViewMode('city')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                viewMode === 'city'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 active:bg-gray-50'
              }`}
            >
              <MapPin size={16} className="shrink-0" />
              <span>By City</span>
            </button>
          </div>

          {/* Customer count */}
          <div className="text-xs md:text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
            <span className="font-semibold text-blue-900">
              {viewMode === 'city' ? customersWithCity : customersWithState}
            </span> customers with location
            <span className="text-blue-700"> ({customersWithoutLocation} without)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* State Choropleth View */}
              {viewMode === 'state' && (
                <GeoJSON
                  data={MALAYSIA_GEOJSON}
                  style={style}
                  onEachFeature={onEachFeature}
                />
              )}

              {/* City Pins View */}
              {viewMode === 'city' && (
                <MarkerClusterGroup
                  chunkedLoading
                  showCoverageOnHover={false}
                  maxClusterRadius={50}
                  spiderfyOnMaxZoom={true}
                  iconCreateFunction={(cluster) => {
                    const count = cluster.getChildCount();
                    const size = count > 99 ? 45 : count > 9 ? 40 : 35;
                    return L.divIcon({
                      html: `<div style="
                        background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
                        color: white;
                        border-radius: 50%;
                        width: ${size}px;
                        height: ${size}px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: ${count > 99 ? '12px' : '14px'};
                        border: 3px solid white;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                      ">${count}</div>`,
                      className: 'custom-cluster-icon',
                      iconSize: [size, size],
                    });
                  }}
                >
                  {cityData.map((city, index) => (
                    <Marker
                      key={index}
                      position={[city.coordinates.lat, city.coordinates.lng]}
                      icon={createNumberedIcon(city.count)}
                    >
                      <Popup>
                        <div className="p-2" style={{ fontFamily: 'system-ui' }}>
                          <h3 className="font-bold text-base mb-2 text-gray-900">
                            {city.city}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {city.coordinates.state}
                          </p>
                          <p className="text-sm mb-3">
                            <span className="font-semibold text-gray-900">{city.count}</span> customer{city.count !== 1 ? 's' : ''}
                          </p>
                          <div className="border-t pt-2 mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Customers:</p>
                            <div className="max-h-40 overflow-y-auto">
                              {city.customers.slice(0, 10).map((customer, idx) => (
                                <div key={idx} className="text-xs text-gray-600 py-0.5">
                                  • {customer.first_name} {customer.last_name}
                                </div>
                              ))}
                              {city.customers.length > 10 && (
                                <div className="text-xs text-gray-500 italic pt-1">
                                  ... and {city.customers.length - 10} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-4">
            <span className="text-xs text-gray-600">Fewer customers</span>
            <div className="flex gap-1">
              <div className="w-8 h-4 bg-[#E5E7EB]" title="0 customers" />
              <div className="w-8 h-4 bg-[#93C5FD]" title="1-25%" />
              <div className="w-8 h-4 bg-[#60A5FA]" title="26-50%" />
              <div className="w-8 h-4 bg-[#3B82F6]" title="51-75%" />
              <div className="w-8 h-4 bg-[#1E40AF]" title="76-100%" />
            </div>
            <span className="text-xs text-gray-600">More customers</span>
          </div>
        </div>

        {/* State List */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customers by state</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {Object.values(stateData)
              .sort((a, b) => b.count - a.count)
              .map((data) => (
                <div
                  key={data.value}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    hoveredState === data.value
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHoveredState(data.value)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getColor(data.count) }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {data.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {data.count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({totalCustomers > 0
                        ? ((data.count / totalCustomers) * 100).toFixed(0)
                        : 0}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* No Data Warning */}
      {viewMode === 'state' && customersWithState === 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            No customers have state information yet. Add state data to contacts to see the distribution map.
          </p>
        </div>
      )}

      {viewMode === 'city' && customersWithCity === 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            No customers have city information yet. Add city data to contacts to see pins on the map.
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Cities must match our database (e.g., "Kuala Lumpur", "Penang", "Johor Bahru"). Check the city field in your contact forms.
          </p>
        </div>
      )}
    </div>
  );
}
