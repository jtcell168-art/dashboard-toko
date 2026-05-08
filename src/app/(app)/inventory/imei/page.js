"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Scanner from "@/components/Scanner";
import { updateImeiRecord, deleteImeiRecord } from "@/app/actions/inventory";
import { getBranches } from "@/app/actions/branches";
import { getCurrentUser } from "@/app/actions/auth";

const statusMap = { 
  service: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Servis" }, 
  sold: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Terjual" }, 
  stock: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Stok" },
  transfer: { bg: "rgba(139,92,246,0.12)", color: "#A78BFA", label: "Transfer" }
};

export default function IMEITrackingPage() {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [user, setUser] = useState(null);
  
  // Edit State
  const [editingRecord, setEditingRecord] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser();
      setUser(u);
      const b = await getBranches();
      setBranches(b);
    }
    init();
  }, []);

  const loadImeiData = async () => {
    if (!search || search.length < 3) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("imei_records")
      .select(`
        id,
        imei,
        status,
        branch_id,
        customer_name,
        last_action,
        created_at,
        products ( id, name ),
        branches ( name )
      `)
      .ilike("imei", `%${search}%`)
      .limit(50);

    if (error) {
      console.error("Error fetching IMEI:", error);
      setRecords([]);
    } else {
      const mapped = data.map(item => ({
        id: item.id,
        imei: item.imei,
        product: item.products?.name || "Produk Tidak Dikenal",
        productId: item.products?.id,
        status: item.status,
        branchId: item.branch_id,
        branch: item.branches?.name || "Cabang Tidak Dikenal",
        customer: item.customer_name || "—",
        lastAction: item.last_action || (item.status === "stock" ? "Masuk Stok" : item.status),
        date: new Date(item.created_at).toLocaleDateString("id-ID")
      }));
      setRecords(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadImeiData();
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [search]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateImeiRecord(editingRecord.originalImei, {
        imei: editingRecord.imei,
        status: editingRecord.status,
        branch_id: editingRecord.branchId,
        customer_name: editingRecord.customer === "—" ? null : editingRecord.customer
      });
      if (res.success) {
        alert("IMEI berhasil diupdate!");
        setEditingRecord(null);
        loadImeiData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (imei) => {
    if (!confirm(`Yakin ingin menghapus IMEI ${imei}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await deleteImeiRecord(imei);
      if (res.success) {
        alert("IMEI dihapus!");
        loadImeiData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = records;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Tracking IMEI</h1>
          <p className="text-sm text-white/40 mt-0.5">Lacak dan update status perangkat berdasarkan IMEI</p>
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">qr_code_scanner</span>
        <input className="input-field pl-10 pr-12" placeholder="Cari IMEI, produk, atau customer..." value={search} onChange={e => setSearch(e.target.value)} />
        <button 
          onClick={() => setShowScanner(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
        </button>
      </div>

      {showScanner && (
        <Scanner 
          onScan={(val) => {
            setSearch(val);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>IMEI</th>
                <th>Produk</th>
                <th>Status</th>
                <th>Cabang</th>
                <th>Customer</th>
                <th>Tanggal</th>
                {(user?.role === 'owner' || user?.role === 'manager') && <th style={{ textAlign: "center" }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-12 text-white/30 animate-pulse">Memuat data IMEI...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-white/30">
                  {search.length < 3 ? "Ketik minimal 3 digit IMEI untuk mencari" : "Tidak ada data IMEI ditemukan."}
                </td></tr>
              ) : filtered.map(r => { 
                const s = statusMap[r.status] || statusMap.stock; 
                return (
                  <tr key={r.imei}>
                    <td><code className="text-[11px] font-mono text-white/60">{r.imei}</code></td>
                    <td>
                      <p className="text-sm font-semibold text-white">{r.product}</p>
                      <p className="text-[10px] text-white/20 uppercase font-bold">{r.lastAction}</p>
                    </td>
                    <td><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></td>
                    <td className="text-xs text-white/50">{r.branch}</td>
                    <td className="text-xs text-white/60">{r.customer}</td>
                    <td className="text-xs text-white/30">{r.date}</td>
                    {(user?.role === 'owner' || user?.role === 'manager') && (
                      <td style={{ textAlign: "center" }}>
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => setEditingRecord({ ...r, originalImei: r.imei })}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-indigo-400 transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {user?.role === 'owner' && (
                            <button 
                              onClick={() => handleDelete(r.imei)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ); 
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {isLoading ? (
            <div className="text-center py-12 text-white/30 animate-pulse">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-white/30">Belum ada data.</div>
          ) : filtered.map(r => { 
            const s = statusMap[r.status] || statusMap.stock; 
            return (
              <div key={r.imei} className="px-4 py-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.product}</p>
                    <p className="text-[10px] font-mono text-white/30">{r.imei}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/40">{r.branch} · {r.date}</span>
                  {(user?.role === 'owner' || user?.role === 'manager') && (
                    <button 
                      onClick={() => setEditingRecord({ ...r, originalImei: r.imei })}
                      className="text-indigo-400 font-bold"
                    >
                      EDIT
                    </button>
                  )}
                </div>
              </div>
            ); 
          })}
        </div>
        <div className="px-4 py-3 border-t border-white/[0.04]"><p className="text-[11px] text-white/30">{filtered.length} perangkat ditemukan</p></div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Update Stok IMEI</h3>
                <p className="text-xs text-white/40">{editingRecord.product}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/30 uppercase ml-1">Nomor IMEI</label>
                <input 
                  className="input-field font-mono uppercase tracking-widest"
                  value={editingRecord.imei}
                  onChange={e => setEditingRecord({...editingRecord, imei: e.target.value})}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/30 uppercase ml-1">Status</label>
                <select 
                  className="input-field"
                  value={editingRecord.status}
                  onChange={e => setEditingRecord({...editingRecord, status: e.target.value})}
                >
                  <option value="stock">Stok (Available)</option>
                  <option value="sold">Terjual (Sold)</option>
                  <option value="service">Servis (In Service)</option>
                  <option value="transfer">Transfer (In Transit)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/30 uppercase ml-1">Lokasi Cabang</label>
                <select 
                  className="input-field"
                  value={editingRecord.branchId}
                  onChange={e => setEditingRecord({...editingRecord, branchId: e.target.value})}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/30 uppercase ml-1">Customer (Opsional)</label>
                <input 
                  className="input-field"
                  placeholder="Nama pembeli / pemilik"
                  value={editingRecord.customer === "—" ? "" : editingRecord.customer}
                  onChange={e => setEditingRecord({...editingRecord, customer: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 btn-gradient py-3 text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

