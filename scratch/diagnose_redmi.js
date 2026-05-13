
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const targetImeis = ['863240088146285', '863240088495864', '863240088354186'];

async function diagnose() {
  console.log('--- DIAGNOSTICS ---');
  
  const { data: imeiRecords, error: imeiError } = await supabase
    .from('imei_records')
    .select('*, branches(name), products(*, categories(name))')
    .in('imei', targetImeis);

  if (imeiError) {
    console.error('Error fetching IMEIs:', imeiError);
    return;
  }

  console.log('IMEI Status:');
  imeiRecords.forEach(r => {
    console.log(`IMEI: ${r.imei} | Status: ${r.status} | Branch: ${r.branches?.name || 'NULL'} | Product: ${r.products?.name} | Category: ${r.products?.categories?.name}`);
  });

  // Check stock table for these products in Riung
  const productIds = [...new Set(imeiRecords.map(r => r.product_id))];
  const riungBranch = imeiRecords.find(r => r.branches?.name.toLowerCase().includes('riung'))?.branch_id;
  
  if (riungBranch && productIds.length > 0) {
    const { data: stockRecords } = await supabase
      .from('stock')
      .select('*, products(name)')
      .in('product_id', productIds)
      .eq('branch_id', riungBranch);
    
    console.log('\nStock Table for Riung:');
    stockRecords?.forEach(s => {
      console.log(`Product: ${s.products?.name} | Quantity: ${s.quantity}`);
    });
  }

  console.log('--- END DIAGNOSTICS ---');
}

diagnose();
