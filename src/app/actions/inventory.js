"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

// GET INVENTORY
export async function getInventory(branchId = "all") {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    
    let query = supabase
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

    // If not owner/manager and has a specific branch, we could filter products?
    // But usually we want to see all products, but filter the STOCK shown.
    // However, if we want to filter the product list to only what's available at the branch:
    // if (branchId !== "all" && user.role !== 'owner' && user.role !== 'manager') {
    //   query = query.eq('stock.branch_id', branchId);
    // }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching inventory:", error);
      return [];
    }
    
    // Flatten categories and filter stock for the frontend
    return data.map(p => {
      let filteredStock = p.stock || [];
      
      // If user is not owner/manager, only show their branch stock
      if (branchId !== "all" && user?.role !== "owner" && user?.role !== "manager") {
        filteredStock = filteredStock.filter(s => s.branch_id === branchId);
      }

      return {
        ...p,
        category: p.categories?.name || "Uncategorized",
        stock: filteredStock
      };
    });
  } catch (err) {
    console.error("Critical error in getInventory:", err);
    return [];
  }
}

// ADD PRODUCT
export async function addProduct(productData, initialStockMap, imeiList = []) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    // Get category_id from name
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("name", productData.category)
      .maybeSingle();

    const insertData = {
      name: productData.name,
      sku: productData.sku,
      category_id: catData?.id,
      retail_price: productData.retailPrice,
      purchase_price: productData.purchasePrice
    };

    const { data: product, error: prodError } = await supabase
      .from("products")
      .insert(insertData)
      .select()
      .single();

    if (prodError) return { success: false, error: `Gagal menyimpan produk: ${prodError.message}` };

    // Insert initial stock
    if (initialStockMap) {
      const stockInserts = Object.keys(initialStockMap)
        .filter(branchId => initialStockMap[branchId] > 0)
        .map((branchId) => ({
          product_id: product.id,
          branch_id: branchId,
          quantity: initialStockMap[branchId]
        }));
        
      if (stockInserts.length > 0) {
        const { error: stockError } = await supabase.from("stock").insert(stockInserts);
        if (stockError) console.error("Stock insert error:", stockError);
      }
    }

    // Insert IMEIs
    if (productData.category === "HP" && imeiList.length > 0) {
      const imeiInserts = imeiList.map(item => ({
        product_id: product.id,
        branch_id: item.branchId,
        imei: item.imei,
        status: 'stock'
      }));
      const { error: imeiError } = await supabase.from("imei_records").insert(imeiInserts);
      if (imeiError) console.error("IMEI insert error:", imeiError);
    }

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProduct(productId, productData) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    // Get category_id from name
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("name", productData.category)
      .maybeSingle();

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

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
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
