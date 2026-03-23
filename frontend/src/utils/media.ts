const API_BASE = import.meta.env.VITE_API_URL || "";

/** Extract YouTube video ID from any YouTube URL format */
export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m?.[1] ?? null;
}

export function isYouTubeEmbed(url: string): boolean {
  return url.includes("youtube.com/embed/");
}

export function youTubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function resolveMediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

/** True for external URLs that are not direct media files or YouTube embeds */
export function isExternalLink(url: string): boolean {
  if (!url.startsWith("http")) return false;
  if (isYouTubeEmbed(url)) return false;
  return !/\.(mp4|webm|jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}

export function detectMediaType(url: string): "image" | "video" {
  if (getYouTubeId(url) || isYouTubeEmbed(url)) return "video";
  return /\.(mp4|webm)(\?|$)/i.test(url) ? "video" : "image";
}
