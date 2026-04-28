"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "kasir" },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Akun berhasil dibuat! Silakan cek email untuk verifikasi, atau langsung login.");
    setIsLogin(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0A0E1A 0%, #1a1040 50%, #0A0E1A 100%)" }}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full filter blur-[120px] opacity-10" style={{ background: "#6366F1" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full filter blur-[120px] opacity-10" style={{ background: "#8B5CF6" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            L
          </div>
          <h1 className="text-2xl font-bold text-white">Lumina ERP</h1>
          <p className="text-sm text-white/40 mt-1">Smart POS & Service Management</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(17, 24, 39, 0.8)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "rgba(255,255,255,0.04)" }}>
            <button onClick={() => { setIsLogin(true); setError(""); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all" style={isLogin ? { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" } : { color: "rgba(255,255,255,0.4)" }}>
              Login
            </button>
            <button onClick={() => { setIsLogin(false); setError(""); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all" style={!isLogin ? { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" } : { color: "rgba(255,255,255,0.4)" }}>
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#F87171" }}>
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", color: "#34D399" }}>
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {success}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/40 font-medium">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-white/20">person</span>
                  <input className="input-field pl-10" placeholder="Nama lengkap" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 font-medium">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-white/20">mail</span>
                <input className="input-field pl-10" type="email" placeholder="email@jtcell.id" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 font-medium">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-white/20">lock</span>
                <input className="input-field pl-10" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gradient py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>
              ) : isLogin ? (
                <><span className="material-symbols-outlined text-[18px]">login</span>Masuk</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">person_add</span>Daftar</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-6">© 2026 Lumina ERP. All rights reserved.</p>
      </div>
    </div>
  );
}
