import React, { useState, useEffect, useMemo } from 'react';
import { FileText, User, ShoppingCart, Truck, Receipt, ChevronDown, ChevronUp, BarChart3, Users, TrendingUp, Package, Award, UserCheck } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useQuotationStatuses } from '../hooks/useQuotationStatuses';
import { useSalesOrderStatuses } from '../hooks/useSalesOrderStatuses';
import { useDeliveryOrderStatuses } from '../hooks/useDeliveryOrderStatuses';
import { useInvoiceStatuses } from '../hooks/useInvoiceStatuses';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsDashboard({ organizationSlug }) {
  const { statuses: quotationStatuses, loading: quotationStatusesLoading } = useQuotationStatuses(organizationSlug);
  const { statuses: salesOrderStatuses, loading: salesOrderStatusesLoading } = useSalesOrderStatuses(organizationSlug);
  const { statuses: deliveryOrderStatuses, loading: deliveryOrderStatusesLoading } = useDeliveryOrderStatuses(organizationSlug);
  const { statuses: invoiceStatuses, loading: invoiceStatusesLoading } = useInvoiceStatuses(organizationSlug);

  const [quotations, setQuotations] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(true);
  const [loadingDeliveryOrders, setLoadingDeliveryOrders] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Accordion states
  const [expandedSections, setExpandedSections] = useState({
    quotations: false,
    salesOrders: false,
    deliveryOrders: false,
    invoices: false,
  });

  // Chart filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Now stores month number (1-12) or empty string for all months

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch quotations
  useEffect(() => {
    const fetchQuotations = async () => {
      if (!organizationSlug) return;

      setLoadingQuotations(true);
      try {
        const response = await fetch(`/api/sales_quotations?organization_slug=${organizationSlug}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setQuotations(data || []);
        }
      } catch (error) {
        console.error('Error fetching quotations:', error);
      } finally {
        setLoadingQuotations(false);
      }
    };

    fetchQuotations();
  }, [organizationSlug]);

  // Fetch sales orders
  useEffect(() => {
    const fetchSalesOrders = async () => {
      if (!organizationSlug) return;

      setLoadingSalesOrders(true);
      try {
        const response = await fetch(`/api/sales_orders?organization_slug=${organizationSlug}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setSalesOrders(data || []);
        }
      } catch (error) {
        console.error('Error fetching sales orders:', error);
      } finally {
        setLoadingSalesOrders(false);
      }
    };

    fetchSalesOrders();
  }, [organizationSlug]);

  // Fetch delivery orders
  useEffect(() => {
    const fetchDeliveryOrders = async () => {
      if (!organizationSlug) return;

      setLoadingDeliveryOrders(true);
      try {
        const response = await fetch(`/api/delivery_orders?organization_slug=${organizationSlug}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setDeliveryOrders(data || []);
        }
      } catch (error) {
        console.error('Error fetching delivery orders:', error);
      } finally {
        setLoadingDeliveryOrders(false);
      }
    };

    fetchDeliveryOrders();
  }, [organizationSlug]);

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!organizationSlug) return;

      setLoadingInvoices(true);
      try {
        const response = await fetch(`/api/invoices?organization_slug=${organizationSlug}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setInvoices(data || []);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [organizationSlug]);

  const isLoading = quotationStatusesLoading || salesOrderStatusesLoading ||
    deliveryOrderStatusesLoading || invoiceStatusesLoading ||
    loadingQuotations || loadingSalesOrders ||
    loadingDeliveryOrders || loadingInvoices;

  // Filter states for charts
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');

  // Get available years from invoices
  const availableYears = useMemo(() => {
    const years = new Set();
    invoices.forEach(invoice => {
      if (invoice.invoice_date) {
        const year = new Date(invoice.invoice_date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  // Set default year to current year or most recent year with data
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      const currentYear = new Date().getFullYear();
      setSelectedYear(availableYears.includes(currentYear) ? currentYear.toString() : availableYears[0].toString());
    }
  }, [availableYears, selectedYear]);

  // Calculate chart data based on filters
  const chartData = useMemo(() => {
    if (!selectedYear) return [];

    const year = parseInt(selectedYear);

    if (selectedMonth) {
      // Show daily data for the selected month
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        label: `${i + 1}`,
        total: 0
      }));

      invoices.forEach(invoice => {
        if (invoice.invoice_date) {
          const invoiceDate = new Date(invoice.invoice_date);
          if (invoiceDate.getFullYear() === year && invoiceDate.getMonth() + 1 === month) {
            const day = invoiceDate.getDate() - 1;
            if (day >= 0 && day < daysInMonth) {
              dailyData[day].total += parseFloat(invoice.total_amount) || 0;
            }
          }
        }
      });

      return dailyData;
    } else {
      // Show all 12 months of the selected year
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        label: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        total: 0
      }));

      invoices.forEach(invoice => {
        if (invoice.invoice_date) {
          const invoiceDate = new Date(invoice.invoice_date);
          if (invoiceDate.getFullYear() === year) {
            const month = invoiceDate.getMonth();
            monthlyData[month].total += parseFloat(invoice.total_amount) || 0;
          }
        }
      });

      return monthlyData;
    }
  }, [invoices, selectedYear, selectedMonth]);

  // Helper function to filter invoices by date
  const filterInvoicesByDate = useMemo(() => {
    if (!selectedYear) return invoices;

    const year = parseInt(selectedYear);
    return invoices.filter(invoice => {
      if (!invoice.invoice_date) return false;
      const invoiceDate = new Date(invoice.invoice_date);
      const matchesYear = invoiceDate.getFullYear() === year;

      if (selectedMonth) {
        const month = parseInt(selectedMonth);
        return matchesYear && invoiceDate.getMonth() + 1 === month;
      }

      return matchesYear;
    });
  }, [invoices, selectedYear, selectedMonth]);

  // 2. Sales Trend by Team - Time-based data
  const salesByTeamData = useMemo(() => {
    if (!selectedYear) return [];

    const year = parseInt(selectedYear);
    const teamMap = new Map();

    // First, collect all unique teams
    filterInvoicesByDate.forEach(invoice => {
      const teamName = invoice.sales_person?.team_name || 'No Team';
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, []);
      }
    });

    if (selectedMonth) {
      // Show daily data for the selected month
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month, 0).getDate();

      // Initialize daily data for each team
      teamMap.forEach((value, teamName) => {
        teamMap.set(teamName, Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          label: `${i + 1}`,
          total: 0
        })));
      });

      // Aggregate data by day and team
      filterInvoicesByDate.forEach(invoice => {
        if (invoice.invoice_date) {
          const invoiceDate = new Date(invoice.invoice_date);
          const day = invoiceDate.getDate() - 1;
          const teamName = invoice.sales_person?.team_name || 'No Team';

          if (day >= 0 && day < daysInMonth && teamMap.has(teamName)) {
            teamMap.get(teamName)[day].total += parseFloat(invoice.total_amount) || 0;
          }
        }
      });

      return Array.from(teamMap.entries()).map(([name, data]) => ({ name, data }));
    } else {
      // Show all 12 months of the selected year
      // Initialize monthly data for each team
      teamMap.forEach((value, teamName) => {
        teamMap.set(teamName, Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          label: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          total: 0
        })));
      });

      // Aggregate data by month and team
      filterInvoicesByDate.forEach(invoice => {
        if (invoice.invoice_date) {
          const invoiceDate = new Date(invoice.invoice_date);
          const month = invoiceDate.getMonth();
          const teamName = invoice.sales_person?.team_name || 'No Team';

          if (teamMap.has(teamName)) {
            teamMap.get(teamName)[month].total += parseFloat(invoice.total_amount) || 0;
          }
        }
      });

      return Array.from(teamMap.entries()).map(([name, data]) => ({ name, data }));
    }
  }, [filterInvoicesByDate, selectedYear, selectedMonth]);

  // 3. Sales Trend by Sales Person - Time-based data
  const salesByPersonData = useMemo(() => {
    if (!selectedYear) return [];

    const year = parseInt(selectedYear);
    const personMap = new Map();

    // First, collect all unique sales persons
    filterInvoicesByDate.forEach(invoice => {
      const personName = invoice.sales_person?.display_name || 'Unassigned';
      if (!personMap.has(personName)) {
        personMap.set(personName, []);
      }
    });

    if (selectedMonth) {
      // Show daily data for the selected month
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month, 0).getDate();

      // Initialize daily data for each person
      personMap.forEach((value, personName) => {
        personMap.set(personName, Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          label: `${i + 1}`,
          total: 0
        })));
      });

      // Aggregate data by day and person
      filterInvoicesByDate.forEach(invoice => {
        if (invoice.invoice_date) {
          const invoiceDate = new Date(invoice.invoice_date);
          const day = invoiceDate.getDate() - 1;
          const personName = invoice.sales_person?.display_name || 'Unassigned';

          if (day >= 0 && day < daysInMonth && personMap.has(personName)) {
            personMap.get(personName)[day].total += parseFloat(invoice.total_amount) || 0;
          }
        }
      });

      return Array.from(personMap.entries()).map(([name, data]) => ({ name, data }));
    } else {
      // Show all 12 months of the selected year
      // Initialize monthly data for each person
      personMap.forEach((value, personName) => {
        personMap.set(personName, Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          label: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          total: 0
        })));
      });

      // Aggregate data by month and person
      filterInvoicesByDate.forEach(invoice => {
        if (invoice.invoice_date) {
          const invoiceDate = new Date(invoice.invoice_date);
          const month = invoiceDate.getMonth();
          const personName = invoice.sales_person?.display_name || 'Unassigned';

          if (personMap.has(personName)) {
            personMap.get(personName)[month].total += parseFloat(invoice.total_amount) || 0;
          }
        }
      });

      return Array.from(personMap.entries()).map(([name, data]) => ({ name, data }));
    }
  }, [filterInvoicesByDate, selectedYear, selectedMonth]);

  // 4 & 5. Product Analytics (Quantity and Amount)
  const productAnalytics = useMemo(() => {
    const productMap = new Map();

    filterInvoicesByDate.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          const productName = item.product?.name || item.product_name || 'Unknown Product';
          const existing = productMap.get(productName) || { quantity: 0, amount: 0 };
          productMap.set(productName, {
            quantity: existing.quantity + (parseFloat(item.quantity) || 0),
            amount: existing.amount + (parseFloat(item.subtotal) || 0)
          });
        });
      }
    });

    const products = Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      amount: data.amount
    }));

    return {
      byQuantity: [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      byAmount: [...products].sort((a, b) => b.amount - a.amount).slice(0, 10)
    };
  }, [filterInvoicesByDate]);


  // 6. Top Sales Person (Top 10) - Aggregate totals
  const topSalesPersons = useMemo(() => {
    const personMap = new Map();

    filterInvoicesByDate.forEach(invoice => {
      const personName = invoice.sales_person?.display_name || 'Unassigned';
      const current = personMap.get(personName) || 0;
      personMap.set(personName, current + (parseFloat(invoice.total_amount) || 0));
    });

    return Array.from(personMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filterInvoicesByDate]);

  // 7. Top Sales Team (Top 10) - Aggregate totals
  const topSalesTeams = useMemo(() => {
    const teamMap = new Map();

    filterInvoicesByDate.forEach(invoice => {
      const teamName = invoice.sales_person?.team_name || 'No Team';
      const current = teamMap.get(teamName) || 0;
      teamMap.set(teamName, current + (parseFloat(invoice.total_amount) || 0));
    });

    return Array.from(teamMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filterInvoicesByDate]);


  // 8. Top Customer (Top 10)
  const topCustomers = useMemo(() => {
    const customerMap = new Map();

    filterInvoicesByDate.forEach(invoice => {
      const customerName = invoice.customer?.company_name ||
        `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`.trim() ||
        'Unknown Customer';
      const current = customerMap.get(customerName) || 0;
      customerMap.set(customerName, current + (parseFloat(invoice.total_amount) || 0));
    });

    return Array.from(customerMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filterInvoicesByDate]);

  // 9. Customer Purchase Frequency
  const customerFrequency = useMemo(() => {
    const frequencyMap = new Map();

    filterInvoicesByDate.forEach(invoice => {
      const customerName = invoice.customer?.company_name ||
        `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`.trim() ||
        'Unknown Customer';
      const current = frequencyMap.get(customerName) || 0;
      frequencyMap.set(customerName, current + 1);
    });

    return Array.from(frequencyMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filterInvoicesByDate]);

  // 10. Customer Average Purchase Amount
  const customerAvgPurchase = useMemo(() => {
    const customerMap = new Map();

    filterInvoicesByDate.forEach(invoice => {
      const customerName = invoice.customer?.company_name ||
        `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`.trim() ||
        'Unknown Customer';
      const existing = customerMap.get(customerName) || { total: 0, count: 0 };
      customerMap.set(customerName, {
        total: existing.total + (parseFloat(invoice.total_amount) || 0),
        count: existing.count + 1
      });
    });

    return Array.from(customerMap.entries())
      .map(([name, data]) => ({
        name,
        average: data.total / data.count
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
  }, [filterInvoicesByDate]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Analytics Charts Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Sales Trend Analytics
          </h2>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(''); // Reset month when year changes
                }}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Year</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedYear}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart.js Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No invoice data available</div>
          ) : (
            <div className="h-80">
              <Bar
                data={{
                  labels: chartData.map(d => d.label),
                  datasets: [
                    {
                      label: 'Sales Amount (MYR)',
                      data: chartData.map(d => d.total),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: 'rgba(37, 99, 235, 0.9)',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return new Intl.NumberFormat('en-MY', {
                            style: 'currency',
                            currency: 'MYR'
                          }).format(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return new Intl.NumberFormat('en-MY', {
                            style: 'currency',
                            currency: 'MYR',
                            notation: 'compact',
                            maximumFractionDigits: 1
                          }).format(value);
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* 2. Sales Trend by Team */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-green-600" size={20} />
            Sales Trend by Team
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
            >
              <option value="all">All Teams</option>
              {salesByTeamData.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          {salesByTeamData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No team data available</div>
          ) : (
            <div className="h-80">
              <Bar
                data={{
                  labels: salesByTeamData[0]?.data.map(d => d.label) || [],
                  datasets: (selectedTeam === 'all' ? salesByTeamData : salesByTeamData.filter(t => t.name === selectedTeam)).map((team, index) => {

                    const colors = [
                      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)', hover: 'rgba(22, 163, 74, 0.9)' },
                      { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)', hover: 'rgba(37, 99, 235, 0.9)' },
                      { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 1)', hover: 'rgba(147, 51, 234, 0.9)' },
                      { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgba(249, 115, 22, 1)', hover: 'rgba(234, 88, 12, 0.9)' },
                      { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)', hover: 'rgba(219, 39, 119, 0.9)' },
                    ];
                    const color = colors[index % colors.length];
                    return {
                      label: team.name,
                      data: team.data.map(d => d.total),
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: color.hover,
                    };
                  })
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: ${new Intl.NumberFormat('en-MY', {
                          style: 'currency',
                          currency: 'MYR'
                        }).format(context.parsed.y)}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      stacked: false,
                      ticks: {
                        callback: (value) => new Intl.NumberFormat('en-MY', {
                          style: 'currency',
                          currency: 'MYR',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(value)
                      }
                    },
                    x: {
                      stacked: false,
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. Sales Trend by Sales Person */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-purple-600" size={20} />
            Sales Trend by Sales Person
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Sales Person:</label>
            <select
              value={selectedSalesPerson}
              onChange={(e) => setSelectedSalesPerson(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
            >
              <option value="all">All Sales Persons</option>
              {salesByPersonData.map(person => (
                <option key={person.name} value={person.name}>{person.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          {salesByPersonData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No sales person data available</div>
          ) : (
            <div className="h-80">
              <Bar
                data={{
                  labels: salesByPersonData[0]?.data.map(d => d.label) || [],
                  datasets: (selectedSalesPerson === 'all' ? salesByPersonData : salesByPersonData.filter(p => p.name === selectedSalesPerson)).map((person, index) => {
                    const colors = [
                      { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 1)', hover: 'rgba(147, 51, 234, 0.9)' },
                      { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)', hover: 'rgba(37, 99, 235, 0.9)' },
                      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)', hover: 'rgba(22, 163, 74, 0.9)' },
                      { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgba(249, 115, 22, 1)', hover: 'rgba(234, 88, 12, 0.9)' },
                      { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)', hover: 'rgba(219, 39, 119, 0.9)' },
                      { bg: 'rgba(20, 184, 166, 0.8)', border: 'rgba(20, 184, 166, 1)', hover: 'rgba(13, 148, 136, 0.9)' },
                      { bg: 'rgba(234, 179, 8, 0.8)', border: 'rgba(234, 179, 8, 1)', hover: 'rgba(202, 138, 4, 0.9)' },
                      { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)', hover: 'rgba(220, 38, 38, 0.9)' },
                      { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgba(99, 102, 241, 1)', hover: 'rgba(79, 70, 229, 0.9)' },
                      { bg: 'rgba(14, 165, 233, 0.8)', border: 'rgba(14, 165, 233, 1)', hover: 'rgba(2, 132, 199, 0.9)' },
                    ];
                    const color = colors[index % colors.length];
                    return {
                      label: person.name,
                      data: person.data.map(d => d.total),
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: color.hover,
                    };
                  })
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: ${new Intl.NumberFormat('en-MY', {
                          style: 'currency',
                          currency: 'MYR'
                        }).format(context.parsed.y)}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      stacked: false,
                      ticks: {
                        callback: (value) => new Intl.NumberFormat('en-MY', {
                          style: 'currency',
                          currency: 'MYR',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(value)
                      }
                    },
                    x: {
                      stacked: false,
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* 4 & 5. Product Analytics - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Quantity by Product */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Package className="text-orange-600" size={20} />
            Sales Quantity by Product
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {productAnalytics.byQuantity.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No product data available</div>
            ) : (
              <div className="h-80">
                <Pie
                  data={{
                    labels: productAnalytics.byQuantity.map(d => d.name),
                    datasets: [{
                      label: 'Quantity Sold',
                      data: productAnalytics.byQuantity.map(d => d.quantity),
                      backgroundColor: [
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(20, 184, 166, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(14, 165, 233, 0.8)',
                      ],
                      borderColor: [
                        'rgba(249, 115, 22, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(20, 184, 166, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(99, 102, 241, 1)',
                        'rgba(14, 165, 233, 1)',
                      ],
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'right',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${context.parsed.toLocaleString()} units`
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* Sales Amount by Product */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Package className="text-teal-600" size={20} />
            Sales Amount by Product
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {productAnalytics.byAmount.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No product data available</div>
            ) : (
              <div className="h-80">
                <Pie
                  data={{
                    labels: productAnalytics.byAmount.map(d => d.name),
                    datasets: [{
                      label: 'Sales Amount (MYR)',
                      data: productAnalytics.byAmount.map(d => d.amount),
                      backgroundColor: [
                        'rgba(20, 184, 166, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(14, 165, 233, 0.8)',
                      ],
                      borderColor: [
                        'rgba(20, 184, 166, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(99, 102, 241, 1)',
                        'rgba(14, 165, 233, 1)',
                      ],
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'right',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${new Intl.NumberFormat('en-MY', {
                            style: 'currency',
                            currency: 'MYR'
                          }).format(context.parsed)}`
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 6 & 7. Top Performers - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sales Person */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Award className="text-yellow-600" size={20} />
            Top Sales Person
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {topSalesPersons.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No data available</div>
            ) : (
              <div className="space-y-2">
                {topSalesPersons.map((person, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                            'bg-blue-500'
                        }`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900">{person.name}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('en-MY', {
                        style: 'currency',
                        currency: 'MYR',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(person.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Top Sales Team */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Award className="text-green-600" size={20} />
            Top Sales Team
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {topSalesTeams.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No data available</div>
            ) : (
              <div className="space-y-2">
                {topSalesTeams.map((team, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                            'bg-green-500'
                        }`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900">{team.name}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('en-MY', {
                        style: 'currency',
                        currency: 'MYR',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(team.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 8. Top Customer */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
          <UserCheck className="text-indigo-600" size={20} />
          Top Customer
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          {topCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No customer data available</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {topCustomers.map((customer, index) => (
                <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                          'bg-indigo-500'
                      }`}>
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-900 truncate">{customer.name}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 whitespace-nowrap ml-2">
                    {new Intl.NumberFormat('en-MY', {
                      style: 'currency',
                      currency: 'MYR',
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(customer.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9 & 10. Customer Analytics - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Purchase Frequency */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <TrendingUp className="text-pink-600" size={20} />
            Customer Purchase Frequency
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {customerFrequency.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No data available</div>
            ) : (
              <div className="h-80">
                <Bar
                  data={{
                    labels: customerFrequency.map(d => d.name),
                    datasets: [{
                      label: 'Number of Purchases',
                      data: customerFrequency.map(d => d.count),
                      backgroundColor: 'rgba(236, 72, 153, 0.8)',
                      borderColor: 'rgba(236, 72, 153, 1)',
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: 'rgba(219, 39, 119, 0.9)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Purchases: ${context.parsed.y}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          callback: (value) => Math.floor(value)
                        }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* Customer Average Purchase Amount */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <BarChart3 className="text-cyan-600" size={20} />
            Customer Average Purchase Amount
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {customerAvgPurchase.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No data available</div>
            ) : (
              <div className="h-80">
                <Bar
                  data={{
                    labels: customerAvgPurchase.map(d => d.name),
                    datasets: [{
                      label: 'Average Purchase (MYR)',
                      data: customerAvgPurchase.map(d => d.average),
                      backgroundColor: 'rgba(6, 182, 212, 0.8)',
                      borderColor: 'rgba(6, 182, 212, 1)',
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: 'rgba(8, 145, 178, 0.9)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => new Intl.NumberFormat('en-MY', {
                            style: 'currency',
                            currency: 'MYR'
                          }).format(context.parsed.y)
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => new Intl.NumberFormat('en-MY', {
                            style: 'currency',
                            currency: 'MYR',
                            notation: 'compact',
                            maximumFractionDigits: 1
                          }).format(value)
                        }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quotations Section */}
      <section className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('quotations')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Quotations</h2>
            <span className="text-sm text-gray-500">({quotations.length})</span>
          </div>
          {expandedSections.quotations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.quotations && (
          <div className="px-6 pb-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {quotationStatuses.map((status) => {
                const statusQuotations = quotations.filter(q => q.status === status.status_key);
                const totalValue = statusQuotations.reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0);

                return (
                  <div
                    key={status.status_key}
                    className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col min-w-[250px] h-[500px]"
                  >
                    {/* Status Header */}
                    <div
                      className="p-3 border-b border-gray-200 rounded-t-lg bg-white sticky top-0 z-10"
                      style={{ borderTop: `3px solid ${status.status_color}` }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{status.status_label}</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {statusQuotations.length}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(totalValue)}
                      </div>
                    </div>

                    {/* Quotation List */}
                    <div className="p-2 overflow-y-auto flex-1 space-y-2">
                      {statusQuotations.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                          No quotations
                        </div>
                      ) : (
                        statusQuotations.map((quotation) => (
                          <div
                            key={quotation.id}
                            className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-blue-600 text-xs hover:underline">
                                {quotation.quotation_code}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(quotation.quotation_date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mb-2">
                              <p className="text-sm font-semibold text-gray-900 truncate" title={quotation.customer?.company_name || `${quotation.customer?.first_name || ''} ${quotation.customer?.last_name || ''}`.trim() || 'Unknown Customer'}>
                                {quotation.customer?.company_name || `${quotation.customer?.first_name || ''} ${quotation.customer?.last_name || ''}`.trim() || 'Unknown Customer'}
                              </p>
                              {quotation.customer?.company_name && (quotation.customer?.first_name || quotation.customer?.last_name) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {quotation.customer?.first_name} {quotation.customer?.last_name}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                              <div className="flex items-center gap-1.5">
                                {quotation.sales_person?.avatar_url ? (
                                  <img
                                    src={quotation.sales_person.avatar_url}
                                    alt={quotation.sales_person.display_name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={10} className="text-gray-400" />
                                  </div>
                                )}
                                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                  {quotation.sales_person?.display_name || 'Unassigned'}
                                </span>
                              </div>
                              <span className="font-bold text-gray-900 text-xs">
                                {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(quotation.total_amount || 0)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Sales Orders Section */}
      <section className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('salesOrders')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-green-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Sales Orders</h2>
            <span className="text-sm text-gray-500">({salesOrders.length})</span>
          </div>
          {expandedSections.salesOrders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.salesOrders && (
          <div className="px-6 pb-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {salesOrderStatuses.map((status) => {
                const statusOrders = salesOrders.filter(o => o.status === status.status_key);
                const totalValue = statusOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

                return (
                  <div
                    key={status.status_key}
                    className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col min-w-[250px] h-[500px]"
                  >
                    {/* Status Header */}
                    <div
                      className="p-3 border-b border-gray-200 rounded-t-lg bg-white sticky top-0 z-10"
                      style={{ borderTop: `3px solid ${status.status_color}` }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{status.status_label}</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {statusOrders.length}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(totalValue)}
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="p-2 overflow-y-auto flex-1 space-y-2">
                      {statusOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                          No sales orders
                        </div>
                      ) : (
                        statusOrders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-green-600 text-xs hover:underline">
                                {order.order_code}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(order.order_date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mb-2">
                              <p className="text-sm font-semibold text-gray-900 truncate" title={order.customer?.company_name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown Customer'}>
                                {order.customer?.company_name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown Customer'}
                              </p>
                              {order.customer?.company_name && (order.customer?.first_name || order.customer?.last_name) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {order.customer?.first_name} {order.customer?.last_name}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                              <div className="flex items-center gap-1.5">
                                {order.sales_person?.avatar_url ? (
                                  <img
                                    src={order.sales_person.avatar_url}
                                    alt={order.sales_person.display_name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={10} className="text-gray-400" />
                                  </div>
                                )}
                                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                  {order.sales_person?.display_name || 'Unassigned'}
                                </span>
                              </div>
                              <span className="font-bold text-gray-900 text-xs">
                                {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(order.total_amount || 0)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Delivery Orders Section */}
      <section className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('deliveryOrders')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Truck className="text-yellow-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Delivery Orders</h2>
            <span className="text-sm text-gray-500">({deliveryOrders.length})</span>
          </div>
          {expandedSections.deliveryOrders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.deliveryOrders && (
          <div className="px-6 pb-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {deliveryOrderStatuses.map((status) => {
                const statusOrders = deliveryOrders.filter(o => o.status === status.status_key);

                return (
                  <div
                    key={status.status_key}
                    className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col min-w-[250px] h-[500px]"
                  >
                    {/* Status Header */}
                    <div
                      className="p-3 border-b border-gray-200 rounded-t-lg bg-white sticky top-0 z-10"
                      style={{ borderTop: `3px solid ${status.status_color}` }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{status.status_label}</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {statusOrders.length}
                        </span>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="p-2 overflow-y-auto flex-1 space-y-2">
                      {statusOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                          No delivery orders
                        </div>
                      ) : (
                        statusOrders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-yellow-600 text-xs hover:underline">
                                {order.delivery_order_code}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(order.delivery_date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mb-2">
                              <p className="text-sm font-semibold text-gray-900 truncate" title={order.customer?.company_name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown Customer'}>
                                {order.customer?.company_name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown Customer'}
                              </p>
                              {order.customer?.company_name && (order.customer?.first_name || order.customer?.last_name) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {order.customer?.first_name} {order.customer?.last_name}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                              <div className="flex items-center gap-1.5">
                                {order.sales_person?.avatar_url ? (
                                  <img
                                    src={order.sales_person.avatar_url}
                                    alt={order.sales_person.display_name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={10} className="text-gray-400" />
                                  </div>
                                )}
                                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                  {order.sales_person?.display_name || 'Unassigned'}
                                </span>
                              </div>
                              {order.sales_order && (
                                <span className="text-[10px] text-gray-500">
                                  SO: {order.sales_order.order_code}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Invoices Section */}
      <section className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('invoices')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Receipt className="text-purple-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Invoices</h2>
            <span className="text-sm text-gray-500">({invoices.length})</span>
          </div>
          {expandedSections.invoices ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.invoices && (
          <div className="px-6 pb-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {invoiceStatuses.map((status) => {
                const statusInvoices = invoices.filter(i => i.status === status.status_key);
                const totalValue = statusInvoices.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);
                const totalPaid = statusInvoices.reduce((sum, i) => sum + (parseFloat(i.amount_paid) || 0), 0);
                const totalOutstanding = totalValue - totalPaid;

                return (
                  <div
                    key={status.status_key}
                    className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col min-w-[250px] h-[500px]"
                  >
                    {/* Status Header */}
                    <div
                      className="p-3 border-b border-gray-200 rounded-t-lg bg-white sticky top-0 z-10"
                      style={{ borderTop: `3px solid ${status.status_color}` }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{status.status_label}</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {statusInvoices.length}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(totalValue)}
                      </div>
                      {totalOutstanding > 0 && (
                        <div className="text-[10px] text-red-600 font-medium mt-0.5">
                          Outstanding: {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(totalOutstanding)}
                        </div>
                      )}
                    </div>

                    {/* Invoices List */}
                    <div className="p-2 overflow-y-auto flex-1 space-y-2">
                      {statusInvoices.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                          No invoices
                        </div>
                      ) : (
                        statusInvoices.map((invoice) => {
                          const amountPaid = parseFloat(invoice.amount_paid) || 0;
                          const totalAmount = parseFloat(invoice.total_amount) || 0;
                          const outstanding = totalAmount - amountPaid;

                          return (
                            <div
                              key={invoice.id}
                              className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-purple-600 text-xs hover:underline">
                                  {invoice.invoice_code}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(invoice.invoice_date).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="mb-2">
                                <p className="text-sm font-semibold text-gray-900 truncate" title={invoice.customer?.company_name || `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`.trim() || 'Unknown Customer'}>
                                  {invoice.customer?.company_name || `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`.trim() || 'Unknown Customer'}
                                </p>
                                {invoice.customer?.company_name && (invoice.customer?.first_name || invoice.customer?.last_name) && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {invoice.customer?.first_name} {invoice.customer?.last_name}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1 pt-2 border-t border-gray-50 mt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-500">Total:</span>
                                  <span className="font-bold text-gray-900 text-xs">
                                    {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(totalAmount)}
                                  </span>
                                </div>
                                {amountPaid > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-green-600">Paid:</span>
                                    <span className="text-[10px] text-green-600 font-medium">
                                      {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amountPaid)}
                                    </span>
                                  </div>
                                )}
                                {outstanding > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-red-600">Due:</span>
                                    <span className="text-[10px] text-red-600 font-medium">
                                      {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(outstanding)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
