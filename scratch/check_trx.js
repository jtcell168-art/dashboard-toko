const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('invoice_no, total, status, branch_id, created_at')
    .limit(10);
  
  if (error) {
    console.error(error);
    return;
  }
  console.log('Sample transactions:', JSON.stringify(data, null, 2));
}

checkTransactions();
