/**
 * AdminTags — Quản lý thẻ chủ đề cho bài viết cộng đồng.
 * Admin có thể thêm, bật/tắt, xoá thẻ.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tagsApi } from "../../api/tags";
import type { Tag } from "../../types";

const COLOR_PRESETS = [
  { label: "Xanh dương", value: "bg-blue-100 text-blue-700" },
  { label: "Xanh lá", value: "bg-green-100 text-green-700" },
  { label: "Vàng", value: "bg-yellow-100 text-yellow-700" },
  { label: "Tím", value: "bg-purple-100 text-purple-700" },
  { label: "Cam", value: "bg-orange-100 text-orange-700" },
  { label: "Xanh ngọc", value: "bg-teal-100 text-teal-700" },
  { label: "Hồng", value: "bg-pink-100 text-pink-700" },
  { label: "Đỏ", value: "bg-red-100 text-red-700" },
  { label: "Chàm", value: "bg-indigo-100 text-indigo-700" },
  { label: "Xám", value: "bg-gray-100 text-gray-700" },
];

export default function AdminTags() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("bg-gray-100 text-gray-700");
  const [error, setError] = useState("");

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ["admin-tags"],
    queryFn: () => tagsApi.listAdmin().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => tagsApi.create({ name: name.trim(), color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
      setName("");
      setError("");
    },
    onError: () => setError("Tên thẻ đã tồn tại hoặc không hợp lệ"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      tagsApi.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) { setError("Tên thẻ không được để trống"); return; }
    setError("");
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Quản lý thẻ chủ đề</h1>

      {/* Add form */}
      <div className="card p-5 mb-6">
        <h2 className="text-base font-medium mb-4">Thêm thẻ mới</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Tên thẻ..."
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <select className="input sm:w-48" value={color} onChange={(e) => setColor(e.target.value)}>
            {COLOR_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            className="btn-primary whitespace-nowrap"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            + Thêm thẻ
          </button>
        </div>

        {/* Preview */}
        {name && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            Xem trước:{" "}
            <span className={`badge ${color}`}>{name}</span>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Tag list */}
      <div className="card divide-y divide-light">
        {isLoading ? (
          <div className="p-6 text-center text-gray-400">Đang tải...</div>
        ) : tags.length === 0 ? (
          <div className="p-6 text-center text-gray-400">Chưa có thẻ nào</div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3">
                <span className={`badge ${tag.color} ${!tag.is_active ? "opacity-40" : ""}`}>
                  {tag.name}
                </span>
                {!tag.is_active && (
                  <span className="text-xs text-gray-400">(Đang ẩn)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: tag.id, is_active: !tag.is_active })}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    tag.is_active
                      ? "border-light text-gray-600 hover:bg-surface"
                      : "border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  {tag.is_active ? "Ẩn" : "Hiện"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Xoá thẻ "${tag.name}"? Bài viết đã gắn thẻ này sẽ không bị ảnh hưởng.`))
                      deleteMutation.mutate(tag.id);
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        * Xoá thẻ sẽ không ảnh hưởng bài viết đã được gắn thẻ đó. Ẩn thẻ sẽ không cho phép chọn khi tạo bài mới.
      </p>
    </div>
  );
}
