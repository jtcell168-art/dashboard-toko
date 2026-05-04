"use client";
import { useState } from "react";
import { uploadFile } from "@/lib/supabase/upload";

export default function ImageUpload({ onUploadComplete, label = "Upload Bukti" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      alert("Gagal mengunggah gambar");
      setPreview(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/40">{label}</label>
      <div className="relative group">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="image-upload"
          className={`flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-32 object-contain rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white/40 group-hover:text-white/60">
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
              <span className="text-[10px] font-medium">{isUploading ? 'Mengunggah...' : 'Klik untuk Upload'}</span>
            </div>
          )}
        </label>
        {preview && !isUploading && (
          <button 
            onClick={() => { setPreview(null); onUploadComplete(null); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
