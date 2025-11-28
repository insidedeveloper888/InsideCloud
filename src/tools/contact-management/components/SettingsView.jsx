/**
 * Settings View - Manage Stages, Channels, and Tags
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, GripVertical, Lock, AlertCircle } from 'lucide-react';
import TagBadge from './TagBadge';

export default function SettingsView({
  stages = [],
  channels = [],
  tags = [],
  contactTypes = [],
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onAddContactType,
  onUpdateContactType,
  onDeleteContactType,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [newStageName, setNewStageName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');
  const [draggedStageIndex, setDraggedStageIndex] = useState(null);
  const [editingStageColorId, setEditingStageColorId] = useState(null);

  // Contact Type management state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeDescription, setEditingTypeDescription] = useState('');
  const [typeError, setTypeError] = useState('');

  const handleAddStage = () => {
    if (newStageName.trim()) {
      onAddStage({
        name: newStageName,
        color: '#2196F3',
        order_index: stages.length,
      });
      setNewStageName('');
    }
  };

  const handleAddChannel = () => {
    if (newChannelName.trim()) {
      onAddChannel({
        name: newChannelName,
        is_enabled: true,
      });
      setNewChannelName('');
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      onAddTag({
        name: newTagName,
        color: newTagColor,
      });
      setNewTagName('');
      setNewTagColor('#3B82F6');
    }
  };

  const handleEditTag = (tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setEditingTagColor(tag.color);
  };

  const handleSaveTag = (tagId) => {
    if (editingTagName.trim()) {
      onUpdateTag(tagId, {
        name: editingTagName,
        color: editingTagColor,
      });
      setEditingTagId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingTagName('');
    setEditingTagColor('');
  };

  // Drag and drop handlers for stages
  const handleDragStart = (e, index, stage) => {
    // PROTECTION: Prevent dragging system stages
    if (stage?.is_system) {
      e.preventDefault();
      return;
    }
    setDraggedStageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex, targetStage) => {
    e.preventDefault();

    // PROTECTION: Prevent dropping onto system stages
    if (targetStage?.is_system) {
      setDraggedStageIndex(null);
      return;
    }

    if (draggedStageIndex === null || draggedStageIndex === dropIndex) {
      setDraggedStageIndex(null);
      return;
    }

    // Reorder stages
    const sortedStages = [...stages].sort((a, b) => a.order_index - b.order_index);
    const [removed] = sortedStages.splice(draggedStageIndex, 1);
    sortedStages.splice(dropIndex, 0, removed);

    // Update order_index for all stages
    sortedStages.forEach((stage, index) => {
      onUpdateStage(stage.id, { order_index: index });
    });

    setDraggedStageIndex(null);
  };

  const handleStageColorChange = (stageId, newColor) => {
    onUpdateStage(stageId, { color: newColor });
    setEditingStageColorId(null);
  };

  // Contact Type handlers
  const handleAddContactType = async () => {
    if (!newTypeName.trim()) return;

    setTypeError('');
    const code = newTypeCode.trim() || newTypeName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      await onAddContactType({
        code: code,
        name: newTypeName.trim(),
        description: newTypeDescription.trim() || null,
      });
      setNewTypeName('');
      setNewTypeCode('');
      setNewTypeDescription('');
    } catch (error) {
      setTypeError(error.message || 'Failed to create contact type');
    }
  };

  const handleEditContactType = (type) => {
    setEditingTypeId(type.id);
    setEditingTypeName(type.name);
    setEditingTypeDescription(type.description || '');
    setTypeError('');
  };

  const handleSaveContactType = async (typeId) => {
    if (!editingTypeName.trim()) return;

    setTypeError('');
    try {
      await onUpdateContactType(typeId, {
        name: editingTypeName.trim(),
        description: editingTypeDescription.trim() || null,
      });
      setEditingTypeId(null);
      setEditingTypeName('');
      setEditingTypeDescription('');
    } catch (error) {
      setTypeError(error.message || 'Failed to update contact type');
    }
  };

  const handleCancelEditType = () => {
    setEditingTypeId(null);
    setEditingTypeName('');
    setEditingTypeDescription('');
    setTypeError('');
  };

  const handleDeleteContactType = async (type) => {
    if (type.is_system) {
      setTypeError('System types cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${type.name}"? Contacts using this type will need to be reassigned.`)) {
      return;
    }

    setTypeError('');
    try {
      await onDeleteContactType(type.id);
    } catch (error) {
      setTypeError(error.message || 'Cannot delete this type. It may be in use by contacts.');
    }
  };

  const tabs = [
    { id: 0, label: 'Stage management' },
    { id: 1, label: 'Channel management' },
    { id: 2, label: 'Tag management' },
    { id: 3, label: 'Contact type management' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900">⚙️ Settings</h2>

      {/* Tabs - Responsive with horizontal scroll on mobile */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap
                border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stages Tab */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2">Custom stages</h3>
            <p className="text-sm text-gray-600 mb-4">Create and manage your sales stages</p>

            {/* Stage List */}
            <div className="space-y-2 mb-4">
              {[...stages].sort((a, b) => a.order_index - b.order_index).map((stage, index) => (
                <div
                  key={stage.id}
                  draggable={!stage.is_system}
                  onDragStart={(e) => handleDragStart(e, index, stage)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, stage)}
                  className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg transition-all ${
                    stage.is_system
                      ? 'cursor-default bg-gray-50'
                      : draggedStageIndex === index
                      ? 'opacity-50 cursor-move'
                      : 'hover:bg-gray-50 cursor-move'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {stage.is_system ? (
                      <Lock size={16} className="text-blue-500" title="System stage - cannot be reordered" />
                    ) : (
                      <GripVertical size={16} className="text-gray-400" />
                    )}
                    <div className="relative">
                      <div
                        onClick={() => setEditingStageColorId(editingStageColorId === stage.id ? null : stage.id)}
                        className="w-4 h-4 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all"
                        style={{ backgroundColor: stage.color }}
                        title="Click to change color"
                      />
                      {editingStageColorId === stage.id && (
                        <div className="absolute top-6 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                          <input
                            type="color"
                            value={stage.color}
                            onChange={(e) => handleStageColorChange(stage.id, e.target.value)}
                            className="w-32 h-10 rounded border border-gray-300 cursor-pointer"
                            autoFocus
                            onBlur={() => setEditingStageColorId(null)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {stage.name}
                      </span>
                      {stage.is_system && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Lock size={12} />
                          System
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (stage.is_system) {
                        alert(`System stage "${stage.name}" cannot be deleted. System stages (Lead, Won, Lost) are required for analytics.`);
                        return;
                      }
                      if (window.confirm('Are you sure you want to delete this stage?')) {
                        onDeleteStage(stage.id);
                      }
                    }}
                    disabled={stage.is_system}
                    className={`p-2 rounded-lg transition-colors ${
                      stage.is_system
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={stage.is_system ? 'System stages cannot be deleted' : 'Delete stage'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Stage Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter stage name..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddStage();
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <button
                onClick={handleAddStage}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2">Traffic channels</h3>
            <p className="text-sm text-gray-600 mb-4">Create and manage your traffic sources</p>

            {/* Channel List */}
            <div className="space-y-2 mb-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">
                    🌐 {channel.name}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this channel?')) {
                        onDeleteChannel(channel.id);
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Channel Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter channel name..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddChannel();
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <button
                onClick={handleAddChannel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                <span>添加</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2">Contact Tags</h3>
            <p className="text-sm text-gray-600 mb-4">Create and manage tags to categorize your contacts</p>

            {/* Tag List */}
            <div className="space-y-2 mb-4">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  {editingTagId === tag.id ? (
                    /* Edit Mode */
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="color"
                          value={editingTagColor}
                          onChange={(e) => setEditingTagColor(e.target.value)}
                          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveTag(tag.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* View Mode */
                    <>
                      <TagBadge tag={tag} size="md" />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditTag(tag)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this tag? All assignments will be removed.')) {
                              onDeleteTag(tag.id);
                            }
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {tags.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No tags yet. Create your first tag below.</p>
                </div>
              )}
            </div>

            {/* Add Tag Form */}
            <div className="flex gap-2">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                title="Choose tag color"
              />
              <input
                type="text"
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <button
                onClick={handleAddTag}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Types Tab */}
      {activeTab === 3 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2">Contact Types</h3>
            <p className="text-sm text-gray-600 mb-4">Define contact types for your organization. System types (Customer, Supplier) cannot be deleted.</p>

            {/* Error Message */}
            {typeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <span className="text-sm text-red-700">{typeError}</span>
              </div>
            )}

            {/* Contact Type List */}
            <div className="space-y-2 mb-4">
              {contactTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  {editingTypeId === type.id ? (
                    /* Edit Mode */
                    <>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTypeName}
                            onChange={(e) => setEditingTypeName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="Type name"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleSaveContactType(type.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancelEditType}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* View Mode */
                    <>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{type.name}</span>
                            <span className="text-xs text-gray-500">({type.code})</span>
                            {type.is_system && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                <Lock size={12} />
                                System
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditContactType(type)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteContactType(type)}
                          disabled={type.is_system}
                          className={`p-2 rounded-lg transition-colors ${type.is_system
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                            }`}
                          title={type.is_system ? 'System types cannot be deleted' : 'Delete'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {contactTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No contact types found. Create your first custom type below.</p>
                </div>
              )}
            </div>

            {/* Add Contact Type Form */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Contact Type</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type name (e.g., Partner, Investor)"
                    value={newTypeName}
                    onChange={(e) => {
                      setNewTypeName(e.target.value);
                      // Auto-generate code from name
                      if (!newTypeCode) {
                        const autoCode = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        setNewTypeCode(autoCode);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddContactType();
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Code (auto)"
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm"
                  />
                  <button
                    onClick={handleAddContactType}
                    disabled={!newTypeName.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                    <span>Add Type</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
