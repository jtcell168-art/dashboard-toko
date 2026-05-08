const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
  // Search for the product by name or SKU from the screenshot
  const { data: product, error } = await supabase
    .from('products')
    .select('*, categories(name), imei_records(*)')
    .ilike('name', '%SUNSET ORANGE%')
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return;
  }

  console.log('Product Details:', {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.categories?.name,
    imeiCount: product.imei_records?.length
  });

  if (product.imei_records) {
    const stockImeis = product.imei_records.filter(i => i.status === 'stock');
    console.log('Stock IMEIs per Branch:');
    const counts = {};
    stockImeis.forEach(i => {
      counts[i.branch_id] = (counts[i.branch_id] || 0) + 1;
    });
    console.log(counts);
  }

  // Check branch IDs
  const { data: branches } = await supabase.from('branches').select('id, name');
  console.log('Branches:', branches);
}

checkProduct();
