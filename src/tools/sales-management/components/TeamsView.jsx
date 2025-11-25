import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, UserPlus, X, Crown, User } from 'lucide-react';
import { ConfirmDialog } from './templates/ui/ConfirmDialog';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export default function TeamsView({ organizationSlug }) {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    team_lead_individual_id: '',
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Fetch teams
  const fetchTeams = async () => {
    if (!organizationSlug) return;

    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_teams?organization_slug=${organizationSlug}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();

        // Fetch detailed info for each team including members
        const teamsWithDetails = await Promise.all(
          data.map(async (team) => {
            const detailResponse = await fetch(
              `${resolveApiOrigin()}/api/sales_teams/${team.id}?organization_slug=${organizationSlug}`,
              { credentials: 'include' }
            );
            if (detailResponse.ok) {
              return await detailResponse.json();
            }
            return team;
          })
        );

        setTeams(teamsWithDetails);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch organization members
  const fetchMembers = async () => {
    if (!organizationSlug) return;

    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_management/members?organization_slug=${organizationSlug}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug]);

  const handleCreateTeam = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      team_lead_individual_id: '',
    });
    setIsFormOpen(true);
  };

  const handleEditTeam = (team) => {
    setFormData({
      name: team.name,
      description: team.description || '',
      color: team.color || '#3B82F6',
      team_lead_individual_id: team.team_lead_individual_id || '',
    });
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();

    try {
      const url = selectedTeam
        ? `${resolveApiOrigin()}/api/sales_teams/${selectedTeam.id}?organization_slug=${organizationSlug}`
        : `${resolveApiOrigin()}/api/sales_teams?organization_slug=${organizationSlug}`;

      const method = selectedTeam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTeams();
        setIsFormOpen(false);
        setSelectedTeam(null);
      } else {
        alert('Failed to save team');
      }
    } catch (err) {
      console.error('Error saving team:', err);
      alert('Failed to save team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Team',
      message: 'Are you sure you want to delete this team? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${resolveApiOrigin()}/api/sales_teams/${teamId}?organization_slug=${organizationSlug}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          );

          if (response.ok) {
            await fetchTeams();
          } else {
            alert('Failed to delete team');
          }
        } catch (err) {
          console.error('Error deleting team:', err);
          alert('Failed to delete team');
        }
      }
    });
  };

  const handleAddMember = (team) => {
    setSelectedTeam(team);
    setIsMemberFormOpen(true);
  };

  const handleSaveMember = async (individualId) => {
    if (!selectedTeam || !individualId) return;

    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_teams/${selectedTeam.id}/members?organization_slug=${organizationSlug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ individual_id: individualId }),
        }
      );

      if (response.ok) {
        await fetchTeams();
        setIsMemberFormOpen(false);
      } else {
        alert('Failed to add member');
      }
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId, individualId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this member from the team?',
      onConfirm: async () => {
        try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_teams/${teamId}/members/${individualId}?organization_slug=${organizationSlug}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

          if (response.ok) {
            await fetchTeams();
          } else {
            alert('Failed to remove member');
          }
        } catch (err) {
          console.error('Error removing member:', err);
          alert('Failed to remove member');
        }
      }
    });
  };

  const getTeamLead = (teamLeadId) => {
    return members.find(m => m.id === teamLeadId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Teams</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organize sales persons into teams for better collaboration
          </p>
        </div>
        <button
          onClick={handleCreateTeam}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first team to organize sales persons and enable team-based visibility
          </p>
          <button
            onClick={handleCreateTeam}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team) => {
            const teamLead = getTeamLead(team.team_lead_individual_id);
            return (
              <div
                key={team.id}
                className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                {/* Team Header */}
                <div
                  className="px-6 py-4 border-b border-gray-200"
                  style={{
                    background: `linear-gradient(135deg, ${team.color}15 0%, ${team.color}05 100%)`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      </div>
                      {team.description && (
                        <p className="text-sm text-gray-600">{team.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team Lead */}
                {teamLead && (
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Crown size={16} className="text-yellow-500" />
                      <span className="text-xs font-medium text-gray-700">Team Lead:</span>
                      <span className="text-sm text-gray-900">{teamLead.display_name}</span>
                    </div>
                  </div>
                )}

                {/* Members */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Members ({team.member_count || 0})
                    </span>
                    <button
                      onClick={() => handleAddMember(team)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <UserPlus size={16} />
                      Add
                    </button>
                  </div>

                  {team.members && team.members.length > 0 ? (
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div
                          key={member.individual_id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {member.member?.display_name || 'Unknown'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(team.id, member.individual_id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No members yet</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedTeam ? 'Edit Team' : 'Create Team'}
              </h3>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setSelectedTeam(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Lead
                </label>
                <select
                  value={formData.team_lead_individual_id}
                  onChange={(e) =>
                    setFormData({ ...formData, team_lead_individual_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select team lead...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <div
                    className="flex-1 px-4 py-2 rounded text-sm font-medium text-center"
                    style={{
                      backgroundColor: formData.color + '20',
                      color: formData.color,
                    }}
                  >
                    Preview Color
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setSelectedTeam(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      {isMemberFormOpen && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add Member to {selectedTeam.name}</h3>
              <button
                onClick={() => setIsMemberFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Member
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSaveMember(member.id)}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                  >
                    <User size={20} className="text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{member.display_name}</div>
                      {member.primary_email && (
                        <div className="text-sm text-gray-600">{member.primary_email}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        variant="danger"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
      />
    </div>
  );
}
