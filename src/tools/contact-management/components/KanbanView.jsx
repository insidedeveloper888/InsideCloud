/**
 * Kanban View - Pipeline Board
 * Mobile-friendly with accordion view and dropdown stage selector
 */

import React, { useState } from 'react';
export default function KanbanView({ contacts = [], stages = [], onUpdateContact }) {
  // Filter to show only customers
  const customers = contacts.filter((c) => c.contact_type === 'customer');
  const [draggedContact, setDraggedContact] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDragStart = (e, contact) => {
    setDraggedContact(contact);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedContact(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedContact || draggedContact.current_stage_id === targetStageId) {
      setDraggedContact(null);
      return;
    }

    // Update contact stage - send full contact object to preserve all fields
    onUpdateContact(draggedContact.id, {
      ...draggedContact,
      current_stage_id: targetStageId,
    });
    setDraggedContact(null);
  };

  const handleStageChange = async (contact, newStageId) => {
    // Send full contact object to preserve all fields
    await onUpdateContact(contact.id, {
      ...contact,
      current_stage_id: newStageId,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">📋 Pipeline</h2>
        <span className="text-xs md:text-sm text-gray-600">
          Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {stages.length > 0 ? (
        <>
          {/* Desktop: Horizontal Kanban Board */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageContacts = customers.filter(
                (c) => c.current_stage_id === stage.id
              );
              const isDropTarget = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-72 lg:w-80"
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className={`border rounded-lg bg-white transition-all ${
                    isDropTarget
                      ? 'border-blue-500 border-2 bg-blue-50'
                      : 'border-gray-200'
                  }`}>
                    {/* Column Header */}
                    <div
                      className="flex justify-between items-center p-4 border-b-2"
                      style={{ borderBottomColor: stage.color }}
                    >
                      <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                      <span
                        className="px-2.5 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${stage.color}20`,
                          color: stage.color,
                        }}
                      >
                        {stageContacts.length}
                      </span>
                    </div>

                    {/* Contact Cards */}
                    <div className="p-3 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto">
                      {stageContacts.length > 0 ? (
                        stageContacts.map((contact) => (
                          <div
                            key={contact.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, contact)}
                            onDragEnd={handleDragEnd}
                            className={`border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-all cursor-move ${
                              draggedContact?.id === contact.id
                                ? 'opacity-50 rotate-2 scale-105'
                                : ''
                            }`}
                          >
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {contact.company_name || 'Customer'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-gray-500">
                            {isDropTarget ? 'Drop here' : 'No contacts'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Accordion with Dropdowns */}
          <div className="md:hidden space-y-3">
            {stages.map((stage) => {
              const stageContacts = customers.filter(
                (c) => c.current_stage_id === stage.id
              );

              return (
                <div key={stage.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  {/* Stage Header */}
                  <div
                    className="flex items-center justify-between p-4 border-b-2"
                    style={{ borderBottomColor: stage.color }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${stage.color}20`,
                        color: stage.color,
                      }}
                    >
                      {stageContacts.length}
                    </span>
                  </div>

                  {/* Contact List */}
                  <div className="divide-y divide-gray-100">
                    {stageContacts.length > 0 ? (
                      stageContacts.map((contact) => (
                        <div key={contact.id} className="p-3 bg-white hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {contact.first_name} {contact.last_name}
                              </h4>
                              {contact.company_name && (
                                <p className="text-xs text-gray-600 mt-0.5 truncate">
                                  {contact.company_name}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Stage Selector Dropdown */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 shrink-0">Move to:</label>
                            <select
                              value={contact.current_stage_id || ''}
                              onChange={(e) => handleStageChange(contact, e.target.value)}
                              className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {stages.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-xs text-gray-500">No contacts in this stage</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 md:py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full mb-3 md:mb-4">
            <span className="text-2xl md:text-3xl">📋</span>
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No custom stages</h3>
          <p className="text-sm md:text-base text-gray-600">Please create stages in settings</p>
        </div>
      )}
    </div>
  );
}
