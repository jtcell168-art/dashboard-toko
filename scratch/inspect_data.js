
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
  console.log('--- INSPECTION START ---');
  
  // 1. Check one of the IMEIs directly
  const imei = '863240088146285';
  console.log(`Searching for IMEI ${imei}...`);
  const { data: imeiRecord, error: imeiError } = await supabase
    .from('imei_records')
    .select('*, products(*)')
    .eq('imei', imei)
    .maybeSingle();
  
  if (imeiError) console.error('IMEI Error:', imeiError);
  if (imeiRecord) {
    console.log('IMEI Record Found:');
    console.log(JSON.stringify(imeiRecord, null, 2));
  } else {
    console.log('IMEI Record NOT FOUND with exact match.');
    
    // Try ilike
    console.log('Trying flexible match for IMEI...');
    const { data: flexibleImei } = await supabase
      .from('imei_records')
      .select('imei')
      .ilike('imei', `%${imei.slice(-8)}%`);
    console.log('Flexible match results:', flexibleImei);
  }

  // 2. List some products
  console.log('\nListing first 10 products:');
  const { data: products } = await supabase
    .from('products')
    .select('name, sku')
    .limit(10);
  console.log(JSON.stringify(products, null, 2));

  console.log('--- INSPECTION END ---');
}

inspectData();
