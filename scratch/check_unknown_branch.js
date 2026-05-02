
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  const { data: trxs, error } = await supabase
    .from('transactions')
    .select('id, invoice_no, branch_id, branches(name)')
    .is('branch_id', null);

  console.log('Transactions with NULL branch_id:', trxs?.length);
  if (trxs && trxs.length > 0) {
    console.log('Samples:', trxs.slice(0, 5));
  }

  const { data: trxsWithBranch, error: err2 } = await supabase
    .from('transactions')
    .select('id, invoice_no, branch_id, branches(name)');

  const unknown = trxsWithBranch?.filter(t => t.branch_id && !t.branches);
  console.log('Transactions with invalid branch_id (no match in branches table):', unknown?.length);
  if (unknown && unknown.length > 0) {
    console.log('Invalid Branch IDs:', [...new Set(unknown.map(t => t.branch_id))]);
  }

  const { data: branches } = await supabase.from('branches').select('id, name');
  console.log('Available Branches:', branches);
}

checkTransactions();
