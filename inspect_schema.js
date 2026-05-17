import { supabase } from './src/lib/supabase';

async function inspectSchema() {
  console.log('--- SCHEMA INSPECTION ---');
  
  // Try to query common tables to see what exists
  const tables = ['profiles', 'businesses', 'services', 'bookings', 'business_stats'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table/View '${table}' error:`, error.message);
    } else {
      console.log(`✅ Table/View '${table}' exists. Columns:`, Object.keys(data[0] || {}).join(', '));
    }
  }
}

inspectSchema();
