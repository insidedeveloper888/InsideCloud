/**
 * Map View - Malaysia Customer Distribution
 * Choropleth map showing customer locations by state
 */

import React, { useState, useMemo } from 'react';
import { MALAYSIA_STATES } from '../utils/malaysiaStates';
import { MALAYSIA_SVG_PATHS, MAP_CONFIG, getLabelPosition } from '../utils/malaysiaSVGMap';

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

  // Calculate color intensity based on customer count
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

  const totalCustomers = customers.length;
  const customersWithState = customers.filter((c) => c.state).length;
  const customersWithoutState = totalCustomers - customersWithState;

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
        <div className="lg:col-span-2 border border-gray-200 rounded-lg p-6 bg-white">
          <div className="relative">
            <svg
              viewBox={MAP_CONFIG.viewBox}
              className="w-full h-auto"
              style={{ maxHeight: '600px' }}
            >
              {/* Background - Ocean */}
              <rect x="0" y="0" width="600" height="500" fill="#E0F2FE" />

              {/* State Paths - Geographic Malaysia Map */}
              {Object.entries(MALAYSIA_SVG_PATHS).map(([stateName, path]) => {
                const data = stateData[stateName];
                const isHovered = hoveredState === stateName;
                const labelPos = getLabelPosition(stateName);

                return (
                  <g key={stateName}>
                    <path
                      d={path}
                      fill={getColor(data?.count || 0)}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className={`transition-all cursor-pointer ${
                        isHovered ? 'opacity-80' : ''
                      }`}
                      style={{
                        filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' : 'none',
                      }}
                      onMouseEnter={() => setHoveredState(stateName)}
                      onMouseLeave={() => setHoveredState(null)}
                    />
                    {/* State Label - Show count if > 0 */}
                    {data && data.count > 0 && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        className="text-xs font-bold fill-white pointer-events-none select-none"
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)',
                          fontSize: '11px'
                        }}
                      >
                        {data.count}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* South China Sea Label */}
              <text
                x="230"
                y="150"
                textAnchor="middle"
                className="text-sm fill-blue-400 opacity-40 pointer-events-none select-none"
                style={{ fontSize: '14px', fontStyle: 'italic' }}
              >
                South China Sea
              </text>
            </svg>

            {/* Hover Tooltip */}
            {hoveredState && stateData[hoveredState] && (
              <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <h4 className="font-semibold text-gray-900 mb-2">{hoveredState}</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">{stateData[hoveredState].count}</span> customer{stateData[hoveredState].count !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalCustomers > 0
                    ? ((stateData[hoveredState].count / totalCustomers) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="text-xs text-gray-600">Fewer</span>
            <div className="flex gap-1">
              <div className="w-8 h-4 bg-[#E5E7EB]" title="0 customers" />
              <div className="w-8 h-4 bg-[#93C5FD]" title="1-25%" />
              <div className="w-8 h-4 bg-[#60A5FA]" title="26-50%" />
              <div className="w-8 h-4 bg-[#3B82F6]" title="51-75%" />
              <div className="w-8 h-4 bg-[#1E40AF]" title="76-100%" />
            </div>
            <span className="text-xs text-gray-600">More</span>
          </div>
        </div>

        {/* State List */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer by state</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
      {customersWithState === 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            No customers have state information yet. Add state data to contacts to see the distribution map.
          </p>
        </div>
      )}
    </div>
  );
}
