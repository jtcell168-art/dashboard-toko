
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listSamsung() {
  console.log('Searching for any product with "SAMSUNG"...');
  const { data, error } = await supabase
    .from('products')
    .select('name, sku, categories(name)')
    .ilike('name', '%SAMSUNG%');
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No products found with "SAMSUNG".');
    return;
  }

  console.log('Products found:');
  data.forEach(p => console.log(`- "${p.name}" (Cat: ${p.categories?.name})`));
}

listSamsung();
