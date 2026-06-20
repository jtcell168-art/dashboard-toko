"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

// Get sparepart products from inventory with stock info
export async function getSpareparts(branchId = "all") {
  try {
    const supabase = await createClient();

    // Fetch products in Sparepart categories with stock
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id, name, sku, purchase_price, retail_price,
        categories!inner ( name ),
        stock (
          branch_id,
          quantity,
          branches ( name )
        )
      `)
      .eq("is_active", true)
      .ilike("categories.name", "%Sparepart%")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching spareparts:", error);
      return [];
    }

    return (products || []).map(p => {
      // Group stock by branch
      const branchStockMap = {};
      (p.stock || []).forEach(s => {
        if (!branchStockMap[s.branch_id]) {
          branchStockMap[s.branch_id] = {
            branch_id: s.branch_id,
            branch_name: s.branches?.name || "Unknown",
            quantity: 0,
          };
        }
        branchStockMap[s.branch_id].quantity += Number(s.quantity || 0);
      });

      let stockEntries = Object.values(branchStockMap);

      // Filter by branch if specified
      if (branchId && branchId !== "all") {
        stockEntries = stockEntries.filter(s => s.branch_id === branchId);
      }

      const totalStock = stockEntries.reduce((sum, s) => sum + s.quantity, 0);

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        purchasePrice: p.purchase_price || 0,
        retailPrice: p.retail_price || 0,
        category: p.categories?.name || "Sparepart",
        totalStock,
        stockByBranch: stockEntries,
      };
    });
  } catch (err) {
    console.error("Critical error in getSpareparts:", err);
    return [];
  }
}

// Fetch service tickets for tracking
export async function getServiceTickets(branchId = "all") {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    let query = supabase
      .from("service_tickets")
      .select("*, service_ticket_parts(*), profiles:technician_id(full_name), branches(name)")
      .order("created_at", { ascending: false });

    if (branchId !== "all") {
      query = query.eq("branch_id", branchId);
    } else if (user.role !== "owner" && user.role !== "manager") {
      // Regular staff only sees their branch
      query = query.eq("branch_id", user.branch_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error("Error fetching service tickets:", err);
    return [];
  }
}

// Create service ticket and deduct sparepart stock
export async function createServiceTicket(ticketData) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const {
      customerName,
      phoneNumber,
      deviceType,
      imeiSerial,
      selectedIssues,
      keluhanDetail,
      estimatedCost,
      estimatedDays,
      dpAmount,
      warrantyDays,
      technicianNotes,
      parts, // [{ id, name, qty, unitPrice }]
      branchId,
    } = ticketData;

    // Build issue description
    const issueDesc = [
      ...(selectedIssues || []),
      keluhanDetail,
    ].filter(Boolean).join("; ");

    // Calculate parts cost
    const partsCost = (parts || []).reduce(
      (sum, p) => sum + p.unitPrice * p.qty,
      0
    );

    // 1. Insert Service Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("service_tickets")
      .insert({
        ticket_no: `SRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customer_name: customerName,
        customer_phone: phoneNumber,
        device_type: deviceType,
        device_name: deviceType, // fallback
        imei_serial: imeiSerial,
        issue_description: issueDesc,
        estimated_cost: Number(estimatedCost || 0),
        parts_cost: partsCost,
        total_cost: Number(estimatedCost || 0) + partsCost,
        estimated_days: Number(estimatedDays || 1),
        dp_amount: Number(dpAmount || 0),
        warranty_days: Number(warrantyDays || 30),
        technician_notes: technicianNotes || "",
        branch_id: branchId && branchId !== "all" ? branchId : user.branch_id,
        technician_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Ticket insert error:", ticketError);
      throw new Error("Gagal membuat tiket: " + ticketError.message);
    }

    // 2. Insert parts used and deduct stock
    if (parts && parts.length > 0) {
      const targetBranch =
        branchId && branchId !== "all" ? branchId : user.branch_id;

      for (const part of parts) {
        // 2a. Insert service_ticket_parts record
        await supabase.from("service_ticket_parts").insert({
          ticket_id: ticket.id,
          product_id: part.id,
          product_name: part.name,
          quantity: part.qty,
          unit_price: part.unitPrice,
          subtotal: part.unitPrice * part.qty,
        });

        // 2b. Deduct stock from inventory (ATOMIC)
        if (targetBranch) {
          const { error: rpcError } = await supabase.rpc("decrement_stock", {
            p_product_id: part.id,
            p_branch_id: targetBranch,
            p_quantity: part.qty
          });

          // Fallback if RPC fails or not yet created
          if (rpcError) {
            console.warn("RPC decrement_stock failed in service, using manual fallback.", rpcError);
            const { data: currentStock } = await supabase
              .from("stock")
              .select("quantity")
              .eq("product_id", part.id)
              .eq("branch_id", targetBranch)
              .maybeSingle();

            const oldQty = currentStock?.quantity || 0;
            const newQty = Math.max(0, oldQty - part.qty);

            await supabase.from("stock").upsert(
              {
                product_id: part.id,
                branch_id: targetBranch,
                quantity: newQty,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "product_id,branch_id" }
            );
          }
        }
      }
    }

    return { success: true, data: ticket };
  } catch (err) {
    console.error("Error creating service ticket:", err);
    return { success: false, error: err.message };
  }
}

// Update service ticket status
export async function updateServiceStatus(ticketId, newStatus) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Get the ticket
    const { data: ticket, error: fetchError } = await supabase
      .from("service_tickets")
      .select("*, service_ticket_parts(*)")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticket) throw new Error("Ticket tidak ditemukan");

    // If changing to 'cancelled', restore stock
    if (newStatus === "cancelled" && ticket.status !== "cancelled") {
      for (const part of ticket.service_ticket_parts || []) {
        if (!part.product_id || !ticket.branch_id) continue;

        const { error: rpcError } = await supabase.rpc("increment_stock", {
          p_product_id: part.product_id,
          p_branch_id: ticket.branch_id,
          p_quantity: part.quantity
        });

        // Fallback
        if (rpcError) {
          console.warn("RPC increment_stock failed, manual fallback.", rpcError);
          const { data: currentStock } = await supabase
            .from("stock")
            .select("quantity")
            .eq("product_id", part.product_id)
            .eq("branch_id", ticket.branch_id)
            .maybeSingle();

          await supabase.from("stock").upsert({
            product_id: part.product_id,
            branch_id: ticket.branch_id,
            quantity: (currentStock?.quantity || 0) + part.quantity,
            updated_at: new Date().toISOString()
          }, { onConflict: "product_id,branch_id" });
        }
      }
    }

    // If changing from 'cancelled' to something else, re-deduct stock? 
    // Usually cancelled is final. We'll leave this edge case for now.

    const updateData = { status: newStatus };
    if (newStatus === "done") updateData.completed_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("service_tickets")
      .update(updateData)
      .eq("id", ticketId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (err) {
    console.error("Error updating service status:", err);
    return { success: false, error: err.message };
  }
}
