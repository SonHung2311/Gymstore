import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import type { Category } from "../../types";

// Client-side slug preview (mirrors backend logic for display only)
function previewSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Modal ──────────────────────────────────────────────────────────────────────

interface ModalProps {
  initial?: Category;
  onClose: () => void;
}

function CategoryModal({ initial, onClose }: ModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      initial
        ? productsApi.updateCategory(initial.id, name.trim())
        : productsApi.createCategory(name.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(msg ?? "Có lỗi xảy ra");
    },
  });

  const slug = previewSlug(name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-dark">
            {initial ? "Sửa danh mục" : "Thêm danh mục"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
        <input
          className="input w-full"
          placeholder="Ví dụ: Thiết bị tập"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) mutation.mutate(); }}
          autoFocus
        />
        {name && (
          <p className="text-xs text-gray-400 mt-1">
            Slug: <span className="font-mono">{slug || "—"}</span>
          </p>
        )}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCategories() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"add" | Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.adminListCategories().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const handleDelete = (cat: Category) => {
    if (
      window.confirm(
        `Xóa danh mục "${cat.name}"?\nCác sản phẩm thuộc danh mục này sẽ không còn danh mục.`
      )
    ) {
      deleteMutation.mutate(cat.id);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Danh mục sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} danh mục</p>
        </div>
        <button onClick={() => setModal("add")} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Chưa có danh mục nào.{" "}
            <button onClick={() => setModal("add")} className="text-primary hover:underline">
              Thêm ngay
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-light text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Tên</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Slug</th>
                <th className="px-5 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light">
              {(categories as Category[]).map((cat) => (
                <tr key={cat.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-dark">{cat.name}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-gray-400">{cat.slug}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setModal(cat)}
                        className="text-xs text-secondary hover:text-primary transition-colors font-medium"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal === "add" && <CategoryModal onClose={() => setModal(null)} />}
      {modal && modal !== "add" && (
        <CategoryModal initial={modal as Category} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
