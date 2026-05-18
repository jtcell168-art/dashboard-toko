"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

// Decodes obfuscated payload to prevent WAF blocks
function decodeWafSafe(str) {
  if (!str) return str;
  if (typeof str === 'string' && str.startsWith('b64_')) {
    try {
      return decodeURIComponent(atob(str.substring(4)));
    } catch (e) {
      return str;
    }
  }
  return str;
}


// GET INVENTORY
export async function getInventory(branchId = "all") {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    
    // Fetch branches for mapping if needed
    const { data: branches } = await supabase.from("branches").select("id, name");

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
        ),
        is_online,
        is_featured,
        image_url,
        description
      `)
      .order("created_at", { ascending: false });

    // If not owner/manager and has a specific branch, we could filter products?
    // But usually we want to see all products, but filter the STOCK shown.
    // However, if we want to filter the product list to only what's available at the branch:
    // if (branchId !== "all" && user.role !== 'owner' && user.role !== 'manager') {
    //   query = query.eq('stock.branch_id', branchId);
    // }

    let { data, error } = await query;

    // Fallback query if 'is_online' column doesn't exist yet
    if (error) {
      console.warn("Primary inventory query failed (likely missing new columns), using fallback...", error.message);
      const fallbackQuery = supabase
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
        
      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("Error fetching inventory:", error);
      return [];
    }
    
    // Pre-calculate IMEI counts for performance O(N+M)
    const imeiCountsMap = {}; // product_id -> branch_id -> count
    
    // Fetch all stock IMEIs to ensure we don't miss anything (Limit 50k)
    const { data: allImeis } = await supabase
      .from("imei_records")
      .select("product_id, branch_id, imei")

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
      let categoryName = "Uncategorized";
      if (p.categories) {
        categoryName = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
      }
      
      const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"];
      const isImeiTracked = trackedCategories.some(c => categoryName?.trim().toUpperCase().includes(c));
      // Group and sum stock records by branch ID to handle potential duplicates
      const branchStockMap = {};
      p.stock?.forEach(s => {
        if (!branchStockMap[s.branch_id]) {
          branchStockMap[s.branch_id] = {
            branch_id: s.branch_id,
            quantity: 0,
            branches: s.branches
          };
        }
        branchStockMap[s.branch_id].quantity += Number(s.quantity || 0);
      });
      let filteredStock = Object.values(branchStockMap);
      
      // For HP products, we overwrite with IMEI counts
      if (isImeiTracked && imeiCountsMap[p.id]) {
        const branchCounts = imeiCountsMap[p.id];
        
        filteredStock = filteredStock.map(s => {
          const imeiCount = branchCounts[s.branch_id] || 0;
          // Source of truth: IMEIs if they exist, otherwise manual stock
          const finalQty = imeiCount > 0 ? imeiCount : Number(s.quantity || 0);
            
          return {
            ...s,
            quantity: finalQty
          };
        });
 
        // Add branches that have IMEIs but no stock record
        Object.entries(branchCounts).forEach(([bId, count]) => {
          if (!filteredStock.some(s => s.branch_id === bId)) {
            filteredStock.push({ 
              branch_id: bId, 
              quantity: count,
              branches: { name: branches.find(b => b.id === bId)?.name || "Cabang Lain" }
            });
          }
        });
      }
 
      // Filter by branch for staff
      if (branchId !== "all" && user?.role !== "owner" && user?.role !== "manager") {
        filteredStock = filteredStock.filter(s => s.branch_id === branchId);
      }

      // Add actual IMEI strings for export
      const imeiData = allImeis?.filter(i => i.product_id === p.id) || [];
      const imeiStrings = {};
      branches?.forEach(b => {
        imeiStrings[b.id] = imeiData
          .filter(i => i.branch_id === b.id)
          .map(i => i.imei)
          .join(", ");
      });
 
      return {
        ...p,
        category: categoryName || "Uncategorized",
        stock: filteredStock,
        imeiStrings // { branch_id: "imei1, imei2..." }
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
    const role = (user?.role || "").toLowerCase();
    if (!user || (role !== "owner" && role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    // Get category_id from name
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", productData.category)
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
      // Clear old stock if product already exists to ensure fresh start
      await supabase.from("stock").delete().eq("product_id", productId);
    } else {
      const insertData = {
        name: productData.name,
        sku: productData.sku,
        category_id: catData?.id,
        retail_price: productData.retailPrice,
        purchase_price: productData.purchasePrice,
        is_online: productData.isOnline || false,
        is_featured: productData.isFeatured || false,
        image_url: decodeWafSafe(productData.imageUrl) || null,
        description: decodeWafSafe(productData.description) || null
      };

      let { data: product, error: prodError } = await supabase
        .from("products")
        .insert(insertData)
        .select()
        .single();

      if (prodError && prodError.message.includes('is_featured')) {
        // Fallback: insert without is_featured
        const { is_featured, ...fallbackInsertData } = insertData;
        const { data: fbProduct, error: fbProdError } = await supabase
          .from("products")
          .insert(fallbackInsertData)
          .select()
          .single();
        product = fbProduct;
        prodError = fbProdError;
      }

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
      const { error: imeiError } = await supabase.from("imei_records").upsert(imeiInserts, { onConflict: 'imei' });
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
    const role = (user?.role || "").toLowerCase();
    if (!user || (role !== "owner" && role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    // Get category_id from name
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", productData.category)
      .maybeSingle();

    const updatePayload = {
      name: productData.name,
      sku: productData.sku,
      category_id: catData?.id,
      retail_price: productData.retailPrice,
      purchase_price: productData.purchasePrice,
      is_online: productData.isOnline !== undefined ? productData.isOnline : false,
      is_featured: productData.isFeatured !== undefined ? productData.isFeatured : false,
      image_url: decodeWafSafe(productData.imageUrl) || null,
      description: decodeWafSafe(productData.description) || null
    };

    let { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId);

    if (error && error.message.includes('is_featured')) {
      // Fallback: update without is_featured
      const { is_featured, ...fallbackPayload } = updatePayload;
      const { error: fallbackError } = await supabase
        .from("products")
        .update(fallbackPayload)
        .eq("id", productId);
      error = fallbackError;
    }

    if (error) return { success: false, error: error.message };
    
    // Delete existing stock records first to prevent duplicates and ensure manual overwrite
    const { error: delError } = await supabase
      .from("stock")
      .delete()
      .eq("product_id", productId);
      
    if (delError) console.error("Gagal membersihkan stok lama:", delError);

    // Update or Insert Stok per Cabang
    if (initialStockMap) {
      for (const branchId of Object.keys(initialStockMap)) {
        const qty = Number(initialStockMap[branchId] || 0);
        
        // Gunakan insert karena kita sudah hapus yang lama
        const { error: stockError } = await supabase
          .from("stock")
          .insert({ 
            product_id: productId, 
            branch_id: branchId, 
            quantity: qty,
          });

        if (stockError) {
          console.error(`Gagal update stok cabang ${branchId}:`, stockError);
          return { success: false, error: `Gagal update stok cabang ${branchId}: ${stockError.message}` };
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
  const role = (user?.role || "").toLowerCase();
  if (!user || (role !== "owner" && role !== "manager")) {
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
  
  const role = (user?.role || "").toLowerCase();
  if (!user || (role !== "owner" && role !== "manager")) {
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

        // Upsert Stocks — ADD to existing quantity (not replace)
        const stockUpdates = [];
        if (item.stockRuteng && branchMap.ruteng) {
          stockUpdates.push({ branchId: branchMap.ruteng, addQty: Number(item.stockRuteng) });
        }
        if (item.stockLarantuka && branchMap.larantuka) {
          stockUpdates.push({ branchId: branchMap.larantuka, addQty: Number(item.stockLarantuka) });
        }
        if (item.stockRiung && branchMap.riung) {
          stockUpdates.push({ branchId: branchMap.riung, addQty: Number(item.stockRiung) });
        }

        for (const su of stockUpdates) {
          // Get current stock first
          const { data: existing } = await supabase
            .from("stock")
            .select("quantity")
            .eq("product_id", product.id)
            .eq("branch_id", su.branchId)
            .maybeSingle();

          const currentQty = existing?.quantity || 0;
          const newQty = currentQty + su.addQty;

          const { error: stockError } = await supabase
            .from("stock")
            .upsert({ product_id: product.id, branch_id: su.branchId, quantity: newQty, updated_at: new Date().toISOString() }, { onConflict: 'product_id,branch_id' });
          if (stockError) console.error("Stock error for SKU " + item.sku, stockError);
        }

        // 4. Process IMEIs if HP
        const categoryName = item.category?.trim().toUpperCase() || "";
        const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"];
        const isImeiTracked = trackedCategories.some(c => categoryName.includes(c));

        if (isImeiTracked || product.category_id) {
          const imeiInserts = [];
          
          const processImeis = (str, branchId) => {
            if (!str) return;
            const list = str.split(/[\n, ]+/).filter(i => i.trim() !== "");
            list.forEach(imei => {
              imeiInserts.push({
                product_id: product.id,
                branch_id: branchId,
                imei: imei.trim(),
                status: "stock",
                last_action: "Import Excel",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            });
          };

          if (branchMap.ruteng) processImeis(item.imeiRuteng, branchMap.ruteng);
          if (branchMap.larantuka) processImeis(item.imeiLarantuka, branchMap.larantuka);
          if (branchMap.riung) processImeis(item.imeiRiung, branchMap.riung);

          if (imeiInserts.length > 0) {
            // Use upsert to avoid duplicate key errors if re-importing
            const { error: imeiError } = await supabase
              .from("imei_records")
              .upsert(imeiInserts, { onConflict: 'imei' });
            if (imeiError) console.error("IMEI error for SKU " + item.sku, imeiError);
          }
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

    // 1. Cek dan Kurangi stok dari cabang asal (DILAKUKAN SAAT KIRIM)
    const { data: fromStock } = await supabase
      .from("stock")
      .select("id, quantity")
      .eq("product_id", productId)
      .eq("branch_id", fromBranchId)
      .single();

    const currentFromQty = fromStock ? fromStock.quantity : 0;
    if (currentFromQty < quantity) {
      throw new Error("Stok cabang asal tidak mencukupi untuk melakukan transfer ini.");
    }

    // 2. Insert transfer record
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

    // 3. Update stok di tabel stock (Kurangi dari asal)
    await supabase
      .from("stock")
      .update({ quantity: currentFromQty - quantity })
      .eq("id", fromStock.id);

    // 4. If there are IMEIs, update their status to 'transfer'
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
      
      // Sinkronisasi stok asal setelah IMEI diubah statusnya menjadi 'transfer'
      await syncStockWithImeis(supabase, productId, fromBranchId);
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

    // 2. Tambahkan stok ke cabang tujuan (Stok asal sudah dikurangi saat submitTransfer)
    const { data: product } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", transfer.product_id)
      .single();

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
    } else {
      // Fallback: If it's an IMEI-tracked category but no IMEIs were explicitly marked, 
      // move available ones from the source branch to match the quantity.
      const categoryName = product?.categories?.name?.trim().toUpperCase();
      const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"];
      const isImeiTracked = trackedCategories.some(c => categoryName?.includes(c));
      
      if (isImeiTracked) {
        const { data: availableImeis } = await supabase
          .from("imei_records")
          .select("id")
          .eq("product_id", transfer.product_id)
          .eq("branch_id", transfer.from_branch_id)
          .eq("status", "stock")
          .limit(transfer.quantity);
          
        if (availableImeis && availableImeis.length > 0) {
          for (const imei of availableImeis) {
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

    // 5. Sinkronisasi stok kedua cabang (PENTING untuk HP agar data tabel stock valid)
    await syncStockWithImeis(supabase, transfer.product_id, transfer.from_branch_id);
    await syncStockWithImeis(supabase, transfer.product_id, transfer.to_branch_id);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// HELPER: Sinkronisasi tabel stock dengan jumlah IMEI (Source of Truth)
export async function syncStockWithImeis(supabase, productId, branchId) {
  try {
    const { data: product } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", productId)
      .single();

    const categoryName = product?.categories?.name?.trim().toUpperCase();
    const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE"];
    const isImeiTracked = trackedCategories.some(c => categoryName?.includes(c));

    if (isImeiTracked) {
      const { count } = await supabase
        .from("imei_records")
        .select("*", { count: 'exact', head: true })
        .eq("product_id", productId)
        .eq("branch_id", branchId)
        .eq("status", "stock");

      await supabase
        .from("stock")
        .upsert({
          product_id: productId,
          branch_id: branchId,
          quantity: count || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id,branch_id' });
    }
  } catch (err) {
    console.error("Error syncing stock with IMEIs:", err);
  }
}

// UPDATE IMEI RECORD
export async function updateImeiRecord(originalImei, updateData) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("imei_records")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("imei", originalImei.trim())
      .select("product_id, branch_id")
      .single();
    
    if (error) throw error;
    
    // Sync stock for affected branches
    if (data) {
      await syncStockWithImeis(supabase, data.product_id, data.branch_id);
      if (updateData.branch_id && updateData.branch_id !== data.branch_id) {
        await syncStockWithImeis(supabase, data.product_id, updateData.branch_id);
      }
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// DELETE IMEI RECORD
export async function deleteImeiRecord(imei) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("imei_records")
      .delete()
      .eq("imei", imei.trim())
      .select("product_id, branch_id")
      .single();

    if (error) throw error;
    if (data) {
      await syncStockWithImeis(supabase, data.product_id, data.branch_id);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ADD SINGLE IMEI RECORD
export async function addImeiRecord(data) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if exists first to provide better message
    const { data: existing, error: checkError } = await supabase
      .from("imei_records")
      .select("product_id, products(name)")
      .eq("imei", data.imei)
      .maybeSingle();

    if (existing) {
      const productName = existing.products?.name || "Produk Lain";
      return { 
        success: false, 
        error: `IMEI ini sudah terdaftar di "${productName}". Hapus dulu dari sana jika ingin dipindah.` 
      };
    }

    const { error } = await supabase
      .from("imei_records")
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    
    // Sync stock
    await syncStockWithImeis(supabase, data.product_id, data.branch_id);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// SEARCH PRODUCT BY IMEI
export async function searchProductByImei(imei) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("imei_records")
      .select("product_id")
      .ilike("imei", `%${imei}%`)
      .limit(20);
    
    if (error) throw error;
    return data.map(d => d.product_id);
  } catch (err) {
    console.error("Search IMEI error:", err);
    return [];
  }
}



