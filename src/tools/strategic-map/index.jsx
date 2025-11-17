import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as StrategicMapAPI from './api';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { debounce } from '../../lib/debounce';
import axios from 'axios';

// Strategic categories - 6 balanced scorecard categories
const categories = [
  '阶段成就',  // Phase Achievements
  '财务盈利',  // Financial Profitability
  '客户市场',  // Customer Market
  '内部系统',  // Internal Systems
  '人才资本',  // Human Capital
  '学习成长',  // Learning & Growth
];

// Helper: Get ISO week number
const getISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Helper: Get weeks in a month (ISO standard)
const getWeeksInMonth = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];

  let currentDate = new Date(firstDay);
  // Start from Monday
  currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);

  while (currentDate <= lastDay) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

    // ISO 8601: A week belongs to the month that contains its Thursday
    const thursday = new Date(weekStart);
    thursday.setDate(thursday.getDate() + 3); // Monday + 3 = Thursday

    // Only include week if Thursday belongs to this month
    if (thursday.getMonth() === month && thursday.getFullYear() === year) {
      // Format dates as YYYY-MM-DD using local timezone
      const formatLocalDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      weeks.push({
        weekNumber: getISOWeek(weekStart),
        startDate: formatLocalDate(weekStart),
        endDate: formatLocalDate(weekEnd),
        label: `Week ${getISOWeek(weekStart)}`,
      });
    }

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

// Helper: Get days in a week
const getDaysInWeek = (weekStartDate) => {
  const days = [];
  // Parse as local date to avoid timezone issues
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const start = new Date(year, month - 1, day); // month is 0-indexed
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);

    // Format as YYYY-MM-DD using local timezone (avoid UTC conversion)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    days.push({
      date: dateStr,
      label: `${dayNames[i]} ${date.getDate()}`,
      dayName: dayNames[i],
    });
  }

  return days;
};

// Helper: Convert URLs in text to clickable links
const linkifyText = (text) => {
  if (!text) return text;

  // Regex to match URLs (http://, https://, www., or common TLDs)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}[^\s]*)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the URL as a link
    let url = match[0];
    let href = url;

    // Add https:// if URL doesn't have protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      href = 'https://' + url;
    }

    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
        onClick={(e) => e.stopPropagation()} // Prevent double-click event from triggering
      >
        {url}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Checklist Item Component
const ChecklistItem = ({ item, onToggle, onRemove, onEdit, readOnly }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const editTextareaRef = React.useRef(null);

  const getNextStatus = (current) => {
    if (current === 'neutral') return 'done';
    if (current === 'done') return 'fail';
    return 'neutral';
  };

  const statusColor = {
    neutral: '#9ca3af',
    done: '#22c55e',
    fail: '#ef4444',
  };

  const handleDoubleClick = () => {
    if (!readOnly) {
      setIsEditing(true);
      setEditText(item.text);
      // Auto-adjust height after entering edit mode
      setTimeout(() => {
        if (editTextareaRef.current) {
          editTextareaRef.current.style.height = 'auto';
          editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
        }
      }, 0);
    }
  };

  const adjustEditHeight = () => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  };

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onEdit(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(item.text);
    }
  };

  const handleEditChange = (e) => {
    setEditText(e.target.value);
    adjustEditHeight();
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 pb-2 border-b border-gray-200">
        <div className="flex-shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 20 20" fill={statusColor[item.status || 'neutral']}>
            <circle cx="10" cy="10" r="8" />
          </svg>
        </div>
        <textarea
          ref={editTextareaRef}
          value={editText}
          onChange={handleEditChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 text-xs text-black border border-blue-500 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group pb-2 border-b border-gray-200">
      <button
        onClick={() => !readOnly && onToggle(item.id, getNextStatus(item.status))}
        className="flex-shrink-0 mt-0.5"
        disabled={readOnly}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill={statusColor[item.status || 'neutral']}>
          <circle cx="10" cy="10" r="8" />
        </svg>
      </button>
      <span
        className={cn(
          "flex-1 text-xs leading-tight text-black whitespace-pre-wrap cursor-pointer break-words",
          item.status === 'done' && "text-black",
          item.status === 'fail' && "text-red-500",
          readOnly && "opacity-60"
        )}
        onDoubleClick={handleDoubleClick}
        style={{ wordBreak: 'break-all' }}
        title={readOnly ? "Cascaded from parent (read-only)" : "Double-click to edit"}
      >
        {linkifyText(item.text)}
      </span>
      {!readOnly && (
        <button
          onClick={() => onRemove(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Cell Input Component with textarea for multi-line support
const CellInput = ({ onSave }) => {
  const [value, setValue] = useState('');
  const textareaRef = React.useRef(null);

  // Auto-resize textarea based on content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSave(value.trim());
        setValue('');
        // Reset height after clearing
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        }, 0);
      }
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      onSave(value.trim());
      setValue('');
      // Reset height after clearing
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 0);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder=""
      className="w-full px-2 py-1.5 text-xs text-black border border-dashed border-gray-300 rounded focus:outline-none focus:border-primary-500 resize-none overflow-hidden"
      rows={1}
    />
  );
};

// Cell Component - displays items and input
const Cell = ({ items = [], onAddItem, onToggleStatus, onRemoveItem, onEditItem, readOnly = false }) => {
  return (
    <div className="flex flex-col gap-2 p-2 min-h-[80px]">
      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          item={item}
          onToggle={(_, status) => onToggleStatus(item.id, status)}
          onRemove={() => onRemoveItem(item.id)}
          onEdit={(id, text) => onEditItem(id, text)}
          readOnly={readOnly}
        />
      ))}
      {!readOnly && (
        <CellInput
          onSave={(text) => onAddItem(text)}
        />
      )}
    </div>
  );
};

