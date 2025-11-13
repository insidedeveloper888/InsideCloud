import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
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
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Fab,
  LinearProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Users,
  Settings,
  Award,
  BookOpen,
} from 'lucide-react';
import { format, getYear, startOfMonth, eachWeekOfInterval, eachDayOfInterval, parseISO, addDays, getISOWeek, getISOWeekYear, getMonth, startOfISOWeek } from 'date-fns';

const resolveApiOrigin = () => {
  const clientConfig = require('../../config/client_config.js').default;
  return clientConfig.apiOrigin && clientConfig.apiOrigin.length > 0
    ? clientConfig.apiOrigin
    : window.location.origin;
};

// Strategic categories (rows) - Map to row_index 0-5
const CATEGORIES = [
  { id: 0, label: '阶段成就', description: '重要里程碑与成就' },
  { id: 1, label: '财务盈利', description: '收入、利润与财务目标' },
  { id: 2, label: '客户市场', description: '客户关系与市场拓展' },
  { id: 3, label: '内部系统', description: '流程优化与系统建设' },
  { id: 4, label: '人才资本', description: '团队建设与人才发展' },
  { id: 5, label: '学习成长', description: '知识积累与能力提升' },
];

// Status cycling: neutral → done → fail → neutral
const STATUS_CYCLE = ['neutral', 'done', 'fail'];

