"""
Seed script: tạo banner đẹp cho trang chủ GymStore.
bg format: "#fromColor,#toColor"  (hex gradient)
Chạy từ thư mục backend/: python seed_banners.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.banner import Banner
from app.models import *  # noqa

BANNERS = [
    # 0 – Hero chào mừng – cam cháy → đỏ đậm (brand-like)
    {
        "title": "Nâng Tầm Cơ Thể – Nâng Tầm Cuộc Sống",
        "subtitle": "Thiết bị gym chính hãng, giao hàng toàn quốc, bảo hành 12 tháng",
        "cta": "Khám phá ngay",
        "link": "/store",
        "bg": "#c0392b,#6b0000",
        "order": 0,
        "is_active": True,
    },
    # 1 – Sale sốc – cam nóng → vàng nghệ
    {
        "title": "Flash Sale Cuối Tháng – Giảm Đến 40%",
        "subtitle": "Chỉ trong 48 giờ! Hàng trăm sản phẩm gym & supplement đang chờ bạn",
        "cta": "Săn deal ngay",
        "link": "/store",
        "bg": "#e67e22,#f39c12",
        "order": 1,
        "is_active": True,
    },
    # 2 – Whey & Supplement – tím grape → indigo
    {
        "title": "Supplement Chính Hãng – Hiệu Quả Thật Sự",
        "subtitle": "Whey Protein, BCAA, Creatine từ các thương hiệu uy tín thế giới",
        "cta": "Xem supplement",
        "link": "/store",
        "bg": "#6c3483,#1a237e",
        "order": 2,
        "is_active": True,
    },
    # 3 – Cộng đồng – xanh biển ocean → teal
    {
        "title": "Cộng Đồng GymStore – Cùng Nhau Bứt Phá",
        "subtitle": "Chia sẻ hành trình, học hỏi kinh nghiệm từ hàng nghìn gym-er khắp Việt Nam",
        "cta": "Tham gia cộng đồng",
        "link": "/community",
        "bg": "#0077b6,#00b4d8",
        "order": 3,
        "is_active": True,
    },
    # 4 – Tạ & thiết bị – xám thép → đen gym
    {
        "title": "Thiết Bị Tập Lực – Dành Cho Người Nghiêm Túc",
        "subtitle": "Tạ đòn, tạ tay, dây kháng lực – chất lượng phòng gym chuyên nghiệp tại nhà bạn",
        "cta": "Xem thiết bị",
        "link": "/store",
        "bg": "#2c3e50,#485563",
        "order": 4,
        "is_active": True,
    },
    # 5 – Mùa hè – xanh lá mint → emerald
    {
        "title": "Thách Thức Mùa Hè – Body Chuẩn Trong 90 Ngày",
        "subtitle": "Bắt đầu hành trình biến đổi cơ thể với bộ dụng cụ tập tại nhà hoàn hảo",
        "cta": "Bắt đầu ngay",
        "link": "/store",
        "bg": "#11998e,#38ef7d",
        "order": 5,
        "is_active": True,
    },
    # 6 – Nữ giới / Yoga – hồng pastel → tím lavender
    {
        "title": "Gym Dành Cho Phái Đẹp – Tone Cơ, Gọn Dáng",
        "subtitle": "Thảm yoga, dây kháng lực, whey isolate – bộ đôi hoàn hảo cho body goals của bạn",
        "cta": "Xem ngay",
        "link": "/store",
        "bg": "#c9538c,#8b5cf6",
        "order": 6,
        "is_active": True,
    },
    # 7 – Free ship – navy → cobalt
    {
        "title": "Miễn Phí Vận Chuyển Toàn Quốc",
        "subtitle": "Đơn hàng từ 500.000đ – giao nhanh 2 ngày – không lo rủi ro",
        "cta": "Mua sắm ngay",
        "link": "/store",
        "bg": "#1e3a5f,#2563eb",
        "order": 7,
        "is_active": True,
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Banner).count()
        print(f"Hiện có {existing} banner trong database.")

        created = 0
        for b in BANNERS:
            # Kiểm tra trùng title
            if db.query(Banner).filter(Banner.title == b["title"]).first():
                print(f"  [skip] '{b['title'][:40]}...' đã tồn tại")
                continue
            db.add(Banner(**b))
            created += 1
            print(f"  [+] order={b['order']} | {b['title'][:50]}")

        db.commit()
        total = db.query(Banner).count()
        print(f"\n✅ Hoàn tất: thêm {created} banner | Tổng: {total} banner trong DB.")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
