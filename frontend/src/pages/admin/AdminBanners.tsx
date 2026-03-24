import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/orders";
import Spinner from "../../components/ui/Spinner";
import type { BannerAdmin } from "../../types";

const PAGE_SIZES = [5, 10, 20];

const LINK_PRESETS = [
  { label: "Trang chủ", value: "/" },
  { label: "Cửa hàng", value: "/store" },
  { label: "Cộng đồng / Bài viết", value: "/community" },
  { label: "Liên hệ / Nhắn tin", value: "/contact" },
  { label: "Đơn hàng của tôi", value: "/store/orders" },
  { label: "Tùy chỉnh (nhập tay)...", value: "__custom__" },
];

// Parse bg field: "#color1,#color2" → [from, to], fallback for old Tailwind class values
function parseBg(bg: string): [string, string] {
  if (bg.includes("#")) {
    const [from, to] = bg.split(",");
    return [from?.trim() || "#6b3f1f", to?.trim() || "#3d1f08"];
  }
  return ["#6b3f1f", "#3d1f08"];
}

function encodeBg(from: string, to: string): string {
  return `${from},${to}`;
}

const PAGE_OPTIONS = [
  { label: "Tất cả trang", value: "all" },
  { label: "Trang chủ (/) only", value: "home" },
  { label: "Gian hàng (/store) only", value: "store" },
  { label: "Cộng đồng (/community) only", value: "community" },
];

interface BannerForm {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  from_color: string;
  to_color: string;
  is_active: boolean;
  order: number;
  display_page: string;
  hide_cta: boolean;
}

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  cta: "Xem ngay",
  link: "/store",
  from_color: "#6b3f1f",
  to_color: "#3d1f08",
  is_active: true,
  order: 0,
  display_page: "all",
  hide_cta: false,
};

