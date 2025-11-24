import React from 'react';
import { TrendingUp, Users, CheckCircle, Clock, Activity } from 'lucide-react';

const DashboardTab = ({ projects }) => {
    // Calculate Stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    // Calculate "Value" (Mock metric for the banner)
    const totalValue = projects.reduce((acc, curr) => acc + (curr.custom_data?.budget || 0), 0);

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
                            <p className="text-sm text-green-600 mt-1 flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" /> +12% this month
                            </p>
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
                            <p className="text-sm text-green-600 mt-1">Succesfully delivered</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Efficiency</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">94%</h3>
                            <p className="text-sm text-gray-500 mt-1">Avg. performance</p>
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
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-start space-x-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                    JS
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">John Smith</span> updated the status of <span className="font-medium text-blue-600">Tech Corp HQ Solar</span> to <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Completed</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Schedule / Upcoming */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Deadlines</h3>
                    <div className="space-y-4">
                        {projects
                            .filter(p => p.due_date && p.status === 'active')
                            .slice(0, 4)
                            .map(project => (
                                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                                        <p className="text-xs text-gray-500">{project.client}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-bold text-red-600">{project.due_date}</p>
                                    </div>
                                </div>
                            ))}
                        {projects.filter(p => p.due_date && p.status === 'active').length === 0 && (
                            <p className="text-sm text-gray-500 italic">No upcoming deadlines.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
