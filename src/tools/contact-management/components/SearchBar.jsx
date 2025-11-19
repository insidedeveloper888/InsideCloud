/**
 * SearchBar Component
 * Input field for searching contacts by name, phone, email, company
 */

import React from 'react';
import './SearchBar.css';

export default function SearchBar({ value, onChange, placeholder = '搜索...' }) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="清除搜索"
        >
          ✕
        </button>
      )}
    </div>
  );
}