export default function AdminBanners() {
  const qc = useQueryClient();
  const [modalBanner, setModalBanner] = useState<BannerAdmin | null | "new">(null);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => adminApi.listBanners().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; subtitle?: string; cta: string; link: string; bg: string; is_active: boolean; order: number }) =>
      adminApi.createBanner(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "banners"] }); setModalBanner(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ title: string; subtitle?: string; cta: string; link: string; bg: string; is_active: boolean; order: number }> }) =>
      adminApi.updateBanner(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "banners"] }); setModalBanner(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });

  const toggleActive = (banner: BannerAdmin) => {
    updateMutation.mutate({ id: banner.id, data: { is_active: !banner.is_active } });
  };

  const openEdit = (banner: BannerAdmin) => {
    const [from_color, to_color] = parseBg(banner.bg);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      cta: banner.cta,
      link: banner.link,
      from_color,
      to_color,
      is_active: banner.is_active,
      order: banner.order,
      display_page: banner.display_page ?? "all",
      hide_cta: !banner.cta,
    });
    setModalBanner(banner);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalBanner("new");
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      subtitle: form.subtitle || undefined,
      cta: form.hide_cta ? "" : form.cta,
      link: form.link,
      bg: encodeBg(form.from_color, form.to_color),
      is_active: form.is_active,
      order: form.order,
      display_page: form.display_page,
    };
    if (modalBanner === "new") {
      createMutation.mutate(payload);
    } else if (modalBanner) {
      updateMutation.mutate({ id: modalBanner.id, data: payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Client-side pagination
  const allBanners = (banners as BannerAdmin[] | undefined) ?? [];
  const total = allBanners.length;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.ceil(total / pageSize);
  const paginated = allBanners.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý banner</h1>
        <button onClick={openCreate} className="btn-primary">+ Thêm banner</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-light/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Xem trước</th>
                  <th className="text-left px-4 py-3 font-semibold">Tiêu đề</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">CTA / Link</th>
                  <th className="text-center px-4 py-3 font-semibold">Thứ tự</th>
                  <th className="text-center px-4 py-3 font-semibold">Hiển thị</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((banner) => {
                  const [fc, tc] = parseBg(banner.bg);
                  return (
                    <tr key={banner.id} className="border-t border-light hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3">
                        <div
                          className="w-16 h-8 rounded"
                          style={{ background: `linear-gradient(135deg, ${fc}, ${tc})` }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">{banner.title}</p>
                        {banner.subtitle && (
                          <p className="text-xs text-gray-400 line-clamp-1">{banner.subtitle}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="font-medium text-xs">{banner.cta}</p>
                        <p className="text-xs text-gray-400">{banner.link}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{banner.order}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(banner)}
                          disabled={updateMutation.isPending}
                          className={`badge cursor-pointer ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {banner.is_active ? "Bật" : "Tắt"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => openEdit(banner)}
                            className="text-xs text-secondary hover:text-primary font-medium">Sửa</button>
                          <button
                            onClick={() => confirm(`Xoá banner "${banner.title}"?`) && deleteMutation.mutate(banner.id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">Xoá</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {total === 0 && (
              <p className="text-center text-gray-400 py-8">Chưa có banner nào</p>
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
                {pages > 1 && (
                  <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}
                      className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">‹</button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${p === page ? "bg-primary text-white border border-primary" : "border border-light bg-white hover:bg-surface"}`}>
                        {p}
                      </button>
                    ))}
                    <button disabled={page === pages} onClick={() => setPage(page + 1)}
                      className="px-2 py-1 rounded border border-light bg-white hover:bg-surface disabled:opacity-40 transition-colors">›</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {modalBanner !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {modalBanner === "new" ? "Thêm banner mới" : "Sửa banner"}
              </h2>
              <button onClick={() => setModalBanner(null)} className="text-gray-400 hover:text-dark text-2xl leading-none">×</button>
            </div>

            {/* Live Preview */}
            <div
              className="rounded-xl text-white p-8 text-center"
              style={{
                background: `linear-gradient(135deg, ${form.from_color}, ${form.to_color})`,
                minHeight: 160,
              }}
            >
              <p className="font-bold text-xl">{form.title || "Tiêu đề banner"}</p>
              {(form.subtitle || !form.title) && (
                <p className="text-white/75 text-sm mt-2">{form.subtitle || "Mô tả ngắn về banner..."}</p>
              )}
              <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2 rounded-lg border border-white/30">
                {form.cta || "CTA"}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <input className="input" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </div>
              {/* Hiển thị tại */}
              <div>
                <label className="block text-sm font-medium mb-1">Hiển thị tại trang</label>
                <select className="input" value={form.display_page}
                  onChange={(e) => setForm((f) => ({ ...f, display_page: e.target.value }))}>
                  {PAGE_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* CTA */}
              <div>
                <label className="block text-sm font-medium mb-1">Nút CTA</label>
                <div className="flex items-center gap-3 mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500">
                    <input type="checkbox" checked={form.hide_cta}
                      onChange={(e) => setForm((f) => ({ ...f, hide_cta: e.target.checked }))}
                      className="accent-primary w-4 h-4" />
                    Ẩn nút CTA
                  </label>
                </div>
                {!form.hide_cta && (
                  <input className="input" value={form.cta}
                    onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
                    placeholder="Xem ngay" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link khi nhấn CTA</label>
                <select
                  className="input mb-2"
                  value={LINK_PRESETS.some((p) => p.value === form.link) ? form.link : "__custom__"}
                  onChange={(e) => {
                    if (e.target.value !== "__custom__") {
                      setForm((f) => ({ ...f, link: e.target.value }));
                    }
                  }}
                >
                  {LINK_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {(!LINK_PRESETS.some((p) => p.value === form.link) ||
                  LINK_PRESETS.find((p) => p.value === form.link)?.value === "__custom__") && (
                  <input
                    className="input text-sm font-mono"
                    placeholder="/store?category_id=1"
                    value={form.link === "__custom__" ? "" : form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Trang sẽ mở khi khách nhấn nút "{form.cta || "CTA"}"
                </p>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Màu đầu</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.from_color}
                      onChange={(e) => setForm((f) => ({ ...f, from_color: e.target.value }))}
                      className="w-10 h-9 rounded border border-light cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      className="input flex-1 font-mono text-sm"
                      value={form.from_color}
                      onChange={(e) => setForm((f) => ({ ...f, from_color: e.target.value }))}
                      maxLength={7}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Màu cuối</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.to_color}
                      onChange={(e) => setForm((f) => ({ ...f, to_color: e.target.value }))}
                      className="w-10 h-9 rounded border border-light cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      className="input flex-1 font-mono text-sm"
                      value={form.to_color}
                      onChange={(e) => setForm((f) => ({ ...f, to_color: e.target.value }))}
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
                  <input type="number" className="input" value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="accent-primary w-4 h-4" />
                    <span className="text-sm font-medium">Hiển thị trang chủ</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={isSaving || !form.title}
                className="btn-primary flex-1">
                {isSaving ? "Đang lưu..." : "Lưu"}
              </button>
              <button onClick={() => setModalBanner(null)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
