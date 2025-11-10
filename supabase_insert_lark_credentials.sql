-- Insert Lark Credentials for Your Organizations
-- Run this in Supabase SQL Editor after replacing the placeholders

-- IMPORTANT: About noncestr
-- ==========================
-- noncestr is NOT provided by Lark - it's a random string YOU generate yourself.
-- It's used in JSAPI signature calculation for security.
-- 
-- Requirements:
-- - 32 characters long (recommended)
-- - Random alphanumeric string
-- - Keep it consistent per organization (don't change it frequently)
-- - Can use: A-Z, a-z, 0-9 (avoid confusing characters like 0/O, 1/l/I)
--
-- Example: "TRnJnK2X7MtMiMDHwwdR38hnebbdeMAE"
--
-- This script will AUTO-GENERATE a random noncestr for each organization.
-- You can also manually replace it with your own if you prefer.

-- First, make sure you have organizations created. If not, create them:
-- INSERT INTO organizations (slug, name, description, is_active)
-- VALUES 
--   ('org-001', 'Organization 1', 'First test organization', true),
--   ('org-002', 'Organization 2', 'Second test organization', true)
-- ON CONFLICT (slug) DO NOTHING;

-- Helper function to generate random noncestr (32 characters)
CREATE OR REPLACE FUNCTION generate_noncestr()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Get the Lark provider ID (should be created by migration)
DO $$
DECLARE
  lark_provider_id UUID;
  org1_id UUID;
  org2_id UUID;
  noncestr1 TEXT;
  noncestr2 TEXT;
BEGIN
  -- Get Lark provider ID
  SELECT id INTO lark_provider_id FROM auth_providers WHERE key = 'lark';
  
  IF lark_provider_id IS NULL THEN
    RAISE EXCEPTION 'Lark auth provider not found. Run migration first.';
  END IF;
  
  -- Get organization IDs (replace 'org-001' and 'org-002' with your actual slugs)
  SELECT id INTO org1_id FROM organizations WHERE slug = 'org-001';
  SELECT id INTO org2_id FROM organizations WHERE slug = 'org-002';
  
  -- Generate random noncestr for each organization
  noncestr1 := generate_noncestr();
  noncestr2 := generate_noncestr();
  
  -- Insert Organization 1 Lark Credentials
  -- REPLACE THESE VALUES WITH YOUR ACTUAL LARK APP 1 CREDENTIALS:
  IF org1_id IS NOT NULL THEN
    INSERT INTO organization_auth_providers (
      organization_id,
      provider_id,
      client_id,           -- Lark App ID (from Lark Developer Console)
      client_secret,       -- Lark App Secret (from Lark Developer Console)
      credentials,         -- JSONB with auto-generated noncestr
      status,
      external_workspace_id
    ) VALUES (
      org1_id,
      lark_provider_id,
      'cli_xxxxx',                    -- REPLACE: Your Org 1 Lark App ID
      'your-app-secret-1',            -- REPLACE: Your Org 1 Lark App Secret
      jsonb_build_object('noncestr', noncestr1),  -- Auto-generated random noncestr
      'active',
      NULL  -- Optional: Lark tenant ID if you have it
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Organization 1 noncestr generated: %', noncestr1;
  END IF;
  
  -- Insert Organization 2 Lark Credentials
  -- REPLACE THESE VALUES WITH YOUR ACTUAL LARK APP 2 CREDENTIALS:
  IF org2_id IS NOT NULL THEN
    INSERT INTO organization_auth_providers (
      organization_id,
      provider_id,
      client_id,           -- Lark App ID (from Lark Developer Console)
      client_secret,       -- Lark App Secret (from Lark Developer Console)
      credentials,         -- JSONB with auto-generated noncestr
      status,
      external_workspace_id
    ) VALUES (
      org2_id,
      lark_provider_id,
      'cli_yyyyy',                    -- REPLACE: Your Org 2 Lark App ID
      'your-app-secret-2',            -- REPLACE: Your Org 2 Lark App Secret
      jsonb_build_object('noncestr', noncestr2),  -- Auto-generated random noncestr
      'active',
      NULL  -- Optional: Lark tenant ID if you have it
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Organization 2 noncestr generated: %', noncestr2;
  END IF;
END $$;

-- Verify the data was inserted:
SELECT 
  o.slug as org_slug,
  o.name as org_name,
  oap.client_id as lark_app_id,
  oap.status,
  oap.credentials->>'noncestr' as noncestr
FROM organization_auth_providers oap
JOIN organizations o ON oap.organization_id = o.id
JOIN auth_providers ap ON oap.provider_id = ap.id
WHERE ap.key = 'lark';

