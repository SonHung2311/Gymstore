import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/orders";
import type { AdminUser } from "../../types";
import AvatarDropzone from "./AvatarDropzone";

interface Props {
  user: AdminUser;
  onClose: () => void;
}

export default function AdminEditProfileModal({ user, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    phone: "",
    avatar: user.avatar ?? "",
    bio: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateUserProfile(user.id, {
        full_name: form.full_name || null,
        phone: form.phone || null,
        avatar: form.avatar || null,
        bio: form.bio || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chỉnh sửa hồ sơ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark text-2xl leading-none">×</button>
        </div>

        <p className="text-sm text-gray-500">{user.email}</p>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium mb-2">Ảnh đại diện</label>
          <AvatarDropzone
            value={form.avatar || null}
            onChange={(url) => setForm((f) => ({ ...f, avatar: url }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Họ tên</label>
          <input className="input" value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <input className="input" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea className="input resize-none" rows={3} maxLength={300}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Giới thiệu..." />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        </div>
      </div>
    </div>
  );
}
