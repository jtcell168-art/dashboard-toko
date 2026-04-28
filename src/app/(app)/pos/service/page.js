"use client";

import { useState, useCallback } from "react";
import Stepper from "@/components/ui/Stepper";

const STEPS = [
  { label: "Input Data" },
  { label: "Keluhan" },
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
};

export default function ServicePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

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
    if (step === 2) {
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

  const handleSubmit = () => {
    alert("Tiket servis berhasil dibuat! (akan terintegrasi dengan Supabase)");
    setCurrentStep(0);
    setFormData(initialFormData);
  };

  const formatCurrency = (value) => {
    const num = value.replace(/\D/g, "");
    return num ? new Intl.NumberFormat("id-ID").format(Number(num)) : "";
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 stagger-children">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Service Ticket</h1>
        <p className="text-sm text-white/40 mt-0.5">Buat tiket servis perangkat baru.</p>
      </div>

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
          <Step3Estimasi formData={formData} errors={errors} updateField={updateField} formatCurrency={formatCurrency} />
        )}
        {currentStep === 3 && (
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
            className="flex-1 btn-gradient py-3.5 flex items-center justify-center gap-2 text-base"
            style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)" }}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Buat Tiket Servis</span>
          </button>
        )}
      </div>
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
  return (
    <section className="glass-card p-4 flex flex-col gap-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">calculate</span>
        <h3 className="text-lg font-semibold text-white">Estimasi Biaya</h3>
      </div>
      <FormField label="Estimasi Biaya Servis" required error={errors.estimatedCost}>
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
      {formData.estimatedCost && (
        <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))", border: "1px solid rgba(16,185,129,0.15)" }}>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Estimasi Biaya</span><span className="text-white font-semibold tabular-nums">Rp {formatCurrency(formData.estimatedCost)}</span></div>
          {formData.dpAmount && (<div className="flex items-center justify-between text-sm"><span className="text-slate-400">Uang Muka (DP)</span><span className="text-emerald-400 font-semibold tabular-nums">- Rp {formatCurrency(formData.dpAmount)}</span></div>)}
          <div className="h-px bg-white/10 my-1" />
          <div className="flex items-center justify-between text-sm"><span className="text-slate-300 font-medium">Sisa Bayar</span><span className="text-white font-bold tabular-nums text-base">Rp {formatCurrency(String(Math.max(0, Number(formData.estimatedCost || 0) - Number(formData.dpAmount || 0))))}</span></div>
        </div>
      )}
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

      <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
        <div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span><h4 className="text-sm font-semibold text-white">Biaya</h4></div>
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Estimasi</span><span className="text-white font-semibold tabular-nums">Rp {formatCurrency(formData.estimatedCost)}</span></div>
        {formData.dpAmount && (<div className="flex items-center justify-between text-sm"><span className="text-slate-400">DP</span><span className="text-emerald-400 font-semibold tabular-nums">Rp {formatCurrency(formData.dpAmount)}</span></div>)}
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Estimasi Waktu</span><span className="text-white font-medium">{formData.estimatedDays} hari kerja</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Garansi</span><span className="text-white font-medium">{formData.warrantyDays} hari</span></div>
      </div>

      <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
        <span className="material-symbols-outlined text-amber-400 text-[16px] mt-0.5">gavel</span>
        <p className="text-xs text-amber-200/80 leading-relaxed font-medium">Dengan membuat tiket ini, customer menyetujui estimasi biaya dan waktu pengerjaan. Biaya final dapat berubah setelah pengecekan oleh teknisi.</p>
      </div>
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
