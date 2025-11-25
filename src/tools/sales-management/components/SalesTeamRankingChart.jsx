import React, { useMemo, useState, useEffect } from 'react';
import { Users, Trophy, Award } from 'lucide-react';
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

export default function SalesTeamRankingChart({ salesOrders, organizationSlug, completedStatusKey }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`/api/sales_teams?organization_slug=${organizationSlug}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setTeams(data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationSlug) {
      fetchTeams();
    }
  }, [organizationSlug]);

  const rankings = useMemo(() => {
    if (!completedStatusKey || !salesOrders.length || !teams.length) return [];

    // Filter completed orders
    const completedOrders = salesOrders.filter(order => order.status === completedStatusKey);

    // Group by team (based on sales person)
    const teamStats = {};

    completedOrders.forEach(order => {
      const salesPersonId = order.sales_person_individual_id;
      if (!salesPersonId) return;

      // Find which team this sales person belongs to
      const team = teams.find(t => {
        // Check if person is team lead
        if (t.team_lead?.id === salesPersonId) return true;
        // Check if person is in team members (would need to fetch this separately)
        return false;
      });

      if (team) {
        if (!teamStats[team.id]) {
          teamStats[team.id] = {
            teamId: team.id,
            teamName: team.name,
            teamColor: team.color || '#3b82f6',
            teamLead: team.team_lead,
            memberCount: team.member_count || 0,
            revenue: 0,
            orderCount: 0,
          };
        }
        teamStats[team.id].revenue += parseFloat(order.total_amount || 0);
        teamStats[team.id].orderCount += 1;
      }
    });

    // Convert to array and sort by revenue
    const rankingArray = Object.values(teamStats);
    return rankingArray.sort((a, b) => b.revenue - a.revenue);
  }, [salesOrders, teams, completedStatusKey]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const chartData = useMemo(() => {
    return {
      labels: rankings.map(r => r.teamName),
      datasets: [
        {
          label: 'Team Revenue',
          data: rankings.map(r => r.revenue),
          backgroundColor: rankings.map((team, index) => {
            if (index === 0) return 'rgba(234, 179, 8, 0.8)'; // Gold
            if (index === 1) return 'rgba(148, 163, 184, 0.8)'; // Silver
            if (index === 2) return 'rgba(205, 127, 50, 0.8)'; // Bronze
            return team.teamColor ? `${team.teamColor}cc` : 'rgba(59, 130, 246, 0.8)';
          }),
          borderColor: rankings.map((team, index) => {
            if (index === 0) return 'rgb(234, 179, 8)';
            if (index === 1) return 'rgb(148, 163, 184)';
            if (index === 2) return 'rgb(205, 127, 50)';
            return team.teamColor || 'rgb(59, 130, 246)';
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
            const team = rankings[context.dataIndex];
            return [
              `Revenue: ${formatCurrency(team.revenue)}`,
              `Orders: ${team.orderCount}`,
              `Avg/Order: ${formatCurrency(team.revenue / team.orderCount)}`,
              `Members: ${team.memberCount}`,
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

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-12 text-gray-500">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Top Sales Teams</h3>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {teams.length === 0 ? 'No teams configured' : 'No completed orders to display'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-80">
            <Bar data={chartData} options={options} />
          </div>

          {/* Top 3 Details */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankings.slice(0, 3).map((team, index) => (
                <div
                  key={team.teamId}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'border-yellow-400 bg-yellow-50' :
                    index === 1 ? 'border-gray-400 bg-gray-50' :
                    'border-orange-400 bg-orange-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getMedalIcon(index)}
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.teamColor }}
                      />
                      <span className="font-semibold text-gray-900">{team.teamName}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(team.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-semibold text-gray-900">{team.orderCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Members:</span>
                      <span className="font-semibold text-gray-900">{team.memberCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lead:</span>
                      <span className="font-semibold text-gray-900 truncate">
                        {team.teamLead?.display_name || 'N/A'}
                      </span>
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
