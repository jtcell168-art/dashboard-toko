"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

// GET ALL ASSETS
export async function getAssets(branchId = "all") {
  try {
    const supabase = await createClient();
    let query = supabase.from("assets").select("*, branches(name)").order("purchase_date", { ascending: false });
    
    if (branchId !== "all") {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching assets:", err);
    return [];
  }
}

// ADD NEW ASSET
export async function addAsset(assetData) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "manager")) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase.from("assets").insert({
      name: assetData.name,
      category: assetData.category,
      purchase_date: assetData.purchaseDate || new Date().toISOString().split('T')[0],
      purchase_price: Number(assetData.purchasePrice),
      branch_id: assetData.branchId === "all" ? null : assetData.branchId,
      note: assetData.note
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error adding asset:", err);
    return { success: false, error: err.message };
  }
}

// DELETE ASSET
export async function deleteAsset(id) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user || user.role !== "owner") {
      throw new Error("Hanya Owner yang dapat menghapus aset tetap.");
    }

    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// GET ASSET STATS
export async function getAssetStats(branchId = "all") {
  try {
    const supabase = await createClient();
    let query = supabase.from("assets").select("purchase_price");
    
    if (branchId !== "all") {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalInvestment = data.reduce((sum, item) => sum + Number(item.purchase_price), 0);
    const assetCount = data.length;

    return { totalInvestment, assetCount };
  } catch (err) {
    return { totalInvestment: 0, assetCount: 0 };
  }
}
