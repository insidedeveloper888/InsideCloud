/**
 * 名单管理 (Contact List Management) - Main Component
 */

import React, { useState } from 'react';
import { Users, BarChart3, Kanban, Settings, MapPin } from 'lucide-react';
import { useContacts } from './hooks/useContacts';
import { useStages } from './hooks/useStages';
import { useChannels } from './hooks/useChannels';
import { useTags } from './hooks/useTags';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useContactSettings } from './hooks/useContactSettings';
import ContactListView from './components/ContactListView';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import SettingsView from './components/SettingsView';
import MapViewLeaflet from './components/MapViewLeaflet';

const TABS = {
  LIST: 0,
  DASHBOARD: 1,
  KANBAN: 2,
  MAP: 3,
  SETTINGS: 4,
};

export default function ContactManagementApp({ organizationSlug }) {
  const [activeTab, setActiveTab] = useState(TABS.LIST);

  // Fetch current user for audit fields
  const { individualId } = useCurrentUser();

  console.log('🏠 [ContactManagementApp] Organization:', organizationSlug);
  console.log('🏠 [ContactManagementApp] Individual ID from useCurrentUser:', individualId);

  // Load data
  const {
    contacts,
    isLoading: contactsLoading,
    error: contactsError,
    addContact,
    updateContact,
    deleteContact,
    refreshContacts,
  } = useContacts(organizationSlug, individualId);

  const {
    stages,
    isLoading: stagesLoading,
    addStage,
    updateStage,
    deleteStage,
  } = useStages(organizationSlug);

  const {
    channels,
    isLoading: channelsLoading,
    addChannel,
    updateChannel,
    deleteChannel,
  } = useChannels(organizationSlug);

  const {
    tags,
    createTag: addTag,
    updateTag: updateTagOriginal,
    deleteTag: deleteTagOriginal,
  } = useTags(organizationSlug);

  // Wrap updateTag to also refresh contacts (so updated tag name/color shows in contact list)
  const updateTag = async (tagId, updates) => {
    await updateTagOriginal(tagId, updates);
    console.log('🔄 [ContactManagementApp] Tag updated, refreshing contacts...');
    await refreshContacts();
  };

  // Wrap deleteTag to also refresh contacts (cascade deletion removes tag assignments)
  const deleteTag = async (tagId) => {
    await deleteTagOriginal(tagId);
    console.log('🔄 [ContactManagementApp] Tag deleted, refreshing contacts...');
    await refreshContacts();
  };

  // Fetch contact settings (rating scale, etc.)
  const {
    settings: contactSettings,
    loading: settingsLoading,
    updateSettings: updateContactSettings,
  } = useContactSettings(organizationSlug);

  const maxRatingScale = contactSettings?.max_rating_scale || 10;

  // Setup real-time sync
  useRealtimeSync(organizationSlug);

  const isLoading = contactsLoading || stagesLoading || channelsLoading || settingsLoading;
  const error = contactsError;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-900 font-semibold mb-2">加载失败</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case TABS.LIST:
        return (
          <ContactListView
            contacts={contacts}
            stages={stages}
            channels={channels}
            tags={tags}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
            onRefresh={refreshContacts}
            onCreateTag={addTag}
            organizationSlug={organizationSlug}
            maxRatingScale={maxRatingScale}
          />
        );
      case TABS.DASHBOARD:
        return <DashboardView contacts={contacts} stages={stages} channels={channels} />;
      case TABS.KANBAN:
        return (
          <KanbanView
            contacts={contacts}
            stages={stages}
            onUpdateContact={updateContact}
          />
        );
      case TABS.MAP:
        return <MapViewLeaflet contacts={contacts} />;
      case TABS.SETTINGS:
        return (
          <SettingsView
            stages={stages}
            channels={channels}
            tags={tags}
            onAddStage={addStage}
            onUpdateStage={updateStage}
            onDeleteStage={deleteStage}
            onAddChannel={addChannel}
            onUpdateChannel={updateChannel}
            onDeleteChannel={deleteChannel}
            onAddTag={addTag}
            onUpdateTag={updateTag}
            onDeleteTag={deleteTag}
            contactSettings={contactSettings}
            onUpdateContactSettings={updateContactSettings}
          />
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: TABS.LIST, label: 'Contacts', icon: Users },
    { id: TABS.DASHBOARD, label: 'Analytics', icon: BarChart3 },
    { id: TABS.KANBAN, label: 'Kanban', icon: Kanban },
    { id: TABS.MAP, label: 'Map', icon: MapPin },
    { id: TABS.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-4 md:px-6 py-3 md:py-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">名单管理</h1>
          </div>

          {/* Tabs - Mobile: Icon only, Desktop: Icon + Text */}
          <div className="px-2 md:px-6">
            <div className="flex gap-0.5 md:gap-1 border-b border-gray-200 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3
                      font-medium text-sm transition-colors whitespace-nowrap
                      border-b-2 -mb-px min-w-[60px] md:min-w-0
                      ${
                        isActive
                          ? 'text-blue-600 border-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 pb-6">{renderContent()}</div>
      </div>
    </div>
  );
}
