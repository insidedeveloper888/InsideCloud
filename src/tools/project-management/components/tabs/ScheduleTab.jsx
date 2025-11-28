import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Calendar } from 'lucide-react';

const ScheduleTab = ({ projects, members = [] }) => {
    // Week offset state for navigation (0 = current week, -1 = last week, 1 = next week)
    const [weekOffset, setWeekOffset] = useState(0);

    // Get current week dates based on offset
    const today = new Date();
    const startOfWeek = useMemo(() => {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Monday + offset
        return start;
    }, [weekOffset]);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = useMemo(() => days.map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
    }), [startOfWeek]);

    // Get week range for header (e.g., "Nov 25 - Dec 1, 2025")
    const weekRange = useMemo(() => {
        const startDate = dates[0];
        const endDate = dates[6];
        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
        const year = endDate.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${year}`;
        }
        return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
    }, [dates]);

    // Navigation handlers
    const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setWeekOffset(0);

    // Helper: Get initials from name or email
    const getInitials = (member) => {
        const name = member.display_name || member.email || '';
        if (!name) return '?';

        // If it's an email, use first letter
        if (name.includes('@')) {
            return name.charAt(0).toUpperCase();
        }

        // Get initials from name (up to 2 characters)
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    // Helper: Get shortened display name (first name only for long names)
    const getShortDisplayName = (member) => {
        const name = member.display_name || member.email || 'Unknown';
        // If email, show first part before @
        if (name.includes('@')) {
            return name.split('@')[0];
        }
        // Return full name - CSS will handle truncation
        return name;
    };

    // Create map of member assignments from projects
    const memberAssignments = useMemo(() => {
        const assignments = {};

        // Initialize empty assignments for all members
        members.forEach(member => {
            assignments[member.id] = {};
        });

        // Map project members to their assignments
        projects.forEach(project => {
            if (project.members && project.start_date && project.due_date) {
                const start = new Date(project.start_date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(project.due_date);
                end.setHours(23, 59, 59, 999);

                project.members.forEach(pm => {
                    const memberId = pm.individual_id || pm.individual?.id;
                    if (memberId && assignments[memberId]) {
                        // Check each day of the week
                        dates.forEach((date, dayIndex) => {
                            const checkDate = new Date(date);
                            checkDate.setHours(12, 0, 0, 0);
                            if (checkDate >= start && checkDate <= end) {
                                if (!assignments[memberId][dayIndex]) {
                                    assignments[memberId][dayIndex] = [];
                                }
                                assignments[memberId][dayIndex].push(project);
                            }
                        });
                    }
                });
            }
        });

        return assignments;
    }, [projects, members, dates]);

    if (members.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
                    <p className="text-sm text-gray-500">
                        Organization members will appear here once they are added.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-[89px] sm:top-[0px] z-20 bg-white">
                <h2 className="text-lg font-bold text-gray-900">Staff Schedule</h2>
                <div className="flex items-center space-x-3">
                    {/* Today button - only show if not on current week */}
                    {weekOffset !== 0 && (
                        <button
                            onClick={goToCurrentWeek}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                        >
                            <Calendar className="w-3 h-3 mr-1" />
                            Today
                        </button>
                    )}
                    <span className="text-sm font-medium text-gray-600 min-w-[160px] text-center">{weekRange}</span>
                    <div className="flex space-x-1">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Previous week"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                            onClick={goToNextWeek}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Next week"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Days Header - using fixed widths */}
                    <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
                        <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Staff
                        </div>
                        {days.map((day, i) => {
                            const isToday = dates[i].toDateString() === today.toDateString();
                            return (
                                <div key={day} className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-blue-100' : ''}`}>
                                    <div className={`text-xs font-medium uppercase ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day}</div>
                                    <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>{dates[i].getDate()}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Staff Rows - compact */}
                    {members.map((member, rowIndex) => (
                        <div
                            key={member.id}
                            className={`grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${rowIndex % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                        >
                            <div className="p-2 border-r border-gray-200 flex items-center" title={member.display_name || member.email}>
                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mr-2 flex-shrink-0">
                                    {getInitials(member)}
                                </div>
                                <span className="text-xs font-medium text-gray-900 truncate">
                                    {getShortDisplayName(member)}
                                </span>
                            </div>

                            {/* Day Cells - Show actual assignments or dash for empty */}
                            {days.map((day, i) => {
                                const dayAssignments = memberAssignments[member.id]?.[i] || [];
                                const isToday = dates[i].toDateString() === today.toDateString();

                                return (
                                    <div key={`${member.id}-${day}`} className={`p-1.5 border-r border-gray-200 last:border-r-0 min-h-[60px] ${isToday ? 'bg-blue-50' : ''}`}>
                                        {dayAssignments.length === 0 ? (
                                            <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                                                -
                                            </div>
                                        ) : (
                                            <>
                                                {dayAssignments.slice(0, 2).map((project, idx) => (
                                                    <div
                                                        key={`${project.id}-${idx}`}
                                                        className="mb-1 border rounded p-1 text-xs cursor-pointer hover:opacity-80 transition-colors"
                                                        style={{
                                                            backgroundColor: `${project.status?.color}15` || '#EFF6FF',
                                                            borderColor: project.status?.color || '#BFDBFE'
                                                        }}
                                                        title={`${project.name}${project.customer ? ` - ${project.customer.company_name || project.customer.first_name}` : ''}`}
                                                    >
                                                        <div className="font-semibold truncate text-[10px]" style={{ color: project.status?.color || '#1E40AF' }}>
                                                            {project.name}
                                                        </div>
                                                    </div>
                                                ))}
                                                {dayAssignments.length > 2 && (
                                                    <div className="text-[10px] text-gray-400 pl-0.5">
                                                        +{dayAssignments.length - 2} more
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Empty state if no projects with assignments */}
                    {projects.every(p => !p.members || p.members.length === 0) && (
                        <div className="p-6 text-center">
                            <p className="text-sm text-gray-500">
                                Assign team members to projects with start/due dates to see them on the schedule.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleTab;
