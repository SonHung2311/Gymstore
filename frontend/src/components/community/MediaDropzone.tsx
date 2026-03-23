import { useRef, useState } from "react";
import { uploadApi } from "../../api/community";
import { detectMediaType, getYouTubeId, isExternalLink, isYouTubeEmbed, resolveMediaUrl } from "../../utils/media";
import LinkPreviewCard from "./LinkPreviewCard";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm";

interface Props {
  mediaUrl: string;
  mediaType: "image" | "video" | "link" | null;
  onChange: (url: string, type: "image" | "video" | "link") => void;
  onClear: () => void;
}

export default function MediaDropzone({ mediaUrl, mediaType, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadApi.uploadMedia(file, setProgress);
      onChange(res.data.url, res.data.type);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (!url) return;
    const ytId = getYouTubeId(url);
    if (ytId) {
      onChange(`https://www.youtube.com/embed/${ytId}`, "video");
    } else if (isExternalLink(url)) {
      onChange(url, "link");
    } else {
      onChange(url, detectMediaType(url));
    }
    setUrlInput("");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  // Preview when media is set
  if (mediaUrl && !uploading) {
    // External link — show OG preview card
    if (mediaType === "link") {
      return <LinkPreviewCard url={mediaUrl} onClear={onClear} />;
    }

    const fullUrl = resolveMediaUrl(mediaUrl);
    const ytId = isYouTubeEmbed(mediaUrl) ? mediaUrl.split("/embed/")[1]?.split("?")[0] : null;
    return (
      <div className="relative rounded-xl overflow-hidden bg-black">
        {ytId ? (
          <iframe
            src={`${fullUrl}?autoplay=0`}
            title="YouTube preview"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video"
          />
        ) : mediaType === "video" ? (
          <video src={fullUrl} controls className="w-full max-h-72 object-contain" />
        ) : (
          <img src={fullUrl} alt="preview" className="w-full max-h-72 object-cover" />
        )}
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg leading-none transition-colors"
          title="Xóa"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors min-h-36 px-4
          ${dragging ? "border-primary bg-primary/5" : "border-light hover:border-primary/50 hover:bg-surface"}`}
      >
        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-full border-4 border-light border-t-primary animate-spin" />
            <p className="text-sm text-gray-500">Đang tải lên... {progress}%</p>
            <div className="w-full max-w-xs h-1.5 bg-light rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-dark">Kéo thả ảnh hoặc video vào đây</p>
              <p className="text-xs text-gray-400 mt-0.5">hoặc nhấn để chọn file</p>
              <p className="text-xs text-gray-300 mt-1">JPG, PNG, GIF, WebP, MP4, WebM · Ảnh ≤10MB · Video ≤100MB</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* URL / YouTube paste */}
      <div className="flex gap-2 mt-2">
        <input
          className="input text-sm flex-1"
          placeholder="Hoặc dán link ảnh, video, YouTube..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleUrlSubmit(); }}
        />
        <button
          type="button"
          disabled={!urlInput.trim()}
          onClick={handleUrlSubmit}
          className="btn-secondary text-sm px-3 disabled:opacity-40"
        >
          Dùng link
        </button>
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInputChange} />
    </div>
  );
}
