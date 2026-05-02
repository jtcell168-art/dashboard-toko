"use server";
import { createClient } from "@/lib/supabase/server";
import { getTotalSalaries } from "./salaries";

export async function getDashboardData(startDate, endDate, selectedBranchId = "all") {
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
    
    // Final branch filter logic: 
    // - If owner and 'all' -> no filter
    // - If owner and specific ID -> filter by ID
    // - If manager -> always filter by their userBranchId
    let targetBranchId = isOwner ? (selectedBranchId === "all" ? null : selectedBranchId) : userBranchId;

    // 1. Get total users
    const usersQuery = supabase.from("profiles").select("*", { count: "exact", head: true });
    if (targetBranchId) usersQuery.eq("branch_id", targetBranchId);
    const { count: usersCount } = await usersQuery;

    // 2. Get total products
    // Note: products table might be global, but stock is branch-specific. 
    // For dashboard, we usually show total variety or branch-specific available stock.
    // Let's keep it global for 'variety' or filter by stock presence if branch selected.
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // 3. Get recent transactions
    const transactionsQuery = supabase
      .from("transactions")
      .select(`
        id, invoice_no, type, total, status, created_at, payment_method,
        profiles (full_name),
        branches (name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (targetBranchId) transactionsQuery.eq("branch_id", targetBranchId);
    if (startDate) transactionsQuery.gte("created_at", startDate);
    if (endDate) transactionsQuery.lte("created_at", endDate + "T23:59:59");
    const { data: recentTransactions } = await transactionsQuery;

    // 4. Get total revenue (completed transactions)
    const revenueQuery = supabase
      .from("transactions")
      .select("total")
      .eq("status", "completed");
    
    if (targetBranchId) revenueQuery.eq("branch_id", targetBranchId);
    if (startDate) revenueQuery.gte("created_at", startDate);
    if (endDate) revenueQuery.lte("created_at", endDate + "T23:59:59");
    const { data: revenues } = await revenueQuery;

    const totalRevenue = revenues?.reduce((sum, t) => sum + Number(t.total), 0) || 0;

    // 5. Active services
    const servicesQuery = supabase
      .from("service_tickets")
      .select("status");
    
    if (targetBranchId) servicesQuery.eq("branch_id", targetBranchId);
    if (startDate) servicesQuery.gte("created_at", startDate);
    if (endDate) servicesQuery.lte("created_at", endDate + "T23:59:59");
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
    
    if (targetBranchId) alertsQuery.eq("branch_id", targetBranchId);
    if (startDate) alertsQuery.gte("created_at", startDate);
    if (endDate) alertsQuery.lte("created_at", endDate + "T23:59:59");
    const { data: serviceAlerts } = await alertsQuery;

    // 7. Get Total Salaries (Manager/Owner only)
    // For now, salaries are global for owners, or branch-specific if we have a way to filter salaries by branch
    // (profiles.branch_id join required)
    let totalSalary = 0;
    if (profile?.role === "owner" || profile?.role === "manager") {
      totalSalary = await getTotalSalaries(startDate, endDate);
    }

    const mappedAlerts = (serviceAlerts || []).map(s => ({
      id: s.id,
      customer: s.customer_name,
      device: s.device_name,
      issue: s.issue_description,
      status: s.status,
      days: Math.floor((new Date() - new Date(s.created_at)) / (1000 * 60 * 60 * 24)),
      technician: s.profiles?.full_name || null
    }));

    // 8. Calculate Sales 7 Days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const salesHistoryQuery = supabase
      .from("transactions")
      .select("total, created_at")
      .eq("status", "completed")
      .gte("created_at", sevenDaysAgo.toISOString());
    
    if (targetBranchId) salesHistoryQuery.eq("branch_id", targetBranchId);
    const { data: last7DaysTrx } = await salesHistoryQuery;
    
    const sales7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("id-ID", { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];
      
      const dayTotal = (last7DaysTrx || [])
        .filter(t => t.created_at.startsWith(dateStr))
        .reduce((sum, t) => sum + Number(t.total), 0);
      
      sales7Days.push({ day: dayStr, total: dayTotal });
    }

    // 9. Calculate Inventory Value (Owner only)
    let inventoryValue = 0;
    if (isOwner) {
      let invQuery = supabase
        .from("stock")
        .select(`
          quantity,
          products ( purchase_price )
        `);
      if (targetBranchId) invQuery.eq("branch_id", targetBranchId);
      
      const { data: stockData } = await invQuery;
      
      if (stockData) {
        inventoryValue = stockData.reduce((sum, s) => {
          const price = Number(s.products?.purchase_price || 0);
          return sum + (s.quantity * price);
        }, 0);
      }
    }

    // 10. Revenue by Branch (only relevant if 'all' branches or if owner wants comparison)
    const branchRevenueQuery = supabase
      .from("transactions")
      .select("total, branches(name)")
      .eq("status", "completed")
      .gte("created_at", startDate || new Date().toISOString().split("T")[0]);
    
    if (targetBranchId) branchRevenueQuery.eq("branch_id", targetBranchId);
    const { data: branchRevenueData } = await branchRevenueQuery;
    
    const branchMap = {};
    (branchRevenueData || []).forEach(t => {
      const bName = t.branches?.name || "Unknown";
      branchMap[bName] = (branchMap[bName] || 0) + Number(t.total);
    });
    
    const revenueByBranch = Object.entries(branchMap).map(([name, rev], i) => ({
      branch: name,
      revenue: rev,
      color: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"][i % 5]
    }));

    return {
      kpi: {
        revenue: totalRevenue,
        users: usersCount || 0,
        products: productsCount || 0,
        activeServices,
        totalSalary: totalSalary,
        inventoryValue: inventoryValue,
      },
      recentTransactions: recentTransactions || [],
      sales7Days,
      revenueByBranch,
      serviceAlerts: mappedAlerts,
      userRole: profile?.role
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
