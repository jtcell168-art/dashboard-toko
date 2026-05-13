
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const targetImeis = ['863240088146285', '863240088495864', '863240088354186'];

// IDs found from your screenshot
const RIUNG_ID = '96edb004-dc23-4da2-8277-22b650537449';
const RUTENG_ID = '7afb8b4e-e506-44c6-8a96-0a51a134812f';

async function fixSpecificImeis() {
  console.log('Using IDs from screenshot...');
  console.log(`Riung ID: ${RIUNG_ID}`);
  console.log(`Ruteng ID: ${RUTENG_ID}`);

  for (const imei of targetImeis) {
    console.log(`\nProcessing IMEI: ${imei}`);
    
    // 1. Update the IMEI record
    const { data: updatedImei, error: updateError } = await supabase
      .from('imei_records')
      .update({
        branch_id: RIUNG_ID,
        status: 'stock',
        updated_at: new Date().toISOString(),
        last_action: 'Manual Repair Move'
      })
      .eq('imei', imei)
      .select('product_id')
      .maybeSingle();

    if (updateError) {
      console.error(`Error updating IMEI ${imei}:`, updateError.message);
      continue;
    }

    if (!updatedImei) {
      console.warn(`IMEI ${imei} not found in database.`);
      continue;
    }

    console.log(`Successfully moved IMEI ${imei} to Riung.`);

    // 2. Sync stock for this product in BOTH branches
    const productId = updatedImei.product_id;
    const branchesToSync = [RIUNG_ID, RUTENG_ID];

    for (const bId of branchesToSync) {
      const { count } = await supabase
        .from('imei_records')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('branch_id', bId)
        .eq('status', 'stock');

      await supabase
        .from('stock')
        .upsert({
          product_id: productId,
          branch_id: bId,
          quantity: count || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id,branch_id' });
      
      console.log(`Synced Product stock at Branch ${bId}: ${count} items.`);
    }
  }

  console.log('\nManual repair completed.');
}

fixSpecificImeis();
