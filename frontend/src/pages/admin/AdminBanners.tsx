import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/orders";
import Spinner from "../../components/ui/Spinner";
import type { BannerAdmin } from "../../types";

const BG_OPTIONS = [
  { label: "Primary → Secondary (nâu đậm)", value: "from-primary to-secondary" },
  { label: "Dark → Primary (đen → nâu)", value: "from-dark to-primary" },
  { label: "Secondary → Accent (cam → vàng)", value: "from-secondary to-accent" },
  { label: "Primary → Accent (nâu → vàng)", value: "from-primary to-accent" },
  { label: "Dark → Secondary (đen → cam)", value: "from-dark to-secondary" },
];

interface BannerForm {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  bg: string;
  is_active: boolean;
  order: number;
}

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  cta: "Xem ngay",
  link: "/",
  bg: "from-primary to-secondary",
  is_active: true,
  order: 0,
};

export default function AdminBanners() {
  const qc = useQueryClient();
  const [modalBanner, setModalBanner] = useState<BannerAdmin | null | "new">(null);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => adminApi.listBanners().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: BannerForm) => adminApi.createBanner(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "banners"] }); setModalBanner(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BannerForm> }) =>
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
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      cta: banner.cta,
      link: banner.link,
      bg: banner.bg,
      is_active: banner.is_active,
      order: banner.order,
    });
    setModalBanner(banner);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalBanner("new");
  };

  const handleSubmit = () => {
    const payload = { ...form, subtitle: form.subtitle || undefined };
    if (modalBanner === "new") {
      createMutation.mutate(payload);
    } else if (modalBanner) {
      updateMutation.mutate({ id: modalBanner.id, data: payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý banner</h1>
        <button onClick={openCreate} className="btn-primary">+ Thêm banner</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
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
              {(banners as BannerAdmin[] | undefined)?.map((banner) => (
                <tr key={banner.id} className="border-t border-light hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className={`w-16 h-8 rounded bg-gradient-to-br ${banner.bg}`} />
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
              ))}
            </tbody>
          </table>
          {banners?.length === 0 && (
            <p className="text-center text-gray-400 py-8">Chưa có banner nào</p>
          )}
        </div>
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

            {/* Preview */}
            <div className={`rounded-xl bg-gradient-to-br ${form.bg} text-white p-6 text-center`}>
              <p className="font-bold text-lg">{form.title || "Tiêu đề"}</p>
              <p className="text-white/70 text-sm mt-1">{form.subtitle || "Mô tả..."}</p>
              <div className="mt-3 inline-block bg-white text-primary text-sm font-semibold px-4 py-1.5 rounded-lg">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nút CTA</label>
                  <input className="input" value={form.cta} onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link</label>
                  <input className="input" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Màu nền</label>
                <select className="input" value={form.bg} onChange={(e) => setForm((f) => ({ ...f, bg: e.target.value }))}>
                  {BG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
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
                    <span className="text-sm font-medium">Hiển thị trên trang chủ</span>
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
