const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLarantuka() {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name');
  
  if (error) {
    console.error(error);
    return;
  }
  console.log('Branches:', JSON.stringify(data, null, 2));

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, branch_id, role')
    .ilike('full_name', '%Larantuka%');
  
  console.log('Larantuka Admins:', JSON.stringify(profile, null, 2));
}

checkLarantuka();
