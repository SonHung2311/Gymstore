import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { communityApi, type UserProfileUpdatePayload } from "../../api/community";
import AvatarDropzone from "../../components/community/AvatarDropzone";
import PostGridCard from "../../components/community/PostGridCard";
import Spinner from "../../components/ui/Spinner";
import { useAuthStore } from "../../store/authStore";

const LIMIT = 12;

function ProfileAvatar({ avatar, name, size = 24 }: { avatar: string | null; name: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name ?? "?")[0].toUpperCase();
  const sizeClass = `w-${size} h-${size}`;
  if (avatar && !imgError) {
    return <img src={avatar} alt={name ?? ""} onError={() => setImgError(true)} className={`${sizeClass} rounded-full object-cover`} />;
  }
  return (
    <span className={`${sizeClass} rounded-full bg-primary text-white text-3xl font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </span>
  );
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, setUser } = useAuthStore();
  const qc = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = currentUser?.id === userId;

  // Profile header data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => communityApi.getUserProfile(userId!).then((r) => r.data),
    enabled: !!userId,
  });

  // User's posts (infinite)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: postsLoading } = useInfiniteQuery({
    queryKey: ["user-posts", userId],
    queryFn: ({ pageParam = 1 }) =>
      communityApi.posts({ user_id: userId, page: pageParam as number, limit: LIMIT }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.pages ? last.page + 1 : undefined,
    enabled: !!userId,
  });

  // Auto-scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((p) => p.items) ?? [];

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserProfileUpdatePayload>({});

  const openEdit = () => {
    setForm({
      full_name: currentUser?.full_name ?? "",
      phone: currentUser?.phone ?? "",
      avatar: currentUser?.avatar ?? "",
      bio: currentUser?.bio ?? "",
    });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: UserProfileUpdatePayload) => {
      const payload: UserProfileUpdatePayload = {
        full_name: data.full_name || null,
        phone: data.phone || null,
        avatar: data.avatar || null,
        bio: data.bio || null,
      };
      return communityApi.updateProfile(payload);
    },
    onSuccess: (res) => {
      setUser(res.data);
      qc.invalidateQueries({ queryKey: ["user-profile", userId] });
      setEditing(false);
    },
  });

  if (profileLoading) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }
  if (!profile) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Không tìm thấy người dùng</p>
        <Link to="/community" className="btn-primary">← Cộng đồng</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-light">
        <ProfileAvatar avatar={profile.avatar} name={profile.full_name} size={24} />

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-dark">{profile.full_name ?? "Người dùng"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {profile.post_count} bài viết
          </p>
          {profile.bio && (
            <p className="text-gray-600 mt-3 max-w-md leading-relaxed">{profile.bio}</p>
          )}

          {isOwnProfile && (
            <button onClick={openEdit} className="btn-secondary text-sm mt-4">
              Sửa hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {editing && isOwnProfile && (
        <div className="card p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-dark">Chỉnh sửa hồ sơ</h2>

          {/* Avatar upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Ảnh đại diện</label>
            <AvatarDropzone
              value={form.avatar ?? null}
              onChange={(url) => setForm((f) => ({ ...f, avatar: url }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input className="input" value={form.full_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input className="input" value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio <span className="text-gray-400 text-xs">(tối đa 300 ký tự)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              maxLength={300}
              value={form.bio ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Giới thiệu bản thân..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="btn-primary"
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">Hủy</button>
          </div>
        </div>
      )}

      {/* Posts grid */}
      {postsLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : allPosts.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          {isOwnProfile ? "Bạn chưa đăng bài viết nào." : "Người dùng này chưa đăng bài viết nào."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPosts.map((post) => <PostGridCard key={post.id} post={post} />)}
          </div>
          <div ref={sentinelRef} className="h-4 mt-4" />
          {isFetchingNextPage && <div className="flex justify-center py-6"><Spinner /></div>}
        </>
      )}
    </div>
  );
}
