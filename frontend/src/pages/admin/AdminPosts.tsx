import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/orders";
import Spinner from "../../components/ui/Spinner";
import { TAGS, TAG_COLORS } from "../../constants/tags";
import type { Post } from "../../types";

const PAGE_SIZES = [10, 20, 50];

export default function AdminPosts() {
  const qc = useQueryClient();
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "posts", tagFilter, search, sort, page, pageSize],
    queryFn: () =>
      adminApi.listAdminPosts({
        tag: tagFilter || undefined,
        search: search || undefined,
        sort,
        page,
        limit: pageSize,
      }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });

  const handleDelete = (post: Post) => {
    if (confirm(`Xoá bài viết "${post.title}"?`)) {
      deleteMutation.mutate(post.id);
    }
  };

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý bài viết</h1>
        {!isLoading && <p className="text-sm text-gray-400">{total} bài viết</p>}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setTagFilter(""); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !tagFilter ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
            }`}>
            Tất cả
          </button>
          {TAGS.map((tag) => (
            <button key={tag} onClick={() => { setTagFilter(tag); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tagFilter === tag ? `${TAG_COLORS[tag]} ring-2 ring-offset-1 ring-current` : "bg-white border border-light text-dark hover:bg-surface"
              }`}>
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            className="input flex-1 max-w-sm"
            placeholder="Tìm tiêu đề bài viết..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div className="flex gap-2">
            {(["new", "hot"] as const).map((s) => (
              <button key={s} onClick={() => { setSort(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sort === s ? "bg-dark text-white" : "bg-white border border-light text-dark hover:bg-surface"
                }`}>
                {s === "new" ? "Mới nhất" : "Hot nhất"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-light/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Tiêu đề</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Tác giả</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Thẻ</th>
                  <th className="text-center px-4 py-3 font-semibold">
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                      </svg>
                    </span>
                  </th>
                  <th className="text-center px-4 py-3 font-semibold hidden md:table-cell">Ngày</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((post: Post) => (
                  <tr key={post.id} className="border-t border-light hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1 max-w-xs">{post.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {post.author.full_name || "Ẩn danh"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {post.tags.map((tag) => (
                          <span key={tag} className={`badge text-xs ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {post.like_count} / {post.comment_count}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">
                      {new Date(post.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.items.length === 0 && (
              <p className="text-center text-gray-400 py-8">Không có bài viết nào</p>
            )}
          </div>

          {/* Pagination footer */}
          {total > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Hiển thị {from}–{to} trong {total}</span>
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
                {data && data.pages > 1 && (
                  <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}
                      className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">‹</button>
                    {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${p === page ? "bg-primary text-white border border-primary" : "border border-light bg-white hover:bg-surface"}`}>
                        {p}
                      </button>
                    ))}
                    <button disabled={page === data.pages} onClick={() => setPage(page + 1)}
                      className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">›</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
