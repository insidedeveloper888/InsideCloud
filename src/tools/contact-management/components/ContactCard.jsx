/**
 * ContactCard Component
 * Displays a single contact in list or grid view
 */

import React from 'react';
import { getInitialsAvatar, getInitials } from '../utils/avatarUtils';
import TagBadge from './TagBadge';
import './ContactCard.css';

export default function ContactCard({
  contact,
  stage,
  channel,
  onClick,
  onEdit,
  onDelete,
}) {
  const initials = getInitials(contact.first_name, contact.last_name);
  const avatar = contact.avatar_url
    ? contact.avatar_url
    : `data:image/svg+xml,${encodeURIComponent(
        getInitialsAvatar(initials, contact.avatar_color)
      )}`;

  const contactTypeLabel = {
    customer: '客户',
    supplier: '供应商',
    coi: 'COI',
    internal: '内部',
  }[contact.contact_type];

  const handleMenuClick = (e, action) => {
    e.stopPropagation();
    if (action === 'edit') {
      onEdit();
    } else if (action === 'delete') {
      onDelete();
    }
  };

  return (
    <div className="contact-card" onClick={onClick}>
      <div className="contact-card-header">
        <img src={avatar} alt={initials} className="contact-avatar" />
        <div className="contact-info">
          <h3 className="contact-name">
            {contact.first_name} {contact.last_name}
          </h3>
          <div className="contact-badges">
            <span className="badge badge-type">{contactTypeLabel}</span>
            {stage && (
              <span
                className="badge badge-stage"
                style={{
                  backgroundColor: `${stage.color}20`,
                  color: stage.color,
                  borderColor: stage.color,
                }}
              >
                {stage.name}
              </span>
            )}
          </div>
        </div>
        <button
          className="btn-menu"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Open context menu
          }}
          title="更多操作"
        >
          ⋯
        </button>
      </div>

      <div className="contact-details">
        {contact.phone_1 && (
          <div className="detail-item">
            <span className="detail-icon">☎️</span>
            <span className="detail-text">{contact.phone_1}</span>
          </div>
        )}
        {contact.email && (
          <div className="detail-item">
            <span className="detail-icon">📧</span>
            <span className="detail-text">{contact.email}</span>
          </div>
        )}
        {channel && (
          <div className="detail-item">
            <span className="detail-icon">🌐</span>
            <span className="detail-text">{channel.name}</span>
          </div>
        )}
        {contact.assigned_department && (
          <div className="detail-item">
            <span className="detail-icon">🏢</span>
            <span className="detail-text">
              {contact.assigned_department === 'sales' ? '销售' : '客服'}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="contact-tags" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {contact.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="xs" />
          ))}
          {contact.tags.length > 3 && (
            <span style={{ fontSize: '11px', color: '#6B7280', padding: '2px 4px' }}>
              +{contact.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