// Main Strategic Map Component
const StrategicMapV2Preview = ({ organizationSlug }) => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState(null);

  // Get today's date info for auto-expansion
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentWeek = getISOWeek(today);

  // Load data (from API or localStorage based on config)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedData = await StrategicMapAPI.loadItems(organizationSlug);
      setData(loadedData);

      // Auto-discover years from loaded data
      const yearsWithData = new Set();
      Object.keys(loadedData).forEach(key => {
        if (key.startsWith('yearly_')) {
          const items = loadedData[key];
          items.forEach(item => {
            if (item.colIndex !== null) {
              const year = currentYear + item.colIndex; // year_index 0 = current year
              yearsWithData.add(year);
            }
          });
        }
      });

      // Add years with data to the years array (if not already included)
      if (yearsWithData.size > 0) {
        setYears(prev => {
          const allYears = new Set([...prev, ...yearsWithData]);
          return Array.from(allYears).sort((a, b) => a - b);
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to localStorage
      const localData = StrategicMapAPI.loadFromLocalStorage(organizationSlug);
      setData(localData);

      // Auto-discover years from local data too
      const yearsWithData = new Set();
      Object.keys(localData).forEach(key => {
        if (key.startsWith('yearly_')) {
          const items = localData[key];
          items.forEach(item => {
            if (item.colIndex !== null) {
              const year = currentYear + item.colIndex;
              yearsWithData.add(year);
            }
          });
        }
      });

      if (yearsWithData.size > 0) {
        setYears(prev => {
          const allYears = new Set([...prev, ...yearsWithData]);
          return Array.from(allYears).sort((a, b) => a - b);
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug, currentYear]);

  // Fetch organization ID for realtime filtering
  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || '';
        const response = await axios.get(`${API_BASE}/api/organization?slug=${organizationSlug}`, {
          withCredentials: true  // Send cookies for authentication
        });
        if (response.data && response.data.id) {
          setOrganizationId(response.data.id);
          console.log('📍 Organization ID fetched for realtime:', response.data.id);
        }
      } catch (error) {
        console.warn('⚠️  Could not fetch organization ID for realtime sync:', error);
      }
    };

    if (organizationSlug) {
      fetchOrganizationId();
    }
  }, [organizationSlug]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper: Transform database row to frontend format
  const transformItemToFrontend = useCallback((row) => {
    // Determine colIndex based on timeframe
    let colIndex = null;
    if (row.timeframe === 'yearly') {
      colIndex = row.year_index !== null ? row.year_index : null;
    } else if (row.timeframe === 'monthly') {
      colIndex = row.month_col_index !== null ? row.month_col_index : null;
    } else if (row.timeframe === 'weekly') {
      colIndex = row.week_number !== null ? row.week_number : null;
    } else if (row.timeframe === 'daily') {
      colIndex = row.daily_date_key !== null ? row.daily_date_key : null;
    }

    return {
      id: row.id,
      text: row.text,
      status: row.status,
      timeframe: row.timeframe,
      rowIndex: row.category_index,
      colIndex,
      isCascaded: row.is_cascaded || false,
      parentItemId: row.parent_item_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }, []);

  // Handle realtime updates from other users
  const handleRealtimeUpdate = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log('📡 Processing realtime event:', eventType, newRecord || oldRecord);

    if (eventType === 'INSERT' && newRecord) {
      // Another user created an item
      const item = transformItemToFrontend(newRecord);
      const key = `${item.timeframe}_${item.rowIndex}_${item.colIndex}`;

      setData(prev => {
        // Check if item already exists (avoid duplicates from our own actions)
        const existing = prev[key] || [];
        if (existing.some(i => i.id === item.id)) {
          return prev; // Already have this item
        }

        console.log('➕ Adding item from realtime:', key, item);
        return {
          ...prev,
          [key]: [...existing, item],
        };
      });
    } else if (eventType === 'UPDATE' && newRecord) {
      // Another user updated an item
      const item = transformItemToFrontend(newRecord);
      const key = `${item.timeframe}_${item.rowIndex}_${item.colIndex}`;

      setData(prev => {
        const cellItems = prev[key] || [];
        const itemIndex = cellItems.findIndex(i => i.id === item.id);

        if (itemIndex === -1) {
          // Item not found, might have been moved to this cell
          console.log('➕ Adding moved item from realtime:', key, item);
          return {
            ...prev,
            [key]: [...cellItems, item],
          };
        }

        console.log('✏️  Updating item from realtime:', key, item);
        const updated = [...cellItems];
        updated[itemIndex] = item;
        return {
          ...prev,
          [key]: updated,
        };
      });
    } else if (eventType === 'DELETE' && oldRecord) {
      // Another user deleted an item (soft delete)
      const item = transformItemToFrontend(oldRecord);
      const key = `${item.timeframe}_${item.rowIndex}_${item.colIndex}`;

      console.log('🗑️  Removing item from realtime:', key, item.id);
      setData(prev => {
        const cellItems = prev[key] || [];
        return {
          ...prev,
          [key]: cellItems.filter(i => i.id !== item.id),
        };
      });
    }
  }, [transformItemToFrontend]);

  // Subscribe to realtime updates
  useRealtimeSync(organizationId, handleRealtimeUpdate);

  // Calculate the week start date for current week
  const getTodayWeekStart = () => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  // Expansion state - auto-expand today's views
  const [expandedYears, setExpandedYears] = useState({ [currentYear]: true });
  const [expandedMonths, setExpandedMonths] = useState({ [`${currentYear}-${currentMonth}`]: true });
  const [expandedWeeks, setExpandedWeeks] = useState({ [`${getTodayWeekStart()}_${currentWeek}`]: true });
  const [hoveredYearIndex, setHoveredYearIndex] = useState(-1);

  // Years state - dynamically managed
  const [years, setYears] = useState(() => Array.from({ length: 5 }, (_, i) => currentYear + i));

  // Ref for yearly table scroll container
  const yearlyScrollRef = useRef(null);

  // Auto-scroll to show current year + 4 years (hide extra years added by user)
  useEffect(() => {
    if (yearlyScrollRef.current && years.length > 5) {
      // Find the index of current year
      const currentYearIndex = years.indexOf(currentYear);

      if (currentYearIndex > 0) {
        // Scroll to show current year at the start
        // Each year column is 200px wide + 2px border
        const columnWidth = 202; // 200px + 2px border
        const scrollPosition = currentYearIndex * columnWidth;

        yearlyScrollRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [years, currentYear]);

  // Months
  const months = [
    { index: 0, name: 'Jan', fullName: 'January' },
    { index: 1, name: 'Feb', fullName: 'February' },
    { index: 2, name: 'Mar', fullName: 'March' },
    { index: 3, name: 'Apr', fullName: 'April' },
    { index: 4, name: 'May', fullName: 'May' },
    { index: 5, name: 'Jun', fullName: 'June' },
    { index: 6, name: 'Jul', fullName: 'July' },
    { index: 7, name: 'Aug', fullName: 'August' },
    { index: 8, name: 'Sep', fullName: 'September' },
    { index: 9, name: 'Oct', fullName: 'October' },
    { index: 10, name: 'Nov', fullName: 'November' },
    { index: 11, name: 'Dec', fullName: 'December' },
  ];

  // Get items for a specific cell
  const getCellItems = (timeframe, rowIndex, colIndex) => {
    const key = `${timeframe}_${rowIndex}_${colIndex}`;
    return data[key] || [];
  };

  // Get weekly items filtered by their parent monthly item (to avoid mixing years)
  const getWeeklyItemsForMonth = (rowIndex, weekNumber, year, monthIndex) => {
    // Get all weekly items with this week number
    const allWeeklyItems = getCellItems('weekly', rowIndex, weekNumber);

    // Get the monthly item for this specific year-month
    const monthColIndex = parseInt(year) * 12 + monthIndex;
    const monthlyItems = getCellItems('monthly', rowIndex, monthColIndex);

    if (monthlyItems.length === 0) {
      // No monthly item exists, show all weekly items (fallback)
      return allWeeklyItems;
    }

    // Filter weekly items to only those whose parent is this month's item
    const monthlyItemIds = monthlyItems.map(item => item.id);
    const filteredWeeklyItems = allWeeklyItems.filter(item =>
      monthlyItemIds.includes(item.parentItemId)
    );

    return filteredWeeklyItems;
  };

  // CASCADE LOGIC: Get cascaded items from parent timeframe
  const getCascadedItems = (timeframe, rowIndex, year, monthIndex, weekNumber) => {
    if (timeframe === 'monthly') {
      // December gets yearly goals
      if (monthIndex === 11) {
        const yearIndex = years.indexOf(year);
        return getCellItems('yearly', rowIndex, yearIndex);
      }
    } else if (timeframe === 'weekly') {
      // Last week of month gets monthly goals
      const weeks = getWeeksInMonth(year, monthIndex);
      const currentWeekIndex = weeks.findIndex(w => w.weekNumber === weekNumber);
      if (currentWeekIndex === weeks.length - 1) {
        const monthColIndex = parseInt(year) * 12 + monthIndex;
        return getCellItems('monthly', rowIndex, monthColIndex);
      }
    } else if (timeframe === 'daily') {
      // Sunday (last day of week) gets weekly goals
      // This is determined by the column index (6 = Sunday, 0-indexed from Monday)
      return null; // Will be handled in the rendering logic
    }
    return null;
  };

  // Check if a cell should be read-only (cascaded from parent)
  const isCascadedCell = (timeframe, year, monthIndex, weekNumber, dayIndex) => {
    if (timeframe === 'monthly' && monthIndex === 11) return true; // December
    if (timeframe === 'weekly') {
      const weeks = getWeeksInMonth(year, monthIndex);
      const currentWeekIndex = weeks.findIndex(w => w.weekNumber === weekNumber);
      return currentWeekIndex === weeks.length - 1; // Last week
    }
    if (timeframe === 'daily' && dayIndex === 6) return true; // Sunday
    return false;
  };

  // Add new item (with optimistic updates)
  const handleAddItem = async (timeframe, rowIndex, colIndex, text) => {
    const key = `${timeframe}_${rowIndex}_${colIndex}`;

    // Generate temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Optimistic update - add item immediately
    const tempItem = {
      id: tempId,
      text,
      status: 'neutral',
      timeframe,
      rowIndex,
      colIndex,
      isCascaded: false,
      parentItemId: null,
      _isOptimistic: true, // Mark as optimistic for UI indication (optional)
    };

    setData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), tempItem],
    }));

    try {
      // API call in background
      const result = await StrategicMapAPI.createItem(organizationSlug, timeframe, rowIndex, colIndex, text);

      // Replace temporary item with real item from server
      setData(prev => ({
        ...prev,
        [key]: (prev[key] || []).map(item =>
          item.id === tempId ? result.newItem : item
        ),
      }));

      // Add cascaded items if present
      if (result.cascadedItems && result.cascadedItems.length > 0) {
        setData(prev => {
          const updated = { ...prev };
          result.cascadedItems.forEach(cascadedItem => {
            const cascadeKey = `${cascadedItem.timeframe}_${cascadedItem.rowIndex}_${cascadedItem.colIndex}`;
            updated[cascadeKey] = [...(updated[cascadeKey] || []), cascadedItem];
          });
          return updated;
        });
      }

      // If adding a yearly item, ensure the year is in the years array
      if (timeframe === 'yearly' && result.newItem.colIndex !== null) {
        const year = currentYear + result.newItem.colIndex;
        setYears(prev => {
          if (!prev.includes(year)) {
            return [...prev, year].sort((a, b) => a - b);
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('❌ Failed to add item - rolling back:', error);

      // Rollback - remove temporary item
      setData(prev => ({
        ...prev,
        [key]: (prev[key] || []).filter(item => item.id !== tempId),
      }));

      // Show error to user (optional - can add toast notification)
      alert(`Failed to create item: ${error.message || 'Unknown error'}`);
    }
  };

  // Debounced API call for edit operations (500ms delay)
  const debouncedEditAPICall = useRef(
    debounce(async (organizationSlug, itemId, timeframe, rowIndex, colIndex, newText, oldText, key, setData) => {
      try {
        // API call after user stops typing
        const result = await StrategicMapAPI.updateItem(organizationSlug, itemId, timeframe, rowIndex, colIndex, { text: newText });
        console.log('✅ Edit saved to server (debounced)');

        // Update cascaded items if present (trigger updates them automatically)
        if (result.data && result.data.cascadedItems && result.data.cascadedItems.length > 0) {
          setData(prev => {
            const updated = { ...prev };
            result.data.cascadedItems.forEach(cascadedItem => {
              const cascadedKey = `${cascadedItem.timeframe}_${cascadedItem.rowIndex}_${cascadedItem.colIndex}`;
              if (!updated[cascadedKey]) {
                updated[cascadedKey] = [];
              }
              // Update existing cascaded item or add it if not present
              const existingIndex = updated[cascadedKey].findIndex(item => item.id === cascadedItem.id);
              if (existingIndex !== -1) {
                updated[cascadedKey][existingIndex] = cascadedItem;
              } else {
                // Item doesn't exist in state yet (e.g., daily view not expanded), add it
                updated[cascadedKey].push(cascadedItem);
              }
            });
            return updated;
          });
          console.log(`✅ Updated ${result.data.cascadedItems.length} cascaded items`);
        }
      } catch (error) {
        console.error('❌ Failed to edit item - rolling back:', error);

        // Rollback - restore old text
        setData(prev => ({
          ...prev,
          [key]: (prev[key] || []).map(item =>
            item.id === itemId ? { ...item, text: oldText } : item
          ),
        }));

        alert(`Failed to update item: ${error.message || 'Unknown error'}`);
      }
    }, 500)
  ).current;

  // Edit existing item (with optimistic updates + debouncing)
  const handleEditItem = async (timeframe, rowIndex, colIndex, itemId, newText) => {
    const key = `${timeframe}_${rowIndex}_${colIndex}`;

    // Save old text for rollback
    let oldText = '';
    setData(prev => {
      const cellItems = prev[key] || [];
      const item = cellItems.find(i => i.id === itemId);
      if (item) {
        oldText = item.text;
      }
      return prev;
    });

    // Optimistic update - change text immediately (instant UI response)
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(item =>
        item.id === itemId ? { ...item, text: newText } : item
      ),
    }));

    // Debounced API call (waits 500ms after user stops editing)
    debouncedEditAPICall(organizationSlug, itemId, timeframe, rowIndex, colIndex, newText, oldText, key, setData);
  };

  // Toggle item status (with optimistic updates)
  const handleToggleStatus = async (timeframe, rowIndex, colIndex, itemId, newStatus) => {
    const key = `${timeframe}_${rowIndex}_${colIndex}`;

    // Save old status for rollback
    let oldStatus = 'neutral';
    setData(prev => {
      const cellItems = prev[key] || [];
      const item = cellItems.find(i => i.id === itemId);
      if (item) {
        oldStatus = item.status;
      }
      return prev;
    });

    // Optimistic update - change status immediately
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      ),
    }));

    try {
      // API call in background
      const result = await StrategicMapAPI.updateItem(organizationSlug, itemId, timeframe, rowIndex, colIndex, { status: newStatus });

      // Update cascaded items if present (trigger updates them automatically)
      if (result.data && result.data.cascadedItems && result.data.cascadedItems.length > 0) {
        setData(prev => {
          const updated = { ...prev };
          result.data.cascadedItems.forEach(cascadedItem => {
            const cascadedKey = `${cascadedItem.timeframe}_${cascadedItem.rowIndex}_${cascadedItem.colIndex}`;
            if (!updated[cascadedKey]) {
              updated[cascadedKey] = [];
            }
            // Update existing cascaded item or add it if not present
            const existingIndex = updated[cascadedKey].findIndex(item => item.id === cascadedItem.id);
            if (existingIndex !== -1) {
              updated[cascadedKey][existingIndex] = cascadedItem;
            } else {
              // Item doesn't exist in state yet (e.g., daily view not expanded), add it
              updated[cascadedKey].push(cascadedItem);
            }
          });
          return updated;
        });
        console.log(`✅ Updated ${result.data.cascadedItems.length} cascaded item statuses`);
      }
    } catch (error) {
      console.error('❌ Failed to toggle status - rolling back:', error);

      // Rollback - restore old status
      setData(prev => ({
        ...prev,
        [key]: (prev[key] || []).map(item =>
          item.id === itemId ? { ...item, status: oldStatus } : item
        ),
      }));

      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  // Remove item (with optimistic updates)
  const handleRemoveItem = async (timeframe, rowIndex, colIndex, itemId) => {
    const key = `${timeframe}_${rowIndex}_${colIndex}`;

    // Save item for rollback
    let removedItem = null;
    setData(prev => {
      const cellItems = prev[key] || [];
      removedItem = cellItems.find(i => i.id === itemId);
      return prev;
    });

    // Optimistic update - remove item immediately
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(item => item.id !== itemId),
    }));

    try {
      // API call in background
      await StrategicMapAPI.deleteItem(organizationSlug, itemId, timeframe, rowIndex, colIndex);
    } catch (error) {
      console.error('❌ Failed to remove item - rolling back:', error);

      // Rollback - restore item
      if (removedItem) {
        setData(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), removedItem],
        }));
      }

      alert(`Failed to delete item: ${error.message || 'Unknown error'}`);
    }
  };

  // Add new year
  const handleAddYear = () => {
    const lastYear = years[years.length - 1];
    setYears(prev => [...prev, lastYear + 1]);
  };

  // Toggle year expansion - close all other views
  const toggleYear = (year) => {
    const isCurrentlyExpanded = expandedYears[year];
    // Close all other years and their children
    setExpandedYears({ [year]: !isCurrentlyExpanded });
    setExpandedMonths({});
    setExpandedWeeks({});
  };

  // Toggle month expansion - close all weekly and daily views
  const toggleMonth = (year, monthIndex) => {
    const monthKey = `${year}-${monthIndex}`;
    const isCurrentlyExpanded = expandedMonths[monthKey];
    // Close all other months and their children
    setExpandedMonths({ [monthKey]: !isCurrentlyExpanded });
    setExpandedWeeks({});
  };

  // Toggle week expansion - close all other daily views
  const toggleWeek = (weekStartDate, weekNumber) => {
    const weekKey = `${weekStartDate}_${weekNumber}`;
    const isCurrentlyExpanded = expandedWeeks[weekKey];
    // Close all other weeks
    setExpandedWeeks({ [weekKey]: !isCurrentlyExpanded });
  };

  const USE_API = process.env.REACT_APP_USE_STRATEGIC_MAP_API === 'true';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Strategic Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">战略地图 Strategic Map</h1>
          <p className="text-sm text-black mt-1">
            Plan your goals from yearly to daily view
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${USE_API ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {USE_API ? 'Database Mode' : 'Local Storage Mode'}
            </span>
          </p>
        </div>

        {/* Yearly View */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div ref={yearlyScrollRef} className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-gray-300 p-3 text-left font-semibold w-[150px] sticky left-0 bg-blue-600 z-10">
                    项目
                  </th>
                  {years.map((year, index) => (
                    <th
                      key={year}
                      className="border border-gray-300 p-3 text-center font-semibold w-[200px] max-w-[200px] cursor-pointer hover:bg-blue-700 transition-colors relative"
                      onClick={() => toggleYear(year)}
                      onMouseEnter={() => setHoveredYearIndex(index)}
                      onMouseLeave={() => setHoveredYearIndex(-1)}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {expandedYears[year] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span>{year}</span>
                      </div>
                      {/* Add Year Button - show on last year hover */}
                      {index === years.length - 1 && hoveredYearIndex === index && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddYear();
                          }}
                          className="absolute top-2 right-2 p-1 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors"
                          title="Add new year"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-semibold bg-gray-50 sticky left-0 z-10 text-black break-words">
                      {category}
                    </td>
                    {years.map((year, yearIndex) => (
                      <td key={year} className="border border-gray-300 align-top w-[200px] max-w-[200px] break-words">
                        <Cell
                          items={getCellItems('yearly', rowIndex, yearIndex)}
                          onAddItem={(text) => handleAddItem('yearly', rowIndex, yearIndex, text)}
                          onToggleStatus={(itemId, status) => handleToggleStatus('yearly', rowIndex, yearIndex, itemId, status)}
                          onRemoveItem={(itemId) => handleRemoveItem('yearly', rowIndex, yearIndex, itemId)}
                          onEditItem={(itemId, text) => handleEditItem('yearly', rowIndex, yearIndex, itemId, text)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Views (2 tables: Jan-Jun and Jul-Dec) */}
        {Object.entries(expandedYears).map(([year, isExpanded]) => {
          if (!isExpanded) return null;

          const firstHalfMonths = months.slice(0, 6);
          const secondHalfMonths = months.slice(6, 12);

          return (
            <div key={`monthly-${year}`} className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="bg-blue-100 border-l-4 border-blue-600 p-4">
                <h2 className="text-lg font-semibold text-black">{year} - Monthly View</h2>
              </div>

              {/* First Half: Jan - Jun */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-semibold w-[150px] sticky left-0 bg-blue-600 z-10">
                        项目
                      </th>
                      {firstHalfMonths.map((month) => (
                        <th
                          key={month.index}
                          className="border border-gray-300 p-3 text-center font-semibold w-[200px] max-w-[200px] cursor-pointer hover:bg-blue-700 transition-colors"
                          onClick={() => toggleMonth(year, month.index)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {expandedMonths[`${year}-${month.index}`] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                            <span>{month.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold bg-gray-50 sticky left-0 z-10 text-black break-words">
                          {category}
                        </td>
                        {firstHalfMonths.map((month) => {
                          const monthColIndex = parseInt(year) * 12 + month.index;
                          const cascadedItems = getCascadedItems('monthly', rowIndex, parseInt(year), month.index);
                          const isReadOnly = isCascadedCell('monthly', parseInt(year), month.index);
                          const displayItems = isReadOnly && cascadedItems ? cascadedItems : getCellItems('monthly', rowIndex, monthColIndex);

                          return (
                            <td key={month.index} className={cn(
                              "border border-gray-300 align-top w-[200px] max-w-[200px] break-words",
                              isReadOnly && "bg-blue-50"
                            )}>
                              <Cell
                                items={displayItems}
                                onAddItem={(text) => handleAddItem('monthly', rowIndex, monthColIndex, text)}
                                onToggleStatus={(itemId, status) => handleToggleStatus('monthly', rowIndex, monthColIndex, itemId, status)}
                                onRemoveItem={(itemId) => handleRemoveItem('monthly', rowIndex, monthColIndex, itemId)}
                                onEditItem={(itemId, text) => handleEditItem('monthly', rowIndex, monthColIndex, itemId, text)}
                                readOnly={isReadOnly}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Second Half: Jul - Dec */}
              <div className="overflow-x-auto pt-0">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-semibold w-[150px] sticky left-0 bg-blue-600 z-10">
                        项目
                      </th>
                      {secondHalfMonths.map((month) => (
                        <th
                          key={month.index}
                          className="border border-gray-300 p-3 text-center font-semibold w-[200px] max-w-[200px] cursor-pointer hover:bg-blue-700 transition-colors"
                          onClick={() => toggleMonth(year, month.index)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {expandedMonths[`${year}-${month.index}`] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                            <span>{month.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold bg-gray-50 sticky left-0 z-10 text-black break-words">
                          {category}
                        </td>
                        {secondHalfMonths.map((month) => {
                          const monthColIndex = parseInt(year) * 12 + month.index;
                          const cascadedItems = getCascadedItems('monthly', rowIndex, parseInt(year), month.index);
                          const isReadOnly = isCascadedCell('monthly', parseInt(year), month.index);
                          const displayItems = isReadOnly && cascadedItems ? cascadedItems : getCellItems('monthly', rowIndex, monthColIndex);

                          return (
                            <td key={month.index} className={cn(
                              "border border-gray-300 align-top w-[200px] max-w-[200px] break-words",
                              isReadOnly && "bg-blue-50"
                            )}>
                              <Cell
                                items={displayItems}
                                onAddItem={(text) => handleAddItem('monthly', rowIndex, monthColIndex, text)}
                                onToggleStatus={(itemId, status) => handleToggleStatus('monthly', rowIndex, monthColIndex, itemId, status)}
                                onRemoveItem={(itemId) => handleRemoveItem('monthly', rowIndex, monthColIndex, itemId)}
                                onEditItem={(itemId, text) => handleEditItem('monthly', rowIndex, monthColIndex, itemId, text)}
                                readOnly={isReadOnly}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Weekly Views (Horizontal table for each expanded month) */}
        {Object.entries(expandedMonths).map(([monthKey, isExpanded]) => {
          if (!isExpanded) return null;

          const [year, monthIndex] = monthKey.split('-').map(Number);
          const weeks = getWeeksInMonth(year, monthIndex);
          const monthName = months[monthIndex].fullName;

          return (
            <div key={`weekly-${monthKey}`} className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="bg-green-100 border-l-4 border-green-600 p-4">
                <h3 className="text-lg font-semibold text-black">
                  {monthName} {year} - Weekly View
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-semibold w-[150px] sticky left-0 bg-green-600 z-10">
                        Category
                      </th>
                      {weeks.map((week) => (
                        <th
                          key={week.startDate}
                          className="border border-gray-300 p-3 text-center font-semibold w-[200px] max-w-[200px] cursor-pointer hover:bg-green-700 transition-colors"
                          onClick={() => toggleWeek(week.startDate, week.weekNumber)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {expandedWeeks[`${week.startDate}_${week.weekNumber}`] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                            <span className="text-xs">{week.label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold bg-gray-50 sticky left-0 z-10 text-sm text-black break-words">
                          {category}
                        </td>
                        {weeks.map((week) => {
                          const weekColIndex = week.weekNumber;
                          const cascadedItems = getCascadedItems('weekly', rowIndex, year, monthIndex, week.weekNumber);
                          const isReadOnly = isCascadedCell('weekly', year, monthIndex, week.weekNumber);
                          // Use filtered function to avoid mixing weekly items from different years
                          const displayItems = isReadOnly && cascadedItems ? cascadedItems : getWeeklyItemsForMonth(rowIndex, weekColIndex, year, monthIndex);

                          return (
                            <td key={week.startDate} className={cn(
                              "border border-gray-300 align-top w-[200px] max-w-[200px] break-words",
                              isReadOnly && "bg-green-50"
                            )}>
                              <Cell
                                items={displayItems}
                                onAddItem={(text) => handleAddItem('weekly', rowIndex, weekColIndex, text)}
                                onToggleStatus={(itemId, status) => handleToggleStatus('weekly', rowIndex, weekColIndex, itemId, status)}
                                onRemoveItem={(itemId) => handleRemoveItem('weekly', rowIndex, weekColIndex, itemId)}
                                onEditItem={(itemId, text) => handleEditItem('weekly', rowIndex, weekColIndex, itemId, text)}
                                readOnly={isReadOnly}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Daily Views (7-column table for each expanded week) */}
        {Object.entries(expandedWeeks).map(([weekKey, isExpanded]) => {
          if (!isExpanded) return null;

          const [weekStartDate, weekNumberStr] = weekKey.split('_');
          const weekNumber = parseInt(weekNumberStr);
          const days = getDaysInWeek(weekStartDate);

          return (
            <div key={`daily-${weekKey}`} className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="bg-purple-100 border-l-4 border-purple-600 p-4">
                <h4 className="text-lg font-semibold text-black">
                  Week {weekNumber} - Daily View
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-purple-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-semibold w-[150px] sticky left-0 bg-purple-600 z-10">
                        Category
                      </th>
                      {days.map((day) => (
                        <th key={day.date} className="border border-gray-300 p-3 text-center font-semibold w-[200px] max-w-[200px]">
                          <div className="text-xs">{day.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-semibold bg-gray-50 sticky left-0 z-10 text-sm text-black break-words">
                          {category}
                        </td>
                        {days.map((day) => {
                          const dayColIndex = parseInt(day.date.replace(/-/g, ''));
                          // With database cascading, daily items are created in DB, so just show them
                          // Sunday items are marked as read-only (cascaded from weekly)
                          const dailyItems = getCellItems('daily', rowIndex, dayColIndex);
                          const isReadOnly = dailyItems.some(item => item.isCascaded);
                          const displayItems = dailyItems;

                          return (
                            <td key={day.date} className={cn(
                              "border border-gray-300 align-top w-[200px] max-w-[200px] break-words",
                              isReadOnly && "bg-purple-50"
                            )}>
                              <Cell
                                items={displayItems}
                                onAddItem={(text) => handleAddItem('daily', rowIndex, dayColIndex, text)}
                                onToggleStatus={(itemId, status) => handleToggleStatus('daily', rowIndex, dayColIndex, itemId, status)}
                                onRemoveItem={(itemId) => handleRemoveItem('daily', rowIndex, dayColIndex, itemId)}
                                onEditItem={(itemId, text) => handleEditItem('daily', rowIndex, dayColIndex, itemId, text)}
                                readOnly={isReadOnly}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StrategicMapV2Preview;
