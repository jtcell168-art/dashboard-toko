const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      sku,
      retail_price,
      is_online,
      is_featured,
      image_url,
      description,
      categories ( name ),
      stock ( quantity )
    `)
    .eq("is_online", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("PRIMARY ERROR:", error);
  } else {
    console.log("PRIMARY DATA LENGTH:", data.length);
    console.log("FIRST ITEM:", JSON.stringify(data[0], null, 2));
  }
}

check();
