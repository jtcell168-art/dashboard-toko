
const { createClient } = require('@supabase/supabase-js');

// Hardcoded to bypass .env issues
const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinal() {
  const invoices = ['TRX-1778674962040-876', 'TRX-1778656400494-702'];
  console.log('--- CHECKING TRANSACTIONS (HARDCODED) ---');

  for (const inv of invoices) {
    console.log(`\nSearching Invoice: ${inv}`);
    const { data: trx, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(*, categories(name)))')
      .eq('invoice_no', inv)
      .maybeSingle();
    
    if (error) {
      console.error('Error:', error.message);
      continue;
    }

    if (!trx) {
      console.log('Transaction NOT FOUND in this database.');
      continue;
    }

    console.log(`FOUND! Customer: ${trx.customer_name} | Total: ${trx.total}`);
    trx.transaction_items?.forEach(item => {
      const p = item.products;
      console.log(`- Product: "${p?.name}" (ID: ${p?.id})`);
      console.log(`- Category: "${p?.categories?.name}"`);
      console.log(`- Qty Sold: ${item.quantity}`);
      
      // Let's also check the current stock for this product at this branch
      if (trx.branch_id) {
        checkStock(p.id, trx.branch_id, p.name);
      }
    });
  }
}

async function checkStock(productId, branchId, productName) {
  const { data: stock } = await supabase
    .from('stock')
    .select('quantity')
    .eq('product_id', productId)
    .eq('branch_id', branchId)
    .maybeSingle();
  
  console.log(`- Current Stock for "${productName}" at this branch: ${stock?.quantity || 0}`);
}

checkFinal();
