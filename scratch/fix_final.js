
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials to bypass .env issues
const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

const RIUNG_ID = '96edb004-dc23-4da2-8277-22b650537449';
const RUTENG_ID = '7afb8b4e-e506-44c6-8a96-0a51a134812f';

async function fixFinal() {
  console.log('--- STARTING FINAL REPAIR ---');
  
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
      .select('id, name')
      .ilike('name', `%${name.split(' ')[0]}%${name.split(' ').slice(-2).join('%')}%`); // Flexible match
    
    if (!products || products.length === 0) {
      console.log('Product not found with flexible search.');
      continue;
    }

    for (const p of products) {
      console.log(`Matched: "${p.name}" (ID: ${p.id}). Finding IMEIs in Ruteng...`);
      
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
            last_action: 'Manual Repair Final'
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

  console.log('\n--- FINAL REPAIR COMPLETED ---');
}

fixFinal();
