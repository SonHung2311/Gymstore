import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communityApi } from "../../api/community";
import { useAuthStore } from "../../store/authStore";
import { TAG_COLORS } from "../../constants/tags";
import type { Post } from "../../types";
import { isExternalLink, isYouTubeEmbed, resolveMediaUrl, youTubeThumbnail } from "../../utils/media";

function isUploadedVideo(url: string) { return /\.(mp4|webm)(\?|$)/i.test(url); }
function getYtId(url: string) { return url.split("/embed/")[1]?.split("?")[0] ?? ""; }

function OgThumbnail({ url, title, gradient }: { url: string; title: string; gradient: string }) {
  const { data } = useQuery({
    queryKey: ["og-preview", url],
    queryFn: () => communityApi.getOgPreview(url).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  if (data?.image) {
    return <img src={data.image} alt={title} className="w-full h-full object-cover" />;
  }
  // Fallback: gradient + link icon
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 p-3`}>
      {data?.favicon
        ? <img src={data.favicon} alt="" className="w-8 h-8 rounded" />
        : <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
      }
      <p className="text-white/80 text-xs text-center line-clamp-2 leading-tight">{data?.site_name || new URL(url).hostname}</p>
    </div>
  );
}

const GRADIENTS = [
  "from-orange-400 to-red-500",
  "from-blue-400 to-purple-500",
  "from-green-400 to-teal-500",
  "from-yellow-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-indigo-400 to-blue-500",
];

function getGradient(id: string) {
  return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length];
}

function AuthorAvatar({ avatar, name }: { avatar: string | null; name: string | null }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name ?? "?")[0].toUpperCase();
  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt={name ?? ""}
        onError={() => setImgError(true)}
        className="w-6 h-6 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
      {initials}
    </span>
  );
}

interface Props {
  post: Post;
}

export default function PostGridCard({ post }: Props) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [imgError, setImgError] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => communityApi.toggleLike(post.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    likeMutation.mutate();
  };

  const firstTag = post.tags[0];

  return (
    <article
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-light hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/community/posts/${post.id}`)}
    >
      {/* Square image / gradient */}
      <div className="relative aspect-square overflow-hidden">
        {post.image_url && !imgError ? (
          isExternalLink(post.image_url) ? (
            <OgThumbnail url={post.image_url} title={post.title} gradient={getGradient(post.id)} />
          ) : isYouTubeEmbed(post.image_url) ? (
            /* YouTube: show thumbnail + play icon (no iframe in grid) */
            <div className="w-full h-full relative bg-black">
              <img
                src={youTubeThumbnail(getYtId(post.image_url))}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-red-600/90 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : isUploadedVideo(post.image_url) ? (
            <div className="w-full h-full relative bg-black">
              <video src={resolveMediaUrl(post.image_url)} className="w-full h-full object-cover" muted preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={resolveMediaUrl(post.image_url)}
              alt={post.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient(post.id)}`} />
        )}

        {/* Hover overlay with counts */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.like_count}
          </span>
          <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
            </svg>
            {post.comment_count}
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3 space-y-2">
        {firstTag && (
          <span className={`badge text-xs ${TAG_COLORS[firstTag] ?? "bg-gray-100 text-gray-600"}`}>
            {firstTag}
          </span>
        )}
        <p className="font-semibold text-sm text-dark line-clamp-2 leading-snug">{post.title}</p>

        <div className="flex items-center justify-between pt-1">
          {/* Author */}
          <Link
            to={`/community/profile/${post.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 min-w-0 hover:opacity-75 transition-opacity"
          >
            <AuthorAvatar avatar={post.author.avatar} name={post.author.full_name} />
            <span className="text-xs text-gray-500 truncate">{post.author.full_name ?? "Ẩn danh"}</span>
          </Link>

          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1 text-xs transition-colors ${post.liked_by_me ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
          >
            <svg className="w-4 h-4" fill={post.liked_by_me ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.like_count}
          </button>
        </div>
      </div>
    </article>
  );
}
