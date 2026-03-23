import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/orders";
import type { Voucher } from "../../types";

const EMPTY_FORM = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "",
  min_order_amount: "",
  max_discount_amount: "",
  applies_to: "all" as "all" | "category" | "product",
  category_id: "",
  product_id: "",
  usage_limit: "",
  per_user_limit: "1",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function VoucherModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: FormState;
  onClose: () => void;
  onSave: (data: FormState) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-light">
          <h2 className="text-lg font-semibold">{initial.code ? "Sửa voucher" : "Thêm voucher"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1">Mã giảm giá <span className="text-red-500">*</span></label>
            <input className="input uppercase" value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="SUMMER24" disabled={!!initial.code} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <input className="input" value={form.description}
              onChange={(e) => set("description", e.target.value)} placeholder="Khuyến mãi hè 2024..." />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Loại giảm <span className="text-red-500">*</span></label>
              <select className="input" value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value as "percent" | "fixed")}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (₫)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Giá trị {form.discount_type === "percent" ? "(%)" : "(₫)"} <span className="text-red-500">*</span>
              </label>
              <input className="input" type="number" min="0" value={form.discount_value}
                onChange={(e) => set("discount_value", e.target.value)} placeholder="20" />
            </div>
          </div>

          {/* Min order + max discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Đơn tối thiểu (₫)</label>
              <input className="input" type="number" min="0" value={form.min_order_amount}
                onChange={(e) => set("min_order_amount", e.target.value)} placeholder="Không giới hạn" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giảm tối đa (₫)</label>
              <input className="input" type="number" min="0" value={form.max_discount_amount}
                onChange={(e) => set("max_discount_amount", e.target.value)} placeholder="Không giới hạn" />
            </div>
          </div>

          {/* Applies to */}
          <div>
            <label className="block text-sm font-medium mb-1">Áp dụng cho</label>
            <select className="input" value={form.applies_to}
              onChange={(e) => set("applies_to", e.target.value as "all" | "category" | "product")}>
              <option value="all">Toàn bộ đơn hàng</option>
              <option value="category">Theo danh mục</option>
              <option value="product">Theo sản phẩm cụ thể</option>
            </select>
          </div>
          {form.applies_to === "category" && (
            <div>
              <label className="block text-sm font-medium mb-1">ID Danh mục</label>
              <input className="input" type="number" value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)} placeholder="1" />
            </div>
          )}
          {form.applies_to === "product" && (
            <div>
              <label className="block text-sm font-medium mb-1">ID Sản phẩm (UUID)</label>
              <input className="input" value={form.product_id}
                onChange={(e) => set("product_id", e.target.value)} placeholder="uuid..." />
            </div>
          )}

          {/* Usage limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tổng lượt dùng</label>
              <input className="input" type="number" min="1" value={form.usage_limit}
                onChange={(e) => set("usage_limit", e.target.value)} placeholder="Không giới hạn" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lượt/người</label>
              <input className="input" type="number" min="1" value={form.per_user_limit}
                onChange={(e) => set("per_user_limit", e.target.value)} />
            </div>
          </div>

          {/* Validity dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Từ ngày</label>
              <input className="input" type="datetime-local" value={form.valid_from}
                onChange={(e) => set("valid_from", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đến ngày</label>
              <input className="input" type="datetime-local" value={form.valid_until}
                onChange={(e) => set("valid_until", e.target.value)} />
            </div>
          </div>

          {/* Active */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium">Kích hoạt</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-light">
          <button onClick={onClose} className="btn-secondary">Huỷ</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.code || !form.discount_value}
            className="btn-primary">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVouchers() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; voucher: Voucher | null }>({ open: false, voucher: null });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: () => adminApi.listVouchers().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: unknown) => adminApi.createVoucher(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vouchers"] }); setModal({ open: false, voucher: null }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => adminApi.updateVoucher(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vouchers"] }); setModal({ open: false, voucher: null }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteVoucher(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vouchers"] }); setDeleteId(null); },
  });

  const handleSave = (form: FormState) => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      applies_to: form.applies_to,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      product_id: form.product_id || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      per_user_limit: parseInt(form.per_user_limit) || 1,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
    };
    if (modal.voucher) {
      updateMut.mutate({ id: modal.voucher.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const openEdit = (v: Voucher) => {
    const toInput = (iso: string | null) => {
      if (!iso) return "";
      return iso.slice(0, 16);
    };
    setModal({
      open: true,
      voucher: v,
    });
    // We don't directly use this, editForm will be created inside modal
    return v;
  };

  const getInitialForm = (v: Voucher | null): FormState => {
    if (!v) return EMPTY_FORM;
    return {
      code: v.code,
      description: v.description || "",
      discount_type: v.discount_type,
      discount_value: String(v.discount_value),
      min_order_amount: v.min_order_amount != null ? String(v.min_order_amount) : "",
      max_discount_amount: v.max_discount_amount != null ? String(v.max_discount_amount) : "",
      applies_to: v.applies_to,
      category_id: v.category_id != null ? String(v.category_id) : "",
      product_id: v.product_id || "",
      usage_limit: v.usage_limit != null ? String(v.usage_limit) : "",
      per_user_limit: String(v.per_user_limit),
      valid_from: v.valid_from ? v.valid_from.slice(0, 16) : "",
      valid_until: v.valid_until ? v.valid_until.slice(0, 16) : "",
      is_active: v.is_active,
    };
  };

  const DISCOUNT_TYPE_LABEL: Record<string, string> = {
    percent: "% giảm",
    fixed: "₫ cố định",
  };

  const APPLIES_LABEL: Record<string, string> = {
    all: "Toàn đơn",
    category: "Danh mục",
    product: "Sản phẩm",
  };

  if (isLoading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Voucher / Mã giảm giá</h1>
          <p className="text-sm text-gray-500 mt-1">{vouchers.length} voucher</p>
        </div>
        <button onClick={() => setModal({ open: true, voucher: null })} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Thêm voucher
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-light">
            <tr>
              {["Mã", "Loại giảm", "Giá trị", "Áp dụng", "Đã dùng", "Hạn", "Trạng thái", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light">
            {vouchers.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Chưa có voucher nào</td></tr>
            )}
            {vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-surface/60 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-primary">{v.code}</td>
                <td className="px-4 py-3 text-gray-600">{DISCOUNT_TYPE_LABEL[v.discount_type]}</td>
                <td className="px-4 py-3 font-medium">
                  {v.discount_type === "percent"
                    ? `${v.discount_value}%`
                    : `${Number(v.discount_value).toLocaleString("vi-VN")}₫`}
                </td>
                <td className="px-4 py-3 text-gray-500">{APPLIES_LABEL[v.applies_to]}</td>
                <td className="px-4 py-3 text-gray-600">
                  {v.usage_count}
                  {v.usage_limit != null && <span className="text-gray-400">/{v.usage_limit}</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {v.valid_until ? formatDate(v.valid_until) : "∞"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${v.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {v.is_active ? "Đang hoạt động" : "Tắt"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { openEdit(v); }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                      Sửa
                    </button>
                    <button onClick={() => setDeleteId(v.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <VoucherModal
          initial={getInitialForm(modal.voucher)}
          onClose={() => setModal({ open: false, voucher: null })}
          onSave={handleSave}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Xác nhận xoá</h3>
            <p className="text-gray-600 text-sm mb-6">Voucher này sẽ bị xoá vĩnh viễn.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Huỷ</button>
              <button onClick={() => deleteMut.mutate(deleteId!)} disabled={deleteMut.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                {deleteMut.isPending ? "Đang xoá..." : "Xoá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
