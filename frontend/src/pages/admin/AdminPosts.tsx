import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/orders";
import Spinner from "../../components/ui/Spinner";
import { TAGS, TAG_COLORS } from "../../constants/tags";
import type { Post } from "../../types";

export default function AdminPosts() {
  const qc = useQueryClient();
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "posts", tagFilter, search, sort, page],
    queryFn: () =>
      adminApi.listAdminPosts({
        tag: tagFilter || undefined,
        search: search || undefined,
        sort,
        page,
        limit: 20,
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý bài viết</h1>

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
                  <th className="text-center px-4 py-3 font-semibold">❤ 💬</th>
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

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40">← Trước</button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === data.pages} onClick={() => setPage(page + 1)}
                className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40">Sau →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
