
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const RIUNG_ID = '96edb004-dc23-4da2-8277-22b650537449';
const RUTENG_ID = '7afb8b4e-e506-44c6-8a96-0a51a134812f';

async function fixByProductName() {
  console.log('Searching for products by name...');
  
  const productNames = [
    'REDMI A7 PRO 4+128 GB PLAM GREEN PLAM GREEN',
    'REDMI A7 PRO 4+128 GB MIST BLACK',
    'REDMI A7 PRO 4+128 GB SUNSET ORANGE SUNSET ORANGE',
    'REDMI A7 PRO 4+128 GB BLACK'
  ];

  for (const name of productNames) {
    console.log(`\nChecking product: ${name}`);
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${name}%`);
    
    if (!products || products.length === 0) {
      console.log('Product not found.');
      continue;
    }

    for (const p of products) {
      console.log(`Product ID: ${p.id}. Finding IMEIs in Ruteng...`);
      
      const { data: imeis } = await supabase
        .from('imei_records')
        .select('id, imei')
        .eq('product_id', p.id)
        .eq('branch_id', RUTENG_ID)
        .eq('status', 'stock');
      
      if (!imeis || imeis.length === 0) {
        console.log('No stock IMEIs found for this product in Ruteng.');
        continue;
      }

      console.log(`Found ${imeis.length} IMEIs. Moving to Riung...`);
      for (const imei of imeis) {
        const { error } = await supabase
          .from('imei_records')
          .update({
            branch_id: RIUNG_ID,
            updated_at: new Date().toISOString(),
            last_action: 'Manual Repair Move (By Product Name)'
          })
          .eq('id', imei.id);
        
        if (error) console.error(`Error moving ${imei.imei}:`, error.message);
        else console.log(`Moved IMEI: ${imei.imei}`);
      }

      // Sync stock for both branches
      for (const bId of [RIUNG_ID, RUTENG_ID]) {
        const { count } = await supabase
          .from('imei_records')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', p.id)
          .eq('branch_id', bId)
          .eq('status', 'stock');

        await supabase
          .from('stock')
          .upsert({
            product_id: p.id,
            branch_id: bId,
            quantity: count || 0,
            updated_at: new Date().toISOString()
          }, { onConflict: 'product_id,branch_id' });
        
        console.log(`Synced stock for branch ${bId}: ${count} items.`);
      }
    }
  }

  console.log('\nProcess finished.');
}

fixByProductName();
