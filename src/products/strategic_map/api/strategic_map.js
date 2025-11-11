const { handleCors, okResponse, failResponse } = require('./_utils');
const { supabase } = require('./supabase_helper');

/**
 * Get strategic map items for an organization
 * Supports both company and individual scope
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  // Support both Express (req.query) and Koa (req.query from ctx.query)
  const queryParams = req.query || {};
  const bodyParams = req.body || {};
  const { organization_slug, scope = 'company', timeframe = 'yearly', timeframe_value, individual_id } = method === 'GET' ? queryParams : { ...queryParams, ...bodyParams };

  if (!organization_slug) {
    res.status(400).json(failResponse('organization_slug is required'));
    return;
  }

  try {
    // Get organization ID
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (orgError || !org) {
      res.status(404).json(failResponse('Organization not found'));
      return;
    }

    if (method === 'GET') {
      // Get items
      let query = supabase
        .from('strategic_map_items')
        .select('*')
        .eq('organization_id', org.id)
        .eq('scope', scope)
        .eq('timeframe', timeframe);

      if (timeframe_value) {
        query = query.eq('timeframe_value', timeframe_value);
      }

      if (scope === 'individual' && individual_id) {
        // Get individual_id from lark_user_id or use provided individual_id
        const { data: individual } = await supabase
          .from('individuals')
          .select('id')
          .eq('id', individual_id)
          .single();

        if (individual) {
          query = query.eq('individual_id', individual.id);
        }
      } else if (scope === 'company') {
        query = query.is('individual_id', null);
      }

      const { data, error } = await query.order('row_index', { ascending: true }).order('column_index', { ascending: true });

      if (error) {
        console.error('Error fetching strategic map items:', error);
        res.status(500).json(failResponse('Failed to fetch strategic map items'));
        return;
      }

      res.status(200).json(okResponse(data || []));
      return;
    }

    if (method === 'POST') {
      // Create or update item
      const { row_index, column_index, cell_value, cell_type, status, individual_id: reqIndividualId } = bodyParams;

      if (row_index === undefined || column_index === undefined) {
        res.status(400).json(failResponse('row_index and column_index are required'));
        return;
      }

      // Get current user's individual_id if not provided
      let finalIndividualId = null;
      if (scope === 'individual') {
        // For individual scope, get from cookie/token
        const cookie = require('cookie');
        const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
        const lkToken = cookies.lk_token;

        if (lkToken) {
          try {
            let userInfo = null;
            try {
              userInfo = JSON.parse(Buffer.from(lkToken, 'base64').toString());
            } catch (e) {
              try {
                userInfo = JSON.parse(lkToken);
              } catch (e2) {
                // Ignore
              }
            }

            if (userInfo && userInfo.user_id) {
              const { data: larkUser } = await supabase
                .from('lark_users')
                .select('id')
                .eq('lark_user_id', userInfo.user_id)
                .single();

              if (larkUser) {
                const { data: individual } = await supabase
                  .from('individuals')
                  .select('id')
                  .eq('user_id', larkUser.id)
                  .single();

                if (individual) {
                  finalIndividualId = individual.id;
                }
              }
            }
          } catch (e) {
            console.error('Error getting user individual_id:', e);
          }
        }

        if (!finalIndividualId && reqIndividualId) {
          finalIndividualId = reqIndividualId;
        }

        if (!finalIndividualId) {
          res.status(400).json(failResponse('individual_id is required for individual scope'));
          return;
        }
      }

      const timeframeDate = timeframe_value ? new Date(timeframe_value) : new Date();

      // Upsert item - use the unique index for conflict resolution
      const itemData = {
        organization_id: org.id,
        individual_id: finalIndividualId,
        scope,
        row_index,
        column_index,
        cell_value: cell_value || null,
        cell_type: cell_type || 'text',
        status: status || 'neutral',
        timeframe,
        timeframe_value: timeframeDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      };

      // First try to find existing item
      const { data: existing } = await supabase
        .from('strategic_map_items')
        .select('id')
        .eq('organization_id', org.id)
        .eq('scope', scope)
        .eq('row_index', row_index)
        .eq('column_index', column_index)
        .eq('timeframe', timeframe)
        .eq('timeframe_value', timeframeDate.toISOString().split('T')[0])
        .eq('individual_id', finalIndividualId || null)
        .maybeSingle();

      let data, error;
      if (existing) {
        // Update existing
        ({ data, error } = await supabase
          .from('strategic_map_items')
          .update(itemData)
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        // Insert new
        ({ data, error } = await supabase
          .from('strategic_map_items')
          .insert(itemData)
          .select()
          .single());
      }

      if (error) {
        console.error('Error upserting strategic map item:', error);
        res.status(500).json(failResponse('Failed to save strategic map item'));
        return;
      }

      res.status(200).json(okResponse(data));
      return;
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        res.status(400).json(failResponse('id is required'));
        return;
      }

      const { error } = await supabase
        .from('strategic_map_items')
        .delete()
        .eq('id', id)
        .eq('organization_id', org.id);

      if (error) {
        console.error('Error deleting strategic map item:', error);
        res.status(500).json(failResponse('Failed to delete strategic map item'));
        return;
      }

      res.status(200).json(okResponse({ success: true }));
      return;
    }

    res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('Error in strategic_map API:', error);
    res.status(500).json(failResponse('Internal server error'));
  }
};

