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
  return data;
}

// ADD PRODUCT
export async function addProduct(productData, initialStockMap) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized");
  }

  const { data: product, error: prodError } = await supabase
    .from("products")
    .insert({
      name: productData.name,
      sku: productData.sku,
      category: productData.category,
      retail_price: productData.retailPrice,
      purchase_price: productData.purchasePrice,
      is_service: productData.isService,
      is_digital: productData.isDigital
    })
    .select()
    .single();

  if (prodError) throw new Error(prodError.message);

  // Insert initial stock
  if (!productData.isService && !productData.isDigital && initialStockMap) {
    const stockInserts = Object.keys(initialStockMap).map((branchId) => ({
      product_id: product.id,
      branch_id: branchId,
      quantity: initialStockMap[branchId]
    }));
    if (stockInserts.length > 0) {
      await supabase.from("stock").insert(stockInserts);
    }
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

  const { error } = await supabase
    .from("products")
    .update({
      name: productData.name,
      sku: productData.sku,
      category: productData.category,
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
