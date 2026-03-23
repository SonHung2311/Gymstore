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
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AuthorAvatar({ avatar, name, size = 9 }: { avatar: string | null; name: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name ?? "?")[0].toUpperCase();
  const sizeClass = `w-${size} h-${size}`;
  if (avatar && !imgError) {
    return <img src={avatar} alt={name ?? ""} onError={() => setImgError(true)} className={`${sizeClass} rounded-full object-cover shrink-0`} />;
  }
  return (
    <span className={`${sizeClass} rounded-full bg-light flex items-center justify-center text-primary font-bold text-xs shrink-0`}>
      {initials}
    </span>
  );
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [imgError, setImgError] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => communityApi.getPost(id!).then((r) => r.data),
    enabled: !!id,
  });

  const imageUrl = post?.image_url ?? "";
  const isYoutube = isYouTubeEmbed(imageUrl);
  const isLink = isExternalLink(imageUrl);
  const isVideo = isYoutube || /\.(mp4|webm)(\?|$)/i.test(imageUrl);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => communityApi.getComments(id!).then((r) => r.data),
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: () => communityApi.toggleLike(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post", id] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => communityApi.addComment(id!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      qc.invalidateQueries({ queryKey: ["post", id] });
      setComment("");
      setCommentError("");
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <Link to="/community" className="text-sm text-secondary hover:text-primary inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại cộng đồng
        </Link>
      </div>

      {/* Instagram-style split layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)] border-t border-light">

        {/* LEFT — Image panel */}
        <div className="lg:w-1/2 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col bg-black">
          {post.image_url && !imgError ? (
            isYoutube ? (
              <iframe
                src={post.image_url}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : isLink ? (
              <div className="w-full h-full flex items-center justify-center p-6 bg-surface">
                <div className="w-full max-w-sm">
                  <LinkPreviewCard url={post.image_url} />
                </div>
              </div>
            ) : isVideo ? (
              <video
                src={resolveMediaUrl(post.image_url)}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={resolveMediaUrl(post.image_url)}
                alt={post.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className={`w-full h-full min-h-64 bg-gradient-to-br ${gradient} flex items-center justify-center p-8`}>
              <p className="text-white font-bold text-xl text-center leading-snug">{post.title}</p>
            </div>
          )}

          {/* Like + comment counts at bottom of left panel (desktop) */}
          <div className="hidden lg:flex items-center gap-5 px-5 py-3 bg-black/80 border-t border-white/10">
            <button
              onClick={() => { if (!user) { navigate("/login"); return; } likeMutation.mutate(); }}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 font-medium text-sm transition-colors ${
                post.liked_by_me ? "text-red-400" : "text-white/70 hover:text-white"
              }`}
            >
              <svg className="w-6 h-6" fill={post.liked_by_me ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.like_count}
            </button>
            <span className="flex items-center gap-2 text-white/70 text-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
              </svg>
              {post.comment_count}
            </span>
          </div>
        </div>

        {/* RIGHT — Content + comments panel */}
        <div className="lg:w-1/2 lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)] flex flex-col bg-white">

          {/* Author header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-light">
            <Link
              to={`/community/profile/${post.author.id}`}
              className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
            >
              <AuthorAvatar avatar={post.author.avatar} name={post.author.full_name} size={9} />
              <div>
                <p className="font-semibold text-sm">{post.author.full_name ?? "Ẩn danh"}</p>
                <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
              </div>
            </Link>

            {(isAuthor || isAdmin) && (
              <button
                onClick={() => confirm("Xóa bài viết này?") && deletePostMutation.mutate()}
                className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Tags + title + content */}
          <div className="px-5 py-4 border-b border-light">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag) => (
                  <span key={tag} className={`badge ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>{tag}</span>
                ))}
              </div>
            )}
            <h1 className="text-lg font-bold text-dark mb-3">{post.title}</h1>
            <div className="prose prose-sm max-w-none text-dark leading-relaxed
              [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary
              [&_a]:text-secondary [&_a]:no-underline hover:[&_a]:underline
              [&_blockquote]:border-l-4 [&_blockquote]:border-light [&_blockquote]:pl-4 [&_blockquote]:text-gray-500
              [&_code]:bg-light/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-light/30 [&_pre]:p-3 [&_pre]:rounded-lg">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>

          {/* Like row (mobile only — desktop like is in left panel) */}
          <div className="lg:hidden flex items-center gap-5 px-5 py-3 border-b border-light">
            <button
              onClick={() => { if (!user) { navigate("/login"); return; } likeMutation.mutate(); }}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 font-medium text-sm transition-colors ${
                post.liked_by_me ? "text-red-500" : "text-gray-500 hover:text-red-400"
              }`}
            >
              <svg className="w-6 h-6" fill={post.liked_by_me ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.like_count} thích
            </button>
            <span className="flex items-center gap-2 text-gray-400 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
              </svg>
              {post.comment_count} bình luận
            </span>
          </div>

          {/* Comments section */}
          <div className="flex-1 px-5 py-4 space-y-4">
            <p className="font-semibold text-sm text-dark">Bình luận ({comments.length})</p>

            {commentsLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <AuthorAvatar avatar={c.author.avatar} name={c.author.full_name} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-sm truncate">{c.author.full_name ?? "Ẩn danh"}</span>
                          <span className="text-xs text-gray-400 shrink-0">{formatDate(c.created_at)}</span>
                        </div>
                        {(user?.id === c.author.id || isAdmin) && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(c.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment form — pinned to bottom */}
          <div className="px-5 py-4 border-t border-light bg-white">
            {user ? (
              <form onSubmit={handleComment} className="flex gap-2 items-end">
                <textarea
                  className="input resize-none flex-1 text-sm"
                  rows={2}
                  placeholder="Viết bình luận..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={commentMutation.isPending || !comment.trim()}
                  className="btn-primary text-sm shrink-0"
                >
                  {commentMutation.isPending ? "..." : "Gửi"}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <Link to="/login" className="text-sm text-secondary hover:text-primary font-medium">
                  Đăng nhập để bình luận
                </Link>
              </div>
            )}
            {commentError && <p className="text-red-500 text-xs mt-1">{commentError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
