/**
 * Strategic Map Controller
 * Handles CRUD operations for Strategic Map items with cascade logic
 */

const { createClient } = require('@supabase/supabase-js');
const { getOrganizationInfo } = require('./organization_helper');

class StrategicMapController {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all strategic map items for an organization
   * @param {string} organizationSlug - Organization identifier
   * @param {string} timeframe - Optional filter by timeframe
   * @returns {Object} Transformed data in frontend format
   */
  async getItems(organizationSlug, timeframe = null) {
    try {
      // 1. Validate organization
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) {
        throw new Error('Organization not found');
      }

      // 2. Call RPC function to get items
      const { data, error } = await this.supabase.rpc('get_strategic_map_items', {
        p_organization_id: org.id,
        p_timeframe: timeframe
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      // 3. Transform to frontend format
      const transformedData = this.transformToFrontendFormat(data || []);

      return {
        success: true,
        data: transformedData,
        metadata: {
          totalItems: data ? data.length : 0,
          organizationId: org.id,
          organizationSlug: organizationSlug,
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in getItems:', error);
      throw error;
    }
  }

  /**
   * Create new strategic map item
   * @param {string} organizationSlug
   * @param {Object} itemData - Item data (text, timeframe, etc.)
   * @param {string} individualId - Creator's individual ID
   * @returns {Object} Created item with cascaded items
   */
  async createItem(organizationSlug, itemData, individualId) {
    try {
      // 1. Validate organization
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) {
        throw new Error('Organization not found');
      }

      // 2. Build insert data
      // Note: created_by_individual_id is left null since we're in organization mode only
      // The individualId is just the Lark user_id (not a UUID from individuals table)
      const insertData = {
        organization_id: org.id,
        created_by_individual_id: null,  // Organization mode - no individual tracking
        text: itemData.text,
        status: itemData.status || 'neutral',
        timeframe: itemData.timeframe,
        category_index: itemData.categoryIndex,
        year_index: itemData.yearIndex !== undefined ? itemData.yearIndex : null,
        month_col_index: itemData.monthColIndex !== undefined ? itemData.monthColIndex : null,
        week_number: itemData.weekNumber !== undefined ? itemData.weekNumber : null,
        daily_date_key: itemData.dailyDateKey !== undefined ? itemData.dailyDateKey : null
      };

      console.log('📝 Creating item:', insertData);

      // 3. Insert item
      const { data, error } = await this.supabase
        .from('strategic_map_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      // 4. Fetch cascaded items created by trigger (wait a bit for trigger to complete)
      await this.sleep(100);
      const cascadedItems = await this.getCascadedItems(data.id);

      return {
        success: true,
        data: {
          item: this.transformItemToFrontend(data),
          cascadedItems: cascadedItems.map(item => this.transformItemToFrontend(item))
        }
      };
    } catch (error) {
      console.error('Error in createItem:', error);
      throw error;
    }
  }

  /**
   * Update strategic map item
   * @param {string} itemId - Item UUID
   * @param {string} organizationSlug
   * @param {Object} updates - Fields to update
   * @param {string} individualId - Updater's individual ID
   * @returns {Object} Updated item with cascaded items
   */
  async updateItem(itemId, organizationSlug, updates, individualId) {
    try {
      // Validate organization
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Build update data
      // Note: updated_by_individual_id is left null since we're in organization mode only
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by_individual_id: null  // Organization mode - no individual tracking
      };

      // Update item
      const { data, error } = await this.supabase
        .from('strategic_map_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('organization_id', org.id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      // Fetch updated cascaded items (trigger updates them automatically)
      await this.sleep(100);
      const cascadedItems = await this.getCascadedItems(itemId);

      return {
        success: true,
        data: {
          item: this.transformItemToFrontend(data),
          cascadedItems: cascadedItems.map(item => this.transformItemToFrontend(item))
        }
      };
    } catch (error) {
      console.error('Error in updateItem:', error);
      throw error;
    }
  }

  /**
   * Soft delete strategic map item
   * @param {string} itemId - Item UUID
   * @param {string} organizationSlug
   * @param {string} individualId - Deleter's individual ID
   * @returns {Object} Deleted item info
   */
  async deleteItem(itemId, organizationSlug, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Count cascaded items before deletion
      const cascadedBefore = await this.getCascadedItems(itemId);

      // Soft delete
      const { data, error } = await this.supabase
        .from('strategic_map_items')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by_individual_id: null  // Organization mode - no individual tracking
        })
        .eq('id', itemId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      return {
        success: true,
        data: {
          item: this.transformItemToFrontend(data),
          cascadedItemsDeleted: cascadedBefore.length
        }
      };
    } catch (error) {
      console.error('Error in deleteItem:', error);
      throw error;
    }
  }

  /**
   * Batch create/update items (for migration)
   * @param {string} organizationSlug
   * @param {Array} items - Array of item data
   * @param {string} individualId
   * @returns {Object} Batch operation results
   */
  async batchUpsert(organizationSlug, items, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Use RPC function for batch upsert
      const { data, error } = await this.supabase.rpc('upsert_strategic_map_items', {
        p_organization_id: org.id,
        p_individual_id: individualId,
        p_items: JSON.stringify(items)
      });

      if (error) {
        console.error('Batch upsert error:', error);
        throw error;
      }

      // Count results
      const created = data.filter(r => r.success).length;
      const failed = data.filter(r => !r.success).length;

      return {
        success: true,
        data: {
          created,
          updated: 0, // RPC function doesn't distinguish
          failed,
          items: data
        }
      };
    } catch (error) {
      console.error('Error in batchUpsert:', error);
      throw error;
    }
  }

