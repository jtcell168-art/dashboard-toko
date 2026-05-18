"use server";
import { createClient } from "@/lib/supabase/server";

export async function getOnlineOrders() {
  try {
    const supabase = await createClient();
    
    // We fetch orders and their items
    const { data, error } = await supabase
      .from("online_orders")
      .select(`
        *,
        items:online_order_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === '42P01') {
         // Table doesn't exist yet, return empty gracefully
         return [];
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error("Error fetching online orders:", err);
    return [];
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("online_orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error updating online order status:", err);
    return { success: false, error: err.message };
  }
}
