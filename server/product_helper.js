// Product helper functions for product access control
const { supabase } = require('./supabase_client');
const { getOrganizationInfo } = require('./organization_helper');

/**
 * Get all enabled products for an organization
 * @param {string} orgSlug - Organization slug identifier
 * @returns {Promise<Array<{key: string, name: string, description: string, category: string, icon: string, metadata: object}> | null>}
 */
async function getOrganizationProducts(orgSlug) {
    if (!orgSlug) {
        console.error('❌ Organization slug is required');
        return null;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        return null;
    }

    try {
        console.log(`🔍 Fetching enabled products for organization: ${orgSlug}`);

        // Get organization info
        const org = await getOrganizationInfo(orgSlug);
        if (!org) {
            console.error(`❌ Organization not found: ${orgSlug}`);
            return null;
        }

        // Fetch products with access check
        const { data, error } = await supabase
            .from('products')
            .select(`
                key,
                name,
                description,
                category,
                icon,
                status,
                metadata,
                organization_product_access!inner(is_enabled)
            `)
            .eq('is_active', true)
            .eq('organization_product_access.organization_id', org.id)
            .eq('organization_product_access.is_enabled', true)
            .order('key');

        if (error) {
            console.error('❌ Error fetching organization products:', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.warn(`⚠️  No enabled products found for organization: ${orgSlug}`);
            return [];
        }

        console.log(`✅ Found ${data.length} enabled product(s) for organization: ${orgSlug}`);
        return data;
    } catch (error) {
        console.error('❌ Exception fetching organization products:', error);
        return null;
    }
}

/**
 * Validate that an organization has access to a specific product
 * @param {string} orgSlug - Organization slug identifier
 * @param {string} productKey - Product key (e.g., 'strategic_map', 'contact_management')
 * @returns {Promise<boolean>}
 */
async function validateProductAccess(orgSlug, productKey) {
    if (!orgSlug || !productKey) {
        console.error('❌ Organization slug and product key are required');
        return false;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Cannot validate product access.');
        return false;
    }

    try {
        console.log(`🔍 Validating product access: ${orgSlug} -> ${productKey}`);

        // Get organization info
        const org = await getOrganizationInfo(orgSlug);
        if (!org || !org.is_active) {
            console.error(`❌ Organization not found or inactive: ${orgSlug}`);
            return false;
        }

        // Get product info
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, key, is_active')
            .eq('key', productKey)
            .eq('is_active', true)
            .single();

        if (productError || !product) {
            console.error(`❌ Product not found or inactive: ${productKey}`);
            return false;
        }

        // Check access
        const { data: access, error: accessError } = await supabase
            .from('organization_product_access')
            .select('is_enabled')
            .eq('organization_id', org.id)
            .eq('product_id', product.id)
            .single();

        if (accessError || !access) {
            console.warn(`⚠️  No access record found for ${orgSlug} -> ${productKey}`);
            return false;
        }

        if (!access.is_enabled) {
            console.warn(`⚠️  Access denied (is_enabled=false) for ${orgSlug} -> ${productKey}`);
            return false;
        }

        console.log(`✅ Access validated: ${orgSlug} -> ${productKey}`);
        return true;
    } catch (error) {
        console.error('❌ Exception validating product access:', error);
        return false;
    }
}

/**
 * Get product details by key
 * @param {string} productKey - Product key (e.g., 'strategic_map', 'contact_management')
 * @returns {Promise<{id: string, key: string, name: string, description: string, category: string, metadata: object} | null>}
 */
async function getProductByKey(productKey) {
    if (!productKey) {
        console.error('❌ Product key is required');
        return null;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Cannot fetch product info.');
        return null;
    }

    try {
        console.log(`🔍 Fetching product info: ${productKey}`);

        const { data, error } = await supabase
            .from('products')
            .select('id, key, name, description, category, icon, status, metadata, is_active')
            .eq('key', productKey)
            .single();

        if (error || !data) {
            console.error(`❌ Product not found: ${productKey}`);
            return null;
        }

        console.log(`✅ Found product: ${productKey}`);
        return data;
    } catch (error) {
        console.error('❌ Exception fetching product info:', error);
        return null;
    }
}

/**
 * Get all products (for admin use, no access filtering)
 * @returns {Promise<Array<{key: string, name: string, description: string, category: string, is_active: boolean}> | null>}
 */
async function getAllProducts() {
    if (!supabase) {
        console.error('❌ Supabase client not initialized. Cannot fetch products.');
        return null;
    }

    try {
        console.log('🔍 Fetching all products');

        const { data, error } = await supabase
            .from('products')
            .select('id, key, name, description, category, icon, status, metadata, is_active')
            .order('status, key');

        if (error) {
            console.error('❌ Error fetching products:', error);
            return null;
        }

        console.log(`✅ Found ${data?.length || 0} product(s)`);
        return data || [];
    } catch (error) {
        console.error('❌ Exception fetching products:', error);
        return null;
    }
}

/**
 * Get products for dashboard display (includes coming_soon products)
 * Returns:
 * - Active/Beta products where organization has access
 * - Coming Soon products (shown to all orgs, no access check)
 * - Deprecated products where organization has access (shown but disabled)
 *
 * @param {string} orgSlug - Organization slug identifier
 * @returns {Promise<Array | null>}
 */
async function getDashboardProducts(orgSlug) {
    if (!orgSlug) {
        console.error('❌ Organization slug is required');
        return null;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return null;
    }

    try {
        console.log(`🔍 Fetching dashboard products for organization: ${orgSlug}`);

        // Get organization info
        const org = await getOrganizationInfo(orgSlug);
        if (!org) {
            console.error(`❌ Organization not found: ${orgSlug}`);
            return null;
        }

        // Get products with access (active, beta, deprecated)
        const { data: accessProducts, error: accessError } = await supabase
            .from('products')
            .select(`
                key,
                name,
                description,
                category,
                icon,
                status,
                metadata,
                organization_product_access!inner(is_enabled)
            `)
            .eq('is_active', true)
            .eq('organization_product_access.organization_id', org.id)
            .eq('organization_product_access.is_enabled', true)
            .in('status', ['active', 'beta', 'deprecated']);

        if (accessError) {
            console.error('❌ Error fetching access products:', accessError);
            return null;
        }

        // Get all coming_soon products (no access check - shown to everyone)
        const { data: comingSoonProducts, error: comingSoonError } = await supabase
            .from('products')
            .select('key, name, description, category, icon, status, metadata')
            .eq('is_active', true)
            .eq('status', 'coming_soon');

        if (comingSoonError) {
            console.error('❌ Error fetching coming soon products:', comingSoonError);
            return null;
        }

        // Combine both lists (remove duplicates if any)
        const allProducts = [...(accessProducts || []), ...(comingSoonProducts || [])];
        const uniqueProducts = Array.from(
            new Map(allProducts.map(p => [p.key, p])).values()
        );

        // Sort by status priority: active, beta, coming_soon, deprecated
        const statusOrder = { active: 1, beta: 2, coming_soon: 3, deprecated: 4 };
        uniqueProducts.sort((a, b) => {
            const orderA = statusOrder[a.status] || 999;
            const orderB = statusOrder[b.status] || 999;
            if (orderA !== orderB) return orderA - orderB;
            return a.key.localeCompare(b.key);
        });

        console.log(`✅ Found ${uniqueProducts.length} dashboard products (${accessProducts?.length || 0} with access, ${comingSoonProducts?.length || 0} coming soon)`);
        return uniqueProducts;
    } catch (error) {
        console.error('❌ Exception fetching dashboard products:', error);
        return null;
    }
}

/**
 * Check if a product requires backend API access
 * Some products like document_parser are pure frontend and don't need API validation
 * @param {string} productKey - Product key
 * @returns {boolean}
 */
function requiresBackendAccess(productKey) {
    const frontendOnlyProducts = ['document_parser']; // Pure frontend tools
    return !frontendOnlyProducts.includes(productKey);
}

module.exports = {
    getOrganizationProducts,
    getDashboardProducts,
    validateProductAccess,
    getProductByKey,
    getAllProducts,
    requiresBackendAccess,
};
