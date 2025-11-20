/**
 * Product Access Control Middleware
 *
 * Validates that an organization has access to a specific product before
 * allowing the request to proceed.
 *
 * Usage:
 *   router.get('/api/contacts', requireProductAccess('contact_management'), controller.getContacts);
 *   router.post('/api/strategic_map_v2', requireProductAccess('strategic_map'), controller.createItem);
 */

const { validateProductAccess, requiresBackendAccess } = require('../product_helper');

/**
 * Middleware factory: Returns Koa middleware that validates product access
 *
 * @param {string} productKey - The product key to validate access for (e.g., 'strategic_map', 'contact_management')
 * @param {object} options - Optional configuration
 * @param {boolean} options.skipForFrontendOnly - If true, skip validation for frontend-only products
 * @returns {Function} Koa middleware function
 */
function requireProductAccess(productKey, options = {}) {
    const { skipForFrontendOnly = true } = options;

    return async function productAccessMiddleware(ctx, next) {
        // Skip validation for frontend-only products if configured
        if (skipForFrontendOnly && !requiresBackendAccess(productKey)) {
            console.log(`⏭️  Skipping product access check for frontend-only product: ${productKey}`);
            return await next();
        }

        // Extract organization_slug from request
        // Priority: query params > request body > session
        const orgSlug =
            ctx.query.organization_slug ||
            ctx.request.body?.organization_slug ||
            ctx.session?.organization_slug;

        if (!orgSlug) {
            console.error('❌ Product access middleware: organization_slug is missing');
            ctx.status = 400;
            ctx.body = {
                code: -1,
                msg: 'Missing required parameter: organization_slug',
                error: 'MISSING_ORGANIZATION_SLUG'
            };
            return;
        }

        // Validate product access
        console.log(`🔐 Validating product access: ${orgSlug} -> ${productKey}`);
        const hasAccess = await validateProductAccess(orgSlug, productKey);

        if (!hasAccess) {
            console.warn(`🚫 Product access denied: ${orgSlug} -> ${productKey}`);
            ctx.status = 403;
            ctx.body = {
                code: -1,
                msg: `Access denied: Your organization does not have access to ${productKey}`,
                error: 'PRODUCT_ACCESS_DENIED',
                product: productKey,
                organization: orgSlug
            };
            return;
        }

        // Access validated, proceed to next middleware/controller
        console.log(`✅ Product access granted: ${orgSlug} -> ${productKey}`);
        return await next();
    };
}

/**
 * Middleware: Validates product access for Vercel serverless functions
 * Same as requireProductAccess but adapted for Express-style req/res
 *
 * @param {string} productKey - The product key to validate access for
 * @returns {Function} Express/Vercel middleware function
 */
function requireProductAccessVercel(productKey) {
    return async function productAccessMiddlewareVercel(req, res, next) {
        // Extract organization_slug from request
        const orgSlug =
            req.query.organization_slug ||
            req.body?.organization_slug;

        if (!orgSlug) {
            console.error('❌ Product access middleware: organization_slug is missing');
            return res.status(400).json({
                code: -1,
                msg: 'Missing required parameter: organization_slug',
                error: 'MISSING_ORGANIZATION_SLUG'
            });
        }

        // Validate product access
        console.log(`🔐 Validating product access (Vercel): ${orgSlug} -> ${productKey}`);
        const hasAccess = await validateProductAccess(orgSlug, productKey);

        if (!hasAccess) {
            console.warn(`🚫 Product access denied (Vercel): ${orgSlug} -> ${productKey}`);
            return res.status(403).json({
                code: -1,
                msg: `Access denied: Your organization does not have access to ${productKey}`,
                error: 'PRODUCT_ACCESS_DENIED',
                product: productKey,
                organization: orgSlug
            });
        }

        // Access validated, proceed to next middleware/handler
        console.log(`✅ Product access granted (Vercel): ${orgSlug} -> ${productKey}`);
        if (next) {
            return next();
        }
        // If no next function, this is the last middleware
        return;
    };
}

module.exports = {
    requireProductAccess,
    requireProductAccessVercel
};
