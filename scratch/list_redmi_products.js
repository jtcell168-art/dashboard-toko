
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findActualProductNames() {
  console.log('Listing all products matching "REDMI"...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku')
    .ilike('name', '%REDMI%');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No products found with "REDMI" in their name.');
    return;
  }

  console.log('Products found:');
  products.forEach(p => {
    console.log(`- NAME: "${p.name}" | SKU: "${p.sku}" | ID: ${p.id}`);
  });
}

findActualProductNames();
