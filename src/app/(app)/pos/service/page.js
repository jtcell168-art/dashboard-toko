"use client";

import { useState, useCallback, useEffect } from "react";
import Stepper from "@/components/ui/Stepper";
import { getSpareparts, createServiceTicket } from "@/app/actions/service";
import { addProduct } from "@/app/actions/inventory";
import { useBranch } from "@/context/BranchContext";
import ServiceTracking from "@/components/pos/ServiceTracking";
import { formatRupiah } from "@/data/mockData";

const STEPS = [
  { label: "Input Data" },
  { label: "Keluhan" },
  { label: "Sparepart" },
  { label: "Estimasi" },
  { label: "Konfirmasi" },
];

const DEVICE_TYPES = [
  { value: "iphone", label: "Apple iPhone" },
  { value: "samsung", label: "Samsung Galaxy" },
  { value: "xiaomi", label: "Xiaomi / Redmi" },
  { value: "oppo", label: "Oppo" },
  { value: "vivo", label: "Vivo" },
  { value: "other", label: "Other" },
];

const COMMON_ISSUES = [
  { id: "lcd_crack", label: "LCD Retak / Pecah", icon: "broken_image" },
  { id: "battery", label: "Baterai Kembung / Boros", icon: "battery_alert" },
  { id: "charging", label: "Tidak Bisa Cas", icon: "power_off" },
  { id: "speaker", label: "Speaker / Mic Rusak", icon: "volume_off" },
  { id: "camera", label: "Kamera Error", icon: "no_photography" },
  { id: "software", label: "Software / Hang", icon: "sync_problem" },
  { id: "water", label: "Kena Air / Lembab", icon: "water_drop" },
  { id: "button", label: "Tombol Tidak Fungsi", icon: "touch_app" },
];

const initialFormData = {
  customerName: "",
  phoneNumber: "",
  deviceType: "",
  imeiSerial: "",
  selectedIssues: [],
  keluhanDetail: "",
  estimatedCost: "",
  estimatedDays: "1",
  technicianNotes: "",
  warrantyDays: "30",
  dpAmount: "",
  selectedParts: [], // [{ id, name, sku, qty, unitPrice, maxStock }]
};

