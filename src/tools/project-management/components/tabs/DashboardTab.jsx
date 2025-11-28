import React from 'react';
import { Users, CheckCircle, Clock, Activity } from 'lucide-react';

const DashboardTab = ({ projects, statuses = [] }) => {
    // Calculate Stats based on actual project statuses
    const totalProjects = projects.length;

    // Find status IDs for different states
    const completedStatusIds = statuses
        .filter(s => s.name?.toLowerCase() === 'completed')
        .map(s => s.id);
    const inProgressStatusIds = statuses
        .filter(s => s.name?.toLowerCase() === 'in progress')
        .map(s => s.id);

    const activeProjects = projects.filter(p => inProgressStatusIds.includes(p.status_id)).length;
    const completedProjects = projects.filter(p => completedStatusIds.includes(p.status_id)).length;

    // Calculate total budget from projects
    const totalValue = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0);

    return (
        <div className="space-y-8">
            {/* Hero Banner - Purple Gradient like reference */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg text-white p-8">
                <div className="relative z-10">
                    <h2 className="text-sm font-medium text-purple-100 uppercase tracking-wider mb-2">Total Project Value</h2>
                    <div className="text-5xl font-bold mb-2">
                        ${totalValue.toLocaleString()}
                        <span className="text-lg font-normal text-purple-200 ml-2">Estimated</span>
                    </div>
                    <p className="text-purple-100 opacity-80">Based on active project budgets</p>
                </div>
                {/* Decorative Circle */}
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Projects</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalProjects}</h3>
                            <p className="text-sm text-gray-500 mt-1">All projects</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Now</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{activeProjects}</h3>
                            <p className="text-sm text-blue-600 mt-1">In progress</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{completedProjects}</h3>
                            <p className="text-sm text-green-600 mt-1">Successfully delivered</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team Members</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">
                                {new Set(projects.flatMap(p => p.members?.map(m => m.individual_id) || [])).size}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Assigned to projects</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {projects.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No recent activity. Create a project to get started.</p>
                        ) : (
                            projects.slice(0, 5).map((project) => (
                                <div key={project.id} className="flex items-start space-x-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                        {project.created_by?.display_name?.charAt(0) || project.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{project.created_by?.display_name || 'Someone'}</span> created project <span className="font-medium text-blue-600">{project.name}</span>
                                            {project.status && (
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full ml-2"
                                                    style={{
                                                        backgroundColor: `${project.status?.color}20`,
                                                        color: project.status?.color
                                                    }}
                                                >
                                                    {project.status?.name}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Mini Schedule / Upcoming */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Deadlines</h3>
                    <div className="space-y-4">
                        {projects
                            .filter(p => p.due_date && !completedStatusIds.includes(p.status_id))
                            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                            .slice(0, 4)
                            .map(project => (
                                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                                        <p className="text-xs text-gray-500">{project.customer?.company_name || project.customer?.first_name || ''}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-xs font-bold ${new Date(project.due_date) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                                            {new Date(project.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        {projects.filter(p => p.due_date && !completedStatusIds.includes(p.status_id)).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No upcoming deadlines.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
