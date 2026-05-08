
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImei() {
  console.log("Searching for product y21D...");
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%y21D%');

  console.log("Products found:", products);

  if (products && products.length > 0) {
    const productIds = products.map(p => p.id);
    console.log(`Searching for IMEIs for product IDs: ${productIds.join(', ')}`);
    const { data: imeis } = await supabase
      .from('imei_records')
      .select('*, branches(name)')
      .in('product_id', productIds);
    
    console.log("IMEIs found:", imeis);
  }

  console.log("Searching for transactions on May 7th...");
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .gte('created_at', '2026-05-07T00:00:00')
    .lte('created_at', '2026-05-07T23:59:59');

  console.log("Transactions on May 7th:", transactions);
}

checkImei();