const StrategicMapView = ({ organizationSlug, userName, organizationName }) => {
  // Responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-960px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 960px

  const [scope, setScope] = useState('company');
  const [focusYear, setFocusYear] = useState(() => {
    return getYear(new Date()); // Default to current year
  });
  const [yearSpan, setYearSpan] = useState(5); // Number of years to display (default 5)
  const [yearStartOffset, setYearStartOffset] = useState(0); // Offset from focusYear to start displaying

  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Track which item we're editing
  const [editingItemKey, setEditingItemKey] = useState(null); // Track which cell+item we're editing (format: "timeframe_rowIndex_columnIndex_itemIndex")
  const editInputRef = useRef(null);
  const editTextareaRef = useRef(null); // Direct ref to the actual textarea/input element
  const saveTimeoutRef = useRef(null);

  // Tab management for Monthly/Weekly/Daily views
  const [activeTab, setActiveTab] = useState('yearly'); // 'yearly' | 'monthly' | 'weekly' | 'daily'
  const [loadedTabs, setLoadedTabs] = useState({
    yearly: false,
    monthly: false,
    weekly: false,
    daily: false,
  });
  const [tabLoading, setTabLoading] = useState({
    monthly: false,
    weekly: false,
    daily: false,
  });

  // Mobile-specific states
  const [expandedCategories, setExpandedCategories] = useState(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );
  const [showFab, setShowFab] = useState(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const scrollContainerRef = useRef(null);
  const monthlySectionRef = useRef(null);
  const weeklySectionRef = useRef(null);
  const dailySectionRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('🔍 StrategicMapView props:', { organizationSlug, userName, organizationName });
    console.log('📱 Device type:', { isMobile, isTablet, isDesktop });
  }, [organizationSlug, userName, organizationName, isMobile, isTablet, isDesktop]);


  useEffect(() => {
    if (editTextareaRef.current && (editingCell || editingItemKey !== null)) {
      const timer = setTimeout(() => {
        const inputElement = editTextareaRef.current;
        if (inputElement && document.activeElement !== inputElement) {
          // Only focus if not already focused (to avoid interfering with active typing)
          inputElement.focus();
          // Set cursor to end when starting to edit
          const length = inputElement.value.length;
          inputElement.setSelectionRange(length, length);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [editingCell, editingItemKey]); // Only run when editing state changes, not on every keystroke

  // Calculate completion statistics for a category
  const getCategoryStats = useCallback((categoryId, timeframe = 'yearly') => {
    const categoryItems = Object.entries(items)
      .filter(([key]) => key.startsWith(`${timeframe}_${categoryId}_`))
      .flatMap(([, itemsArray]) => itemsArray);

    const total = categoryItems.length;
    const completed = categoryItems.filter(item => item.status === 'done').length;
    const failed = categoryItems.filter(item => item.status === 'fail').length;
    const inProgress = categoryItems.filter(item => item.status === 'neutral').length;

    return {
      total,
      completed,
      failed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [items]);

  // Toggle category expansion (for mobile)
  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Generate years dynamically based on focusYear and yearSpan
  const getYears = useCallback(() => {
    const startYear = focusYear + yearStartOffset;
    return Array.from({ length: yearSpan }, (_, i) => ({
      index: i,
      year: startYear + i,
      value: `${startYear + i}-01-01`,
    }));
  }, [focusYear, yearSpan, yearStartOffset]);

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
    const startDate = startOfISOWeek(new Date(year, 0, 4));
    const endDate = startOfISOWeek(new Date(year + 1, 0, 4));
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });

    return weeks.map((week, i) => ({
      index: i,
      label: `W${String(i + 1).padStart(2, '0')}`,
      value: format(week, 'yyyy-MM-dd'),
    }));
  }, [focusYear]);

  const weeksByMonth = useMemo(() => {
    const monthsForYear = getMonths();
    const weeksForYear = getWeeks();

    return monthsForYear.map((month, monthIdx) => {
      const monthWeeks = weeksForYear
        .map(week => {
          const weekStart = parseISO(week.value);
          const anchorDate = addDays(weekStart, 3); // Thursday rule

          if (getYear(anchorDate) !== focusYear || getMonth(anchorDate) !== monthIdx) {
            return null;
          }

          const isoWeekNumber = getISOWeek(weekStart);

          return {
            ...week,
            isoWeekNumber,
            isoWeekLabel: String(isoWeekNumber).padStart(2, '0'),
            weekStart,
          };
        })
        .filter(Boolean);

      return {
        month,
        weeks: monthWeeks,
      };
    });
  }, [getMonths, getWeeks, focusYear]);

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

  const daysByWeek = useMemo(() => {
    const allDays = getDays();
    const map = new Map();

    allDays.forEach((day) => {
      const dateObj = parseISO(day.value);
      const isoWeekNumber = getISOWeek(dateObj);
      const dayOfWeek = ((dateObj.getDay() + 6) % 7) + 1; // Monday=1 ... Sunday=7

      const localMonth = dateObj.getMonth();
      const yearMonthKey = `${getISOWeekYear(dateObj)}-${String(localMonth + 1).padStart(2, '0')}`;
      const weekKey = `${getISOWeekYear(dateObj)}-${String(isoWeekNumber).padStart(2, '0')}`;

      const dayEntry = {
        ...day,
        date: dateObj,
        isoWeekNumber,
        dayOfWeek,
        lastDayOfMonth: new Date(dateObj.getFullYear(), localMonth + 1, 0),
        yearMonthKey,
      };

      if (!map.has(weekKey)) {
        map.set(weekKey, []);
      }
      map.get(weekKey).push(dayEntry);
    });

    map.forEach((values) => {
      values.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });

    return map;
  }, [getDays, focusYear]);

  // Fetch batch data for a timeframe (optimized - single API call)
  const fetchBatchTimeframeData = useCallback(async (timeframeType, focusYearValue, yearStart, yearEnd) => {
    if (!organizationSlug) return {};

    const base = resolveApiOrigin();
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      scope,
      timeframe: timeframeType,
    });

    // Use year_range for yearly (send start year), focus_year for others
    if (timeframeType === 'yearly') {
      params.append('year_range', yearStart); // Start year of the range
      params.append('year_span', yearEnd - yearStart + 1); // Number of years
    } else {
      params.append('focus_year', focusYearValue);
    }

    try {
      const response = await fetch(`${base}/api/strategic_map?${params.toString()}`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await response.json();

      if (json.code !== 0 || !json.data) {
        console.log(`⚠️ No data returned for ${timeframeType} (focusYear: ${focusYearValue})`, json);
        return {};
      }

      console.log(`📥 Fetched ${json.data.length} items for ${timeframeType} (focusYear: ${focusYearValue})`);
      if (timeframeType === 'monthly') {
        // Log December items specifically
        const decemberItems = json.data.filter(item => {
          if (item.timeframe_value) {
            const month = parseInt(item.timeframe_value.substring(5, 7), 10);
            return month === 12;
          }
          return false;
        });
        console.log(`📅 December items found: ${decemberItems.length}`, decemberItems);
      }

      // Process items and organize by actual year/date, not column_index
      // This ensures items appear in the correct column even when the view changes
      const itemsMap = {};

      // For yearly items, build a year-to-columnIndex map based on the fetched range
      let yearToColumnMap = null;
      if (timeframeType === 'yearly') {
        yearToColumnMap = {};
        for (let i = 0; i <= yearEnd - yearStart; i++) {
          const year = yearStart + i;
          yearToColumnMap[year] = i;
        }
      }

      json.data.forEach((item) => {
        let columnIndex = item.column_index !== undefined ? item.column_index : 0;

        // For yearly items, map by actual year from timeframe_value instead of column_index
        if (timeframeType === 'yearly' && item.timeframe_value && yearToColumnMap) {
          // Extract year from timeframe_value (format: "YYYY-01-01")
          const yearFromValue = parseInt(item.timeframe_value.substring(0, 4), 10);
          // Find the column index that corresponds to this year in the fetched range
          if (yearToColumnMap[yearFromValue] !== undefined) {
            columnIndex = yearToColumnMap[yearFromValue];
          } else {
            // Year not in fetched range, skip this item
            return;
          }
        }

        // For monthly items, verify the year matches focusYear (filter out items from other years)
        if (timeframeType === 'monthly' && item.timeframe_value) {
          // Extract year from timeframe_value (format: "YYYY-MM-DD")
          const yearFromValue = parseInt(item.timeframe_value.substring(0, 4), 10);
          // Only include items that match the focusYear
          if (yearFromValue !== focusYearValue) {
            console.log(`⚠️ Skipping monthly item from year ${yearFromValue} (focusYear is ${focusYearValue})`, item);
            return; // Skip items from other years
          }
        }

        const key = `${timeframeType}_${item.row_index}_${columnIndex}`;
        if (!itemsMap[key]) {
          itemsMap[key] = [];
        }
        itemsMap[key].push(item);
      });

      return itemsMap;
    } catch (err) {
      console.error('Error fetching batch data:', err);
      return {};
    }
  }, [organizationSlug, scope]);

  // Load yearly data (always loaded on mount)
  const fetchYearlyData = useCallback(async (clearFirst = false, silent = false) => {
    if (!organizationSlug) {
      console.error('❌ Cannot fetch: organizationSlug is missing');
      setError('Organization slug is missing. Please refresh the page.');
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    // Always clear items when yearRange changes to prevent showing wrong year's data
    if (clearFirst) {
      console.log('🧹 Clearing all items due to year range change');
      setItems({});
      setLoadedTabs({ yearly: false, monthly: false, weekly: false, daily: false });
    }

    try {
      // Fetch all yearly data in one batch call for the current year range
      const years = getYears();
      const yearStart = years[0]?.year || focusYear;
      const yearEnd = years[years.length - 1]?.year || focusYear;
      const yearlyItems = await fetchBatchTimeframeData('yearly', focusYear, yearStart, yearEnd);

      setItems(prev => {
        // If clearFirst, start with empty object, otherwise merge
        const newItems = clearFirst ? {} : { ...prev };

        // Only add items that match the current yearRange
        // Filter out old items that don't belong to current yearRange
        if (clearFirst) {
          // When clearing, only add new items
          Object.keys(yearlyItems).forEach(key => {
            newItems[key] = yearlyItems[key];
          });
        } else {
          // When merging, replace yearly items but keep other timeframes
          Object.keys(prev).forEach(key => {
            if (!key.startsWith('yearly_')) {
              newItems[key] = prev[key];
            }
          });
          Object.keys(yearlyItems).forEach(key => {
            newItems[key] = yearlyItems[key];
          });
        }

        return newItems;
      });

      setLoadedTabs(prev => ({ ...prev, yearly: true }));
      if (!silent) {
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Fetch yearly error:', err);
      setError(err.message);
      if (!silent) {
        setLoading(false);
      }
    }
  }, [organizationSlug, focusYear, yearSpan, yearStartOffset, getYears, fetchBatchTimeframeData]);

  // Load tab data on demand
  const loadTabData = useCallback(async (tabName, forceReload = false) => {
    if (!organizationSlug) {
      return;
    }
    if (tabLoading[tabName]) {
      return;
    }
    if (!forceReload && loadedTabs[tabName]) {
      return;
    }

    setTabLoading(prev => ({ ...prev, [tabName]: true }));
    setError(null);

    try {
      let timeframeItems = {};

      if (tabName === 'monthly') {
        timeframeItems = await fetchBatchTimeframeData('monthly', focusYear, focusYear, focusYear);
      } else if (tabName === 'weekly') {
        timeframeItems = await fetchBatchTimeframeData('weekly', focusYear, focusYear, focusYear);
      } else if (tabName === 'daily') {
        timeframeItems = await fetchBatchTimeframeData('daily', focusYear, focusYear, focusYear);
      }

      setItems(prev => {
        const newItems = { ...prev };

        // Remove old items for this timeframe before adding new ones
        Object.keys(prev).forEach(key => {
          if (key.startsWith(`${tabName}_`)) {
            delete newItems[key];
          }
        });

        // Add new items for current yearRange/focusYear
        Object.keys(timeframeItems).forEach(key => {
          newItems[key] = timeframeItems[key];
        });

        return newItems;
      });

      setLoadedTabs(prev => ({ ...prev, [tabName]: true }));
    } catch (err) {
      console.error(`❌ Fetch ${tabName} error:`, err);
      setError(`Failed to load ${tabName} data: ${err.message}`);
    } finally {
      setTabLoading(prev => ({ ...prev, [tabName]: false }));
    }
  }, [organizationSlug, focusYear, loadedTabs, tabLoading, fetchBatchTimeframeData]);

  const reloadTimeframe = useCallback((timeframeKey, { silent = true } = {}) => {
    if (!organizationSlug) {
      return;
    }

    if (timeframeKey === 'yearly') {
      fetchYearlyData(false, silent);
      return;
    }

    if (tabLoading[timeframeKey]) {
      return;
    }

    setTabLoading(prev => ({ ...prev, [timeframeKey]: true }));

    setItems(prev => {
      const newItems = { ...prev };
      Object.keys(prev).forEach(key => {
        if (key.startsWith(`${timeframeKey}_`)) {
          delete newItems[key];
        }
      });
      return newItems;
    });

    setLoadedTabs(prev => ({ ...prev, [timeframeKey]: false }));
    loadTabData(timeframeKey, true);
  }, [organizationSlug, fetchYearlyData, loadTabData, tabLoading]);

  // Track previous scope/focusYear/yearSpan/yearStartOffset to detect changes
  const prevScopeRef = useRef(scope);
  const prevFocusYearRef = useRef(focusYear);
  const prevYearSpanRef = useRef(yearSpan);
  const prevYearStartOffsetRef = useRef(yearStartOffset);
  const isInitialMount = useRef(true);
  const prevFocusYearForReloadRef = useRef(focusYear);

  // Load yearly data on mount or when scope/year range changes
  useEffect(() => {
    if (!organizationSlug) {
      setLoading(false);
      return;
    }

    const scopeChanged = prevScopeRef.current !== scope;
    const focusYearChanged = prevFocusYearRef.current !== focusYear;
    const yearSpanChanged = prevYearSpanRef.current !== yearSpan;
    const yearStartOffsetChanged = prevYearStartOffsetRef.current !== yearStartOffset;

    prevScopeRef.current = scope;
    prevFocusYearRef.current = focusYear;
    prevYearSpanRef.current = yearSpan;
    prevYearStartOffsetRef.current = yearStartOffset;

    if (isInitialMount.current || scopeChanged || focusYearChanged || yearSpanChanged || yearStartOffsetChanged) {
      isInitialMount.current = false;
      if (focusYearChanged || yearSpanChanged || yearStartOffsetChanged) {
        setLoadedTabs(prev => ({
          ...prev,
          monthly: false,
          weekly: false,
          daily: false
        }));
        setItems(prev => {
          const newItems = { ...prev };
          Object.keys(prev).forEach(key => {
            if (key.startsWith('monthly_') || key.startsWith('weekly_') || key.startsWith('daily_')) {
              delete newItems[key];
            }
          });
          return newItems;
        });
        // Defer non-yearly reloads to tab-activation and focusYear-change handlers to avoid races
      }
      reloadTimeframe('yearly', { silent: false });
    }
  }, [organizationSlug, reloadTimeframe, scope, focusYear, yearSpan, yearStartOffset]);

  // Reload tab data when focusYear changes (if tab is active)
  useEffect(() => {
    if (!organizationSlug || isInitialMount.current) return;

    const changed = prevFocusYearForReloadRef.current !== focusYear;
    prevFocusYearForReloadRef.current = focusYear;

    if (!changed) return;

    console.log('🔄 Focus year changed, reloading active tab:', activeTab);
    if (activeTab !== 'yearly') {
      reloadTimeframe(activeTab);
    }
  }, [focusYear, activeTab, organizationSlug, reloadTimeframe]);

  // Load tab data when tab is activated
  useEffect(() => {
    if (activeTab !== 'yearly' && !loadedTabs[activeTab] && !tabLoading[activeTab]) {
      reloadTimeframe(activeTab);
    }
  }, [activeTab, loadedTabs, tabLoading, reloadTimeframe]);

  useEffect(() => {
    if (activeTab === 'weekly' && !loadedTabs.monthly && !tabLoading.monthly) {
      loadTabData('monthly');
    }
  }, [activeTab, loadedTabs.monthly, tabLoading.monthly, loadTabData]);

  useEffect(() => {
    if (activeTab === 'daily' && !loadedTabs.weekly && !tabLoading.weekly) {
      loadTabData('weekly');
    }
    if (activeTab === 'daily' && !loadedTabs.monthly && !tabLoading.monthly) {
      loadTabData('monthly');
    }
  }, [activeTab, loadedTabs.weekly, loadedTabs.monthly, tabLoading.weekly, tabLoading.monthly, loadTabData]);

  const refreshCascadeTimeframes = useCallback(async (changedTimeframe) => {
    if (!organizationSlug) {
      return;
    }

    const timeframesToRefresh = ['yearly', 'monthly', 'weekly', 'daily'];

    for (const timeframeKey of timeframesToRefresh) {
      try {
        if (timeframeKey === 'yearly') {
          await fetchYearlyData(false, true);
        } else {
          await loadTabData(timeframeKey, true);
        }
      } catch (err) {
        console.error(`Failed to refresh ${timeframeKey} data after ${changedTimeframe} update:`, err);
      }
    }
  }, [organizationSlug, fetchYearlyData, loadTabData]);

  const getCellItems = useCallback((timeframe, rowIndex, columnIndex) => {
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;
    const cellItems = items[key];
    return Array.isArray(cellItems) ? cellItems : (cellItems ? [cellItems] : []);
  }, [items]);

  // Memoized Cell Component to prevent unnecessary re-renders
  const StrategicMapCell = memo(({ 
    timeframe,
    rowIndex,
    columnIndex,
    cellItems,
    isEditing,
    editValue,
    editingItemIndex,
    editingItemKey,
    isSmall,
    hasRightBorder = true,
    hasLeftBorder = false,
    onCellClick,
    onItemClick,
    onCellBlur,
    onCellKeyDown,
    onStatusClick,
    onDeleteItem,
    onEditValueChange,
    editInputRef
  }) => {
    const getStatusIcon = useCallback((status, itemId, itemIndex) => {
      const iconSize = 18; // Increased from 14 to 18

      let icon;
      if (status === 'done') {
        // Green check icon
        icon = (
          <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
            <path
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              fill="#4caf50"
            />
          </svg>
        );
      } else if (status === 'fail') {
        // Red cross icon
        icon = (
          <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              fill="#f44336"
            />
          </svg>
        );
      } else {
        // Neutral - gray circle (not completed)
        icon = (
          <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="#9e9e9e"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        );
      }

      return (
        <Box
          onClick={(e) => onStatusClick(timeframe, rowIndex, columnIndex, itemId, itemIndex, e)}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconSize + 8,
            height: iconSize + 8,
            cursor: 'pointer',
            flexShrink: 0,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          {icon}
        </Box>
      );
    }, [timeframe, rowIndex, columnIndex, onStatusClick]);

    const getLockIcon = useCallback(() => {
      const iconSize = 18;
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconSize + 8,
            height: iconSize + 8,
            flexShrink: 0,
            borderRadius: '4px',
          }}
        >
          <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
            <path d="M10 3a4 4 0 00-4 4v2H5a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2h-1V7a4 4 0 00-4-4zm-2 6V7a2 2 0 114 0v2H8z" fill="#9e9e9e"/>
          </svg>
        </Box>
      );
    }, []);

    return (
      <TableCell
        onClick={!isEditing ? onCellClick : undefined}
        sx={{
          minWidth: isSmall ? 60 : 120,
          maxWidth: isSmall ? 60 : 120,
          minHeight: 60,
          px: isSmall ? 0.5 : 1,
          py: 1,
          cursor: isEditing ? 'default' : 'pointer',
          verticalAlign: 'top',
          position: 'relative',
          fontSize: '0.875rem',
          borderBottom: '1px solid #e8e8e8',
          borderRight: hasRightBorder ? '1px solid #e0e0e0' : 'none',
          borderLeft: hasLeftBorder ? '1px solid #e0e0e0' : 'none',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Always show existing checklist items */}
          {cellItems.length > 0 && (
            cellItems.map((item, idx) => (
              <Box
                key={item.id || idx}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  minHeight: 16,
                  position: 'relative',
                  '&:hover .delete-button': {
                    opacity: 1,
                  },
                }}
              >
                {getStatusIcon(item.status || 'neutral', item.id, item.item_index)}
                {item.is_auto_generated ? getLockIcon() : null}
                {editingItemKey === `${timeframe}_${rowIndex}_${columnIndex}_${item.item_index !== undefined ? item.item_index : idx}` ? (
                  // Inline editing - use native input for single-line text
                <input
                  type="text"
                  ref={editTextareaRef}
                  defaultValue={editValue || ''}
                  onKeyDown={(e) => onCellKeyDown(e, timeframe, rowIndex, columnIndex)}
                  autoFocus
                  style={{
                    flex: 1,
                    fontSize: isSmall ? '0.8125rem' : '0.9375rem',
                    fontFamily: 'inherit',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    lineHeight: 1.4,
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2';
                    e.target.style.borderWidth = '2px';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                    e.target.style.borderWidth = '1px';
                    onCellBlur(timeframe, rowIndex, columnIndex);
                  }}
                />
                ) : (
                  <Typography
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const itemIndex = item.item_index !== undefined ? item.item_index : idx;
                      if (!item.is_auto_generated) {
                        onItemClick(timeframe, rowIndex, columnIndex, item.id, itemIndex, item.cell_value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    variant="body2"
                    sx={{
                      fontSize: isSmall ? '0.8125rem' : '0.9375rem', // Increased from 0.6/0.65rem
                      lineHeight: 1.4,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      cursor: item.is_auto_generated ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      px: 0.5,
                      py: 0.5,
                      transition: 'all 0.2s',
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    {item.cell_value || ''}
                  </Typography>
                )}
                {/* Delete button - shows on hover */}
                <Box
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (item.id && !item.id.toString().startsWith('temp-')) {
                      onDeleteItem(timeframe, rowIndex, columnIndex, item.id);
                    }
                  }}
                  sx={{
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    cursor: 'pointer',
                    flexShrink: 0,
                    borderRadius: '4px',
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      opacity: 1,
                    },
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      fill="#9e9e9e"
                    />
                  </svg>
                </Box>
              </Box>
            ))
          )}

          {/* Input field - only show when adding new items (not when editing existing items inline) */}
          {isEditing && editingItemIndex === null ? (
            <input
              type="text"
              ref={editTextareaRef}
              defaultValue={editValue || ''}
              // onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={(e) => onCellKeyDown(e, timeframe, rowIndex, columnIndex)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                padding: '6px 6px',
                marginTop: '4px',
                lineHeight: 1.4,
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.borderWidth = '2px';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                e.target.style.borderWidth = '1px';
                onCellBlur(timeframe, rowIndex, columnIndex);
              }}
            />
          ) : (
            <Box
              onClick={onCellClick}
              sx={{
                minHeight: 32,
                fontSize: '0.875rem',
                color: 'text.secondary',
                cursor: 'pointer',
                px: 0.75,
                py: 0.5,
                borderRadius: 0.5,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            />
          )}
        </Box>
      </TableCell>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if these props change
    if (prevProps.isEditing !== nextProps.isEditing) return false;
    if (prevProps.editValue !== nextProps.editValue) return false;
    if (prevProps.editingItemIndex !== nextProps.editingItemIndex) return false;
    if (prevProps.editingItemKey !== nextProps.editingItemKey) return false;
    if (prevProps.isSmall !== nextProps.isSmall) return false;

    // Deep compare cellItems array
    if (prevProps.cellItems.length !== nextProps.cellItems.length) return false;
    for (let i = 0; i < prevProps.cellItems.length; i++) {
      const prev = prevProps.cellItems[i];
      const next = nextProps.cellItems[i];
      if (prev.id !== next.id || prev.cell_value !== next.cell_value || prev.status !== next.status) {
        return false;
      }
    }

    return true; // Props are equal, skip re-render
  });

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
      let savedItemResult = null;

      // Update items state - merge the saved item with existing items
      if (json.data) {
        const savedItem = json.data;
        savedItemResult = savedItem;
        setItems((prev) => {
          const newItems = { ...prev };
          // Get existing items from prev state, not closure
          const cellItems = prev[key];
          const existingItems = Array.isArray(cellItems) ? cellItems : (cellItems ? [cellItems] : []);

          if (savedItem.id && existingItems.some(i => i.id === savedItem.id)) {
            // Update existing item
            newItems[key] = existingItems.map(item =>
              item.id === savedItem.id ? savedItem : item
            );
          } else {
            // Add new item (or replace temp item if exists)
            const tempItemIndex = existingItems.findIndex(item =>
              item.id && item.id.toString().startsWith('temp-') &&
              item.item_index === savedItem.item_index
            );
            if (tempItemIndex >= 0) {
              // Replace temp item
              const updatedItems = [...existingItems];
              updatedItems[tempItemIndex] = savedItem;
              newItems[key] = updatedItems;
            } else {
              // Add new item
              newItems[key] = [...existingItems, savedItem];
            }
          }

          return newItems;
        });
      }

      console.log('✅ Save successful');
      refreshCascadeTimeframes(timeframe).catch(err => {
        console.error(`Failed to refresh cascaded timeframes after ${timeframe} save:`, err);
      });
      return savedItemResult;
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
  }, [organizationSlug, scope, getYears, getMonths, getWeeks, getDays, refreshCascadeTimeframes]);

  // Simple onChange handler - native textarea handles cursor positioning automatically
  const handleEditValueChange = useCallback((newValue) => {
    setEditValue(newValue);
  }, []);

  const handleCellClick = (timeframe, rowIndex, columnIndex) => {
    if (!organizationSlug) {
      setError('Organization slug is missing. Please refresh the page.');
      return;
    }
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;
    // Always start with empty input for adding new items (checklist behavior)
    setEditingCell(key);
    setEditValue('');
    setEditingItemIndex(null); // Always create new item when clicking cell
    setEditingItemKey(null); // Clear editing item key when adding new item
  };

  const handleItemClick = useCallback((timeframe, rowIndex, columnIndex, itemId, itemIndex, currentValue) => {
    if (!organizationSlug) {
      setError('Organization slug is missing. Please refresh the page.');
      return;
    }
    // Edit existing item inline - track both the cell and item index
    setEditValue(currentValue || '');
    setEditingItemIndex(itemIndex);
    setEditingItemKey(`${timeframe}_${rowIndex}_${columnIndex}_${itemIndex}`);
  }, [organizationSlug]);

  const handleCellBlur = (timeframe, rowIndex, columnIndex) => {
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;

    // Handle inline item editing blur - only if this is the cell being edited
    if (editingItemKey && editingItemKey.startsWith(`${timeframe}_${rowIndex}_${columnIndex}_`)) {
      const domValue = editTextareaRef.current ? editTextareaRef.current.value : editValue;
      const newValue = (domValue || '').trim();
      const itemIndexMatch = editingItemKey.match(/_(\d+)$/);
      const itemIndex = itemIndexMatch ? parseInt(itemIndexMatch[1], 10) : null;

      if (newValue && itemIndex !== null) {
        const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
        const existingItem = cellItems.find(i => i.item_index === itemIndex);

        if (existingItem && newValue !== existingItem.cell_value) {
          // Save the yearly item
          saveItem(timeframe, rowIndex, columnIndex, {
            cell_value: newValue,
            item_id: existingItem.id,
            item_index: itemIndex
          });
        }
      } else if (itemIndex !== null) {
        // Empty value when editing - delete the item
        const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
        const existingItem = cellItems.find(i => i.item_index === itemIndex);
        if (existingItem && existingItem.id && !existingItem.id.toString().startsWith('temp-')) {
          handleDeleteItem(timeframe, rowIndex, columnIndex, existingItem.id);
        }
      }

      // Exit inline edit mode
      setEditValue('');
      setEditingItemIndex(null);
      setEditingItemKey(null);
      return;
    }

    // Handle cell input blur (for adding new items)
    if (editingCell === key) {
      const domValue = editTextareaRef.current ? editTextareaRef.current.value : editValue;
      const newValue = (domValue || '').trim();

      // Creating new item (checklist behavior)
      if (newValue) {
        const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
        const maxItemIndex = cellItems.length > 0
          ? Math.max(...cellItems.map(i => i.item_index || 0))
          : -1;
        const nextItemIndex = maxItemIndex + 1;

        saveItem(timeframe, rowIndex, columnIndex, {
          cell_value: newValue,
          item_id: null, // New item
          item_index: nextItemIndex
        });
      }

      // Exit edit mode on blur
      setEditingCell(null);
      setEditValue('');
      setEditingItemIndex(null);
      setEditingItemKey(null);
    }
  };

  const handleCellKeyDown = (e, timeframe, rowIndex, columnIndex) => {
    const composing = (e.nativeEvent && e.nativeEvent.isComposing) || e.keyCode === 229;
    if (composing) {
      return;
    }
    // Handle inline item editing - only if this is the cell being edited
    if (editingItemKey && editingItemKey.startsWith(`${timeframe}_${rowIndex}_${columnIndex}_`)) {
      const itemIndexMatch = editingItemKey.match(/_(\d+)$/);
      const itemIndex = itemIndexMatch ? parseInt(itemIndexMatch[1], 10) : null;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const domValue = editTextareaRef.current ? editTextareaRef.current.value : editValue;
        const newValue = (domValue || '').trim();

        if (newValue && itemIndex !== null) {
          const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
          const existingItem = cellItems.find(i => i.item_index === itemIndex);

          if (existingItem && newValue !== existingItem.cell_value) {
            // Value changed - update it
            saveItem(timeframe, rowIndex, columnIndex, {
              cell_value: newValue,
              item_id: existingItem.id,
              item_index: itemIndex
            });
          }
          // Exit edit mode
          setEditValue('');
          setEditingItemIndex(null);
          setEditingItemKey(null);
        } else if (itemIndex !== null) {
          // Empty value - delete the item
          const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
          const existingItem = cellItems.find(i => i.item_index === itemIndex);
          if (existingItem && existingItem.id && !existingItem.id.toString().startsWith('temp-')) {
            handleDeleteItem(timeframe, rowIndex, columnIndex, existingItem.id);
          }
          setEditValue('');
          setEditingItemIndex(null);
          setEditingItemKey(null);
        }
        return;
      } else if (e.key === 'Escape') {
        // Cancel editing
        e.preventDefault();
        setEditValue('');
        setEditingItemIndex(null);
        setEditingItemKey(null);
        return;
      }
      // For other keys, let the input handle them
      return;
    }

    // Handle cell input (for adding new items)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const domValue = editTextareaRef.current ? editTextareaRef.current.value : editValue;
      const newValue = (domValue || '').trim();

      if (newValue) {
        // Creating new item (checklist behavior)
        const cellItems = getCellItems(timeframe, rowIndex, columnIndex);
        const maxItemIndex = cellItems.length > 0
          ? Math.max(...cellItems.map(i => (i.item_index || 0)))
          : -1;
        const nextItemIndex = maxItemIndex + 1;

        // Optimistically update UI immediately (don't wait for save)
        const key = `${timeframe}_${rowIndex}_${columnIndex}`;
        const tempId = `temp-${Date.now()}-${nextItemIndex}`;
        const optimisticItem = {
          id: tempId,
          cell_value: newValue,
          status: 'neutral',
          item_index: nextItemIndex,
          row_index: rowIndex,
          column_index: columnIndex,
          timeframe,
        };

        // Add to items immediately for instant feedback
        setItems(prev => {
          const newItems = { ...prev };
          const existingItems = prev[key] || [];
          newItems[key] = [...existingItems, optimisticItem];
          return newItems;
        });

        // Clear input immediately for next item
        setEditValue('');
        if (editTextareaRef.current) {
          editTextareaRef.current.value = '';
        }
        setEditingItemIndex(null);
        setEditingItemKey(null);

        // Save in background (don't wait)
        saveItem(timeframe, rowIndex, columnIndex, {
          cell_value: newValue,
          item_id: null, // New item
          item_index: nextItemIndex
        }).then((savedItem) => {
          // Replace optimistic item with real saved item
          if (savedItem) {
            setItems(prev => {
              const newItems = { ...prev };
              const existingItems = prev[key] || [];
              // Replace temp item with real item
              const updatedItems = existingItems.map(item =>
                item.id === tempId ? savedItem : item
              );
              newItems[key] = updatedItems;
              return newItems;
            });
          }
        }).catch(err => {
          console.error('Failed to save item:', err);
          // Remove optimistic item on error
          setItems(prev => {
            const newItems = { ...prev };
            const existingItems = prev[key] || [];
            newItems[key] = existingItems.filter(item => item.id !== tempId);
            return newItems;
          });
        });

        // Keep focus on input for next item
        setTimeout(() => {
          if (editTextareaRef.current) {
            editTextareaRef.current.focus();
          }
        }, 10);
      } else {
        // Empty value - just clear
        setEditValue('');
        setEditingItemIndex(null);
        setEditingItemKey(null);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter = save current item and exit edit mode
      e.preventDefault();
      handleCellBlur(timeframe, rowIndex, columnIndex);
    } else if (e.key === 'Escape') {
      // Escape = cancel editing
      setEditingCell(null);
      setEditValue('');
      setEditingItemIndex(null);
      setEditingItemKey(null);
    }
  };

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

    // IMPORTANT: Include cell_value to preserve the text when updating status
    saveItem(timeframe, rowIndex, columnIndex, {
      status: nextStatus,
      cell_value: item.cell_value || '', // Preserve existing text
      item_id: item.id,
      item_index: item.item_index || 0
    });
  }, [organizationSlug, saveItem, getCellItems]);

  const handleDeleteItem = useCallback(async (timeframe, rowIndex, columnIndex, itemId) => {
    if (!organizationSlug || !itemId) {
      console.error('Cannot delete: missing organizationSlug or itemId');
      return;
    }

    // Optimistically remove from UI
    const key = `${timeframe}_${rowIndex}_${columnIndex}`;
    setItems(prev => {
      const newItems = { ...prev };
      const existingItems = prev[key] || [];
      newItems[key] = existingItems.filter(item => item.id !== itemId);
      return newItems;
    });

    try {
      const base = resolveApiOrigin();
      // Include organization_slug in query params for DELETE request
      const params = new URLSearchParams({
        id: itemId,
        organization_slug: organizationSlug,
      });
      const response = await fetch(`${base}/api/strategic_map?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        // If not OK, try to get error message
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          throw new Error(json.msg || json.error || `Failed to delete item (${response.status})`);
        } else {
          const text = await response.text();
          throw new Error(text || `Failed to delete item (${response.status})`);
        }
      }

      // Response is OK, parse as JSON
      const json = await response.json();

      if (json.code !== 0) {
        throw new Error(json.msg || 'Failed to delete item');
      }

      console.log('✅ Item deleted successfully');
      refreshCascadeTimeframes(timeframe).catch(err => {
        console.error(`Failed to refresh cascaded timeframes after ${timeframe} delete:`, err);
      });
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.message || 'Failed to delete item. Please try again.');

      // Revert optimistic update on error - reload cell data
      const key = `${timeframe}_${rowIndex}_${columnIndex}`;
      // Reload data for this cell by fetching from API
      // For now, we'll just show the error - user can refresh
    }
  }, [organizationSlug]);

  // Year navigation handlers
  const handleYearNavigation = (direction) => {
    if (direction === 'prev') {
      setFocusYear(prev => prev - 1);
    } else if (direction === 'next') {
      setFocusYear(prev => prev + 1);
    }
  };

  const handleYearSpanChange = (delta) => {
    setYearSpan(prev => Math.max(1, Math.min(20, prev + delta))); // Limit between 1-20 years
  };

  const handleYearStartOffsetChange = (delta) => {
    setYearStartOffset(prev => prev + delta);
  };

  // Memoized renderCell function using the memoized cell component
  const renderCell = useCallback((timeframe, category, col, isSmall = false, hasRightBorder = true, hasLeftBorder = false) => {
    const cellItemsData = getCellItems(timeframe, category.id, col.index);
    const cellKey = `${timeframe}_${category.id}_${col.index}`;
    const isEditing = editingCell === cellKey;

      return (
        <StrategicMapCell
          key={col.index}
          timeframe={timeframe}
          rowIndex={category.id}
          columnIndex={col.index}
          cellItems={cellItemsData}
          isEditing={isEditing}
          editValue={isEditing || editingItemKey !== null ? editValue : ''}
          editingItemIndex={editingItemIndex}
          editingItemKey={editingItemKey}
          isSmall={isSmall}
          hasRightBorder={hasRightBorder}
          hasLeftBorder={hasLeftBorder}
          onCellClick={() => handleCellClick(timeframe, category.id, col.index)}
          onItemClick={handleItemClick}
          onCellBlur={() => handleCellBlur(timeframe, category.id, col.index)}
          onCellKeyDown={(e) => handleCellKeyDown(e, timeframe, category.id, col.index)}
          onStatusClick={handleStatusClick}
          onDeleteItem={handleDeleteItem}
          onEditValueChange={handleEditValueChange}
          editInputRef={editInputRef}
        />
      );
  }, [getCellItems, editingCell, editValue, editingItemIndex, editingItemKey, handleCellClick, handleItemClick, handleCellBlur, handleCellKeyDown, handleStatusClick, handleDeleteItem, handleEditValueChange]);

  // Mobile Card Component for responsive view
  const MobileCategoryCard = useCallback(({ category, timeframe, columns }) => {
    const stats = getCategoryStats(category.id, timeframe);
    const isExpanded = expandedCategories[category.id];
    // Subtle alternating colors
    const bgColor = category.id % 2 === 0 ? '#f8f9fa' : '#ffffff';

    return (
      <Card
        key={category.id}
        sx={{
          mb: 2,
          boxShadow: 2,
          borderRadius: 2,
          backgroundColor: bgColor,
        }}
      >
        <CardHeader
          action={
            <IconButton onClick={() => toggleCategory(category.id)} size="large">
              {isExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
            </IconButton>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {category.label}
            </Typography>
          }
          subheader={
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '1rem', mb: 0.5 }}>
                {category.description}
              </Typography>
              {stats.total > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      完成进度: {stats.completionRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.9375rem' }} color="text.secondary">
                      {stats.completed}/{stats.total}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.completionRate}
                    sx={{
                      height: 10,
                      borderRadius: 1,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#1976d2',
                        borderRadius: 1,
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0 }}>
            {columns.map((col) => {
              const cellItems = getCellItems(timeframe, category.id, col.index);
              const hasItems = cellItems.length > 0;

              return (
                <Box
                  key={col.index}
                  sx={{
                    mb: 2,
                    pb: 2,
                    borderBottom: col.index < columns.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      fontSize: '1.125rem'
                    }}
                  >
                    {timeframe === 'yearly' ? col.year : col.label}
                  </Typography>

                  {hasItems ? (
                    cellItems.map((item, idx) => (
                      <Box
                        key={item.id || idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          mb: 1.5,
                          p: 2,
                          backgroundColor: '#ffffff',
                          borderRadius: 2,
                          border: '1px solid #e0e0e0',
                          minHeight: 56, // Larger touch target
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            boxShadow: 1,
                          }
                        }}
                      >
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusClick(timeframe, category.id, col.index, item.id, item.item_index, e);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 32,
                            minHeight: 32,
                            cursor: 'pointer',
                            borderRadius: '50%',
                            '&:hover': {
                              backgroundColor: '#e0e0e0',
                            }
                          }}
                        >
                          {item.status === 'done' ? (
                            <svg width={24} height={24} viewBox="0 0 20 20" fill="none">
                              <path
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                fill="#4caf50"
                              />
                            </svg>
                          ) : item.status === 'fail' ? (
                            <svg width={24} height={24} viewBox="0 0 20 20" fill="none">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                fill="#f44336"
                              />
                            </svg>
                          ) : (
                            <svg width={24} height={24} viewBox="0 0 20 20" fill="none">
                              <circle
                                cx="10"
                                cy="10"
                                r="8"
                                stroke="#9e9e9e"
                                strokeWidth="1.5"
                                fill="none"
                              />
                            </svg>
                          )}
                        </Box>
                        <Typography
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(timeframe, category.id, col.index, item.id, item.item_index, item.cell_value);
                          }}
                          sx={{
                            flex: 1,
                            fontSize: '1.0625rem', // 17px - larger and readable
                            lineHeight: 1.6,
                            cursor: 'pointer',
                            py: 0.5,
                          }}
                        >
                          {item.cell_value}
                        </Typography>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.id && !item.id.toString().startsWith('temp-')) {
                              handleDeleteItem(timeframe, category.id, col.index, item.id);
                            }
                          }}
                          size="small"
                          sx={{ minWidth: 32, minHeight: 32 }}
                        >
                          <svg width={16} height={16} viewBox="0 0 20 20" fill="none">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              fill="#9e9e9e"
                            />
                          </svg>
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontStyle: 'italic',
                        textAlign: 'center',
                        py: 2,
                        fontSize: '0.875rem'
                      }}
                    >
                      暂无目标项目...
                    </Typography>
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Plus size={20} />}
                    onClick={() => handleCellClick(timeframe, category.id, col.index)}
                    sx={{
                      mt: 1.5,
                      minHeight: 48,
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                  >
                    添加新项目
                  </Button>
                </Box>
              );
            })}
          </CardContent>
        </Collapse>
      </Card>
    );
  }, [expandedCategories, getCellItems, getCategoryStats, handleCellClick, handleItemClick, handleStatusClick, handleDeleteItem, toggleCategory]);

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
      <Box ref={scrollContainerRef} sx={{ flex: 1, overflow: 'auto', px: isMobile ? 1 : 2, py: isMobile ? 1 : 1 }}>
        {/* Yearly View - Responsive */}
        <Box ref={monthlySectionRef} sx={{ mb: 3 }}>
          {/* Controls integrated above the table */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            mb: 2,
            py: 1
          }}>
            {/* Scope Selection - Radio Buttons */}
            <FormControl component="fieldset">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope"
                    value="company"
                    checked={scope === 'company'}
                    onChange={(e) => setScope(e.target.value)}
                    style={{ marginRight: '4px' }}
                  />
                  <Typography sx={{ fontSize: '0.875rem' }}>公司视图</Typography>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope"
                    value="individual"
                    checked={scope === 'individual'}
                    onChange={(e) => setScope(e.target.value)}
                    style={{ marginRight: '4px' }}
                  />
                  <Typography sx={{ fontSize: '0.875rem' }}>个人视图</Typography>
                </label>
              </Box>
            </FormControl>

            {/* Year Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => handleYearNavigation('prev')}
                sx={{ width: 32, height: 32 }}
              >
                <ChevronLeft size={18} />
              </IconButton>

              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>年份</InputLabel>
                <Select
                  value={focusYear}
                  label="年份"
                  onChange={(e) => setFocusYear(Number(e.target.value))}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = getYear(new Date()) - 3 + i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <IconButton
                size="small"
                onClick={() => handleYearNavigation('next')}
                sx={{ width: 32, height: 32 }}
              >
                <ChevronRight size={18} />
              </IconButton>
            </Box>
          </Box>

          {isMobile ? (
            // Mobile Card View
            <Box sx={{ mt: 2 }}>
              {CATEGORIES.map((category) => (
                <MobileCategoryCard
                  key={category.id}
                  category={category}
                  timeframe="yearly"
                  columns={years}
                />
              ))}
            </Box>
          ) : (
            // Desktop Table View with Colors
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                overflow: 'hidden'
              }}
            >
              <Table
                size="small"
                sx={{
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{
                      minWidth: 100,
                      fontWeight: 700,
                      backgroundColor: '#437eb9',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      p: 1.5,
                      borderBottom: '2px solid #e0e0e0',
                      borderRight: '1px solid #e0e0e0',
                    }}>
                      项目
                    </TableCell>
                    {years.map((year, idx) => (
                      <TableCell
                        key={year.index}
                        align="center"
                        sx={{
                          minWidth: 100,
                          fontWeight: 700,
                          backgroundColor: '#437eb9',
                          color: '#ffffff',
                          fontSize: '0.875rem',
                          p: 1.5,
                          borderBottom: '2px solid #e0e0e0',
                          borderRight: idx < years.length - 1 ? '1px solid #e0e0e0' : 'none',
                        }}
                      >
                        {year.year}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {CATEGORIES.map((category, catIdx) => {
                    const stats = getCategoryStats(category.id, 'yearly');
                    // Subtle alternating background
                    const rowBg = category.id % 2 === 0 ? '#fafafa' : '#ffffff';

                    return (
                      <TableRow
                        key={category.id}
                        sx={{
                          '&:hover': { backgroundColor: '#f0f4f8' },
                          '&:last-child td': { borderBottom: 'none' }
                        }}
                      >
                        <TableCell sx={{
                          fontWeight: 600,
                          backgroundColor: rowBg,
                          p: 1.5,
                          fontSize: '0.9rem',
                          borderBottom: '1px solid #e8e8e8',
                          borderRight: '1px solid #e0e0e0',
                        }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                              {category.label}
                            </Typography>
                            {stats.total > 0 && (
                              <Typography variant="caption" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                                {stats.completed}/{stats.total} ({stats.completionRate}%)
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        {years.map((year, yearIdx) => renderCell('yearly', category, year, false, yearIdx < years.length - 1))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Tabs for Monthly/Weekly/Daily */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ minHeight: 48 }}
            centered
          >
            <Tab label="月度计划" value="monthly" sx={{ fontSize: '0.9375rem', minHeight: 48, fontWeight: 600 }} />
            <Tab label="周度计划" value="weekly" sx={{ fontSize: '0.9375rem', minHeight: 48, fontWeight: 600 }} />
            <Tab label="日度计划" value="daily" sx={{ fontSize: '0.9375rem', minHeight: 48, fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* Monthly Tables - Only show when tab is active */}
        {activeTab === 'monthly' && (
          <Box sx={{ mb: 2 }}>
            {tabLoading.monthly ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    py: 1,
                    px: 2,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 1,
                    mb: 1.5,
                    borderBottom: '2px solid #e0e0e0'
                  }}
                >
                  上半年 {focusYear} 年度计划
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    mb: 2
                  }}
                >
                  <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{
                          minWidth: 100,
                          fontWeight: 700,
                          backgroundColor: '#437eb9',
                          color: '#ffffff',
                          fontSize: '0.875rem',
                          p: 1.5,
                          borderBottom: '2px solid #e0e0e0',
                          borderRight: '1px solid #e0e0e0',
                        }}>
                          项目
                        </TableCell>
                        {months.slice(0, 6).map((month, idx) => (
                      <TableCell
                        key={month.index}
                        align="center"
                        sx={{
                          minWidth: 100,
                          fontWeight: 700,
                          backgroundColor: '#437eb9',
                          color: '#ffffff',
                          fontSize: '0.875rem',
                          p: 1.5,
                          borderBottom: '2px solid #e0e0e0',
                          borderRight: idx < 5 ? '1px solid #e0e0e0' : 'none',
                        }}
                      >
                        {month.label}
                      </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CATEGORIES.map((category) => {
                        const stats = getCategoryStats(category.id, 'monthly');
                        const rowBg = category.id % 2 === 0 ? '#fafafa' : '#ffffff';

                        return (
                          <TableRow key={category.id} sx={{ '&:hover': { backgroundColor: '#f0f4f8' }, '&:last-child td': { borderBottom: 'none' } }}>
                      <TableCell sx={{
                        fontWeight: 600,
                        backgroundColor: rowBg,
                        p: 1.5,
                        fontSize: '0.9rem',
                        borderBottom: '1px solid #e8e8e8',
                        borderRight: '1px solid #e0e0e0',
                      }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                                  {category.label}
                                </Typography>
                                {stats.total > 0 && (
                                  <Typography variant="caption" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                                    {stats.completed}/{stats.total}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            {months.slice(0, 6).map((month, idx) => renderCell('monthly', category, month, false, idx < 5))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    py: 1,
                    px: 2,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 1,
                    mb: 1.5,
                    borderBottom: '2px solid #e0e0e0'
                  }}
                >
                  下半年 {focusYear} 年度计划
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden'
                  }}
                >
                  <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                      <TableRow>
                          <TableCell sx={{ 
                            minWidth: 100, 
                            fontWeight: 700, 
                            backgroundColor: '#437eb9', 
                            color: '#ffffff',
                            fontSize: '0.875rem', 
                            p: 1.5, 
                            borderBottom: '2px solid #e0e0e0',
                            borderRight: '1px solid #e0e0e0',
                          }}>
                          项目
                        </TableCell>
                        {months.slice(6).map((month, idx) => (
                       <TableCell
                         key={month.index}
                         align="center"
                         sx={{
                           minWidth: 100,
                           fontWeight: 700,
                           backgroundColor: '#437eb9',
                           color: '#ffffff',
                           fontSize: '0.875rem',
                           p: 1.5,
                           borderBottom: '2px solid #e0e0e0',
                           borderRight: idx < 5 ? '1px solid #e0e0e0' : 'none',
                         }}
                       >
                            {month.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CATEGORIES.map((category) => {
                        const stats = getCategoryStats(category.id, 'monthly');
                        const rowBg = category.id % 2 === 0 ? '#fafafa' : '#ffffff';

                        return (
                          <TableRow key={category.id} sx={{ '&:hover': { backgroundColor: '#f0f4f8' }, '&:last-child td': { borderBottom: 'none' } }}>
                            <TableCell sx={{
                              fontWeight: 600,
                              backgroundColor: rowBg,
                              p: 1.5,
                              fontSize: '0.9rem',
                              borderBottom: '1px solid #e8e8e8',
                              borderRight: '1px solid #e0e0e0',
                            }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                                  {category.label}
                                </Typography>
                                {stats.total > 0 && (
                                  <Typography variant="caption" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                                    {stats.completed}/{stats.total}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            {months.slice(6).map((month, idx) => renderCell('monthly', category, month, false, idx < 5))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {/* Weekly Tables - Only show when tab is active */}
        {activeTab === 'weekly' && (
          <Box sx={{ mb: 2 }}>
            <Box ref={weeklySectionRef} sx={{ mb: 2 }}>
              {tabLoading.weekly ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {weeksByMonth.map(({ month, weeks: monthWeeks }, monthIdx) => {
                    const slotCount = Math.max(monthWeeks.length, 5);
                    const weekSlots = Array.from({ length: slotCount }, (_, idx) => monthWeeks[idx] || null);

                    return (
                      <Box key={month.index} sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            py: 0.5,
                            backgroundColor: '#f5f5f5',
                          }}
                        >
                          {focusYear} {month.label} 周度计划
                        </Typography>
                        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    minWidth: 100,
                                    fontWeight: 700,
                                    backgroundColor: '#437eb9',
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    p: 0.5,
                                  }}
                                >
                                  项目
                                </TableCell>
                                {weekSlots.map((week, idx) => (
                                  <TableCell
                                    key={week ? week.index : `week-placeholder-${idx}`}
                                    align="center"
                                    sx={{
                                      minWidth: 60,
                                      fontWeight: 700,
                                      backgroundColor: '#437eb9',
                                      color: '#ffffff',
                                      fontSize: '0.7rem',
                                      p: 0.25,
                                    }}
                                  >
                                    {week ? week.isoWeekLabel : ''}
                                  </TableCell>
                                ))}
                                <TableCell
                                  align="center"
                                  sx={{
                                    minWidth: 75,
                                    fontWeight: 700,
                                    backgroundColor: '#437eb9',
                                    color: '#ffffff',
                                    fontSize: '0.7rem',
                                    p: 0.25,
                                  }}
                                >
                                  {month.label}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {CATEGORIES.map((category) => (
                                <TableRow key={category.id}>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      backgroundColor: '#fafafa',
                                      p: 0.5,
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      {category.label}
                                    </Typography>
                                  </TableCell>
                                  {weekSlots.map((week, idx) =>
                                    week ? (
                                      renderCell('weekly', category, week, true, idx < weekSlots.length - 1)
                                    ) : (
                                      <TableCell
                                        key={`empty-week-${category.id}-${idx}`}
                                        sx={{
                                          minWidth: 60,
                                          borderBottom: '1px solid #e8e8e8',
                                          borderRight: idx < weekSlots.length - 1 ? '1px solid #e0e0e0' : 'none',
                                        }}
                                      />
                                    )
                                  )}
                                  {months[monthIdx] ? (
                                    renderCell('monthly', category, months[monthIdx], false, false, true)
                                  ) : (
                                    <TableCell
                                      sx={{
                                        minWidth: 75,
                                        borderBottom: '1px solid #e8e8e8',
                                        borderLeft: '1px solid #e0e0e0',
                                      }}
                                    />
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    );
                  })}
                </>
              )}
            </Box>
          </Box>
        )}

        {/* Daily Tables - Only show when tab is active */}
        {activeTab === 'daily' && (
          <Box ref={dailySectionRef} sx={{ mb: 2 }}>
            {tabLoading.daily ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {weeks.map((week) => {
                  const weekStart = parseISO(week.value);
                  const anchorDate = addDays(weekStart, 3);
                  if (getISOWeekYear(anchorDate) !== focusYear) {
                    return null;
                  }

                  const isoWeekNumber = getISOWeek(weekStart);
                  const isoWeekLabel = String(isoWeekNumber).padStart(2, '0');
                  const weekLabel = `Week ${isoWeekLabel}`;
                  const weekKey = `${getISOWeekYear(weekStart)}-${isoWeekLabel}`;
                  const weekDays = daysByWeek.get(weekKey) || [];

                  const dayColumns = Array.from({ length: 7 }, (_, idx) => {
                    const slot = weekDays.find((day) => day.dayOfWeek === idx + 1);
                    return slot || null;
                  });

                  const hasVisibleDays = dayColumns.some((day) => day !== null);
                  if (!hasVisibleDays && !weekDays.length) {
                    return null;
                  }

                  const weekMeta = {
                    ...week,
                    isoWeekNumber,
                    isoWeekLabel,
                    weekStart,
                  };

                  return (
                    <Box key={`daily-week-${isoWeekNumber}`} sx={{ mb: 2 }}>
                      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  minWidth: 100,
                                  fontWeight: 700,
                                  backgroundColor: '#437eb9',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  p: 0.5,
                                }}
                              >
                                项目
                              </TableCell>
                              {dayColumns.map((day, idx) => (
                                <TableCell
                                  key={day ? day.index : `empty-day-${isoWeekNumber}-${idx}`}
                                  align="center"
                                  sx={{
                                    minWidth: 60,
                                    maxWidth: 60,
                                    fontWeight: 700,
                                    backgroundColor: '#437eb9',
                                    color: '#ffffff',
                                    fontSize: '0.65rem',
                                    p: 0.25,
                                  }}
                                >
                                  {day
                                    ? `${format(day.date, 'dd')} (${format(day.date, 'EEE')})`
                                    : ''}
                                </TableCell>
                              ))}
                              <TableCell
                                align="center"
                                sx={{
                                  minWidth: 90,
                                  fontWeight: 700,
                                  backgroundColor: '#437eb9',
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  p: 0.25,
                                }}
                              >
                                {weekLabel}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {CATEGORIES.map((category) => (
                              <TableRow key={category.id}>
                                <TableCell
                                  sx={{
                                    fontWeight: 600,
                                    backgroundColor: '#fafafa',
                                    p: 0.5,
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                    {category.label}
                                  </Typography>
                                </TableCell>
                                {dayColumns.map((day, idx) =>
                                  day ? (
                                    renderCell('daily', category, day, true, idx < dayColumns.length - 1)
                                  ) : (
                                    <TableCell
                                      key={`empty-day-cell-${category.id}-${isoWeekNumber}-${idx}`}
                                      sx={{
                                        minWidth: 60,
                                        borderBottom: '1px solid #e8e8e8',
                                        borderRight: idx < dayColumns.length - 1 ? '1px solid #e0e0e0' : 'none',
                                      }}
                                    />
                                  )
                                )}
                                {weekMeta ? (
                                  renderCell('weekly', category, weekMeta, false, false, true)
                                ) : (
                                  <TableCell
                                    sx={{
                                      minWidth: 90,
                                      borderBottom: '1px solid #e8e8e8',
                                      borderLeft: '1px solid #e0e0e0',
                                    }}
                                  />
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })}
              </>
            )}
          </Box>
        )}

      </Box>

      {/* Floating Action Button for Mobile - Quick Add */}
      {isMobile && (
        <Tooltip title="快速添加" placement="left">
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            onClick={() => {
              // Scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Plus size={24} />
          </Fab>
        </Tooltip>
      )}
      <Fab
        size="small"
        color="primary"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        sx={{
          position: 'fixed',
          right: 32,
          top: '90%',
          transform: 'translateY(-50%)',
          zIndex: 1400,
        }}
      >
        <ChevronUp size={20} />
      </Fab>
    </Box>
  );
};

export default StrategicMapView;

