-- Create integration_configurations table
CREATE TABLE IF NOT EXISTS integration_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_slug TEXT NOT NULL,
    integration_key TEXT NOT NULL, -- e.g., 'bukku', 'whatsapp'
    category TEXT NOT NULL, -- e.g., 'accounting', 'social_media'
    sync_strategy TEXT DEFAULT 'polling', -- 'polling', 'webhook', 'n8n_delegated'
    config JSONB DEFAULT '{}'::jsonb, -- Encrypted credentials
    state JSONB DEFAULT '{}'::jsonb, -- Sync state (cursors, last_sync)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by organization
CREATE INDEX IF NOT EXISTS idx_integration_configs_slug ON integration_configurations(organization_slug);

-- Add unique constraint to prevent duplicate integrations of same type per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_configs_unique_key ON integration_configurations(organization_slug, integration_key);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE integration_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view integrations for their organization
-- Note: This requires specific RLS setup matching your auth system. 
-- For now, assuming service role access from backend.
