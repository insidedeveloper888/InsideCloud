/**
 * Strategic Map API Client
 * Handles communication with Strategic Map v2 backend
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '';
const USE_API = process.env.REACT_APP_USE_STRATEGIC_MAP_API === 'true';

/**
 * Storage key for localStorage fallback
 */
export const getStorageKey = (organizationSlug) => `strategic_map_${organizationSlug || 'default'}`;

/**
 * Load data from localStorage
 */
export const loadFromLocalStorage = (organizationSlug) => {
  try {
    const saved = localStorage.getItem(getStorageKey(organizationSlug));
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return {};
  }
};

/**
 * Save data to localStorage
 */
export const saveToLocalStorage = (organizationSlug, data) => {
  try {
    localStorage.setItem(getStorageKey(organizationSlug), JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

/**
 * Get column index fields based on timeframe
 */
const getColIndexFields = (timeframe, colIndex) => {
  switch (timeframe) {
    case 'yearly':
      return { yearIndex: colIndex };
    case 'monthly':
      return { monthColIndex: colIndex };
    case 'weekly':
      return { weekNumber: colIndex };
    case 'daily':
      return { dailyDateKey: colIndex };
    default:
      return {};
  }
};

/**
 * Load all items from API
 */
export const loadItems = async (organizationSlug, timeframe = null) => {
  if (!USE_API) {
    return loadFromLocalStorage(organizationSlug);
  }

  try {
    const url = `${API_BASE}/api/strategic_map_v2?organization_slug=${organizationSlug}${timeframe ? `&timeframe=${timeframe}` : ''}`;
    const response = await axios.get(url, {
      withCredentials: true  // Send cookies for authentication
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to load data');
    }
  } catch (error) {
    console.error('API load failed, falling back to localStorage:', error);
    return loadFromLocalStorage(organizationSlug);
  }
};

/**
 * Create a new item
 */
export const createItem = async (organizationSlug, timeframe, rowIndex, colIndex, text) => {
  const itemData = {
    text,
    status: 'neutral',
    timeframe,
    categoryIndex: rowIndex,
    ...getColIndexFields(timeframe, colIndex)
  };

  if (!USE_API) {
    // localStorage mode - return generated item
    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...itemData,
      timeframe,
      rowIndex,
      colIndex,
    };

    const data = loadFromLocalStorage(organizationSlug);
    const cellKey = `${timeframe}_${rowIndex}_${colIndex}`;
    if (!data[cellKey]) data[cellKey] = [];
    data[cellKey].push(newItem);
    saveToLocalStorage(organizationSlug, data);

    return { newItem, cascadedItems: [] };
  }

  try {
    const response = await axios.post(`${API_BASE}/api/strategic_map_v2`, {
      organization_slug: organizationSlug,
      ...itemData
    }, {
      withCredentials: true  // Send cookies for authentication
    });

    if (response.data.success) {
      return {
        newItem: response.data.data.item,
        cascadedItems: response.data.data.cascadedItems || []
      };
    } else {
      throw new Error(response.data.error || 'Failed to create item');
    }
  } catch (error) {
    console.error('API create failed, falling back to localStorage:', error);

    // Fallback to localStorage
    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...itemData,
      timeframe,
      rowIndex,
      colIndex,
    };

    const data = loadFromLocalStorage(organizationSlug);
    const cellKey = `${timeframe}_${rowIndex}_${colIndex}`;
    if (!data[cellKey]) data[cellKey] = [];
    data[cellKey].push(newItem);
    saveToLocalStorage(organizationSlug, data);

    return { newItem, cascadedItems: [] };
  }
};

/**
 * Update an item
 */
export const updateItem = async (organizationSlug, itemId, timeframe, rowIndex, colIndex, updates) => {
  if (!USE_API) {
    // localStorage mode
    const data = loadFromLocalStorage(organizationSlug);
    const cellKey = `${timeframe}_${rowIndex}_${colIndex}`;

    if (data[cellKey]) {
      const itemIndex = data[cellKey].findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        data[cellKey][itemIndex] = { ...data[cellKey][itemIndex], ...updates };
        saveToLocalStorage(organizationSlug, data);
      }
    }

    return { success: true };
  }

  try {
    const response = await axios.put(`${API_BASE}/api/strategic_map_v2?id=${itemId}`, {
      organization_slug: organizationSlug,
      ...updates
    }, {
      withCredentials: true  // Send cookies for authentication
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to update item');
    }
  } catch (error) {
    console.error('API update failed, falling back to localStorage:', error);

    // Fallback to localStorage
    const data = loadFromLocalStorage(organizationSlug);
    const cellKey = `${timeframe}_${rowIndex}_${colIndex}`;

    if (data[cellKey]) {
      const itemIndex = data[cellKey].findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        data[cellKey][itemIndex] = { ...data[cellKey][itemIndex], ...updates };
        saveToLocalStorage(organizationSlug, data);
      }
    }

    return { success: true };
  }
};

/**
 * Delete an item
 */
export const deleteItem = async (organizationSlug, itemId, timeframe, rowIndex, colIndex) => {
  if (!USE_API) {
    // localStorage mode
    const data = loadFromLocalStorage(organizationSlug);
    const cellKey = `${timeframe}_${rowIndex}_${colIndex}`;

    if (data[cellKey]) {
      data[cellKey] = data[cellKey].filter(item => item.id !== itemId);
      if (data[cellKey].length === 0) {
        delete data[cellKey];
      }
      saveToLocalStorage(organizationSlug, data);
    }

    return { success: true };
  }

  try {
    const response = await axios.delete(
      `${API_BASE}/api/strategic_map_v2?id=${itemId}&organization_slug=${organizationSlug}`,
      {
        withCredentials: true  // Send cookies for authentication
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to delete item');
    }
  } catch (error) {
    console.error('API delete failed, falling back to localStorage:', error);

    // Fallback to localStorage
    const data = loadFromLocalStorage(organizationSlug);
    const cellKey = `${timeframe}_${rowIndex}_${colIndex}`;

    if (data[cellKey]) {
      data[cellKey] = data[cellKey].filter(item => item.id !== itemId);
      if (data[cellKey].length === 0) {
        delete data[cellKey];
      }
      saveToLocalStorage(organizationSlug, data);
    }

    return { success: true };
  }
};

/**
 * Batch migrate data from localStorage to database
 */
export const migrateLocalStorageToDatabase = async (organizationSlug) => {
  if (!USE_API) {
    throw new Error('API mode is not enabled. Set REACT_APP_USE_STRATEGIC_MAP_API=true');
  }

  const localData = loadFromLocalStorage(organizationSlug);
  const items = [];

  // Transform localStorage format to API format
  Object.entries(localData).forEach(([cellKey, cellItems]) => {
    const [timeframe, categoryIndex, colIndex] = cellKey.split('_');

    cellItems.forEach(item => {
      items.push({
        text: item.text,
        status: item.status,
        timeframe,
        category_index: parseInt(categoryIndex),
        ...getColIndexFields(timeframe, parseInt(colIndex))
      });
    });
  });

  if (items.length === 0) {
    return {
      success: true,
      data: { created: 0, failed: 0, items: [] }
    };
  }

  try {
    const response = await axios.post(`${API_BASE}/api/strategic_map_v2/batch`, {
      organization_slug: organizationSlug,
      items
    });

    if (response.data.success) {
      // On successful migration, optionally clear localStorage
      // localStorage.removeItem(getStorageKey(organizationSlug));
      return response.data;
    } else {
      throw new Error(response.data.error || 'Migration failed');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

export default {
  loadItems,
  createItem,
  updateItem,
  deleteItem,
  migrateLocalStorageToDatabase,
  loadFromLocalStorage,
  saveToLocalStorage
};
