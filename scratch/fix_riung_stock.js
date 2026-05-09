const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStock() {
  console.log('Starting stock fix for Riung...');

  // 1. Get Branches
  const { data: branches } = await supabase.from('branches').select('id, name');
  const riung = branches.find(b => b.name.toLowerCase().includes('riung'));
  const ruteng4 = branches.find(b => b.name.toLowerCase().includes('ruteng 4') || b.name.toLowerCase().includes('ruteng'));

  if (!riung) {
    console.error('Riung branch not found');
    return;
  }
  console.log(`Riung ID: ${riung.id}, Ruteng 4 ID: ${ruteng4 ? ruteng4.id : 'Not found'}`);

  // 2. Get Kartu Perdana Products
  const { data: categories } = await supabase.from('categories').select('id, name').ilike('name', '%perdana%');
  if (!categories || categories.length === 0) {
    console.error('Kartu Perdana category not found');
    return;
  }
  const categoryIds = categories.map(c => c.id);

  const { data: products } = await supabase.from('products').select('id, name').in('category_id', categoryIds);
  console.log(`Found ${products.length} Kartu Perdana products`);

  for (const p of products) {
    // Check stock table for Riung
    const { data: stockRow } = await supabase
      .from('stock')
      .select('quantity')
      .eq('product_id', p.id)
      .eq('branch_id', riung.id)
      .maybeSingle();

    const stockQty = stockRow ? stockRow.quantity : 0;

    // Check IMEI records for Riung
    const { count: imeiCount } = await supabase
      .from('imei_records')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', p.id)
      .eq('branch_id', riung.id)
      .eq('status', 'stock');

    console.log(`Product: ${p.name} | Stock Table: ${stockQty} | IMEI Records: ${imeiCount}`);

    if (stockQty > 0 && imeiCount === 0) {
      console.log(`Fixing ${p.name}... Moving ${stockQty} IMEIs from Ruteng to Riung.`);
      
      // Find IMEIs at Ruteng (or anywhere else if Ruteng 4 not found)
      let query = supabase
        .from('imei_records')
        .select('id, branch_id')
        .eq('product_id', p.id)
        .eq('status', 'stock');
      
      if (ruteng4) {
        query = query.eq('branch_id', ruteng4.id);
      }

      const { data: sourceImeis } = await query.limit(stockQty);

      if (sourceImeis && sourceImeis.length > 0) {
        for (const imei of sourceImeis) {
          const { error } = await supabase
            .from('imei_records')
            .update({ 
              branch_id: riung.id,
              updated_at: new Date().toISOString(),
              last_action: 'Auto-fix Riung Transfer'
            })
            .eq('id', imei.id);
          
          if (error) console.error(`Error updating IMEI ${imei.id}:`, error.message);
        }
        console.log(`Successfully moved ${sourceImeis.length} IMEIs for ${p.name}`);
      } else {
        console.warn(`No IMEIs found at source for ${p.name}`);
      }
    }
  }

  console.log('Stock fix completed.');
}

fixStock();
