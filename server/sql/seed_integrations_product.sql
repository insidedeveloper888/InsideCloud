-- 1. Insert the 'integrations' product
INSERT INTO products (key, name, description, category, icon, status, metadata, is_active)
VALUES (
    'integrations',
    'Integrations',
    'Connect your favorite tools to streamline your workflow.',
    'productivity',
    'Puzzle', -- Lucide icon name
    'active',
    '{}'::jsonb,
    true
)
ON CONFLICT (key) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active;

-- 2. Grant access to the 'insidedeveloper888' organization
-- We use a DO block or a subquery insert to handle the foreign keys dynamically
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT 
    o.id,
    p.id,
    true
FROM 
    organizations o,
    products p
WHERE 
    o.slug = 'insidedeveloper888' AND 
    p.key = 'integrations'
ON CONFLICT (organization_id, product_id) DO UPDATE 
SET is_enabled = true;