export default function ServicePage() {
  const { selectedBranch } = useBranch();
  const [activeTab, setActiveTab] = useState("baru"); // 'baru' or 'antrean'
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [spareparts, setSpareparts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPartsLoading(true);
    getSpareparts(selectedBranch).then(data => { setSpareparts(data); setPartsLoading(false); });
  }, [selectedBranch]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const toggleIssue = useCallback((issueId) => {
    setFormData((prev) => ({
      ...prev,
      selectedIssues: prev.selectedIssues.includes(issueId)
        ? prev.selectedIssues.filter((id) => id !== issueId)
        : [...prev.selectedIssues, issueId],
    }));
  }, []);

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.customerName.trim()) newErrors.customerName = "Nama wajib diisi";
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "No. HP wajib diisi";
      if (!formData.imeiSerial.trim()) newErrors.imeiSerial = "IMEI wajib diisi";
    }
    if (step === 1) {
      if (formData.selectedIssues.length === 0 && !formData.keluhanDetail.trim()) {
        newErrors.keluhan = "Pilih minimal 1 keluhan atau isi detail";
      }
    }
    if (step === 3) {
      if (!formData.estimatedCost.trim()) newErrors.estimatedCost = "Estimasi biaya wajib diisi";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const addPart = useCallback((part) => {
    setFormData(prev => {
      const exists = prev.selectedParts.find(p => p.id === part.id);
      if (exists) return prev;
      return { ...prev, selectedParts: [...prev.selectedParts, { id: part.id, name: part.name, sku: part.sku, qty: 1, unitPrice: part.retailPrice || part.purchasePrice, maxStock: part.totalStock }] };
    });
  }, []);

  const updatePartQty = useCallback((partId, qty) => {
    setFormData(prev => ({ ...prev, selectedParts: prev.selectedParts.map(p => p.id === partId ? { ...p, qty: Math.max(1, Math.min(qty, p.maxStock)) } : p) }));
  }, []);

  const removePart = useCallback((partId) => {
    setFormData(prev => ({ ...prev, selectedParts: prev.selectedParts.filter(p => p.id !== partId) }));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const issueLabels = COMMON_ISSUES.filter(i => formData.selectedIssues.includes(i.id)).map(i => i.label);
      const res = await createServiceTicket({
        ...formData,
        selectedIssues: issueLabels,
        parts: formData.selectedParts.map(p => ({ id: p.id, name: p.name, qty: p.qty, unitPrice: p.unitPrice })),
        branchId: selectedBranch,
      });
      if (res.success) {
        alert("Tiket servis berhasil dibuat! Stok sparepart otomatis berkurang.");
        setCurrentStep(0);
        setFormData(initialFormData);
        getSpareparts(selectedBranch).then(setSpareparts);
      } else {
        alert("Gagal: " + res.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    const num = value.replace(/\D/g, "");
    return num ? new Intl.NumberFormat("id-ID").format(Number(num)) : "";
  };

  return (
    <div className={`mx-auto flex flex-col gap-6 stagger-children transition-all duration-300 w-full ${activeTab === "antrean" ? "max-w-6xl" : "max-w-2xl"}`}>
      {/* Header & Tabs */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Service Center</h1>
            <p className="text-sm text-white/40 mt-0.5">Kelola penerimaan dan status tiket servis.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("baru")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "baru" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              Buat Tiket Baru
            </button>
            <button 
              onClick={() => setActiveTab("antrean")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === "antrean" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              Antrean & Riwayat
            </button>
          </div>
        </div>
      </div>

      {activeTab === "antrean" ? (
        <ServiceTracking branchId={selectedBranch} />
      ) : (
        <>
          {/* Stepper */}
          <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Form Content */}
      <div className="animate-fade-slide-up" key={currentStep}>
        {currentStep === 0 && (
          <Step1CustomerDevice formData={formData} errors={errors} updateField={updateField} />
        )}
        {currentStep === 1 && (
          <Step2Keluhan formData={formData} errors={errors} updateField={updateField} toggleIssue={toggleIssue} />
        )}
        {currentStep === 2 && (
          <Step2bSparepart spareparts={spareparts} loading={partsLoading} selectedParts={formData.selectedParts} addPart={addPart} updatePartQty={updatePartQty} removePart={removePart} branchId={selectedBranch} onRefresh={() => getSpareparts(selectedBranch).then(setSpareparts)} />
        )}
        {currentStep === 3 && (
          <Step3Estimasi formData={formData} errors={errors} updateField={updateField} formatCurrency={formatCurrency} />
        )}
        {currentStep === 4 && (
          <Step4Konfirmasi formData={formData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Kembali</span>
          </button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <button onClick={handleNext} className="flex-1 btn-gradient py-3.5 flex items-center justify-center gap-2 text-base">
            <span>Next: {STEPS[currentStep + 1].label}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 btn-gradient py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)" }}
          >
            <span className="material-symbols-outlined text-[18px]">{isSubmitting ? "hourglass_top" : "check_circle"}</span>
            <span>{isSubmitting ? "Memproses..." : "Buat Tiket Servis"}</span>
          </button>
        )}
      </div>
      </>
      )}
    </div>
  );
}

/* ==============================
   STEP 1: Customer Info + Device
   ============================== */
function Step1CustomerDevice({ formData, errors, updateField }) {
  return (
    <section className="glass-card p-4 flex flex-col gap-3 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-indigo-400 text-[20px]">person</span>
        <h3 className="text-lg font-semibold text-white">Customer Info</h3>
      </div>
      <FormField label="Customer Name" required error={errors.customerName}>
        <input className="input-field" placeholder="e.g. Tarson" value={formData.customerName} onChange={(e) => updateField("customerName", e.target.value)} />
      </FormField>
      <FormField label="Phone Number" required error={errors.phoneNumber}>
        <div className="relative flex items-center">
          <div className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 text-[18px]">call</span>
          </div>
          <input className="input-field pl-11" placeholder="0812-XXXX-XXXX" type="tel" value={formData.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} />
        </div>
      </FormField>
      <div className="w-full h-px bg-white/5 my-2" />
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-indigo-400 text-[20px]">devices</span>
        <h3 className="text-lg font-semibold text-white">Device Details</h3>
      </div>
      <FormField label="Device Type">
        <select className="input-field appearance-none" value={formData.deviceType} onChange={(e) => updateField("deviceType", e.target.value)}>
          <option value="" disabled>Select device brand/model</option>
          {DEVICE_TYPES.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
        </select>
      </FormField>
      <FormField label="IMEI / Serial Number" required error={errors.imeiSerial}>
        <div className="relative flex items-center">
          <input className="input-field pr-12 uppercase tracking-wider" placeholder="Enter 15-digit IMEI" value={formData.imeiSerial} onChange={(e) => updateField("imeiSerial", e.target.value)} />
          <button type="button" className="absolute right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 transition-colors">
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
          </button>
        </div>
      </FormField>
      <div className="flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 mt-1">
        <span className="material-symbols-outlined text-indigo-400 text-[16px] mt-0.5">info</span>
        <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">Pastikan IMEI sesuai untuk keperluan garansi dan tracking komponen servis.</p>
      </div>
    </section>
  );
}

/* ==============================
   STEP 2: Keluhan
   ============================== */
function Step2Keluhan({ formData, errors, updateField, toggleIssue }) {
  return (
    <section className="glass-card p-4 flex flex-col gap-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-amber-400 text-[20px]">report_problem</span>
        <h3 className="text-lg font-semibold text-white">Detail Keluhan</h3>
      </div>
      <p className="text-sm text-slate-400 -mt-2">Pilih masalah yang dialami perangkat:</p>
      <div className="grid grid-cols-2 gap-2">
        {COMMON_ISSUES.map((issue) => {
          const isSelected = formData.selectedIssues.includes(issue.id);
          return (
            <button
              key={issue.id}
              onClick={() => toggleIssue(issue.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] ${isSelected ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300" : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:border-white/10"}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isSelected ? "text-indigo-400" : "text-slate-500"}`}>{issue.icon}</span>
              <span className="text-xs font-medium leading-tight">{issue.label}</span>
              {isSelected && <span className="material-symbols-outlined text-[16px] text-indigo-400 ml-auto">check_circle</span>}
            </button>
          );
        })}
      </div>
      <FormField label="Detail Tambahan" error={errors.keluhan}>
        <textarea className="input-field resize-none" rows={4} placeholder="Jelaskan keluhan lebih detail..." value={formData.keluhanDetail} onChange={(e) => updateField("keluhanDetail", e.target.value)} />
      </FormField>
      {formData.selectedIssues.length > 0 && (
        <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
          <span className="material-symbols-outlined text-indigo-400 text-[16px]">checklist</span>
          <p className="text-xs text-indigo-200/80 font-medium">{formData.selectedIssues.length} keluhan dipilih</p>
        </div>
      )}
    </section>
  );
}

/* ==============================
   STEP 3: Estimasi
   ============================== */
function Step3Estimasi({ formData, errors, updateField, formatCurrency }) {
  const partsCost = formData.selectedParts.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);
  const serviceFee = Number(formData.estimatedCost || 0);
  const grandTotal = serviceFee + partsCost;
  const sisaBayar = Math.max(0, grandTotal - Number(formData.dpAmount || 0));

  return (
    <section className="glass-card p-4 flex flex-col gap-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">calculate</span>
        <h3 className="text-lg font-semibold text-white">Estimasi Biaya</h3>
      </div>

      {/* Parts cost auto-summary */}
      {formData.selectedParts.length > 0 && (
        <div className="rounded-xl p-3 bg-violet-500/5 border border-violet-500/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-violet-400 text-[16px]">build</span>
            <span className="text-xs font-bold text-violet-300 uppercase">Biaya Part ({formData.selectedParts.length} item)</span>
          </div>
          {formData.selectedParts.map(p => (
            <div key={p.id} className="flex justify-between text-xs text-white/60 py-0.5">
              <span>{p.name} x{p.qty}</span>
              <span className="tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(p.unitPrice * p.qty)}</span>
            </div>
          ))}
          <div className="h-px bg-violet-500/20 my-1.5" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-violet-300">Subtotal Part</span>
            <span className="text-violet-300 tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(partsCost)}</span>
          </div>
        </div>
      )}

      <FormField label="Biaya Jasa Servis (Ongkos Kerja)" required error={errors.estimatedCost}>
        <div className="relative flex items-center">
          <div className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none"><span className="text-sm font-semibold text-slate-500">Rp</span></div>
          <input className="input-field pl-12 text-right tabular-nums" placeholder="0" value={formData.estimatedCost ? formatCurrency(formData.estimatedCost) : ""} onChange={(e) => updateField("estimatedCost", e.target.value.replace(/\D/g, ""))} />
        </div>
      </FormField>
      <FormField label="Estimasi Waktu Pengerjaan">
        <div className="flex items-center gap-3">
          <input className="input-field flex-1 text-center tabular-nums" type="number" min="1" max="90" value={formData.estimatedDays} onChange={(e) => updateField("estimatedDays", e.target.value)} />
          <span className="text-sm text-slate-400 font-medium">hari kerja</span>
        </div>
      </FormField>
      <FormField label="Uang Muka / DP (Opsional)">
        <div className="relative flex items-center">
          <div className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none"><span className="text-sm font-semibold text-slate-500">Rp</span></div>
          <input className="input-field pl-12 text-right tabular-nums" placeholder="0" value={formData.dpAmount ? formatCurrency(formData.dpAmount) : ""} onChange={(e) => updateField("dpAmount", e.target.value.replace(/\D/g, ""))} />
        </div>
      </FormField>
      <FormField label="Garansi Servis">
        <select className="input-field appearance-none" value={formData.warrantyDays} onChange={(e) => updateField("warrantyDays", e.target.value)}>
          <option value="0">Tanpa garansi</option>
          <option value="7">7 hari</option>
          <option value="14">14 hari</option>
          <option value="30">30 hari (Standar)</option>
          <option value="90">90 hari</option>
        </select>
      </FormField>
      <FormField label="Catatan Teknisi">
        <textarea className="input-field resize-none" rows={3} placeholder="Catatan internal untuk teknisi..." value={formData.technicianNotes} onChange={(e) => updateField("technicianNotes", e.target.value)} />
      </FormField>

      {/* Grand Total */}
      <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))", border: "1px solid rgba(16,185,129,0.15)" }}>
        {partsCost > 0 && (
          <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Biaya Part</span><span className="text-violet-300 font-semibold tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(partsCost)}</span></div>
        )}
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Biaya Jasa</span><span className="text-white font-semibold tabular-nums">Rp {formatCurrency(formData.estimatedCost || "0")}</span></div>
        {(partsCost > 0 || serviceFee > 0) && <div className="h-px bg-white/10 my-0.5" />}
        <div className="flex items-center justify-between text-sm"><span className="text-emerald-300 font-bold">Total Biaya</span><span className="text-white font-bold tabular-nums text-lg">Rp {new Intl.NumberFormat("id-ID").format(grandTotal)}</span></div>
        {formData.dpAmount && (
          <>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Uang Muka (DP)</span><span className="text-emerald-400 font-semibold tabular-nums">- Rp {formatCurrency(formData.dpAmount)}</span></div>
            <div className="h-px bg-white/10 my-0.5" />
            <div className="flex items-center justify-between text-sm"><span className="text-slate-300 font-medium">Sisa Bayar</span><span className="text-white font-bold tabular-nums text-base">Rp {new Intl.NumberFormat("id-ID").format(sisaBayar)}</span></div>
          </>
        )}
      </div>
    </section>
  );
}

/* ==============================
   STEP 4: Konfirmasi
   ============================== */
function Step4Konfirmasi({ formData }) {
  const formatCurrency = (value) => {
    const num = String(value).replace(/\D/g, "");
    return num ? new Intl.NumberFormat("id-ID").format(Number(num)) : "0";
  };
  const selectedIssueLabels = COMMON_ISSUES.filter((i) => formData.selectedIssues.includes(i.id)).map((i) => i.label);
  const deviceLabel = DEVICE_TYPES.find((d) => d.value === formData.deviceType)?.label || "Tidak dipilih";
  const partsCost = formData.selectedParts.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);

  return (
    <section className="glass-card p-4 flex flex-col gap-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-indigo-400 text-[20px]">fact_check</span>
        <h3 className="text-lg font-semibold text-white">Konfirmasi Tiket</h3>
      </div>
      <p className="text-sm text-slate-400 -mt-2">Periksa detail sebelum membuat tiket servis:</p>

      <SummaryCard icon="person" iconColor="text-indigo-400" title="Customer" items={[{ label: "Nama", value: formData.customerName || "-" }, { label: "No. HP", value: formData.phoneNumber || "-" }]} />
      <SummaryCard icon="smartphone" iconColor="text-violet-400" title="Perangkat" items={[{ label: "Tipe", value: deviceLabel }, { label: "IMEI", value: formData.imeiSerial || "-", mono: true }]} />
      <SummaryCard icon="report_problem" iconColor="text-amber-400" title="Keluhan" items={[{ label: "Masalah", value: selectedIssueLabels.length > 0 ? selectedIssueLabels.join(", ") : "Tidak ada" }, ...(formData.keluhanDetail ? [{ label: "Detail", value: formData.keluhanDetail }] : [])]} />

      {/* Sparepart Summary */}
      {formData.selectedParts.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-violet-400 text-[18px]">build</span><h4 className="text-sm font-semibold text-white">Sparepart ({formData.selectedParts.length})</h4></div>
          {formData.selectedParts.map(p => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{p.name} x{p.qty}</span>
              <span className="text-white font-medium tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(p.unitPrice * p.qty)}</span>
            </div>
          ))}
          <div className="h-px bg-white/10 mt-1" />
          <div className="flex items-center justify-between text-sm"><span className="text-slate-300 font-medium">Total Part</span><span className="text-violet-300 font-bold tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(partsCost)}</span></div>
        </div>
      )}

      <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
        <div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span><h4 className="text-sm font-semibold text-white">Biaya</h4></div>
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Estimasi Servis</span><span className="text-white font-semibold tabular-nums">Rp {formatCurrency(formData.estimatedCost)}</span></div>
        {partsCost > 0 && (<div className="flex items-center justify-between text-sm"><span className="text-slate-400">Biaya Part</span><span className="text-violet-300 font-semibold tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(partsCost)}</span></div>)}
        {formData.dpAmount && (<div className="flex items-center justify-between text-sm"><span className="text-slate-400">DP</span><span className="text-emerald-400 font-semibold tabular-nums">- Rp {formatCurrency(formData.dpAmount)}</span></div>)}
        <div className="h-px bg-white/10 my-1" />
        <div className="flex items-center justify-between text-sm"><span className="text-white font-bold">Total</span><span className="text-white font-bold tabular-nums text-base">Rp {new Intl.NumberFormat("id-ID").format(Number(formData.estimatedCost || 0) + partsCost - Number(formData.dpAmount || 0))}</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Estimasi Waktu</span><span className="text-white font-medium">{formData.estimatedDays} hari kerja</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Garansi</span><span className="text-white font-medium">{formData.warrantyDays} hari</span></div>
      </div>

      {formData.selectedParts.length > 0 && (
        <div className="flex items-start gap-2 bg-violet-500/5 border border-violet-500/10 rounded-lg p-3">
          <span className="material-symbols-outlined text-violet-400 text-[16px] mt-0.5">inventory_2</span>
          <p className="text-xs text-violet-200/80 leading-relaxed font-medium">Stok sparepart yang dipilih akan otomatis dikurangi dari inventaris setelah tiket dibuat.</p>
        </div>
      )}

      <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
        <span className="material-symbols-outlined text-amber-400 text-[16px] mt-0.5">gavel</span>
        <p className="text-xs text-amber-200/80 leading-relaxed font-medium">Dengan membuat tiket ini, customer menyetujui estimasi biaya dan waktu pengerjaan. Biaya final dapat berubah setelah pengecekan oleh teknisi.</p>
      </div>
    </section>
  );
}

/* ==============================
   STEP 2b: Sparepart Picker
   ============================== */
function Step2bSparepart({ spareparts, loading, selectedParts, addPart, updatePartQty, removePart, branchId, onRefresh }) {
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", sku: "", buyPrice: "", sellPrice: "", stock: "1" });
  const [isSaving, setIsSaving] = useState(false);
  const filtered = spareparts.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const partsCost = selectedParts.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);

  const handleQuickAdd = async () => {
    if (!quickForm.name || !quickForm.sku) return alert("Nama dan SKU wajib diisi!");
    setIsSaving(true);
    try {
      const stockMap = {};
      if (branchId && branchId !== "all") stockMap[branchId] = Number(quickForm.stock || 1);
      const res = await addProduct(
        { name: quickForm.name, sku: quickForm.sku.toUpperCase(), category: "Sparepart", purchasePrice: Number(quickForm.buyPrice || 0), retailPrice: Number(quickForm.sellPrice || 0) },
        stockMap, []
      );
      if (res.success) {
        alert(`Part "${quickForm.name}" berhasil ditambahkan ke inventaris!`);
        setQuickForm({ name: "", sku: "", buyPrice: "", sellPrice: "", stock: "1" });
        setShowQuickAdd(false);
        if (onRefresh) onRefresh();
      } else {
        alert("Gagal: " + res.error);
      }
    } catch (err) { alert("Error: " + err.message); }
    finally { setIsSaving(false); }
  };

  return (
    <section className="glass-card p-4 flex flex-col gap-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-violet-400 text-[20px]">build</span>
        <h3 className="text-lg font-semibold text-white">Pilih Sparepart</h3>
      </div>
      <p className="text-sm text-slate-400 -mt-2">Pilih part yang digunakan untuk servis (opsional). Stok akan otomatis berkurang.</p>

      {/* Search + Quick Add Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-white/30">search</span>
          <input className="input-field pl-10" placeholder="Cari sparepart..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowQuickAdd(!showQuickAdd)} className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${showQuickAdd ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}>
          <span className="material-symbols-outlined text-[16px]">{showQuickAdd ? "close" : "add_circle"}</span>
          {showQuickAdd ? "Tutup" : "Part Baru"}
        </button>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="rounded-xl p-4 bg-violet-500/5 border border-violet-500/15 flex flex-col gap-3 animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400 text-[18px]">add_box</span>
            <h4 className="text-sm font-bold text-white">Tambah Part Baru ke Inventaris</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-[10px] text-white/40 uppercase font-bold">Nama Part *</label>
              <input className="input-field text-sm" placeholder="LCD Samsung A54 OEM" value={quickForm.name} onChange={e => setQuickForm({...quickForm, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-[10px] text-white/40 uppercase font-bold">SKU / Kode *</label>
              <input className="input-field text-sm font-mono uppercase" placeholder="SPC-LCD-SA54" value={quickForm.sku} onChange={e => setQuickForm({...quickForm, sku: e.target.value.toUpperCase()})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/40 uppercase font-bold">Harga Beli (Modal)</label>
              <input type="number" className="input-field text-sm" placeholder="0" value={quickForm.buyPrice} onChange={e => setQuickForm({...quickForm, buyPrice: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/40 uppercase font-bold">Harga Jual (Ke Customer)</label>
              <input type="number" className="input-field text-sm" placeholder="0" value={quickForm.sellPrice} onChange={e => setQuickForm({...quickForm, sellPrice: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/40 uppercase font-bold">Stok Awal</label>
              <input type="number" className="input-field text-sm text-center" min="1" value={quickForm.stock} onChange={e => setQuickForm({...quickForm, stock: e.target.value})} />
            </div>
            <div className="flex items-end">
              <button onClick={handleQuickAdd} disabled={isSaving || !quickForm.name || !quickForm.sku} className="btn-gradient w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40">
                <span className="material-symbols-outlined text-[16px]">{isSaving ? "hourglass_top" : "save"}</span>
                {isSaving ? "Menyimpan..." : "Simpan & Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parts List */}
      <div className="max-h-[240px] overflow-y-auto flex flex-col gap-1.5 pr-1">
        {loading ? (
          <div className="py-8 text-center text-white/30 text-sm">Memuat sparepart...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-white/30 text-sm">Tidak ada sparepart ditemukan</div>
        ) : filtered.map(part => {
          const isAdded = selectedParts.some(p => p.id === part.id);
          return (
            <button key={part.id} onClick={() => !isAdded && part.totalStock > 0 && addPart(part)}
              disabled={isAdded || part.totalStock === 0}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${isAdded ? "bg-violet-500/15 border-violet-500/30" : part.totalStock === 0 ? "bg-white/[0.01] border-white/[0.04] opacity-40" : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"}`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-white">{part.name}</span>
                <span className="text-[10px] text-white/30 font-mono">{part.sku} · <span className="text-emerald-400/70">Rp {new Intl.NumberFormat("id-ID").format(part.retailPrice || part.purchasePrice)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${part.totalStock > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  Stok: {part.totalStock}
                </span>
                {isAdded && <span className="material-symbols-outlined text-violet-400 text-[16px]">check_circle</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Parts Cart */}
      {selectedParts.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.04))", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-violet-400 text-[18px]">shopping_cart</span>
            <h4 className="text-sm font-semibold text-white">Part Digunakan ({selectedParts.length})</h4>
          </div>
          {selectedParts.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{p.name}</p>
                <p className="text-[10px] text-white/30">@ Rp {new Intl.NumberFormat("id-ID").format(p.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updatePartQty(p.id, p.qty - 1)} className="w-6 h-6 rounded bg-white/10 text-white/60 flex items-center justify-center text-sm hover:bg-white/20">−</button>
                <span className="text-xs text-white font-bold w-6 text-center tabular-nums">{p.qty}</span>
                <button onClick={() => updatePartQty(p.id, p.qty + 1)} className="w-6 h-6 rounded bg-white/10 text-white/60 flex items-center justify-center text-sm hover:bg-white/20">+</button>
                <button onClick={() => removePart(p.id)} className="ml-1 text-red-400/60 hover:text-red-400"><span className="material-symbols-outlined text-[16px]">delete</span></button>
              </div>
            </div>
          ))}
          <div className="h-px bg-white/10 mt-1" />
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Part</span>
            <span className="text-violet-300 font-bold tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(partsCost)}</span>
          </div>
        </div>
      )}
    </section>
  );
}

/* Shared Components */
function FormField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 ml-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
      {error && (<p className="text-xs text-red-400 ml-1 flex items-center gap-1 animate-fade-in"><span className="material-symbols-outlined text-[14px]">error</span>{error}</p>)}
    </div>
  );
}

function SummaryCard({ icon, iconColor, title, items }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1"><span className={`material-symbols-outlined ${iconColor} text-[18px]`}>{icon}</span><h4 className="text-sm font-semibold text-white">{title}</h4></div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start justify-between text-sm gap-4">
          <span className="text-slate-500 shrink-0">{item.label}</span>
          <span className={`text-white text-right ${item.mono ? "font-mono text-xs tracking-wider" : ""}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
