"use client";
import { formatRupiah } from "@/data/mockData";

export default function Payslip({ data, onClose }) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const total = (Number(data.base_salary) || 0) + (Number(data.bonus) || 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Preview Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">description</span>
            Preview Slip Gaji
          </h3>
          <button onClick={onClose} className="hover:text-red-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Slip Content (This is what gets printed) */}
        <div id="payslip-content" className="p-8 bg-white print:p-0">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900">JT CELL GROUP</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Smart POS & Service Center</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-slate-900 uppercase">Slip Gaji</h2>
              <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Nama Karyawan</p>
              <p className="font-bold text-slate-800">{data.employee_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Jabatan</p>
              <p className="font-bold text-slate-800">{data.employee_role}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Periode</p>
              <p className="font-bold text-slate-800">{data.notes || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Tanggal Cetak</p>
              <p className="font-bold text-slate-800">{new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Gaji Pokok</span>
              <span className="font-mono font-bold text-slate-900">{formatRupiah(data.base_salary)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Bonus / Komisi</span>
              <span className="font-mono font-bold text-slate-900">{formatRupiah(data.bonus)}</span>
            </div>
            <div className="flex justify-between py-4 bg-slate-50 px-4 rounded-xl mt-4">
              <span className="font-bold text-slate-900">TOTAL DITERIMA</span>
              <span className="font-mono font-black text-indigo-600 text-lg">{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-12">Penerima,</p>
              <div className="w-32 border-b border-slate-300 mx-auto"></div>
              <p className="text-[10px] mt-1 font-bold text-slate-800">{data.employee_name}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-12">Admin JT Cell,</p>
              <div className="w-32 border-b border-slate-300 mx-auto"></div>
              <p className="text-[10px] mt-1 font-bold text-slate-800">Finance Manager</p>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-dashed border-slate-200 text-center">
            <p className="text-[9px] text-slate-400 italic">Terima kasih atas dedikasi Anda pada JT Cell Group.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
          >
            Tutup
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-3 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payslip-content, #payslip-content * {
            visibility: visible;
          }
          #payslip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
