import { useRef, useState } from "react";
import { uploadApi } from "../../api/community";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const API_BASE = import.meta.env.VITE_API_URL || "";

interface Props {
  value: string | null;
  onChange: (url: string) => void;
}

export default function AvatarDropzone({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Chỉ hỗ trợ ảnh"); return; }
    setError("");
    setUploading(true);
    try {
      const res = await uploadApi.uploadMedia(file);
      onChange(res.data.url);
    } catch {
      setError("Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const fullUrl = value ? (value.startsWith("http") ? value : `${API_BASE}${value}`) : null;

  return (
    <div className="flex items-center gap-4">
      {/* Circle preview / placeholder */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative w-20 h-20 rounded-full shrink-0 cursor-pointer overflow-hidden border-2 border-dashed transition-colors flex items-center justify-center
          ${dragging ? "border-primary bg-primary/5" : "border-light hover:border-primary/50"}`}
      >
        {uploading ? (
          <div className="w-6 h-6 border-2 border-light border-t-primary rounded-full animate-spin" />
        ) : fullUrl ? (
          <img src={fullUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        )}

        {/* Camera overlay on hover */}
        {!uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 leading-relaxed">
        <p>Nhấn hoặc kéo thả ảnh vào đây</p>
        <p>JPG, PNG, GIF, WebP · Tối đa 10MB</p>
        {error && <p className="text-red-500 mt-1">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}
