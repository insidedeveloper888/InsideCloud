/**
 * ContactDetailSidebar Component
 * Displays detailed information about a selected contact
 */

import React from 'react';
import { getInitials, getInitialsAvatar } from '../utils/avatarUtils';
import './ContactDetailSidebar.css';

export default function ContactDetailSidebar({
  contact,
  stage,
  onClose,
  onEdit,
  onDelete,
}) {
  const initials = getInitials(contact.first_name, contact.last_name);
  const avatar = contact.avatar_url
    ? contact.avatar_url
    : `data:image/svg+xml,${encodeURIComponent(
        getInitialsAvatar(initials, contact.avatar_color)
      )}`;

  return (
    <div className="contact-detail-sidebar">
      <div className="sidebar-overlay" onClick={onClose}></div>
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <h2>
            {contact.first_name} {contact.last_name}
          </h2>
          <button className="btn-close" onClick={onClose} title="关闭">
            ✕
          </button>
        </div>

        {/* Avatar */}
        <div className="sidebar-avatar">
          <img src={avatar} alt={initials} />
        </div>

        {/* Contact Type & Stage */}
        <div className="sidebar-section">
          <div className="info-row">
            <span className="label">类型:</span>
            <span className="value">
              {contact.contact_type === 'customer'
                ? '客户'
                : contact.contact_type === 'supplier'
                ? '供应商'
                : contact.contact_type === 'coi'
                ? 'COI'
                : '内部'}
            </span>
          </div>
          {stage && (
            <div className="info-row">
              <span className="label">阶段:</span>
              <span className="value">{stage.name}</span>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="sidebar-section">
          <h3 className="section-title">联系方式</h3>
          {contact.phone_1 && (
            <div className="info-row">
              <span className="label">☎️ 电话1:</span>
              <span className="value">{contact.phone_1}</span>
            </div>
          )}
          {contact.phone_2 && (
            <div className="info-row">
              <span className="label">☎️ 电话2:</span>
              <span className="value">{contact.phone_2}</span>
            </div>
          )}
          {contact.email && (
            <div className="info-row">
              <span className="label">📧 邮箱:</span>
              <span className="value">{contact.email}</span>
            </div>
          )}
        </div>

        {/* Company Information */}
        {contact.company_name && (
          <div className="sidebar-section">
            <h3 className="section-title">公司信息</h3>
            <div className="info-row">
              <span className="label">公司名称:</span>
              <span className="value">{contact.company_name}</span>
            </div>
            {contact.contact_person_name && (
              <div className="info-row">
                <span className="label">联系人:</span>
                <span className="value">{contact.contact_person_name}</span>
              </div>
            )}
            {contact.industry && (
              <div className="info-row">
                <span className="label">行业:</span>
                <span className="value">{contact.industry}</span>
              </div>
            )}
          </div>
        )}

        {/* Address Information */}
        {contact.address_line_1 && (
          <div className="sidebar-section">
            <h3 className="section-title">地址</h3>
            <div className="info-row">
              <span className="label">地址:</span>
              <span className="value">
                {contact.address_line_1}
                {contact.address_line_2 && ` ${contact.address_line_2}`}
              </span>
            </div>
            {contact.city && (
              <div className="info-row">
                <span className="label">城市:</span>
                <span className="value">
                  {contact.city}
                  {contact.state && `, ${contact.state}`}
                </span>
              </div>
            )}
            {contact.postal_code && (
              <div className="info-row">
                <span className="label">邮编:</span>
                <span className="value">{contact.postal_code}</span>
              </div>
            )}
          </div>
        )}

        {/* Assignment */}
        <div className="sidebar-section">
          <h3 className="section-title">分配</h3>
          {contact.assigned_department && (
            <div className="info-row">
              <span className="label">部门:</span>
              <span className="value">
                {contact.assigned_department === 'sales' ? '销售' : '客服'}
              </span>
            </div>
          )}
          {contact.assigned_to_individual_id && (
            <div className="info-row">
              <span className="label">分配给:</span>
              <span className="value">销售代表</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="sidebar-section">
            <h3 className="section-title">备注</h3>
            <p className="notes-text">{contact.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sidebar-actions">
          <button className="btn-edit" onClick={onEdit}>
            编辑
          </button>
          <button className="btn-delete" onClick={onDelete}>
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
