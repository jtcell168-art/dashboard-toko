const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('--- DIAGNOSING PRODUCT UPDATE ERROR ---');
  
  // 1. Find the product "Samsung A07 4+64 GB" or by SKU "SAMSUNG A07 4+64 GB BLACK"
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('sku', 'SAMSUNG A07 4+64 GB BLACK');

  if (pError) {
    console.error('Error fetching product:', pError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('Product not found by SKU, searching by name...');
    const { data: prodByName, error: p2Error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .ilike('name', '%Samsung%A07%');
    
    if (p2Error) {
      console.error('Error searching by name:', p2Error);
      return;
    }
    console.log('Products found by name:', prodByName);
    if (prodByName && prodByName.length > 0) {
      await testUpdate(prodByName[0]);
    }
  } else {
    console.log('Product found:', products[0]);
    await testUpdate(products[0]);
  }
}

async function testUpdate(product) {
  console.log('\n--- TESTING UPDATE FOR PRODUCT:', product.name, '(ID:', product.id, ') ---');
  
  // Try to update with the exact values from screenshot
  const updatePayload = {
    name: "Samsung A07 4+64 GB",
    sku: "SAMSUNG A07 4+64 GB BLACK",
    category_id: product.category_id,
    retail_price: 1799000,
    purchase_price: 1487000,
    is_online: true,
    is_featured: false,
    image_url: "https://http2.mlstatic.com/D_NQ_NP_955073-MLA99453299204_112025-O.w",
    description: "https://rakistan.pk/wp-content/uploads/2025/10/61PVZnxS8gL.jpg"
  };

  console.log('Update Payload:', updatePayload);

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', product.id)
    .select();

  if (error) {
    console.error('\n>>> UPDATE ERROR:', error);
  } else {
    console.log('\n>>> UPDATE SUCCESS!', data);
  }
}

diagnose();
