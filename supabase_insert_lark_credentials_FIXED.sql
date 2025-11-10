-- Insert Lark Credentials for Your Organizations
-- Fixed version that works with your existing setup

-- Your existing organization: slug = 'testing'
-- Lark provider exists ✅

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

-- Option 1: Insert credentials for your existing 'testing' organization
-- This will add credentials for Organization 1 (using your existing 'testing' org)
DO $$
DECLARE
  lark_provider_id UUID;
  testing_org_id UUID;
  noncestr1 TEXT;
BEGIN
  -- Get Lark provider ID
  SELECT id INTO lark_provider_id FROM auth_providers WHERE key = 'lark';
  
  IF lark_provider_id IS NULL THEN
    RAISE EXCEPTION 'Lark auth provider not found. Run migration first.';
  END IF;
  
  -- Get your existing 'testing' organization
  SELECT id INTO testing_org_id FROM organizations WHERE slug = 'testing';
  
  IF testing_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization with slug ''testing'' not found.';
  END IF;
  
  -- Generate random noncestr
  noncestr1 := generate_noncestr();
  
  -- Insert Organization 1 Lark Credentials (using 'testing' org)
  -- Note: external_workspace_id is REQUIRED (NOT NULL constraint)
  INSERT INTO organization_auth_providers (
    organization_id,
    provider_id,
    external_workspace_id,  -- REQUIRED: Using org slug as identifier
    client_id,
    client_secret,
    credentials,
    status
  ) VALUES (
    testing_org_id,
    lark_provider_id,
    'testing',  -- Using org slug as external_workspace_id (required field)
    'cli_a7c6350f9778d010',                    -- Your Org 1 Lark App ID
    'cMfrfWMK5vppT6zh89zzohz5jby8GiRc',        -- Your Org 1 Lark App Secret
    jsonb_build_object('noncestr', noncestr1),
    'active'
  )
  ON CONFLICT (organization_id, provider_id) DO UPDATE SET
    external_workspace_id = EXCLUDED.external_workspace_id,
    client_id = EXCLUDED.client_id,
    client_secret = EXCLUDED.client_secret,
    credentials = EXCLUDED.credentials,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Organization 1 (testing) credentials inserted!';
  RAISE NOTICE '   Noncestr: %', noncestr1;
END $$;

-- Option 2: Create a second organization for Organization 2
-- Uncomment this if you want to create a second organization
/*
INSERT INTO organizations (slug, name, description, is_active)
VALUES 
  ('org-002', 'Organization 2', 'Second test organization', true)
ON CONFLICT (slug) DO NOTHING;
*/

-- Option 3: Insert credentials for Organization 2 (if you created org-002 above)
-- Uncomment this if you created the second organization
/*
DO $$
DECLARE
  lark_provider_id UUID;
  org2_id UUID;
  noncestr2 TEXT;
BEGIN
  SELECT id INTO lark_provider_id FROM auth_providers WHERE key = 'lark';
  SELECT id INTO org2_id FROM organizations WHERE slug = 'org-002';
  
  IF org2_id IS NOT NULL THEN
    noncestr2 := generate_noncestr();
    
    INSERT INTO organization_auth_providers (
      organization_id,
      provider_id,
      external_workspace_id,  -- REQUIRED: Using org slug as identifier
      client_id,
      client_secret,
      credentials,
      status
    ) VALUES (
      org2_id,
      lark_provider_id,
      'org-002',  -- Using org slug as external_workspace_id (required field)
      'cli_a8ece83e7eb89010',                    -- Your Org 2 Lark App ID
      '91m6FfRPT41L8t7eJPQyCXXpzR01wXiR',        -- Your Org 2 Lark App Secret
      jsonb_build_object('noncestr', noncestr2),
      'active'
    )
    ON CONFLICT (organization_id, provider_id) DO UPDATE SET
      external_workspace_id = EXCLUDED.external_workspace_id,
      client_id = EXCLUDED.client_id,
      client_secret = EXCLUDED.client_secret,
      credentials = EXCLUDED.credentials,
      status = EXCLUDED.status,
      updated_at = NOW();
    
    RAISE NOTICE '✅ Organization 2 credentials inserted!';
    RAISE NOTICE '   Noncestr: %', noncestr2;
  END IF;
END $$;
*/

-- Verify the data was inserted:
SELECT 
  o.slug as org_slug,
  o.name as org_name,
  oap.client_id as lark_app_id,
  oap.status,
  oap.credentials->>'noncestr' as noncestr,
  oap.created_at
FROM organization_auth_providers oap
JOIN organizations o ON oap.organization_id = o.id
JOIN auth_providers ap ON oap.provider_id = ap.id
WHERE ap.key = 'lark'
ORDER BY oap.created_at DESC;

