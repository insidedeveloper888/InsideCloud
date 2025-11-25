import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Users, ChevronDown } from 'lucide-react';
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

export default function SalesPerformanceChart({ salesOrders, salesPersons, completedStatusKey }) {
  const [period, setPeriod] = useState('monthly');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);
  const personDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (personDropdownRef.current && !personDropdownRef.current.contains(event.target)) {
        setIsPersonDropdownOpen(false);
      }
    };

    if (isPersonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPersonDropdownOpen]);

  const chartData = useMemo(() => {
    if (!completedStatusKey || !salesOrders.length) return [];

    // Filter completed orders
    let filteredOrders = salesOrders.filter(order => order.status === completedStatusKey);

    // Filter by selected sales person
    if (selectedPerson !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.sales_person_individual_id === selectedPerson);
    }

    // Group by period and sales person
    const grouped = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    filteredOrders.forEach(order => {
      const date = new Date(order.order_date);
      let periodKey;

      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
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
          periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          periodKey = String(date.getFullYear());
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      const personId = order.sales_person_individual_id || 'unassigned';

      if (!grouped[periodKey]) {
        grouped[periodKey] = {};
      }

      if (!grouped[periodKey][personId]) {
        grouped[periodKey][personId] = { revenue: 0, count: 0 };
      }

      grouped[periodKey][personId].revenue += order.total_amount || 0;
      grouped[periodKey][personId].count += 1;
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

    if (selectedPerson === 'all') {
      // Show top 5 performers across all periods
      const personTotals = {};
      Object.values(grouped).forEach(periodData => {
        Object.entries(periodData).forEach(([personId, { revenue }]) => {
          personTotals[personId] = (personTotals[personId] || 0) + revenue;
        });
      });

      const topPeople = Object.entries(personTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([personId]) => personId);

      return allPeriods.map(periodKey => {
        const data = { period: periodKey };
        topPeople.forEach(personId => {
          data[personId] = grouped[periodKey]?.[personId]?.revenue || 0;
        });
        return data;
      });
    } else {
      // Show selected person only
      return allPeriods.map(periodKey => ({
        period: periodKey,
        [selectedPerson]: grouped[periodKey]?.[selectedPerson]?.revenue || 0,
      }));
    }
  }, [salesOrders, period, selectedPerson, completedStatusKey]);

  // Get unique person IDs from chart data
  const personIds = useMemo(() => {
    if (!chartData.length) return [];
    const ids = new Set();
    chartData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'period') ids.add(key);
      });
    });
    return Array.from(ids);
  }, [chartData]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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

  const getPersonName = (personId) => {
    if (personId === 'unassigned') return 'Unassigned';
    const person = salesPersons.find(p => p.id === personId);
    return person?.display_name || 'Unknown';
  };

  const chartJsData = useMemo(() => {
    if (!chartData.length) return { labels: [], datasets: [] };

    const labels = chartData.map(d => formatPeriodLabel(d.period));
    const datasets = personIds.map((personId, index) => ({
      label: getPersonName(personId),
      data: chartData.map(d => d[personId] || 0),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1,
    }));

    return { labels, datasets };
  }, [chartData, personIds, period]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: selectedPerson === 'all',
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: selectedPerson === 'all',
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
      x: {
        stacked: selectedPerson === 'all',
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Sales Performance by Person</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sales Person Filter */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <div className="relative" ref={personDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPersonDropdownOpen(!isPersonDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors min-w-[180px]"
              >
                {selectedPerson === 'all' ? (
                  <span className="flex-1 text-left">All Sales Persons</span>
                ) : (() => {
                  const person = salesPersons.find(p => p.id === selectedPerson);
                  if (!person) return <span className="flex-1 text-left">All Sales Persons</span>;
                  return (
                    <>
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.display_name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white flex-shrink-0">
                          {person.display_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="flex-1 text-left">{person.display_name}</span>
                    </>
                  );
                })()}
                <ChevronDown size={16} className={`text-gray-500 transition-transform flex-shrink-0 ${isPersonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isPersonDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* "All" option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPerson('all');
                      setIsPersonDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${
                      selectedPerson === 'all' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-gray-900">All Sales Persons</span>
                  </button>

                  {/* Person options */}
                  {salesPersons.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        setSelectedPerson(person.id);
                        setIsPersonDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${
                        selectedPerson === person.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.display_name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white flex-shrink-0">
                          {person.display_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-900">{person.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Period Filter */}
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
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No completed orders to display
        </div>
      ) : (
        <div className="h-80">
          <Bar data={chartJsData} options={options} />
        </div>
      )}
    </div>
  );
}
