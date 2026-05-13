
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listBranches() {
  const { data, error } = await supabase.from('branches').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Branches in database:');
  console.log(JSON.stringify(data, null, 2));
}

listBranches();
