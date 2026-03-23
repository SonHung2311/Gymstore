import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/orders";
import AdminEditProfileModal from "../../components/community/AdminEditProfileModal";
import Spinner from "../../components/ui/Spinner";
import type { AdminUser } from "../../types";
import { useAuthStore } from "../../store/authStore";

const ROLES = ["", "user", "admin"] as const;
const ROLE_LABELS: Record<string, string> = { "": "Tất cả", user: "Người dùng", admin: "Admin" };

export default function AdminUsers() {
  const qc = useQueryClient();
  const { user: currentAdmin } = useAuthStore();
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingProfile, setEditingProfile] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", roleFilter, search, page],
    queryFn: () =>
      adminApi.listUsers({
        role: roleFilter || undefined,
        search: search || undefined,
        page,
        limit: 20,
      }).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { is_active?: boolean; role?: string } }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                roleFilter === r ? "bg-primary text-white" : "bg-white border border-light text-dark hover:bg-surface"
              }`}>
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <input
          className="input flex-1 sm:max-w-xs"
          placeholder="Tìm email hoặc tên..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-light/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Họ tên</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Số điện thoại</th>
                  <th className="text-center px-4 py-3 font-semibold">Role</th>
                  <th className="text-center px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((u: AdminUser) => (
                  <tr key={u.id} className="border-t border-light hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {u.full_name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {u.phone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${u.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.is_active ? "Hoạt động" : "Bị khoá"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id === currentAdmin?.id ? (
                        <span className="text-xs text-gray-300">Bạn</span>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setEditingProfile(u)}
                            className="text-xs font-medium text-blue-500 hover:text-blue-700"
                          >
                            Hồ sơ
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                            disabled={updateMutation.isPending}
                            className={`text-xs font-medium ${u.is_active ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}
                          >
                            {u.is_active ? "Khoá" : "Mở khoá"}
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: u.id, data: { role: u.role === "admin" ? "user" : "admin" } })}
                            disabled={updateMutation.isPending}
                            className="text-xs font-medium text-secondary hover:text-primary"
                          >
                            {u.role === "admin" ? "→ User" : "→ Admin"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.items.length === 0 && (
              <p className="text-center text-gray-400 py-8">Không có người dùng nào</p>
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

    {editingProfile && (
      <AdminEditProfileModal user={editingProfile} onClose={() => setEditingProfile(null)} />
    )}
    </>
  );
}
