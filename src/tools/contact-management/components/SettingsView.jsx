/**
 * Settings View - Manage Stages, Channels, and Tags
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
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
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [newStageName, setNewStageName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');

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

  const tabs = [
    { id: 0, label: '阶段管理' },
    { id: 1, label: '渠道管理' },
    { id: 2, label: '标签管理' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">⚙️ 设置</h2>

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
            <h3 className="font-semibold text-gray-900 mb-2">自定义阶段</h3>
            <p className="text-sm text-gray-600 mb-4">创建和管理您的销售阶段</p>

            {/* Stage List */}
            <div className="space-y-2 mb-4">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {stage.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('确定要删除此阶段吗？')) {
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
                placeholder="输入阶段名称..."
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
                <span>添加</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2">流量渠道</h3>
            <p className="text-sm text-gray-600 mb-4">创建和管理您的流量来源</p>

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
                      if (window.confirm('确定要删除此渠道吗？')) {
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
                placeholder="输入渠道名称..."
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
