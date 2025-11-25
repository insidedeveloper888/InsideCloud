import React, { useMemo } from 'react';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesPersonRankingChart({ salesOrders, salesPersons, completedStatusKey }) {
  const rankings = useMemo(() => {
    if (!completedStatusKey || !salesOrders.length) return [];

    // Filter completed orders
    const completedOrders = salesOrders.filter(order => order.status === completedStatusKey);

    // Group by sales person
    const personStats = {};
    completedOrders.forEach(order => {
      const personId = order.sales_person_individual_id || 'unassigned';
      if (!personStats[personId]) {
        personStats[personId] = {
          revenue: 0,
          orderCount: 0,
        };
      }
      personStats[personId].revenue += parseFloat(order.total_amount || 0);
      personStats[personId].orderCount += 1;
    });

    // Convert to array and sort by revenue
    const rankingArray = Object.entries(personStats).map(([personId, stats]) => {
      const person = salesPersons.find(p => p.id === personId);
      return {
        personId,
        name: person?.display_name || 'Unassigned',
        avatar_url: person?.avatar_url,
        revenue: stats.revenue,
        orderCount: stats.orderCount,
        avgOrderValue: stats.revenue / stats.orderCount,
      };
    });

    return rankingArray.sort((a, b) => b.revenue - a.revenue);
  }, [salesOrders, salesPersons, completedStatusKey]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const chartData = useMemo(() => {
    const topRankings = rankings.slice(0, 10);
    return {
      labels: topRankings.map(r => r.name),
      datasets: [
        {
          label: 'Revenue',
          data: topRankings.map(r => r.revenue),
          backgroundColor: topRankings.map((_, index) => {
            if (index === 0) return 'rgba(234, 179, 8, 0.8)'; // Gold
            if (index === 1) return 'rgba(148, 163, 184, 0.8)'; // Silver
            if (index === 2) return 'rgba(205, 127, 50, 0.8)'; // Bronze
            return 'rgba(59, 130, 246, 0.8)'; // Blue
          }),
          borderColor: topRankings.map((_, index) => {
            if (index === 0) return 'rgb(234, 179, 8)';
            if (index === 1) return 'rgb(148, 163, 184)';
            if (index === 2) return 'rgb(205, 127, 50)';
            return 'rgb(59, 130, 246)';
          }),
          borderWidth: 2,
        },
      ],
    };
  }, [rankings]);

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const ranking = rankings[context.dataIndex];
            return [
              `Revenue: ${formatCurrency(ranking.revenue)}`,
              `Orders: ${ranking.orderCount}`,
              `Avg: ${formatCurrency(ranking.avgOrderValue)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  const getMedalIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Award className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-600" />;
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Top Sales Persons</h3>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No completed orders to display
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-96">
            <Bar data={chartData} options={options} />
          </div>

          {/* Top 3 Details */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankings.slice(0, 3).map((person, index) => (
                <div
                  key={person.personId}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'border-yellow-400 bg-yellow-50' :
                    index === 1 ? 'border-gray-400 bg-gray-50' :
                    'border-orange-400 bg-orange-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getMedalIcon(index)}
                    <div className="flex items-center gap-2 flex-1">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">{person.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(person.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-semibold text-gray-900">{person.orderCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Value:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(person.avgOrderValue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
