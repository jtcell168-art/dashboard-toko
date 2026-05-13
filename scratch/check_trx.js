
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrx() {
  const invoices = ['TRX-1778674962040-876', 'TRX-1778656400494-702'];
  console.log('--- CHECKING TRANSACTIONS ---');

  for (const inv of invoices) {
    console.log(`\nInvoice: ${inv}`);
    const { data: trx, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(*, categories(name)))')
      .eq('invoice_no', inv)
      .maybeSingle();
    
    if (error) {
      console.error('Error:', error);
      continue;
    }

    if (!trx) {
      console.log('Transaction not found.');
      continue;
    }

    console.log(`Customer: ${trx.customer_name}`);
    trx.transaction_items?.forEach(item => {
      const p = item.products;
      console.log(`- Product: "${p?.name}" (ID: ${p?.id})`);
      console.log(`- Category: "${p?.categories?.name}"`);
      console.log(`- Qty Sold: ${item.quantity}`);
    });
  }
}

checkTrx();
