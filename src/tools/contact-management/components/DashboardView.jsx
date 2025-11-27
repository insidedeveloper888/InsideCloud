/**
 * Dashboard View - Analytics
 */

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { hasContactType } from '../utils/contactTypeUtils';

export default function DashboardView({ contacts = [], stages = [], channels = [] }) {
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // Filter to customers only (using contact_types array)
  const customers = contacts.filter((c) => hasContactType(c, 'customer'));

  // Metrics based on customers only
  const totalCustomers = customers.length;
  // UPDATED: Use stage_type instead of hardcoded name matching
  const wonCustomers = customers.filter(
    (c) => stages.find((s) => s.id === c.current_stage_id)?.stage_type === 'won'
  ).length;
  const conversionRate =
    totalCustomers > 0 ? ((wonCustomers / totalCustomers) * 100).toFixed(1) : 0;

  const metrics = [
    { label: 'Total customers', value: totalCustomers, icon: '👥', trend: null },
    { label: 'Won customers', value: wonCustomers, icon: '✓', trend: null },
    { label: 'Conversion rate', value: `${conversionRate}%`, icon: '📈', trend: null },
    { label: 'Active contacts', value: totalCustomers - wonCustomers, icon: '⚡', trend: null },
  ];

  // Filter customers by channel for funnel
  const filteredCustomers = selectedChannelId
    ? customers.filter((c) => c.traffic_source_id === selectedChannelId)
    : customers;

  // Calculate customer funnel data
  const sortedStages = [...stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const funnelData = sortedStages.map((stage, index) => {
    const count = filteredCustomers.filter((c) => c.current_stage_id === stage.id).length;
    const previousCount = index > 0
      ? filteredCustomers.filter((c) => c.current_stage_id === sortedStages[index - 1].id).length
      : filteredCustomers.length;

    // Calculate conversion rate from previous stage
    const conversionFromPrevious = previousCount > 0
      ? ((count / previousCount) * 100).toFixed(1)
      : 100;

    return {
      stage,
      count,
      conversionFromPrevious: index === 0 ? 100 : parseFloat(conversionFromPrevious),
    };
  });

  const maxCustomerCount = Math.max(...funnelData.map((d) => d.count), 1);

  // Calculate customer distribution by traffic channel
  const channelDistribution = channels.map((channel) => {
    const count = customers.filter((c) => c.traffic_source_id === channel.id).length;
    return {
      channel,
      count,
      percentage: customers.length > 0 ? ((count / customers.length) * 100).toFixed(1) : 0,
    };
  }).filter((item) => item.count > 0);

  // Add "No Channel" category if there are customers without channel
  const customersWithoutChannel = customers.filter((c) => !c.traffic_source_id).length;
  if (customersWithoutChannel > 0) {
    channelDistribution.push({
      channel: { id: 'none', name: 'No Channel', color: '#94A3B8' },
      count: customersWithoutChannel,
      percentage: customers.length > 0 ? ((customersWithoutChannel / customers.length) * 100).toFixed(1) : 0,
    });
  }

  // Generate pie chart data
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  let currentAngle = 0;
  const pieSlices = channelDistribution.map((item, index) => {
    const percentage = parseFloat(item.percentage);
    const sliceAngle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const color = item.channel.id === 'none' ? item.channel.color : colors[index % colors.length];

    return {
      ...item,
      startAngle,
      endAngle,
      color,
    };
  });

  // Helper function to convert polar coordinates to cartesian
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Helper function to create SVG arc path
  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900">📊 Analytics</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 md:p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p className="text-xs md:text-sm text-gray-600 font-medium">{metric.label}</p>
              <span className="text-lg md:text-xl">{metric.icon}</span>
            </div>
            <p className="text-2xl md:text-4xl font-bold text-gray-900">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Customer Conversion Funnel and Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Customer Conversion Funnel */}
        <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4 md:p-6 bg-white overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Customer conversion funnel</h3>
            </div>

            {/* Channel Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 shrink-0" />
              <select
                value={selectedChannelId || ''}
                onChange={(e) => setSelectedChannelId(e.target.value || null)}
                className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full sm:w-auto"
              >
                <option value="" className="text-gray-900">All channels</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id} className="text-gray-900">
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        <div className="space-y-3 md:space-y-4">
          {funnelData.map((item, index) => {
            const widthPercentage = maxCustomerCount > 0
              ? (item.count / maxCustomerCount) * 100
              : 0;

            return (
              <div key={item.stage.id}>
                {/* Conversion Rate Indicator */}
                {index > 0 && (
                  <div className="flex items-center justify-center py-1.5 md:py-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <div className="h-6 md:h-8 w-px bg-gray-300" />
                      <span className="font-semibold">
                        {item.conversionFromPrevious}% conversion
                      </span>
                    </div>
                  </div>
                )}

                {/* Funnel Stage Bar */}
                <div className="relative">
                  <div
                    className="rounded-lg p-3 md:p-4 transition-all hover:shadow-md"
                    style={{
                      backgroundColor: `${item.stage.color}20`,
                      width: `${Math.max(widthPercentage, 25)}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      minWidth: '200px',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      {/* Stage Name */}
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.stage.color }}
                        />
                        <span className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                          {item.stage.name}
                        </span>
                      </div>
                      {/* Count and Percentage */}
                      <div className="flex items-baseline gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl font-bold text-gray-900">
                          {item.count}
                        </span>
                        <span className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">
                          ({filteredCustomers.length > 0
                            ? ((item.count / filteredCustomers.length) * 100).toFixed(0)
                            : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No customer data available</p>
            </div>
          )}
        </div>

        {/* Customer Distribution by Channel - Pie Chart */}
        <div className="border border-gray-200 rounded-lg p-4 md:p-6 bg-white">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Customer by channel</h3>
          <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
            Distribution of customers across traffic sources
          </p>

          {channelDistribution.length > 0 ? (
            <>
              {/* Pie Chart SVG - Responsive size */}
              <div className="flex justify-center mb-4 md:mb-6">
                <svg
                  className="w-40 h-40 md:w-52 md:h-52"
                  viewBox="0 0 200 200"
                >
                  {pieSlices.map((slice, index) => (
                    <path
                      key={index}
                      d={describeArc(100, 100, 90, slice.startAngle, slice.endAngle)}
                      fill={slice.color}
                      stroke="white"
                      strokeWidth="2"
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                  {/* Center circle for donut effect */}
                  <circle cx="100" cy="100" r="50" fill="white" />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    className="text-xl md:text-2xl font-bold fill-gray-900"
                  >
                    {customers.length}
                  </text>
                  <text
                    x="100"
                    y="115"
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    Total
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 md:space-y-2">
                {channelDistribution.map((item, index) => (
                  <div
                    key={item.channel.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <div
                        className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.channel.id === 'none'
                            ? item.channel.color
                            : colors[index % colors.length]
                        }}
                      />
                      <span className="text-xs md:text-sm text-gray-900 font-medium truncate">
                        {item.channel.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                      <span className="text-xs md:text-sm font-bold text-gray-900">
                        {item.count}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No customer data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
