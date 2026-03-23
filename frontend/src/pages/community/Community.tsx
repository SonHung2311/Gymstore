import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { communityApi, type CreatePostPayload } from "../../api/community";
import MediaDropzone from "../../components/community/MediaDropzone";
import PostGridCard from "../../components/community/PostGridCard";
import Spinner from "../../components/ui/Spinner";
import { TAGS, TAG_COLORS } from "../../constants/tags";
import { useAuthStore } from "../../store/authStore";

const LIMIT = 12;

// ── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreatePostPayload>({ title: "", content: "", tags: [] });
  const [mediaType, setMediaType] = useState<"image" | "video" | "link" | null>(null);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreatePostPayload) => communityApi.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      onClose();
    },
    onError: () => setError("Đăng bài thất bại, vui lòng thử lại"),
  });

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Tạo bài viết mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark text-2xl leading-none">×</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          {/* Drag & drop media */}
          <MediaDropzone
            mediaUrl={form.image_url ?? ""}
            mediaType={mediaType}
            onChange={(url, type) => { setForm((f) => ({ ...f, image_url: url })); setMediaType(type); }}
            onClear={() => { setForm((f) => ({ ...f, image_url: undefined })); setMediaType(null); }}
          />

          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
            <input className="input" required value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Chủ đề bài viết..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nội dung * <span className="text-xs text-gray-400">(hỗ trợ Markdown)</span>
            </label>
            <textarea className="input resize-none font-mono text-sm" rows={6} required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Chia sẻ lộ trình, kinh nghiệm, hoặc đặt câu hỏi..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Thẻ chủ đề</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`badge cursor-pointer transition-all ${
                    form.tags.includes(tag)
                      ? `${TAG_COLORS[tag]} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.title || !form.content}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? "Đang đăng..." : "Đăng bài"}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Community Page ──────────────────────────────────────────────────────

export default function Community() {
  const { user } = useAuthStore();
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [showCreate, setShowCreate] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["community-posts", activeTag, sort],
    queryFn: ({ pageParam = 1 }) =>
      communityApi.posts({ tag: activeTag, sort, page: pageParam as number, limit: LIMIT }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.pages ? last.page + 1 : undefined,
  });

  // Auto-scroll: IntersectionObserver on sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Cộng đồng</h1>
          <p className="text-gray-500 text-sm mt-1">Chia sẻ kiến thức và kinh nghiệm tập luyện</p>
        </div>
        {user ? (
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ Đăng bài</button>
        ) : (
          <Link to="/login" className="btn-primary">Đăng nhập để đăng bài</Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar (desktop) */}
        <aside className="lg:w-48 shrink-0 space-y-5">
          <div>
            <p className="text-sm font-semibold text-dark mb-2">Sắp xếp</p>
            <div className="flex lg:flex-col gap-2">
              {(["new", "hot"] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`text-sm px-3 py-2 rounded-lg text-left transition-colors ${
                    sort === s ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
                  }`}>
                  {s === "new" ? "Mới nhất" : "Hot nhất"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-2">Chủ đề</p>
            <div className="flex lg:flex-col flex-wrap gap-2">
              <button onClick={() => setActiveTag(undefined)}
                className={`text-sm px-3 py-2 rounded-lg text-left transition-colors ${
                  !activeTag ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
                }`}>
                Tất cả
              </button>
              {TAGS.map((tag) => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? undefined : tag)}
                  className={`text-sm px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTag === tag
                      ? `${TAG_COLORS[tag]} font-medium`
                      : "bg-white border border-light text-dark hover:bg-surface"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid feed */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : allPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">Chưa có bài viết nào.</p>
              {user && <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">Đăng bài đầu tiên</button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPosts.map((post) => <PostGridCard key={post.id} post={post} />)}
              </div>

              {/* Auto-scroll sentinel */}
              <div ref={sentinelRef} className="h-4 mt-4" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-6"><Spinner /></div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
