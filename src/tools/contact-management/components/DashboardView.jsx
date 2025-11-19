/**
 * Dashboard View - Analytics
 */

import React from 'react';

export default function DashboardView({ contacts = [], stages = [] }) {
  const totalContacts = contacts.length;
  const wonContacts = contacts.filter(
    (c) => stages.find((s) => s.id === c.current_stage_id)?.name?.toLowerCase() === 'won'
  ).length;
  const conversionRate =
    totalContacts > 0 ? ((wonContacts / totalContacts) * 100).toFixed(1) : 0;

  const metrics = [
    { label: '总联系人', value: totalContacts, color: '#2196F3' },
    { label: '已成交', value: wonContacts, color: '#4CAF50' },
    { label: '转化率', value: `${conversionRate}%`, color: '#FF9800' },
    { label: '活跃', value: totalContacts - wonContacts, color: '#9C27B0' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">📊 数据分析</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
            <p
              className="text-4xl font-bold"
              style={{ color: metric.color }}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Stage Distribution */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按阶段分布</h3>
        <div className="space-y-2">
          {stages.map((stage) => {
            const count = contacts.filter(
              (c) => c.current_stage_id === stage.id
            ).length;
            return (
              <div
                key={stage.id}
                className="flex justify-between items-center p-4 rounded-lg"
                style={{ backgroundColor: `${stage.color}10` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {stage.name}
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-900">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
