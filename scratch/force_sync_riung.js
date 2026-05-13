
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function forceSyncRiung() {
  console.log('Fetching Riung branch...');
  const { data: branches } = await supabase.from('branches').select('id, name').ilike('name', '%riung%');
  if (!branches || branches.length === 0) {
    console.error('Riung branch not found');
    return;
  }
  const riungId = branches[0].id;
  console.log(`Riung ID: ${riungId}`);

  console.log('Fetching all products...');
  const { data: products } = await supabase.from('products').select('id, name, categories(name)');
  
  console.log(`Syncing ${products.length} products for Riung...`);
  
  const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"];

  for (const p of products) {
    const categoryName = p.categories?.name?.trim().toUpperCase();
    const isImeiTracked = trackedCategories.some(c => categoryName?.includes(c));

    if (isImeiTracked) {
      const { count } = await supabase
        .from('imei_records')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', p.id)
        .eq('branch_id', riungId)
        .eq('status', 'stock');

      console.log(`Syncing ${p.name}: ${count} IMEIs found.`);

      await supabase
        .from('stock')
        .upsert({
          product_id: p.id,
          branch_id: riungId,
          quantity: count || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id,branch_id' });
    }
  }

  console.log('Sync completed for Riung branch.');
}

forceSyncRiung();
