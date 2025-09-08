/**
 * Script to add missing image settings columns to the events table
 * Run this when you have access to the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eurpvqyfcnllittzloev.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need the service role key

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Get it from: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addImageColumns() {
  console.log('🔄 Adding image settings columns to events table...');
  
  try {
    // Add the columns using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS image_scale INTEGER DEFAULT 100,
        ADD COLUMN IF NOT EXISTS image_position_x INTEGER DEFAULT 50,
        ADD COLUMN IF NOT EXISTS image_position_y INTEGER DEFAULT 50,
        ADD COLUMN IF NOT EXISTS image_fit TEXT DEFAULT 'contain' CHECK (image_fit IN ('contain', 'cover'));
      `
    });
    
    if (error) {
      console.error('❌ Error adding columns:', error);
      return false;
    }
    
    console.log('✅ Successfully added image settings columns!');
    
    // Verify the columns were added
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'events')
      .in('column_name', ['image_scale', 'image_position_x', 'image_position_y', 'image_fit']);
    
    if (verifyError) {
      console.error('❌ Error verifying columns:', verifyError);
      return false;
    }
    
    console.log('📋 Added columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Alternative method using direct SQL execution
async function addImageColumnsDirect() {
  console.log('🔄 Adding image settings columns using direct SQL...');
  
  const sql = `
    ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS image_scale INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS image_position_x INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS image_position_y INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS image_fit TEXT DEFAULT 'contain' CHECK (image_fit IN ('contain', 'cover'));
  `;
  
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Cannot access events table:', error);
      return false;
    }
    
    console.log('✅ Events table is accessible');
    console.log('📝 Run this SQL in your Supabase SQL editor:');
    console.log('');
    console.log(sql);
    console.log('');
    console.log('Or use the Supabase CLI:');
    console.log('supabase db reset --linked');
    
    return true;
    
  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Image Settings Column Migration Script');
  console.log('==========================================');
  
  // Try the direct method first (more reliable)
  const success = await addImageColumnsDirect();
  
  if (success) {
    console.log('');
    console.log('🎉 Next steps:');
    console.log('1. Run the SQL command shown above in your Supabase SQL editor');
    console.log('2. Or run: supabase db reset --linked');
    console.log('3. Test the event edit form - image settings should now save properly');
  }
}

main().catch(console.error);
