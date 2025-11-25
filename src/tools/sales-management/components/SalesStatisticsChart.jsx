import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
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

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function SalesStatisticsChart({ salesOrders, completedStatusKey }) {
  const [period, setPeriod] = useState('monthly');

  const chartData = useMemo(() => {
    if (!completedStatusKey || !salesOrders.length) return [];

    // Filter only completed orders
    const completedOrders = salesOrders.filter(order => order.status === completedStatusKey);

    // Group orders by period
    const grouped = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    completedOrders.forEach(order => {
      const date = new Date(order.order_date);
      let key;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // ISO week number
          const getISOWeek = (d) => {
            const target = new Date(d.valueOf());
            const dayNr = (d.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNr + 3);
            const firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
              target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            return 1 + Math.ceil((firstThursday - target) / 604800000);
          };
          const weekNum = getISOWeek(date);
          key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, count: 0 };
      }
      grouped[key].revenue += order.total_amount || 0;
      grouped[key].count += 1;
    });

    // Generate all periods for the current timeframe
    let allPeriods = [];

    if (period === 'daily') {
      // Show all days of current week (Monday to Sunday, ISO 8601)
      const getCurrentWeekDays = () => {
        const today = new Date(now);
        const dayOfWeek = (today.getDay() + 6) % 7; // Convert Sunday=0 to Sunday=6, Monday=0
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek); // Get Monday of current week

        const days = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          days.push(day.toISOString().split('T')[0]);
        }
        return days;
      };
      allPeriods = getCurrentWeekDays();
    } else if (period === 'monthly') {
      // Show all 12 months of current year
      for (let m = 0; m < 12; m++) {
        const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        allPeriods.push(key);
      }
    } else if (period === 'weekly') {
      // Show weeks of current month only
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);

      const getISOWeek = (d) => {
        const target = new Date(d.valueOf());
        const dayNr = (d.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - target) / 604800000);
      };

      const weeks = new Set();
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const weekNum = getISOWeek(d);
        const year = d.getFullYear();
        weeks.add(`${year}-W${String(weekNum).padStart(2, '0')}`);
      }
      allPeriods = Array.from(weeks).sort();
    } else {
      // For quarterly, yearly - show last 12 periods with data
      allPeriods = Object.keys(grouped).sort().slice(-12);
    }

    // Map periods to data, filling with 0 for missing periods
    return allPeriods.map(key => ({
      period: key,
      revenue: grouped[key]?.revenue || 0,
      count: grouped[key]?.count || 0,
    }));
  }, [salesOrders, period, completedStatusKey]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPeriodLabel = (periodKey) => {
    switch (period) {
      case 'daily':
        const date = new Date(periodKey);
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      case 'weekly':
        // Extract week number from format "2025-W51"
        const weekMatch = periodKey.match(/W(\d+)/);
        return weekMatch ? `Week ${weekMatch[1]}` : periodKey;
      case 'monthly':
        const [year, month] = periodKey.split('-');
        return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
      case 'quarterly':
        return periodKey;
      case 'yearly':
        return periodKey;
      default:
        return periodKey;
    }
  };

  const chartJsData = useMemo(() => {
    return {
      labels: chartData.map(d => formatPeriodLabel(d.period)),
      datasets: [
        {
          label: 'Revenue',
          data: chartData.map(d => d.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  }, [chartData, period]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const revenue = context.parsed.y;
            const dataPoint = chartData[context.dataIndex];
            return [
              `Revenue: ${formatCurrency(revenue)}`,
              `Orders: ${dataPoint.count}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sales Revenue Trend</h3>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No completed orders to display
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-80">
            <Bar data={chartJsData} options={options} />
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Total for period: <span className="font-semibold text-gray-900">
                  {formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0))}
                </span>
              </div>
              <div className="text-gray-600">
                Orders: <span className="font-semibold text-gray-900">
                  {chartData.reduce((sum, d) => sum + d.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
