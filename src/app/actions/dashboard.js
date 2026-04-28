"use server";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  try {
    const supabase = await createClient();

    // Get current user profile for filtering
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return {
        kpi: { revenue: 0, users: 0, products: 0, activeServices: { pending: 0, process: 0, done: 0 } },
        recentTransactions: [],
        sales7Days: [],
        revenueByBranch: [],
        serviceAlerts: [],
      };
    }

    const { data: profile } = await supabase.from("profiles").select("role, branch_id").eq("id", authUser.id).single();
    
    const isOwner = profile?.role === "owner";
    const userBranchId = profile?.branch_id;

    // 1. Get total users
    const usersQuery = supabase.from("profiles").select("*", { count: "exact", head: true });
    if (!isOwner && userBranchId) usersQuery.eq("branch_id", userBranchId);
    const { count: usersCount } = await usersQuery;

    // 2. Get total products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // 3. Get recent transactions
    const transactionsQuery = supabase
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
    
    if (!isOwner && userBranchId) transactionsQuery.eq("branch_id", userBranchId);
    const { data: recentTransactions } = await transactionsQuery;

    // 4. Get total revenue (completed transactions)
    const revenueQuery = supabase
      .from("transactions")
      .select("total")
      .eq("status", "completed");
    
    if (!isOwner && userBranchId) revenueQuery.eq("branch_id", userBranchId);
    const { data: revenues } = await revenueQuery;

    const totalRevenue = revenues?.reduce((sum, t) => sum + Number(t.total), 0) || 0;

    // 5. Active services
    const servicesQuery = supabase
      .from("service_tickets")
      .select("status")
      .in("status", ["pending", "process", "done", "overdue"]);
    
    if (!isOwner && userBranchId) servicesQuery.eq("branch_id", userBranchId);
    const { data: activeServicesList } = await servicesQuery;

    const activeServices = {
      pending: activeServicesList?.filter(s => s.status === "pending").length || 0,
      process: activeServicesList?.filter(s => s.status === "process").length || 0,
      done: activeServicesList?.filter(s => s.status === "done").length || 0,
    };

    // 6. Service Alerts
    const alertsQuery = supabase
      .from("service_tickets")
      .select("id, customer_name, device_name, issue_description, status, created_at, profiles(full_name)")
      .in("status", ["pending", "overdue"])
      .order("created_at", { ascending: true })
      .limit(5);
    
    if (!isOwner && userBranchId) alertsQuery.eq("branch_id", userBranchId);
    const { data: serviceAlerts } = await alertsQuery;

    const mappedAlerts = (serviceAlerts || []).map(s => ({
      id: s.id,
      customer: s.customer_name,
      device: s.device_name,
      issue: s.issue_description,
      status: s.status,
      days: Math.floor((new Date() - new Date(s.created_at)) / (1000 * 60 * 60 * 24)),
      technician: s.profiles?.full_name || null
    }));

    return {
      kpi: {
        revenue: totalRevenue,
        users: usersCount || 0,
        products: productsCount || 0,
        activeServices,
      },
      recentTransactions: recentTransactions || [],
      sales7Days: [],
      revenueByBranch: [],
      serviceAlerts: mappedAlerts,
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return {
      kpi: { revenue: 0, users: 0, products: 0, activeServices: { pending: 0, process: 0, done: 0 } },
      recentTransactions: [],
      sales7Days: [],
      revenueByBranch: [],
      serviceAlerts: [],
    };
  }
}
