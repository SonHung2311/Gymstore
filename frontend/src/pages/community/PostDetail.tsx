import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { communityApi } from "../../api/community";
import { useAuthStore } from "../../store/authStore";
import Spinner from "../../components/ui/Spinner";
import { TAG_COLORS } from "../../constants/tags";
import { isExternalLink, isYouTubeEmbed, resolveMediaUrl } from "../../utils/media";
import LinkPreviewCard from "../../components/community/LinkPreviewCard";

const GRADIENTS = [
  "from-orange-400 to-red-500",
  "from-blue-400 to-purple-500",
  "from-green-400 to-teal-500",
  "from-yellow-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-indigo-400 to-blue-500",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Avatar({ avatar, name, size = 9, className = "" }: {
  avatar: string | null; name: string | null; size?: number; className?: string;
}) {
  const [err, setErr] = useState(false);
  const initials = (name ?? "?")[0].toUpperCase();
  const sz = `w-${size} h-${size}`;
  if (avatar && !err)
    return <img src={avatar} alt={name ?? ""} onError={() => setErr(true)} className={`${sz} rounded-full object-cover shrink-0 ${className}`} />;
  return (
    <span className={`${sz} rounded-full bg-light flex items-center justify-center text-primary font-bold text-xs shrink-0 ${className}`}>
      {initials}
    </span>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [imgError, setImgError] = useState(false);

  // ── Current post ───────────────────────────────────────────────────────────
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => communityApi.getPost(id!).then((r) => r.data),
    enabled: !!id,
  });

  // ── Post list for prev/next navigation ────────────────────────────────────
  const { data: listData } = useQuery({
    queryKey: ["community-posts-nav"],
    queryFn: () => communityApi.posts({ sort: "new", limit: 50 }).then((r) => r.data),
    staleTime: 60_000,
  });
  const postList = listData?.items ?? [];
  const currentIdx = postList.findIndex((p) => p.id === id);
  const prevPost = currentIdx > 0 ? postList[currentIdx - 1] : null;
  const nextPost = currentIdx >= 0 && currentIdx < postList.length - 1 ? postList[currentIdx + 1] : null;

  // ── Comments ───────────────────────────────────────────────────────────────
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => communityApi.getComments(id!).then((r) => r.data),
    enabled: !!id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => communityApi.toggleLike(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post", id] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => communityApi.addComment(id!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      qc.invalidateQueries({ queryKey: ["post", id] });
      setComment(""); setCommentError("");
    },
    onError: () => setCommentError("Có lỗi xảy ra"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => communityApi.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => communityApi.deletePost(id!),
    onSuccess: () => navigate("/community"),
  });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user) { navigate("/login"); return; }
    commentMutation.mutate(comment.trim());
  };

  // ── States ─────────────────────────────────────────────────────────────────
  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (!post) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Không tìm thấy bài viết</p>
        <Link to="/community" className="btn-primary">← Quay lại cộng đồng</Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.author.id;
  const isAdmin = user?.role === "admin";
  const gradient = GRADIENTS[post.id.charCodeAt(0) % GRADIENTS.length];
  const imageUrl = post.image_url ?? "";
  const isYoutube = isYouTubeEmbed(imageUrl);
  const isLink = isExternalLink(imageUrl);
  const isVideo = isYoutube || /\.(mp4|webm)(\?|$)/i.test(imageUrl);

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between">
        <Link to="/community" className="text-sm text-secondary hover:text-primary inline-flex items-center gap-1.5 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Cộng đồng
        </Link>

        {/* Prev / Next navigation */}
        <div className="flex items-center gap-1">
          <button
            disabled={!prevPost}
            onClick={() => prevPost && navigate(`/community/posts/${prevPost.id}`)}
            title={prevPost?.title}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-light bg-white text-sm text-gray-600 hover:bg-surface hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft />
            <span className="hidden sm:inline">Bài trước</span>
          </button>
          {currentIdx >= 0 && postList.length > 0 && (
            <span className="text-xs text-gray-400 px-2 hidden sm:block">
              {currentIdx + 1} / {postList.length}
            </span>
          )}
          <button
            disabled={!nextPost}
            onClick={() => nextPost && navigate(`/community/posts/${nextPost.id}`)}
            title={nextPost?.title}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-light bg-white text-sm text-gray-600 hover:bg-surface hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Bài sau</span>
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* ── Split layout ───────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)] border-t border-light">

        {/* LEFT — media panel */}
        <div className="lg:w-[48%] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col bg-black">
          {post.image_url && !imgError ? (
            isYoutube ? (
              <iframe src={post.image_url} title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen className="w-full h-full" />
            ) : isLink ? (
              <div className="w-full h-full flex items-center justify-center p-6 bg-surface">
                <div className="w-full max-w-sm"><LinkPreviewCard url={post.image_url} /></div>
              </div>
            ) : isVideo ? (
              <video src={resolveMediaUrl(post.image_url)} controls className="w-full h-full object-contain" />
            ) : (
              <img src={resolveMediaUrl(post.image_url)} alt={post.title}
                onError={() => setImgError(true)} className="w-full h-full object-contain" />
            )
          ) : (
            <div className={`w-full h-full min-h-64 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-10 gap-4`}>
              {/* Tags overlay */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-white font-bold text-2xl text-center leading-snug drop-shadow-sm">{post.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Avatar avatar={post.author.avatar} name={post.author.full_name} size={7} className="ring-2 ring-white/40" />
                <span className="text-white/80 text-sm font-medium">{post.author.full_name}</span>
              </div>
            </div>
          )}

          {/* Like + comment bar (desktop) */}
          <div className="hidden lg:flex items-center gap-5 px-5 py-3 bg-black/80 border-t border-white/10">
            <button
              onClick={() => { if (!user) { navigate("/login"); return; } likeMutation.mutate(); }}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 font-medium text-sm transition-colors ${post.liked_by_me ? "text-red-400" : "text-white/60 hover:text-white"}`}
            >
              <HeartIcon filled={!!post.liked_by_me} />
              {post.like_count}
            </button>
            <span className="flex items-center gap-2 text-white/60 text-sm">
              <ChatIcon />
              {post.comment_count}
            </span>
          </div>
        </div>

        {/* RIGHT — content + comments */}
        <div className="lg:w-[52%] lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)] flex flex-col bg-white">

          {/* Author header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-light bg-white sticky top-0 z-10">
            <Link to={`/community/profile/${post.author.id}`} className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
              <Avatar avatar={post.author.avatar} name={post.author.full_name} size={9} />
              <div>
                <p className="font-semibold text-sm leading-tight">{post.author.full_name ?? "Ẩn danh"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(post.created_at)}</p>
              </div>
            </Link>
            {(isAuthor || isAdmin) && (
              <button
                onClick={() => confirm("Xóa bài viết này?") && deletePostMutation.mutate()}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                Xóa bài
              </button>
            )}
          </div>

          {/* Tags + title + content */}
          <div className="px-5 py-5 border-b border-light">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/community?tag=${encodeURIComponent(tag)}`}
                    className={`badge transition-opacity hover:opacity-75 ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="text-xl font-bold text-dark mb-4 leading-snug">{post.title}</h1>
            <div className="prose prose-sm max-w-none text-dark leading-relaxed
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-primary [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-3 [&_h2]:mb-1.5
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-dark [&_h3]:mt-2 [&_h3]:mb-1
              [&_a]:text-secondary [&_a]:no-underline hover:[&_a]:underline
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500 [&_blockquote]:italic [&_blockquote]:my-2
              [&_code]:bg-light/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_code]:text-xs [&_code]:font-mono
              [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-3
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
              [&_li]:text-sm
              [&_strong]:font-semibold [&_strong]:text-dark
              [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-3
              [&_th]:bg-light/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:border [&_th]:border-light
              [&_td]:px-3 [&_td]:py-1.5 [&_td]:border [&_td]:border-light [&_td]:align-top
              [&_tr:nth-child(even)_td]:bg-surface/50
              [&_hr]:border-light [&_hr]:my-4">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>

          {/* Like row (mobile) */}
          <div className="lg:hidden flex items-center gap-5 px-5 py-3 border-b border-light bg-surface/30">
            <button
              onClick={() => { if (!user) { navigate("/login"); return; } likeMutation.mutate(); }}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 font-medium text-sm transition-colors ${post.liked_by_me ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
            >
              <HeartIcon filled={!!post.liked_by_me} />
              {post.like_count} thích
            </button>
            <span className="flex items-center gap-2 text-gray-400 text-sm">
              <ChatIcon />
              {post.comment_count} bình luận
            </span>
          </div>

          {/* Comments */}
          <div className="flex-1 px-5 py-4">
            <p className="font-semibold text-sm text-dark mb-4">
              Bình luận
              <span className="ml-1.5 text-xs font-normal text-gray-400 bg-light px-1.5 py-0.5 rounded-full">
                {comments.length}
              </span>
            </p>

            {commentsLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ChatIcon />
                <p className="text-sm mt-2">Chưa có bình luận. Hãy là người đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 group">
                    <Link to={`/community/profile/${c.author.id}`} className="shrink-0 mt-0.5">
                      <Avatar avatar={c.author.avatar} name={c.author.full_name} size={8} />
                    </Link>
                    <div className="flex-1 min-w-0 bg-surface/50 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link to={`/community/profile/${c.author.id}`}
                            className="font-semibold text-sm hover:text-primary transition-colors truncate">
                            {c.author.full_name ?? "Ẩn danh"}
                          </Link>
                          <span className="text-xs text-gray-400 shrink-0">{formatDate(c.created_at)}</span>
                        </div>
                        {(user?.id === c.author.id || isAdmin) && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(c.id)}
                            className="text-xs text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment form — sticky bottom */}
          <div className="px-5 py-4 border-t border-light bg-white sticky bottom-0">
            {user ? (
              <form onSubmit={handleComment} className="flex gap-2.5 items-end">
                <Avatar avatar={user.avatar ?? null} name={user.full_name ?? null} size={8} className="mb-0.5 shrink-0" />
                <div className="flex-1 flex gap-2 items-end">
                  <textarea
                    className="input resize-none flex-1 text-sm !py-2 !px-3"
                    rows={1}
                    placeholder="Thêm bình luận..."
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (comment.trim()) commentMutation.mutate(comment.trim()); }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !comment.trim()}
                    className="btn-primary text-sm shrink-0 !py-2"
                  >
                    {commentMutation.isPending ? "..." : "Gửi"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-1">
                <Link to="/login" className="text-sm text-secondary hover:text-primary font-medium">
                  Đăng nhập để bình luận
                </Link>
              </div>
            )}
            {commentError && <p className="text-red-500 text-xs mt-1.5">{commentError}</p>}
            <p className="text-xs text-gray-300 mt-1.5 text-right hidden sm:block">Enter để gửi · Shift+Enter xuống dòng</p>
          </div>

        </div>
      </div>

      {/* ── Prev/Next preview bar (bottom) ────────────────────────────────── */}
      {(prevPost || nextPost) && (
        <div className="border-t border-light bg-surface/40 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {prevPost ? (
            <Link to={`/community/posts/${prevPost.id}`}
              className="flex items-center gap-2.5 group flex-1 min-w-0 hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-light flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <ChevronLeft />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Bài trước</p>
                <p className="text-sm font-medium truncate">{prevPost.title}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {nextPost ? (
            <Link to={`/community/posts/${nextPost.id}`}
              className="flex items-center gap-2.5 group flex-1 min-w-0 justify-end text-right hover:text-primary transition-colors">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Bài sau</p>
                <p className="text-sm font-medium truncate">{nextPost.title}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-light flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <ChevronRight />
              </div>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      )}

    </div>
  );
}
