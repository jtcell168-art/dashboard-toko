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
    
    // Pre-calculate IMEI counts for performance O(N+M)
    const imeiCountsMap = {}; // product_id -> branch_id -> count
    
    // Fetch all stock IMEIs to ensure we don't miss anything (Limit 50k)
    const { data: allImeis } = await supabase
      .from("imei_records")
      .select("product_id, branch_id")
      .eq("status", "stock")
      .limit(50000);
    
    if (allImeis) {
      allImeis.forEach(i => {
        if (!imeiCountsMap[i.product_id]) imeiCountsMap[i.product_id] = {};
        imeiCountsMap[i.product_id][i.branch_id] = (imeiCountsMap[i.product_id][i.branch_id] || 0) + 1;
      });
    }

    // Flatten categories and calculate real-time stock
    return data.map(p => {
      const categoryName = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
      const isHP = categoryName?.toUpperCase() === "HP";
      let filteredStock = p.stock || [];
      
      if (isHP && imeiCountsMap[p.id]) {
        const branchCounts = imeiCountsMap[p.id];
        
        // Recalculate stock based on IMEI for HP
        filteredStock = filteredStock.map(s => ({
          ...s,
          quantity: branchCounts[s.branch_id] || 0
        }));

        // Add missing branches if they have IMEIs but no stock record yet
        Object.entries(branchCounts).forEach(([bId, count]) => {
          if (!filteredStock.find(s => s.branch_id === bId)) {
            filteredStock.push({ branch_id: bId, quantity: count });
          }
        });
      }

      // Filter by branch for staff
      if (branchId !== "all" && user?.role !== "owner" && user?.role !== "manager") {
        filteredStock = filteredStock.filter(s => s.branch_id === branchId);
      }

      return {
        ...p,
        category: categoryName || "Uncategorized",
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

    // 1. Cek apakah SKU sudah ada
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("sku", productData.sku)
      .maybeSingle();

    let productId;

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
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
      productId = product.id;
    }

    // 2. Update atau Insert Stok per Cabang
    if (initialStockMap) {
      for (const branchId of Object.keys(initialStockMap)) {
        const qty = Number(initialStockMap[branchId]);
        if (qty <= 0) continue;

        const { error: stockError } = await supabase
          .from("stock")
          .upsert({ 
            product_id: productId, 
            branch_id: branchId, 
            quantity: qty,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'product_id,branch_id' 
          });

        if (stockError) console.error(`Gagal simpan stok cabang ${branchId}:`, stockError);
      }
    }

    // 3. Insert IMEIs
    if (imeiList && imeiList.length > 0) {
      const imeiInserts = imeiList.map(item => ({
        product_id: productId,
        branch_id: item.branchId,
        imei: item.imei,
        status: 'stock'
      }));
      const { error: imeiError } = await supabase.from("imei_records").insert(imeiInserts);
      if (imeiError) return { success: false, error: "Gagal menyimpan IMEI: " + imeiError.message };
    }

    return { success: true, data: { id: productId } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProduct(productId, productData, initialStockMap) {
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

    // Update or Insert Stok per Cabang
    if (initialStockMap) {
      for (const branchId of Object.keys(initialStockMap)) {
        const qty = Number(initialStockMap[branchId] || 0);
        
        // Gunakan upsert untuk memastikan data masuk baik barisnya sudah ada atau belum
        const { error: stockError } = await supabase
          .from("stock")
          .upsert({ 
            product_id: productId, 
            branch_id: branchId, 
            quantity: qty,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'product_id,branch_id' 
          });

        if (stockError) {
          console.error(`Gagal update stok cabang ${branchId}:`, stockError);
        }
      }
    }

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

// BULK IMPORT PRODUCTS
export async function bulkImportProducts(productsArray) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Get Categories & Branches Mapping
    const [{ data: categories }, { data: branches }] = await Promise.all([
      supabase.from("categories").select("id, name"),
      supabase.from("branches").select("id, name")
    ]);

    const catMap = {};
    categories?.forEach(c => catMap[c.name.toLowerCase()] = c.id);

    const branchMap = {};
    branches?.forEach(b => {
      const name = b.name.toLowerCase();
      if (name.includes("ruteng")) branchMap.ruteng = b.id;
      else if (name.includes("larantuka")) branchMap.larantuka = b.id;
      else if (name.includes("riung")) branchMap.riung = b.id;
    });

    let successCount = 0;
    let errorCount = 0;

    // 2. Process each product
    for (const item of productsArray) {
      try {
        const catId = catMap[item.category?.toLowerCase()] || null;
        
        // Upsert Product by SKU
        const { data: product, error: prodError } = await supabase
          .from("products")
          .upsert({
            name: item.name,
            sku: item.sku,
            category_id: catId,
            purchase_price: Number(item.buyPrice || 0),
            retail_price: Number(item.sellPrice || 0),
            updated_at: new Date().toISOString()
          }, { onConflict: 'sku' })
          .select()
          .single();

        if (prodError) throw prodError;

        // Upsert Stocks
        const stockInserts = [];
        if (item.stockRuteng !== undefined && branchMap.ruteng) {
          stockInserts.push({ product_id: product.id, branch_id: branchMap.ruteng, quantity: Number(item.stockRuteng) });
        }
        if (item.stockLarantuka !== undefined && branchMap.larantuka) {
          stockInserts.push({ product_id: product.id, branch_id: branchMap.larantuka, quantity: Number(item.stockLarantuka) });
        }
        if (item.stockRiung !== undefined && branchMap.riung) {
          stockInserts.push({ product_id: product.id, branch_id: branchMap.riung, quantity: Number(item.stockRiung) });
        }

        if (stockInserts.length > 0) {
          const { error: stockError } = await supabase
            .from("stock")
            .upsert(stockInserts, { onConflict: 'product_id,branch_id' });
          if (stockError) console.error("Stock error for SKU " + item.sku, stockError);
        }

        successCount++;
      } catch (e) {
        console.error("Error importing SKU " + item.sku, e);
        errorCount++;
      }
    }

    return { success: true, successCount, errorCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// SUBMIT STOCK TRANSFER
export async function submitTransfer(data) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { productId, fromBranchId, toBranchId, quantity, imeis = [] } = data;

    // Insert transfer record
    const { data: transfer, error: transferError } = await supabase
      .from("stock_transfers")
      .insert({
        product_id: productId,
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        quantity: quantity,
        status: "in_transit",
        transferred_by: user.id
      })
      .select()
      .single();

    if (transferError) throw new Error(transferError.message);

    // If there are IMEIs, update their status to 'transfer'
    if (imeis && imeis.length > 0) {
      for (const imei of imeis) {
        await supabase
          .from("imei_records")
          .update({
            status: "transfer",
            last_action: `transfer_${transfer.id}`,
            updated_at: new Date().toISOString()
          })
          .eq("id", imei.id);
      }
    }

    return { success: true, data: transfer };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// RECEIVE STOCK TRANSFER
export async function receiveTransfer(transferId) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Get transfer details
    const { data: transfer, error: transferError } = await supabase
      .from("stock_transfers")
      .select("*")
      .eq("id", transferId)
      .single();

    if (transferError || !transfer) throw new Error("Transfer tidak ditemukan.");
    if (transfer.status === "completed") throw new Error("Transfer sudah diselesaikan.");

    // Cek wewenang (Owner, Manager, atau staff dari cabang tujuan)
    if (user.role !== "owner" && user.role !== "manager" && user.branch_id !== transfer.to_branch_id) {
      throw new Error("Hanya staff cabang tujuan, Owner, atau Manager yang bisa menerima barang.");
    }

    // 2. Kurangi stok dari cabang asal
    const { data: fromStock } = await supabase
      .from("stock")
      .select("quantity")
      .eq("product_id", transfer.product_id)
      .eq("branch_id", transfer.from_branch_id)
      .single();

    const currentFromQty = fromStock ? fromStock.quantity : 0;
    if (currentFromQty < transfer.quantity) {
      throw new Error("Stok cabang asal tidak mencukupi untuk menyelesaikan transfer ini.");
    }

    await supabase
      .from("stock")
      .update({ quantity: currentFromQty - transfer.quantity })
      .eq("product_id", transfer.product_id)
      .eq("branch_id", transfer.from_branch_id);

    // 3. Tambahkan stok ke cabang tujuan
    const { data: toStock } = await supabase
      .from("stock")
      .select("quantity")
      .eq("product_id", transfer.product_id)
      .eq("branch_id", transfer.to_branch_id)
      .maybeSingle();

    if (toStock) {
      await supabase
        .from("stock")
        .update({ quantity: toStock.quantity + transfer.quantity })
        .eq("product_id", transfer.product_id)
        .eq("branch_id", transfer.to_branch_id);
    } else {
      await supabase
        .from("stock")
        .insert({
          product_id: transfer.product_id,
          branch_id: transfer.to_branch_id,
          quantity: transfer.quantity
        });
    }

    // Update IMEI records if they were transferred
    const { data: transferredImeis } = await supabase
      .from("imei_records")
      .select("id")
      .eq("last_action", `transfer_${transferId}`)
      .eq("status", "transfer");

    if (transferredImeis && transferredImeis.length > 0) {
      for (const imei of transferredImeis) {
        await supabase
          .from("imei_records")
          .update({
            status: "stock",
            branch_id: transfer.to_branch_id,
            updated_at: new Date().toISOString()
          })
          .eq("id", imei.id);
      }
    }

    // 4. Update status transfer
    const { error: updateError } = await supabase
      .from("stock_transfers")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", transferId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
