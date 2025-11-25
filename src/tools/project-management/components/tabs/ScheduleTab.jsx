import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ScheduleTab = ({ projects }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = [24, 25, 26, 27, 28, 29, 30]; // Mock dates
    const staff = [
        { id: 1, name: 'Technician A' },
        { id: 2, name: 'Technician B' },
        { id: 3, name: 'Technician C' },
        { id: 4, name: 'Technician D' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-[89px] sm:top-[0px] z-20 bg-white">
                <h2 className="text-lg font-bold text-gray-900">Staff Schedule</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">November 2025</span>
                    <div className="flex space-x-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Days Header */}
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                        <div className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Staff
                        </div>
                        {days.map((day, i) => (
                            <div key={day} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                                <div className="text-xs font-medium text-gray-500 uppercase">{day}</div>
                                <div className="text-sm font-bold text-gray-900 mt-1">{dates[i]}</div>
                            </div>
                        ))}
                    </div>

                    {/* Staff Rows */}
                    {staff.map((member) => (
                        <div key={member.id} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                            <div className="p-4 border-r border-gray-200 flex items-center">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mr-3">
                                    {member.id}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{member.name}</span>
                            </div>

                            {/* Mock Assignments */}
                            {days.map((_, i) => {
                                // Randomly assign projects for demo
                                const assignedProject = projects.find(p => p.assigned_staff?.includes(member.id) && (i % 3 === 0)); // Mock logic

                                return (
                                    <div key={i} className="p-2 border-r border-gray-200 last:border-r-0 min-h-[80px]">
                                        {assignedProject && (
                                            <div className="bg-blue-100 border border-blue-200 rounded p-2 text-xs cursor-pointer hover:bg-blue-200 transition-colors">
                                                <div className="font-semibold text-blue-800 truncate">{assignedProject.name}</div>
                                                <div className="text-blue-600 mt-1 truncate">{assignedProject.client}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScheduleTab;