  /**
   * Get cascaded items for a parent item (ALL descendants, not just direct children)
   * @param {string} parentItemId
   * @returns {Array} Cascaded items (all descendants recursively)
   */
  async getCascadedItems(parentItemId) {
    try {
      // Fetch all descendants recursively using multiple queries
      // (Supabase doesn't support recursive CTEs directly, so we do it iteratively)
      const allDescendants = [];
      let currentLevelIds = [parentItemId];
      let depth = 0;
      const maxDepth = 10; // Safety limit to prevent infinite loops

      while (currentLevelIds.length > 0 && depth < maxDepth) {
        // Fetch children of current level
        const { data, error } = await this.supabase
          .from('strategic_map_items')
          .select('*')
          .in('parent_item_id', currentLevelIds)
          .eq('is_deleted', false);

        if (error) throw error;

        if (!data || data.length === 0) {
          break; // No more children
        }

        // Add to results
        allDescendants.push(...data);

        // Prepare next level (children IDs become parents for next iteration)
        currentLevelIds = data.map(item => item.id);
        depth++;
      }

      console.log(`📊 Fetched ${allDescendants.length} descendants for item ${parentItemId} (depth: ${depth})`);
      return allDescendants;
    } catch (error) {
      console.error('Error fetching cascaded items:', error);
      return [];
    }
  }

  /**
   * Transform database rows to frontend format
   * Converts flat rows into nested object keyed by cell position
   * @param {Array} rows - Database rows
   * @returns {Object} Frontend format data
   */
  transformToFrontendFormat(rows) {
    const result = {};

    rows.forEach(row => {
      // Generate cell key: {timeframe}_{categoryIndex}_{colIndex}
      const cellKey = this.getCellKey(row);

      if (!result[cellKey]) {
        result[cellKey] = [];
      }

      result[cellKey].push(this.transformItemToFrontend(row));
    });

    return result;
  }

  /**
   * Transform single item to frontend format
   */
  transformItemToFrontend(row) {
    return {
      id: row.id,
      text: row.text,
      status: row.status,
      timeframe: row.timeframe,
      rowIndex: row.category_index,
      colIndex: this.getColIndex(row),
      isCascaded: row.is_cascaded,
      parentItemId: row.parent_item_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdById: row.created_by_individual_id,
      updatedById: row.updated_by_individual_id
    };
  }

  /**
   * Get cell key for grouping items
   */
  getCellKey(row) {
    const categoryIndex = row.category_index;
    let colIndex;

    switch (row.timeframe) {
      case 'yearly':
        colIndex = row.year_index;
        break;
      case 'monthly':
        colIndex = row.month_col_index;
        break;
      case 'weekly':
        colIndex = row.week_number;
        break;
      case 'daily':
        colIndex = row.daily_date_key;
        break;
    }

    return `${row.timeframe}_${categoryIndex}_${colIndex}`;
  }

  /**
   * Get column index from row
   */
  getColIndex(row) {
    switch (row.timeframe) {
      case 'yearly':
        return row.year_index;
      case 'monthly':
        return row.month_col_index;
      case 'weekly':
        return row.week_number;
      case 'daily':
        return row.daily_date_key;
      default:
        return null;
    }
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = StrategicMapController;
