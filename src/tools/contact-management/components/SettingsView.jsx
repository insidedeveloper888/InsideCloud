/**
 * Settings View - Manage Stages, Channels, and Tags
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import TagBadge from './TagBadge';

export default function SettingsView({
  stages = [],
  channels = [],
  tags = [],
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  contactSettings = {},
  onUpdateContactSettings,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRatingScale, setSelectedRatingScale] = useState(contactSettings?.max_rating_scale || 10);
  const [newStageName, setNewStageName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');
  const [draggedStageIndex, setDraggedStageIndex] = useState(null);
  const [editingStageColorId, setEditingStageColorId] = useState(null);

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
  const handleDragStart = (e, index) => {
    setDraggedStageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

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

  const handleRatingScaleChange = async (scale) => {
    setSelectedRatingScale(scale);
    if (onUpdateContactSettings) {
      try {
        await onUpdateContactSettings({ max_rating_scale: parseInt(scale) });
      } catch (error) {
        console.error('Failed to update rating scale:', error);
        // Revert on error
        setSelectedRatingScale(contactSettings?.max_rating_scale || 10);
      }
    }
  };

  const tabs = [
    { id: 0, label: 'Stage management' },
    { id: 1, label: 'Channel management' },
    { id: 2, label: 'Tag management' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">⚙️ Settings</h2>

      {/* General Settings */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-2">General Settings</h3>
        <p className="text-sm text-gray-600 mb-4">Configure general contact management settings</p>

        <div className="space-y-4">
          {/* Rating Scale Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Rating Scale
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose how many stars you want to use for customer conversion probability ratings (3-10 stars)
            </p>
            <div className="flex items-center gap-3">
              <select
                value={selectedRatingScale}
                onChange={(e) => handleRatingScaleChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="3">3-star rating (Low, Medium, High)</option>
                <option value="4">4-star rating</option>
                <option value="5">5-star rating (Standard)</option>
                <option value="6">6-star rating</option>
                <option value="7">7-star rating</option>
                <option value="8">8-star rating</option>
                <option value="9">9-star rating</option>
                <option value="10">10-star rating (Detailed)</option>
              </select>
              <span className="text-sm text-gray-600">
                Current: {selectedRatingScale} stars
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 font-medium text-sm transition-colors
                border-b-2 -mb-px
                ${
                  activeTab === tab.id
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-move transition-all ${
                    draggedStageIndex === index ? 'opacity-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-gray-400" />
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
                    <span className="text-sm font-medium text-gray-900">
                      {stage.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this stage?')) {
                        onDeleteStage(stage.id);
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
}
