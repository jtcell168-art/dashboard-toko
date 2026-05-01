"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

// GET INVENTORY
export async function getInventory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories ( name ),
      stock (
        id,
        branch_id,
        quantity,
        branches ( name )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
  
  // Flatten categories for the frontend
  return data.map(p => ({
    ...p,
    category: p.categories?.name
  }));
}

// ADD PRODUCT
export async function addProduct(productData, initialStockMap, imeiList = []) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized");
  }

  // Get category_id from name
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", productData.category)
    .single();

  if (catError) {
    console.error("Category error:", catError);
    // If category not found, we still proceed but with null category or throw error?
    // Let's throw error to be safe as it's a required selection in UI
    throw new Error(`Kategori '${productData.category}' tidak ditemukan di database.`);
  }

  const { data: product, error: prodError } = await supabase
    .from("products")
    .insert({
      name: productData.name,
      sku: productData.sku,
      category_id: catData?.id,
      retail_price: productData.retailPrice,
      purchase_price: productData.purchasePrice
    })
    .select()
    .single();

  if (prodError) throw new Error(`Gagal menyimpan produk: ${prodError.message}`);

  // Insert initial stock
  if (!productData.isService && !productData.isDigital && initialStockMap) {
    const stockInserts = Object.keys(initialStockMap)
      .filter(branchId => initialStockMap[branchId] > 0) // Only insert if stock > 0 to avoid clutter
      .map((branchId) => ({
        product_id: product.id,
        branch_id: branchId,
        quantity: initialStockMap[branchId]
      }));
      
    if (stockInserts.length > 0) {
      const { error: stockError } = await supabase.from("stock").insert(stockInserts);
      if (stockError) throw new Error(`Gagal menyimpan stok: ${stockError.message}`);
    }
  }

  // Insert IMEIs if category is HP
  if (productData.category === "HP" && imeiList.length > 0) {
    const imeiInserts = imeiList.map(item => ({
      product_id: product.id,
      branch_id: item.branchId,
      imei: item.imei,
      status: 'stock'
    }));
    const { error: imeiError } = await supabase.from("imei_records").insert(imeiInserts);
    if (imeiError) throw new Error(`Gagal menyimpan data IMEI: ${imeiError.message}`);
  }

  return product;
}

// UPDATE PRODUCT
export async function updateProduct(productId, productData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized");
  }

  // Get category_id from name
  const { data: catData } = await supabase
    .from("categories")
    .select("id")
    .eq("name", productData.category)
    .single();

  const { error } = await supabase
    .from("products")
    .update({
      name: productData.name,
      sku: productData.sku,
      category_id: catData?.id,
      retail_price: productData.retailPrice,
      purchase_price: productData.purchasePrice,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  return true;
}

// DELETE PRODUCT
export async function deleteProduct(productId) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized. Hanya Owner atau Manager yang bisa menghapus data.");
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  return true;
}

// UPDATE PRODUCT PRICE WITH HISTORY
export async function updateProductPrice(productId, newBuyPrice, newSellPrice, reason) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized. Hanya Owner atau Manager yang bisa mengubah harga.");
  }

  // 1. Get current price
  const { data: product, error: getError } = await supabase
    .from("products")
    .select("purchase_price, retail_price")
    .eq("id", productId)
    .single();
    
  if (getError) throw new Error(getError.message);

  // 2. Update product price
  const { error: updateError } = await supabase
    .from("products")
    .update({
      purchase_price: newBuyPrice,
      retail_price: newSellPrice,
      updated_at: new Date().toISOString()
    })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);

  // 3. Record history
  const { error: historyError } = await supabase
    .from("price_history")
    .insert({
      product_id: productId,
      user_id: user.id,
      old_buy_price: product.purchase_price,
      new_buy_price: newBuyPrice,
      old_sell_price: product.retail_price,
      new_sell_price: newSellPrice,
      reason: reason
    });

  if (historyError) console.error("Failed to record price history:", historyError);

  return true;
}

// GET PRICE HISTORY
export async function getPriceHistory(productId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_history")
    .select(`
      *,
      profiles ( full_name )
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching price history:", error);
    return [];
  }
  return data;
}
