
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking stock for Redmi A7 Pro in Ruteng...");
  
  // 1. Find product
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', '%REDMI A7 PRO%SUNSET ORANGE%')
    .limit(1)
    .single();

  if (!product) {
    console.log("Product not found");
    return;
  }
  console.log(`Found product: ${product.name} (${product.id})`);

  // 2. Check stock table
  const { data: branches } = await supabase.from('branches').select('id, name');
  const ruteng = branches.find(b => b.name.includes('Ruteng'));
  
  if (!ruteng) {
    console.log("Ruteng branch not found");
    return;
  }

  const { data: stock } = await supabase
    .from('stock')
    .select('*')
    .eq('product_id', product.id)
    .eq('branch_id', ruteng.id)
    .maybeSingle();

  console.log("Stock table entry for Ruteng:", stock);

  // 3. Check IMEI records
  const { data: imeis } = await supabase
    .from('imei_records')
    .select('*')
    .eq('product_id', product.id)
    .eq('branch_id', ruteng.id);

  console.log(`IMEI records in Ruteng (${imeis.length}):`);
  imeis.forEach(i => console.log(`- ${i.imei} (status: ${i.status})`));

  // 4. Check active transfers
  const { data: transfers } = await supabase
    .from('stock_transfers')
    .select('*, from_branch:branches!from_branch_id(name), to_branch:branches!to_branch_id(name)')
    .eq('product_id', product.id)
    .eq('status', 'in_transit');

  console.log(`Active transfers for this product (${transfers.length}):`);
  transfers.forEach(t => console.log(`- From ${t.from_branch.name} to ${t.to_branch.name}, qty: ${t.quantity}`));
}

check();
