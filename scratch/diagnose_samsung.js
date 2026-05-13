
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSamsung() {
  console.log('--- DIAGNOSING SAMSUNG LIPAT ---');
  
  // 1. Find the product
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('*, categories(name)')
    .ilike('name', '%SAMSUNG%LIPAT%');
  
  if (pError) {
    console.error('Error fetching product:', pError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('Product "SAMSUNG LIPAT" not found in database.');
    return;
  }

  for (const p of products) {
    console.log(`\nProduct: "${p.name}" (ID: ${p.id})`);
    console.log(`Category: "${p.categories?.name}"`);
    
    // 2. Check current stock records
    const { data: stock } = await supabase
      .from('stock')
      .select('*, branches(name)')
      .eq('product_id', p.id);
    
    console.log('Current Stock Table Records:');
    stock?.forEach(s => console.log(`- Branch: ${s.branches?.name} | Qty: ${s.quantity}`));

    // 3. Check IMEI records for this product
    const { data: imeis } = await supabase
      .from('imei_records')
      .select('imei, status, branch_id, branches(name)')
      .eq('product_id', p.id);
    
    console.log(`\nIMEI Records found: ${imeis?.length || 0}`);
    const stockImeis = imeis?.filter(i => i.status === 'stock');
    const soldImeis = imeis?.filter(i => i.status === 'sold');
    
    console.log(`- Status 'stock': ${stockImeis?.length || 0}`);
    console.log(`- Status 'sold': ${soldImeis?.length || 0}`);
    
    if (stockImeis && stockImeis.length > 0) {
      console.log('\nTop 5 Stock IMEIs:');
      stockImeis.slice(0, 5).forEach(i => console.log(`- ${i.imei} (Branch: ${i.branches?.name})`));
    }
  }
}

diagnoseSamsung();
