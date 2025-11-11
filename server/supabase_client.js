// Supabase client configuration for backend
// Load environment variables from .env file
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase = null;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('⚠️  Supabase credentials not found in environment variables. Multi-tenant features will not work.');
    console.warn('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
    console.warn('   Server will continue running but organization features will be limited.');
} else {
    console.log('ℹ️  Supabase client configured. URL present:', !!supabaseUrl, 'Service role key present:', !!supabaseServiceRoleKey);
    // Create Supabase client with service role key (bypasses RLS)
    try {
        supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } catch (error) {
        console.error('❌ Failed to create Supabase client:', error.message);
        supabase = null;
    }
}

module.exports = { supabase };

