
import { createClient } from "./src/lib/supabase/client";

async function debug() {
  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("id, name").ilike("name", "%Telkomsel%");
  console.log("Products found:", products);
  
  if (products && products.length > 0) {
    const productId = products[0].id;
    const { data: stock } = await supabase.from("stock").select("*").eq("product_id", productId);
    console.log("Stock for product:", stock);
    
    const { data: branches } = await supabase.from("branches").select("id, name");
    console.log("Branches:", branches);
  }
}
// This is just a scratch script.
