// Get a real organization ID for testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rituzypqhjawhyrxoddj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrgId() {
  // Get organization from existing strategic map items
  const { data, error } = await supabase
    .from('strategic_map_items')
    .select('organization_id')
    .limit(1)
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Organization ID:', data.organization_id);
  }
}

getOrgId();
