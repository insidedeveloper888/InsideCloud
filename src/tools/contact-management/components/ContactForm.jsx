/**
 * ContactForm Component
 * Multi-step form for creating/editing contacts
 */

import React, { useState } from 'react';
import './ContactForm.css';

export default function ContactForm({
  contact,
  stages = [],
  channels = [],
  onSubmit,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(
    contact || {
      first_name: '',
      last_name: '',
      phone_1: '',
      phone_2: '',
      email: '',
      gender: '',
      company_name: '',
      entity_type: 'individual',
      contact_person_name: '',
      contact_person_phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      contact_type: 'customer',
      traffic_source_id: '',
      assigned_department: '',
      current_stage_id: '',
      notes: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="contact-form-modal">
      <div className="form-overlay" onClick={onCancel}></div>
      <div className="form-container">
        <div className="form-header">
          <h2>{contact ? 'Edit contact' : 'Add contact'}</h2>
          <button className="btn-close" onClick={onCancel} title="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="form-step">
              <h3>Basic information</h3>

              <div className="form-group">
                <label htmlFor="contact_type">*Contact type</label>
                <select
                  id="contact_type"
                  name="contact_type"
                  value={formData.contact_type}
                  onChange={handleChange}
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="coi">COI</option>
                  <option value="internal">Internal</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">*名</label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">*Last name</label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone_1">*Main phone</label>
                <input
                  id="phone_1"
                  type="tel"
                  name="phone_1"
                  value={formData.phone_1}
                  onChange={handleChange}
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone_2">Secondary phone</label>
                <input
                  id="phone_2"
                  type="tel"
                  name="phone_2"
                  value={formData.phone_2}
                  onChange={handleChange}
                  placeholder="Secondary phone"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </div>
            </div>
          )}

          {/* Step 2: Company Information */}
          {step === 2 && (
            <div className="form-step">
              <h3>公司信息</h3>

              <div className="form-group">
                <label htmlFor="entity_type">*实体类型</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="entity_type"
                      value="individual"
                      checked={formData.entity_type === 'individual'}
                      onChange={handleChange}
                    />
                    个人
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="entity_type"
                      value="company"
                      checked={formData.entity_type === 'company'}
                      onChange={handleChange}
                    />
                    公司
                  </label>
                </div>
              </div>

              {formData.entity_type === 'company' && (
                <>
                  <div className="form-group">
                    <label htmlFor="company_name">公司名称</label>
                    <input
                      id="company_name"
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="公司名称"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact_person_name">联系人</label>
                    <input
                      id="contact_person_name"
                      type="text"
                      name="contact_person_name"
                      value={formData.contact_person_name}
                      onChange={handleChange}
                      placeholder="联系人名称"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact_person_phone">联系人电话</label>
                    <input
                      id="contact_person_phone"
                      type="tel"
                      name="contact_person_phone"
                      value={formData.contact_person_phone}
                      onChange={handleChange}
                      placeholder="联系人电话"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Address & Assignment */}
          {step === 3 && (
            <div className="form-step">
              <h3>地址与分配</h3>

              <div className="form-group">
                <label htmlFor="address_line_1">地址</label>
                <input
                  id="address_line_1"
                  type="text"
                  name="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleChange}
                  placeholder="街道地址"
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">城市</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="城市"
                />
              </div>

              <div className="form-group">
                <label htmlFor="traffic_source_id">*流量渠道</label>
                <select
                  id="traffic_source_id"
                  name="traffic_source_id"
                  value={formData.traffic_source_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择渠道...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assigned_department">部门</label>
                <select
                  id="assigned_department"
                  name="assigned_department"
                  value={formData.assigned_department}
                  onChange={handleChange}
                >
                  <option value="">未分配</option>
                  <option value="sales">销售</option>
                  <option value="customer_service">客服</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="current_stage_id">*阶段</label>
                <select
                  id="current_stage_id"
                  name="current_stage_id"
                  value={formData.current_stage_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">选择阶段...</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            {step > 1 && (
              <button type="button" className="btn-back" onClick={handleBack}>
                上一步
              </button>
            )}
            <button type="submit" className="btn-submit">
              {step < 3 ? '下一步' : '保存'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
