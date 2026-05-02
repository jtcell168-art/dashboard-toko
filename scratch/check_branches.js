const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBranches() {
  const { data, error } = await supabase.from('branches').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Branches in DB:', JSON.stringify(data, null, 2));
}

checkBranches();
