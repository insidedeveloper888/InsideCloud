import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, getYear, startOfMonth, eachWeekOfInterval, eachDayOfInterval } from 'date-fns';

const resolveApiOrigin = () => {
  const clientConfig = require('../../config/client_config.js').default;
  return clientConfig.apiOrigin && clientConfig.apiOrigin.length > 0
    ? clientConfig.apiOrigin
    : window.location.origin;
};

// Strategic categories (rows) - Map to row_index 0-5
const CATEGORIES = [
  { id: 0, label: '阶段成就', en: 'Phase Achievements' },
  { id: 1, label: '财务盈利', en: 'Financial Profitability' },
  { id: 2, label: '客户市场', en: 'Customer Market' },
  { id: 3, label: '内部系统', en: 'Internal Systems' },
  { id: 4, label: '人才资本', en: 'Human Capital' },
  { id: 5, label: '学习成长', en: 'Learning & Growth' },
];

// Status cycling: neutral → done → fail → neutral
const STATUS_CYCLE = ['neutral', 'done', 'fail'];

const StrategicMapView = ({ organizationSlug, userName, organizationName }) => {
  const [scope, setScope] = useState('company');
  const [yearRange, setYearRange] = useState(() => {
    const currentYear = getYear(new Date());
    return Math.floor(currentYear / 5) * 5;
  });
  const [focusYear, setFocusYear] = useState(() => {
    return getYear(new Date()); // Default to current year
  });
  
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Track which item we're editing
  const editInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  // Progressive loading states (tracked but not currently used for conditional logic)
  // eslint-disable-next-line no-unused-vars
  const [loadedTimeframes, setLoadedTimeframes] = useState({
    yearly: false,
    monthly: false,
    weekly: false,
    daily: false,
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 StrategicMapView props:', { organizationSlug, userName, organizationName });
  }, [organizationSlug, userName, organizationName]);

  // Generate years (5 years)
  const getYears = useCallback(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      index: i,
      year: yearRange + i,
      value: `${yearRange + i}-01-01`,
    }));
  }, [yearRange]);

  // Generate months (12 months)
  const getMonths = useCallback(() => {
    const year = focusYear;
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(year, i, 1);
      return {
        index: i,
        label: format(date, 'MMM'),
        value: format(date, 'yyyy-MM-dd'),
      };
    });
  }, [focusYear]);

  // Generate weeks (52 weeks)
  const getWeeks = useCallback(() => {
    const year = focusYear;
    const startDate = startOfMonth(new Date(year, 0, 1));
    const endDate = new Date(year, 12, 1);
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    
    return weeks.slice(0, 52).map((week, i) => ({
      index: i,
      label: `W${String(i + 1).padStart(2, '0')}`,
      value: format(week, 'yyyy-MM-dd'),
    }));
  }, [focusYear]);

  // Generate days (365 days)
  const getDays = useCallback(() => {
    const year = focusYear;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map((day, i) => ({
      index: i,
      label: format(day, 'MMM dd'),
      shortLabel: format(day, 'dd'),
      value: format(day, 'yyyy-MM-dd'),
    }));
  }, [focusYear]);

  // Fetch specific timeframe data
  const fetchTimeframeData = useCallback(async (timeframeType, columns, startIndex) => {
    if (!organizationSlug) return {};
    
    const base = resolveApiOrigin();
    const promises = columns.map(col => {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        scope,
        timeframe: timeframeType,
        timeframe_value: col.value,
      });
      return fetch(`${base}/api/strategic_map?${params.toString()}`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      }).then(res => res.json());
    });

    const results = await Promise.all(promises);
    const itemsMap = {};
    
    results.forEach((json, colIndex) => {
      if (json.code === 0 && json.data) {
        json.data.forEach((item) => {
          // Support multiple items per cell - use array
          const key = `${timeframeType}_${item.row_index}_${colIndex}`;
          if (!itemsMap[key]) {
            itemsMap[key] = [];
          }
          itemsMap[key].push(item);
        });
      }
    });
    
    return itemsMap;
  }, [organizationSlug, scope]);

  const fetchItems = useCallback(async (loadAll = false, clearFirst = false) => {
    if (!organizationSlug) {
      console.error('❌ Cannot fetch: organizationSlug is missing');
      setError('Organization slug is missing. Please refresh the page.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Clear items first if scope changed
    if (clearFirst) {
      setItems({});
      setLoadedTimeframes({ yearly: false, monthly: false, weekly: false, daily: false });
    }
    
    try {
      // Always fetch yearly data first (fast, only 5 requests)
      // Note: fetchTimeframeData uses resolveApiOrigin() internally
      const years = getYears();
      const yearlyItems = await fetchTimeframeData('yearly', years, 0);
      
      setItems(prev => {
        const newItems = { ...prev };
        // Merge new items with existing, handling arrays properly
        Object.keys(yearlyItems).forEach(key => {
          if (clearFirst) {
            newItems[key] = yearlyItems[key];
          } else {
            const existing = newItems[key];
            const incoming = yearlyItems[key];
            if (Array.isArray(existing) && Array.isArray(incoming)) {
              newItems[key] = [...existing, ...incoming];
            } else if (Array.isArray(existing)) {
              newItems[key] = [...existing, incoming];
            } else if (Array.isArray(incoming)) {
              newItems[key] = [existing, ...incoming].filter(Boolean);
            } else {
              newItems[key] = incoming || existing;
            }
          }
        });
        return newItems;
      });
      setLoadedTimeframes(prev => ({ ...prev, yearly: true }));
      setLoading(false); // Show yearly table immediately
      
      // If loadAll is true or user wants to see all, load the rest progressively
      if (loadAll) {
        // Load monthly (12 requests)
        const months = getMonths();
        const monthlyItems = await fetchTimeframeData('monthly', months, 5);
        setItems(prev => {
          const newItems = { ...prev };
          Object.keys(monthlyItems).forEach(key => {
            const existing = newItems[key];
            const incoming = monthlyItems[key];
            newItems[key] = Array.isArray(existing) && Array.isArray(incoming) 
              ? [...existing, ...incoming]
              : Array.isArray(existing) 
                ? [...existing, incoming].filter(Boolean)
                : Array.isArray(incoming)
                  ? [existing, ...incoming].filter(Boolean)
                  : incoming || existing;
          });
          return newItems;
        });
        setLoadedTimeframes(prev => ({ ...prev, monthly: true }));
        
        // Load weekly (52 requests) - batch in chunks
        const weeks = getWeeks();
        const weeklyChunks = [];
        for (let i = 0; i < weeks.length; i += 13) {
          weeklyChunks.push(weeks.slice(i, i + 13));
        }
        for (const chunk of weeklyChunks) {
          const weeklyItems = await fetchTimeframeData('weekly', chunk, 17);
          setItems(prev => {
            const newItems = { ...prev };
            Object.keys(weeklyItems).forEach(key => {
              const existing = newItems[key];
              const incoming = weeklyItems[key];
              newItems[key] = Array.isArray(existing) && Array.isArray(incoming) 
                ? [...existing, ...incoming]
                : Array.isArray(existing) 
                  ? [...existing, incoming].filter(Boolean)
                  : Array.isArray(incoming)
                    ? [existing, ...incoming].filter(Boolean)
                    : incoming || existing;
            });
            return newItems;
          });
        }
        setLoadedTimeframes(prev => ({ ...prev, weekly: true }));
        
        // Load daily (365 requests) - only load current year for performance
        const days = getDays();
        const currentYearDays = days.filter(day => {
          const date = new Date(day.value);
          return date.getFullYear() === focusYear;
        });
        
        // Load daily data in batches of 30 days
        for (let i = 0; i < currentYearDays.length; i += 30) {
          const batch = currentYearDays.slice(i, i + 30);
          const dailyItems = await fetchTimeframeData('daily', batch, 69);
          setItems(prev => {
            const newItems = { ...prev };
            Object.keys(dailyItems).forEach(key => {
              const existing = newItems[key];
              const incoming = dailyItems[key];
              newItems[key] = Array.isArray(existing) && Array.isArray(incoming) 
                ? [...existing, ...incoming]
                : Array.isArray(existing) 
                  ? [...existing, incoming].filter(Boolean)
                  : Array.isArray(incoming)
                    ? [existing, ...incoming].filter(Boolean)
                    : incoming || existing;
            });
            return newItems;
          });
        }
        setLoadedTimeframes(prev => ({ ...prev, daily: true }));
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [organizationSlug, getYears, getMonths, getWeeks, getDays, fetchTimeframeData, focusYear]); // scope is used via fetchTimeframeData, yearRange and focusYear are used via getYears/getMonths/getWeeks/getDays

  useEffect(() => {
    setFocusYear(yearRange);
  }, [yearRange]);

  // Track previous scope to detect changes
  const prevScopeRef = useRef(scope);
  const prevYearRangeRef = useRef(yearRange);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (!organizationSlug) {
      setLoading(false);
      return;
    }
    
    // If scope or yearRange changed, clear and reload
    const scopeChanged = prevScopeRef.current !== scope;
    const yearRangeChanged = prevYearRangeRef.current !== yearRange;
    prevScopeRef.current = scope;
    prevYearRangeRef.current = yearRange;
    
    // On initial mount or when scope/yearRange changes, load all data
    // Clear first if scope or yearRange changed to prevent mixing data
    if (isInitialMount.current || scopeChanged || yearRangeChanged) {
      isInitialMount.current = false;
      fetchItems(true, scopeChanged || yearRangeChanged); // Load all data, clear if scope/yearRange changed
    }
  }, [organizationSlug, fetchItems, scope, yearRange]);

  const saveItem = useCallback(async (timeframe, rowIndex, columnIndex, updates) => {
    // Validate organizationSlug before proceeding
    if (!organizationSlug || organizationSlug === 'null' || organizationSlug === 'undefined') {
      const errorMsg = `Organization slug is missing or invalid: ${organizationSlug}. Please refresh the page.`;
      console.error('❌ Save blocked:', errorMsg);
      console.error('🔍 Current organizationSlug value:', organizationSlug);
      setError(errorMsg);
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    try {
      const base = resolveApiOrigin();
      let timeframeValue = '';
      
      if (timeframe === 'yearly') {
        const years = getYears();
        timeframeValue = years[columnIndex]?.value || '';
      } else if (timeframe === 'monthly') {
        const months = getMonths();
        timeframeValue = months[columnIndex]?.value || '';
      } else if (timeframe === 'weekly') {
        const weeks = getWeeks();
        timeframeValue = weeks[columnIndex]?.value || '';
      } else {
        const days = getDays();
        timeframeValue = days[columnIndex]?.value || '';
      }

      if (!timeframeValue) {
        throw new Error('Invalid column index');
      }

      const payload = {
        organization_slug: organizationSlug,
        scope,
        timeframe,
        timeframe_value: timeframeValue,
        row_index: rowIndex,
        column_index: columnIndex,
        ...updates,
      };

      console.log('💾 Saving with payload:', payload);
      console.log('💾 Payload details:', {
        organization_slug: payload.organization_slug,
        organization_slug_type: typeof payload.organization_slug,
        organization_slug_value: payload.organization_slug,
        payload_keys: Object.keys(payload),
        payload_stringified: JSON.stringify(payload),
      });

      const requestBody = JSON.stringify(payload);
      console.log('💾 Request body string:', requestBody);
      console.log('💾 Request body length:', requestBody.length);

      const response = await fetch(`${base}/api/strategic_map`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: requestBody,
      });

      const json = await response.json();
      console.log('📥 Save response:', json);

      if (!response.ok) {
        const errorMsg = json.msg || json.error || `Failed to save (${response.status})`;
        console.error('❌ Save failed:', { status: response.status, json });
        throw new Error(errorMsg);
      }

      if (json.code !== 0) {
        const errorMsg = json.msg || json.error || 'Failed to save';
        console.error('❌ Save failed:', json);
        throw new Error(errorMsg);
      }

      const key = `${timeframe}_${rowIndex}_${columnIndex}`;
      
      // Update items state - merge the saved item with existing items
      if (json.data) {
        const savedItem = json.data;
        setItems((prev) => {
          const newItems = { ...prev };
          const existingItems = getCellItems(timeframe, rowIndex, columnIndex);
          
          if (savedItem.id && existingItems.some(i => i.id === savedItem.id)) {
            // Update existing item
            newItems[key] = existingItems.map(item => 
              item.id === savedItem.id ? savedItem : item
            );
          } else {
            // Add new item
            newItems[key] = [...existingItems, savedItem];
          }
          
          return newItems;
        });
      }
      
      console.log('✅ Save successful');
    } catch (err) {
      console.error('❌ Save error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        organizationSlug,
        timeframe,
        rowIndex,
        columnIndex,
      });
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [organizationSlug, scope, getYears, getMonths, getWeeks, getDays, getCellItems]);

  const handleCellClick = (timeframe, rowIndex, columnIndex) => {
    if (!organizationSlug) {
      setError('Organization slug is missing. Please refresh the page.');
      return;
    }
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;
    const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
    // When clicking, edit the first item if exists, or create new
    const firstItem = cellItems[0];
    setEditingCell(key);
    setEditValue(firstItem?.cell_value || '');
    setEditingItemIndex(firstItem?.item_index !== undefined ? firstItem.item_index : null);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };

  const handleCellBlur = (timeframe, rowIndex, columnIndex) => {
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;
    if (editingCell === key) {
      const newValue = editValue.trim();
      const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
      
      // Only save if value changed
      if (newValue) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // If editingItemIndex is set, we're updating an existing item
        // Otherwise, we're creating a new item with the next available index
        const maxItemIndex = cellItems.length > 0 
          ? Math.max(...cellItems.map(i => i.item_index || 0))
          : -1;
        const itemIndex = editingItemIndex !== null ? editingItemIndex : maxItemIndex + 1;
        
        const editingItem = editingItemIndex !== null 
          ? cellItems.find(i => i.item_index === editingItemIndex)
          : null;
        
        saveTimeoutRef.current = setTimeout(() => {
          saveItem(timeframe, rowIndex, columnIndex, { 
            cell_value: newValue,
            item_id: editingItem?.id,
            item_index: itemIndex
          });
        }, 500);
      }

      setEditingCell(null);
      setEditValue('');
      setEditingItemIndex(null);
    }
  };

  const handleCellKeyDown = async (e, timeframe, rowIndex, columnIndex) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If Enter is pressed, save current item and prepare for next item
      const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
      const newValue = editValue.trim();
      
      if (newValue) {
        // If editingItemIndex is set, we're updating an existing item
        // Otherwise, we're creating a new item with the next available index
        let currentItemIndex;
        let editingItem = null;
        
        if (editingItemIndex !== null) {
          // Updating existing item
          editingItem = cellItems.find(i => i.item_index === editingItemIndex);
          currentItemIndex = editingItemIndex;
        } else {
          // Creating new item - find next available index
          const maxItemIndex = cellItems.length > 0 
            ? Math.max(...cellItems.map(i => (i.item_index || 0)))
            : -1;
          currentItemIndex = maxItemIndex + 1;
        }
        
        // Save current item (wait for it to complete)
        try {
          await saveItem(timeframe, rowIndex, columnIndex, { 
            cell_value: newValue,
            item_id: editingItem?.id,
            item_index: currentItemIndex
          });
          
          // After save completes, prepare for next item
          setEditValue('');
          setEditingItemIndex(null); // Next item will be new
          // Keep edit mode active so user can type the next goal
          setTimeout(() => {
            if (editInputRef.current) {
              editInputRef.current.focus();
            }
          }, 100);
        } catch (err) {
          console.error('Failed to save item:', err);
          // Don't clear on error, let user retry
        }
      } else {
        // Empty value - just clear and prepare for next
        setEditValue('');
        setEditingItemIndex(null);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter = save and exit
      e.preventDefault();
      handleCellBlur(timeframe, rowIndex, columnIndex);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
      setEditingItemIndex(null);
    }
  };

  const getCellItems = useCallback((timeframe, rowIndex, columnIndex) => {
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;
    const cellItems = items[key];
    return Array.isArray(cellItems) ? cellItems : (cellItems ? [cellItems] : []);
  }, [items]);

  const handleStatusClick = useCallback((timeframe, rowIndex, columnIndex, itemId, itemIndex, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!organizationSlug) {
      setError('Organization slug is missing. Please refresh the page.');
      return;
    }
    
    const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
    const item = cellItems.find(i => (itemId && i.id === itemId) || (itemIndex !== undefined && i.item_index === itemIndex)) || cellItems[0];
    if (!item) return;
    
    const currentStatus = item.status || 'neutral';
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];

    console.log('🔄 Status click:', { timeframe, rowIndex, columnIndex, itemId, itemIndex, currentStatus, nextStatus });
    saveItem(timeframe, rowIndex, columnIndex, { 
      status: nextStatus, 
      item_id: item.id, 
      item_index: item.item_index || 0 
    });
  }, [organizationSlug, saveItem, getCellItems]);

  const handleYearRangeChange = (direction) => {
    setYearRange(prev => prev + (direction === 'next' ? 5 : -5));
  };

  const renderCell = (timeframe, category, col, isSmall = false) => {
    const cellItems = getCellItems(timeframe, category.id, col.index);
    const cellKey = `${timeframe}_${category.id}_${col.index}`;
    const isEditing = editingCell === cellKey;

    const getStatusDot = (status, itemId, itemIndex) => {
      let color = '#ccc';
      if (status === 'done') color = '#4caf50';
      else if (status === 'fail') color = '#f44336';
      
      return (
        <Box 
          onClick={(e) => handleStatusClick(timeframe, category.id, col.index, itemId, itemIndex, e)}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: color,
            cursor: 'pointer',
            flexShrink: 0,
            '&:hover': {
              transform: 'scale(1.3)',
            },
          }}
        />
      );
    };

    return (
      <TableCell
        key={col.index}
        onClick={() => handleCellClick(timeframe, category.id, col.index)}
        sx={{
          minWidth: isSmall ? 50 : 100,
          maxWidth: isSmall ? 50 : 100,
          minHeight: 50,
          px: isSmall ? 0.25 : 0.5,
          py: 0.5,
          cursor: 'pointer',
          verticalAlign: 'top',
          position: 'relative',
          fontSize: '0.7rem',
          '&:hover': {
            backgroundColor: '#f0f7ff',
          },
        }}
      >
        {isEditing ? (
          <TextField
            inputRef={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellBlur(timeframe, category.id, col.index)}
            onKeyDown={(e) => handleCellKeyDown(e, timeframe, category.id, col.index)}
            multiline
            fullWidth
            autoFocus
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.65rem',
                p: 0.25,
              },
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {cellItems.length === 0 ? null : (
              cellItems.map((item, idx) => (
                <Box 
                  key={item.id || idx} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 0.5,
                    minHeight: 16,
                  }}
                >
                  {getStatusDot(item.status || 'neutral', item.id, item.item_index)}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: isSmall ? '0.6rem' : '0.65rem',
                      lineHeight: 1.2,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {item.cell_value || ''}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        )}
      </TableCell>
    );
  };

  if (!organizationSlug) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <Typography variant="body2" color="text.secondary">
          未找到组织信息，请稍候或重新选择组织。
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const years = getYears();
  const months = getMonths();
  const weeks = getWeeks();
  const days = getDays();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 0.5, backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', m: 0 }}>
          战略地图 (Strategic Map)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {scope === 'company' ? organizationName : userName}
        </Typography>
      </Box>

      {/* Control Panel - Stacked Vertically */}
      <Box sx={{ px: 0.5, py: 0.75, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        <Stack spacing={0.75}>
          {/* Row 1: Scope Selection */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={scope}
              exclusive
              onChange={(e, newScope) => newScope && setScope(newScope)}
              size="small"
              sx={{ width: '100%', maxWidth: 400 }}
            >
              <ToggleButton value="company" sx={{ flex: 1, py: 0.5, fontSize: '0.8rem' }}>
                公司视图 (Company)
              </ToggleButton>
              <ToggleButton value="individual" sx={{ flex: 1, py: 0.5, fontSize: '0.8rem' }}>
                个人视图 (Individual)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Row 2: Year Range + Refresh */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              size="small"
              onClick={() => handleYearRangeChange('prev')}
              sx={{ minWidth: 36, px: 0.5, height: 32 }}
            >
              <ChevronLeft size={16} />
            </Button>
            <Chip 
              label={`${yearRange}-${yearRange + 4}`}
              color="primary"
              sx={{ fontSize: '0.85rem', fontWeight: 600, height: 32, minWidth: 100 }}
            />
            <Button 
              size="small"
              onClick={() => handleYearRangeChange('next')}
              sx={{ minWidth: 36, px: 0.5, height: 32 }}
            >
              <ChevronRight size={16} />
            </Button>
            
            <Button
              variant="contained"
              startIcon={<RefreshCw size={14} />}
              onClick={fetchItems}
              size="small"
              sx={{ height: 32, fontSize: '0.75rem', ml: 1 }}
            >
              刷新数据
            </Button>

            {saving && (
              <Chip 
                label="保存中" 
                color="primary" 
                size="small"
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* Row 3: Focus Year selection */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={focusYear}
              exclusive
              onChange={(e, newFocus) => newFocus && setFocusYear(newFocus)}
              size="small"
              sx={{ width: '100%', maxWidth: 500, flexWrap: 'wrap' }}
            >
              {Array.from({ length: 5 }, (_, i) => yearRange + i).map((year) => (
                <ToggleButton key={year} value={year} sx={{ flex: 1, minWidth: 80, py: 0.5, fontSize: '0.75rem' }}>
                  {year}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ 
            m: 0.5, 
            py: 0.25,
            px: 1,
            minHeight: 'auto',
            '& .MuiAlert-icon': {
              fontSize: '0.875rem',
              padding: '2px 0',
              marginRight: 0.5,
            },
            '& .MuiAlert-message': {
              fontSize: '0.7rem',
              padding: '2px 0',
              flex: 1,
            },
            '& .MuiAlert-action': {
              padding: 0,
              marginLeft: 0.5,
              marginRight: 0,
              alignItems: 'flex-start',
            },
            '& .MuiIconButton-root': {
              padding: '1px',
              fontSize: '0.75rem',
              width: 16,
              height: 16,
            },
            '& .MuiSvgIcon-root': {
              fontSize: '0.875rem',
            },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {/* Yearly Table */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', py: 0.5, backgroundColor: '#f5f5f5' }}>
            战略地图 (Strategic Map)
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}>
                    项目
                  </TableCell>
                  {years.map((year) => (
                    <TableCell 
                      key={year.index} 
                      align="center" 
                      sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}
                    >
                      {year.year}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {CATEGORIES.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', p: 0.5, fontSize: '0.7rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {category.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {category.en}
                      </Typography>
                    </TableCell>
                    {years.map((year) => renderCell('yearly', category, year))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Monthly Tables - Split into 2 halves */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', py: 0.5, backgroundColor: '#f5f5f5' }}>
            上半年 {focusYear} 年度计划
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}>
                    项目
                  </TableCell>
                  {months.slice(0, 6).map((month) => (
                    <TableCell 
                      key={month.index} 
                      align="center" 
                      sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}
                    >
                      {month.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {CATEGORIES.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', p: 0.5, fontSize: '0.7rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {category.label}
                      </Typography>
                    </TableCell>
                    {months.slice(0, 6).map((month) => renderCell('monthly', category, month))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', py: 0.5, backgroundColor: '#f5f5f5' }}>
            下半年 {focusYear} 年度计划
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}>
                    项目
                  </TableCell>
                  {months.slice(6).map((month) => (
                    <TableCell 
                      key={month.index} 
                      align="center" 
                      sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}
                    >
                      {month.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {CATEGORIES.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', p: 0.5, fontSize: '0.7rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {category.label}
                      </Typography>
                    </TableCell>
                    {months.slice(6).map((month) => renderCell('monthly', category, month))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Weekly Tables - Split into chunks */}
        <Box sx={{ mb: 2 }}>
          {[0, 1, 2, 3].map((chunkIndex) => {
            const startIdx = chunkIndex * 13;
            const endIdx = Math.min(startIdx + 13, 52);
            const weekChunk = weeks.slice(startIdx, endIdx);
            
            return (
              <Box key={chunkIndex} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', py: 0.5, backgroundColor: '#f5f5f5' }}>
                  {focusYear} 周度计划 (Week {startIdx + 1}-{endIdx})
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}>
                          项目
                        </TableCell>
                        {weekChunk.map((week) => (
                          <TableCell 
                            key={week.index} 
                            align="center" 
                            sx={{ minWidth: 60, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.7rem', p: 0.25 }}
                          >
                            {week.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CATEGORIES.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', p: 0.5, fontSize: '0.7rem' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              {category.label}
                            </Typography>
                          </TableCell>
                          {weekChunk.map((week) => renderCell('weekly', category, week, true))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>

        {/* Daily Tables - Split into months */}
        <Box sx={{ mb: 2 }}>
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const monthDays = days.filter((day, i) => {
              const date = new Date(day.value);
              return date.getMonth() === monthIdx;
            });

            if (monthDays.length === 0) return null;

            const monthName = format(new Date(focusYear, monthIdx, 1), 'MMMM');

            return (
              <Box key={monthIdx} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', py: 0.5, backgroundColor: '#f5f5f5' }}>
                  {focusYear} {monthName} 日度计划 (Daily Plan)
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 100, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.75rem', p: 0.5 }}>
                          项目
                        </TableCell>
                        {monthDays.map((day) => (
                          <TableCell 
                            key={day.index} 
                            align="center" 
                            sx={{ minWidth: 50, maxWidth: 50, fontWeight: 700, backgroundColor: '#f5f5f5', fontSize: '0.65rem', p: 0.25 }}
                          >
                            {day.shortLabel}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CATEGORIES.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', p: 0.5, fontSize: '0.7rem' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              {category.label}
                            </Typography>
                          </TableCell>
                          {monthDays.map((day) => renderCell('daily', category, day, true))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default StrategicMapView;
