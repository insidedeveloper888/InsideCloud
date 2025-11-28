
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Calendar, LayoutGrid, List, Kanban, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Building2, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddProjectModal from '../modals/AddProjectModal';
import ProjectDetailModal from '../modals/ProjectDetailModal';
import FilterPanel from '../FilterPanel';
import { useOrganizationMembers, useCustomers } from '../../hooks';

const ProjectsTab = ({
    projects,
    templates,
    statuses = [],
    onRefresh,
    organizationSlug,
    individualId,
    createProject,
    updateProject,
    deleteProject,
}) => {
    const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'kanban'
    const [visibilityView, setVisibilityView] = useState('organization'); // 'organization', 'team', 'personal'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Fetch organization members and customers for filtering
    const { members: orgMembers } = useOrganizationMembers(organizationSlug);
    const { customers } = useCustomers(organizationSlug);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: [],
        templates: [],
        members: [],
        customers: [],
        dueDateFrom: '',
        dueDateTo: '',
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Helpers ---
    const getTemplateName = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        return template ? template.name : 'Unknown Template';
    };

    // Get status info from statuses array (uses status_id from project)
    const getStatusInfo = (statusId) => {
        const status = statuses.find(s => s.id === statusId);
        return status || { name: 'Unknown', color: '#6B7280' };
    };

    // Generate status badge style from status color
    const getStatusStyle = (statusId) => {
        const status = getStatusInfo(statusId);
        const color = status.color || '#6B7280';
        return {
            backgroundColor: `${color}20`,
            color: color,
            borderColor: `${color}40`,
        };
    };

    // --- Logic ---

    // Helper to get customer display name
    const getCustomerDisplayName = (project) => {
        if (!project.customer) return '';
        const c = project.customer;
        return c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
    };

    // 1. Filter
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            // Visibility filter
            if (visibilityView === 'personal') {
                // Only projects owned by the current user
                if (project.owner_id !== individualId) return false;
            } else if (visibilityView === 'team') {
                // Projects owned by current user OR where current user is a member
                const isOwner = project.owner_id === individualId;
                const isMember = project.members?.some(m => m.individual_id === individualId);
                if (!isOwner && !isMember) return false;
            }
            // 'organization' shows all projects (no filter)

            const customerName = getCustomerDisplayName(project);
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customerName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filters.status.length === 0 || filters.status.includes(project.status_id);
            const matchesTemplate = filters.templates.length === 0 || filters.templates.includes(project.template_id);

            // Member filter: check if any selected member is assigned to the project
            const matchesMembers = filters.members.length === 0 ||
                project.members?.some(m => filters.members.includes(m.individual?.id));

            // Customer filter
            const matchesCustomer = filters.customers.length === 0 ||
                filters.customers.includes(project.customer_contact_id);

            // Date range filter
            let matchesDueDate = true;
            if (filters.dueDateFrom && project.due_date) {
                matchesDueDate = matchesDueDate && project.due_date >= filters.dueDateFrom;
            }
            if (filters.dueDateTo && project.due_date) {
                matchesDueDate = matchesDueDate && project.due_date <= filters.dueDateTo;
            }

            return matchesSearch && matchesStatus && matchesTemplate && matchesMembers && matchesCustomer && matchesDueDate;
        });
    }, [projects, searchTerm, filters, visibilityView, individualId]);

    // 2. Sort
    const sortedProjects = useMemo(() => {
        let sortableItems = [...filteredProjects];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle special cases
                if (sortConfig.key === 'template_id') {
                    aValue = getTemplateName(a.template_id);
                    bValue = getTemplateName(b.template_id);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredProjects, sortConfig]);

    // 3. Paginate
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const paginatedProjects = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedProjects.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedProjects, currentPage]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (key, value) => {
        setCurrentPage(1); // Reset to page 1 on filter change
        if (key === 'clear') {
            setFilters({
                status: [],
                templates: [],
                members: [],
                customers: [],
                dueDateFrom: '',
                dueDateTo: '',
            });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    // --- Sub-Components ---

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const TableHeader = ({ label, sortKey }) => (
        <th
            className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors select-none"
            onClick={() => handleSort(sortKey)}
        >
            <div className="flex items-center">
                {label}
                <SortIcon columnKey={sortKey} />
            </div>
        </th>
    );

    const TableView = () => (
        <div className="bg-white border-t border-gray-200 shadow-sm rounded-b-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <TableHeader label="Project" sortKey="name" />
                            <TableHeader label="Template" sortKey="template_id" />
                            <TableHeader label="Status" sortKey="status" />
                            <TableHeader label="Budget" sortKey="budget" />
                            <TableHeader label="Due Date" sortKey="due_date" />
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <AnimatePresence>
                            {paginatedProjects.map((project, index) => (
                                <motion.tr
                                    key={project.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-sm">
                                                {project.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</div>
                                                <div className="text-xs text-gray-500">{getCustomerDisplayName(project) || 'No customer'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getTemplateName(project.template_id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className="px-2.5 py-1 inline-flex text-xs leading-4 font-medium rounded-full border"
                                            style={getStatusStyle(project.status_id)}
                                        >
                                            {getStatusInfo(project.status_id).name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {project.budget ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {project.due_date || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex -space-x-2">
                                            {project.members?.slice(0, 3).map((member, i) => (
                                                <div key={i} className="w-7 h-7 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-purple-600" title={member.individual?.display_name || 'Unknown'}>
                                                    {member.individual?.display_name?.charAt(0) || '?'}
                                                </div>
                                            ))}
                                            {project.members?.length > 3 && (
                                                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                    +{project.members.length - 3}
                                                </div>
                                            )}
                                            {(!project.members || project.members.length === 0) && (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            {sortedProjects.length === 0 ? (
                                'Showing 0 results'
                            ) : (
                                <>Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedProjects.length)}</span> of <span className="font-medium">{sortedProjects.length}</span> results</>
                            )}
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || sortedProjects.length === 0}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            {/* Simple Page Numbers */}
                            {totalPages > 0 && [...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0 || sortedProjects.length === 0}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );

    const GridView = () => (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
                {paginatedProjects.map((project) => (
                    <motion.div
                        key={project.id}
                        layoutId={project.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setSelectedProject(project)}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {project.name.charAt(0)}
                            </div>
                            <span
                                className="px-2 py-1 text-xs font-medium rounded-md border"
                                style={getStatusStyle(project.status_id)}
                            >
                                {getStatusInfo(project.status_id).name}
                            </span>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">{project.name}</h3>
                        <p className="text-sm text-gray-500 mb-4 truncate">{getCustomerDisplayName(project) || 'No customer'}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                            <div className="flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                {project.due_date || 'No date'}
                            </div>
                            <div className="flex -space-x-1.5">
                                {project.members?.slice(0, 3).map((member, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[9px] text-purple-600" title={member.individual?.display_name || 'Unknown'}>
                                        {member.individual?.display_name?.charAt(0) || '?'}
                                    </div>
                                ))}
                                {project.members?.length > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px]">
                                        +{project.members.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    const KanbanView = () => {
        // Use dynamic statuses from API, sorted by sort_order
        const sortedStatuses = [...statuses].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        return (
            <div className="flex h-[calc(100vh-220px)] overflow-x-auto p-6 space-x-6">
                {sortedStatuses.map(status => (
                    <div key={status.id} className="flex-shrink-0 w-80 flex flex-col bg-gray-50 rounded-xl border border-gray-200 max-h-full">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-gray-50 rounded-t-xl z-10">
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: status.color || '#6B7280' }}
                                ></div>
                                <h3 className="font-semibold text-gray-700">{status.name}</h3>
                            </div>
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 border border-gray-200">
                                {filteredProjects.filter(p => p.status_id === status.id).length}
                            </span>
                        </div>

                        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {filteredProjects.filter(p => p.status_id === status.id).map(project => (
                                <motion.div
                                    key={project.id}
                                    layoutId={`kanban-${project.id}`}
                                    onClick={() => setSelectedProject(project)}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            {getTemplateName(project.template_id)}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600">{project.name}</h4>
                                    <p className="text-xs text-gray-500 mb-3">{getCustomerDisplayName(project) || 'No customer'}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-1">
                                            {project.members?.slice(0, 2).map((member, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px]">
                                                    {member.individual?.display_name?.charAt(0) || '?'}
                                                </div>
                                            ))}
                                        </div>
                                        {project.due_date && (
                                            <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                                                {project.due_date}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="relative flex flex-col h-full">
            {/* Filter Panel Overlay */}
            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                templates={templates}
                statuses={statuses}
                members={orgMembers}
                customers={customers}
            />

            {/* Toolbar - Sticky with Offset to avoid overlapping main header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-[89px] sm:top-[93px] z-20 shadow-sm">
                <div className="flex items-center space-x-4 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex items-center px-3 py-2 rounded-lg border transition-colors relative ${(filters.status.length > 0 || filters.templates.length > 0 || filters.members.length > 0 || filters.customers.length > 0 || filters.dueDateFrom || filters.dueDateTo)
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Filter</span>
                        {(filters.status.length > 0 || filters.templates.length > 0 || filters.members.length > 0 || filters.customers.length > 0 || filters.dueDateFrom || filters.dueDateTo) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setVisibilityView('organization')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${visibilityView === 'organization'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        title="All organization projects"
                    >
                        <Building2 className="w-4 h-4" />
                        <span className="hidden sm:inline">All</span>
                    </button>
                    <button
                        onClick={() => setVisibilityView('team')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${visibilityView === 'team'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        title="Projects you own or are a member of"
                    >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Team</span>
                    </button>
                    <button
                        onClick={() => setVisibilityView('personal')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${visibilityView === 'personal'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        title="Projects you own"
                    >
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">My</span>
                    </button>
                </div>

                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Kanban View"
                    >
                        <Kanban className="w-4 h-4" />
                    </button>
                </div>

                <button
                    id="new-project-btn"
                    onClick={() => setIsAddModalOpen(true)}
                    className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-50/30">
                {viewMode === 'table' && <TableView />}
                {viewMode === 'grid' && <GridView />}
                {viewMode === 'kanban' && <KanbanView />}
            </div>

            {/* Modals */}
            <AddProjectModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                templates={templates}
                statuses={statuses}
                organizationSlug={organizationSlug}
                individualId={individualId}
                createProject={createProject}
                onSave={() => {
                    setIsAddModalOpen(false);
                    if (onRefresh) onRefresh();
                }}
            />

            <ProjectDetailModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                project={selectedProject}
                templates={templates}
                statuses={statuses}
                organizationSlug={organizationSlug}
                individualId={individualId}
                updateProject={updateProject}
                deleteProject={deleteProject}
                onSave={() => {
                    setSelectedProject(null);
                    if (onRefresh) onRefresh();
                }}
            />
        </div>
    );
};

export default ProjectsTab;

