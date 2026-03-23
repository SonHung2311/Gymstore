import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../../api/community";

interface Props {
  url: string;
  onClear?: () => void;
}

export default function LinkPreviewCard({ url, onClear }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["og-preview", url],
    queryFn: () => communityApi.getOgPreview(url).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 rounded-xl border border-light p-3 animate-pulse">
        <div className="w-24 h-16 rounded-lg bg-light shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-light rounded w-3/4" />
          <div className="h-3 bg-light rounded w-1/2" />
        </div>
      </div>
    );
  }

  const title = data?.title || new URL(url).hostname;
  const siteName = data?.site_name || new URL(url).hostname;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="relative flex gap-3 rounded-xl border border-light hover:border-primary/40 hover:bg-surface transition-colors overflow-hidden group"
    >
      {/* Thumbnail */}
      {data?.image ? (
        <img
          src={data.image}
          alt={title}
          className="w-28 h-20 object-cover shrink-0"
        />
      ) : (
        <div className="w-28 h-20 bg-light flex items-center justify-center shrink-0">
          {data?.favicon ? (
            <img src={data.favicon} alt="" className="w-8 h-8" />
          ) : (
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          )}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 py-2 pr-3 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
          {data?.favicon && <img src={data.favicon} alt="" className="w-3.5 h-3.5 inline" />}
          {siteName}
        </p>
        <p className="text-sm font-semibold text-dark line-clamp-2 leading-snug">{title}</p>
        {data?.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{data.description}</p>
        )}
      </div>

      {/* Clear button (only shown when onClear is passed — i.e. in dropzone) */}
      {onClear && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
          className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none transition-colors"
          title="Xóa"
        >
          ×
        </button>
      )}
    </a>
  );
}
