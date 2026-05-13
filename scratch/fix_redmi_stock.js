
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRedmi() {
  const productName = 'REDMI A7 PRO 4+128 GB MIST BLUE MIST BLUE';
  console.log(`--- ANALYZING: ${productName} ---`);

  // 1. Get Product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('name', productName)
    .maybeSingle();
  
  if (!product) {
    console.log('Product not found.');
    return;
  }
  console.log(`Product ID: ${product.id}`);

  // 2. Get Stock in Riung (96edb004-dc23-4da2-8277-22b668abf97e)
  const riungId = '96edb004-dc23-4da2-8277-22b668abf97e';
  const { data: stock } = await supabase
    .from('stock')
    .select('*')
    .eq('product_id', product.id)
    .eq('branch_id', riungId)
    .maybeSingle();
  
  console.log(`Current Stock in Riung Table: ${stock?.quantity || 0}`);

  // 3. Get IMEIs in Riung
  const { data: imeis } = await supabase
    .from('imei_records')
    .select('imei, status')
    .eq('product_id', product.id)
    .eq('branch_id', riungId);
  
  console.log(`IMEIs in Riung:`);
  imeis?.forEach(i => console.log(`- ${i.imei} | Status: ${i.status}`));

  // 4. Check last transaction items
  const { data: lastItems } = await supabase
    .from('transaction_items')
    .select('*, transactions(*)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log(`\nLast Transactions for this product:`);
  lastItems?.forEach(item => {
    console.log(`- Date: ${item.transactions?.created_at} | Qty: ${item.quantity} | Branch: ${item.transactions?.branch_id}`);
  });
}

fixRedmi();
