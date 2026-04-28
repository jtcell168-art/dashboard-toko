"use server";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();

  // 1. Get total users
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // 2. Get total products
  const { count: productsCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // 3. Get recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(`
      id,
      invoice_no,
      total,
      status,
      created_at,
      payment_method,
      profiles (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  // 4. Get total revenue (completed transactions)
  const { data: revenues } = await supabase
    .from("transactions")
    .select("total")
    .eq("status", "completed");

  const totalRevenue = revenues?.reduce((sum, t) => sum + Number(t.total), 0) || 0;

  return {
    kpi: {
      revenue: totalRevenue,
      users: usersCount || 0,
      products: productsCount || 0,
    },
    recentTransactions: recentTransactions || [],
  };
}
