import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { communityApi, type CreatePostPayload } from "../../api/community";
import MediaDropzone from "../../components/community/MediaDropzone";
import PostGridCard from "../../components/community/PostGridCard";
import Spinner from "../../components/ui/Spinner";
import { TAGS, TAG_COLORS } from "../../constants/tags";
import { useAuthStore } from "../../store/authStore";

const PAGE_SIZES = [6, 12, 24];

// ── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreatePostPayload>({ title: "", content: "", tags: [] });
  const [mediaType, setMediaType] = useState<"image" | "video" | "link" | null>(null);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
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

  const addCustomTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag) || form.tags.length >= 5) return;
    setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  };

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
            <label className="block text-sm font-medium mb-2">
              Thẻ chủ đề
              <span className="text-xs text-gray-400 font-normal ml-2">tối đa 5 thẻ</span>
            </label>

            {/* Preset tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  disabled={!form.tags.includes(tag) && form.tags.length >= 5}
                  className={`badge cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    form.tags.includes(tag)
                      ? `${TAG_COLORS[tag]} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm !py-1.5"
                placeholder="Hoặc gõ thẻ tùy chỉnh rồi nhấn Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                maxLength={30}
                disabled={form.tags.length >= 5}
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!tagInput.trim() || form.tags.length >= 5}
                className="px-3 py-1.5 rounded-lg border border-light bg-white text-sm text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Thêm
              </button>
            </div>

            {/* Selected tags (including custom) */}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span key={tag} className={`badge flex items-center gap-1 ${TAG_COLORS[tag] ?? "bg-primary/10 text-primary"}`}>
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="hover:opacity-70 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data, isLoading } = useQuery({
    queryKey: ["community-posts", activeTag, sort, page, pageSize],
    queryFn: () =>
      communityApi.posts({ tag: activeTag, sort, page, limit: pageSize }).then((r) => r.data),
  });

  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const allPosts = data?.items ?? [];

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
                <button key={s} onClick={() => { setSort(s); setPage(1); }}
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
              <button onClick={() => { setActiveTag(undefined); setPage(1); }}
                className={`text-sm px-3 py-2 rounded-lg text-left transition-colors ${
                  !activeTag ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
                }`}>
                Tất cả
              </button>
              {TAGS.map((tag) => (
                <button key={tag} onClick={() => { setActiveTag(activeTag === tag ? undefined : tag); setPage(1); }}
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

              {/* Pagination footer */}
              {total > 0 && (
                <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
                  <span>Hiển thị {from}–{to} trong {total} bài</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">Hiển thị:</span>
                      <select
                        className="border border-light rounded-lg px-2 py-1 text-sm bg-white"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      >
                        {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)}
                          className="px-3 py-1.5 rounded-lg text-sm border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">
                          ← Trước
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button key={p} onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              p === page ? "bg-primary text-white border border-primary" : "border border-light bg-white hover:bg-surface"
                            }`}>
                            {p}
                          </button>
                        ))}
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
                          className="px-3 py-1.5 rounded-lg text-sm border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">
                          Sau →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
