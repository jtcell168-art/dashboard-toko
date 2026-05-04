"use client";
import { useState, useId } from "react";
import { uploadFile } from "@/lib/supabase/upload";

export default function ImageUpload({ onUploadComplete, label = "Upload Bukti" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputId = useId();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran file (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      alert("Hanya file gambar yang diperbolehkan.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    const url = await uploadFile(file);
    setIsUploading(false);

    if (url) {
      onUploadComplete(url);
    } else {
      alert("Gagal mengunggah gambar. Pastikan koneksi stabil dan ukuran file tidak terlalu besar.");
      setPreview(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] uppercase font-bold text-white/40 ml-1">{label}</label>
      <div className="relative group">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
          disabled={isUploading}
        />
        <label
          htmlFor={inputId}
          className={`flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/5 hover:border-indigo-500/30 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} ${preview ? 'p-1 border-indigo-500/50 bg-indigo-500/5' : ''}`}
        >
          {preview ? (
            <div className="relative w-full">
              <img src={preview} alt="Preview" className="w-full h-32 object-contain rounded-lg" />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-lg">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-white/40 group-hover:text-white/60">
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{isUploading ? 'Mengunggah...' : 'Klik untuk Upload'}</span>
            </div>
          )}
        </label>
        {preview && !isUploading && (
          <button 
            type="button"
            onClick={() => { setPreview(null); onUploadComplete(null); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors z-10"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
