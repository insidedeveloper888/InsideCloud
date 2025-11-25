import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Calendar, FileJson } from 'lucide-react';
import { ProjectManagementAPI } from './api/project-management';
import DashboardTab from './components/tabs/DashboardTab';
import ProjectsTab from './components/tabs/ProjectsTab';
import ScheduleTab from './components/tabs/ScheduleTab';
import TemplatesTab from './components/tabs/TemplatesTab';

const ProjectManagement = ({ organizationSlug }) => {
  // Global State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, templatesData] = await Promise.all([
        ProjectManagementAPI.getProjects(organizationSlug),
        ProjectManagementAPI.getTemplates(organizationSlug)
      ]);
      setProjects(projectsData);
      setTemplates(templatesData);
    } catch (err) {
      console.error("Failed to fetch project data:", err);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug]);

  // Tab Configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: FileJson },
  ];

  // Render Content based on Active Tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <DashboardTab projects={projects} />
          </div>
        );
      case 'projects':
        return <ProjectsTab projects={projects} templates={templates} onRefresh={fetchData} organizationSlug={organizationSlug} />;
      case 'schedule':
        return (
          <div className="p-6">
            <ScheduleTab projects={projects} />
          </div>
        );
      case 'templates':
        return (
          <div className="p-6">
            <TemplatesTab templates={templates} onRefresh={fetchData} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-inter">
      {/* Header Section */}
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 pt-4 pb-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Project Management</h1>
              <p className="text-sm text-gray-500 mt-1">Dynamic Project Orchestration</p>
            </div>

            {/* Primary Action Button - Context Aware */}
            {activeTab === 'projects' && (
              <button
                onClick={() => document.getElementById('new-project-btn')?.click()}
                className="hidden" // Hidden trigger for now, handled inside ProjectsTab
              >
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Sticky */}
        <div className="sticky top-[44px] sm:top-[48px] z-30 bg-white px-6 pb-0 shadow-sm">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-4 py-3 border-b-2 text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area - Removed padding as requested */}
      <main className="w-full">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProjectManagement;
