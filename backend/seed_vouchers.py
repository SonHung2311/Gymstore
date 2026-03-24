"""
Seed vouchers:
- Đảm bảo 4 voucher từ bài đăng cộng đồng đang active
- Thêm voucher gắn với sản phẩm / danh mục cụ thể
Chạy: python seed_vouchers.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.voucher import Voucher
from app.models.product import Product, Category
from app.models import *  # noqa


def future(days): return datetime.now(timezone.utc) + timedelta(days=days)
def ago(days):    return datetime.now(timezone.utc) - timedelta(days=days)


def seed():
    db = SessionLocal()
    try:
        # ── Lookup product ids ──────────────────────────────────────────────
        def pid(name_fragment):
            p = db.query(Product).filter(Product.name.ilike(f"%{name_fragment}%")).first()
            if not p:
                raise ValueError(f"Không tìm thấy sản phẩm: {name_fragment}")
            return p.id

        def cid(name_fragment):
            c = db.query(Category).filter(Category.name.ilike(f"%{name_fragment}%")).first()
            if not c:
                raise ValueError(f"Không tìm thấy danh mục: {name_fragment}")
            return c.id

        whey_id       = pid("Whey Protein Isolate")
        creatine_id   = pid("Creatine Monohydrate")
        preworkout_id = pid("Pre-workout C4")
        massgainer_id = pid("Mass Gainer")
        legging_id    = pid("Quần legging tập gym nữ")
        sportsbra_id  = pid("Sports bra")
        bench_id      = pid("Bench đa năng")
        rowing_id     = pid("Rowing Machine")

        cat_clothing_id   = cid("Quần áo")
        cat_supplement_id = cid("Dinh dưỡng")
        cat_machine_id    = cid("Máy tập")
        cat_accessory_id  = cid("Phụ kiện")

        # ── 1. Đảm bảo 4 voucher community đang active ─────────────────────
        community_codes = ["GYMFLASH20", "WELCOME15", "WEEKEND10", "SUPP30K"]
        for code in community_codes:
            v = db.query(Voucher).filter(Voucher.code == code).first()
            if v and not v.is_active:
                v.is_active = True
                print(f"  [activate] {code}")
            elif v:
                print(f"  [ok] {code} đang active")
            else:
                print(f"  [warn] Không tìm thấy voucher {code} – chạy seed_community.py trước")
        db.commit()

        # ── 2. Vouchers theo sản phẩm cụ thể ──────────────────────────────
        PRODUCT_VOUCHERS = [
            {
                "code": "WHEY15",
                "description": "Giảm 15% cho Whey Protein Isolate 2kg – best seller tháng này",
                "discount_type": "percent",
                "discount_value": 15,
                "min_order_amount": None,
                "max_discount_amount": 120_000,
                "applies_to": "product",
                "product_id": whey_id,
                "usage_limit": 40,
                "per_user_limit": 1,
                "valid_from": ago(3),
                "valid_until": future(14),
                "is_active": True,
            },
            {
                "code": "CREATINE20K",
                "description": "Giảm 20.000đ cho Creatine Monohydrate 500g",
                "discount_type": "fixed",
                "discount_value": 20_000,
                "min_order_amount": None,
                "max_discount_amount": None,
                "applies_to": "product",
                "product_id": creatine_id,
                "usage_limit": 30,
                "per_user_limit": 1,
                "valid_from": ago(1),
                "valid_until": future(10),
                "is_active": True,
            },
            {
                "code": "C4PREWORKOUT",
                "description": "Giảm 10% Pre-workout C4 Original – thử trước khi quyết định",
                "discount_type": "percent",
                "discount_value": 10,
                "min_order_amount": None,
                "max_discount_amount": 50_000,
                "applies_to": "product",
                "product_id": preworkout_id,
                "usage_limit": 25,
                "per_user_limit": 1,
                "valid_from": ago(2),
                "valid_until": future(12),
                "is_active": True,
            },
            {
                "code": "MASS50K",
                "description": "Giảm 50.000đ cho Mass Gainer tăng cân 3kg",
                "discount_type": "fixed",
                "discount_value": 50_000,
                "min_order_amount": None,
                "max_discount_amount": None,
                "applies_to": "product",
                "product_id": massgainer_id,
                "usage_limit": 20,
                "per_user_limit": 1,
                "valid_from": ago(1),
                "valid_until": future(7),
                "is_active": True,
            },
            {
                "code": "SETGIRL10",
                "description": "Giảm 10% khi mua leggings + sports bra cùng lúc",
                "discount_type": "percent",
                "discount_value": 10,
                "min_order_amount": 400_000,
                "max_discount_amount": 80_000,
                "applies_to": "product",
                "product_id": legging_id,   # applied to legging as anchor
                "usage_limit": 30,
                "per_user_limit": 1,
                "valid_from": ago(4),
                "valid_until": future(20),
                "is_active": True,
            },
            {
                "code": "BENCH100K",
                "description": "Giảm 100.000đ cho Bench đa năng điều chỉnh 7 vị trí",
                "discount_type": "fixed",
                "discount_value": 100_000,
                "min_order_amount": None,
                "max_discount_amount": None,
                "applies_to": "product",
                "product_id": bench_id,
                "usage_limit": 15,
                "per_user_limit": 1,
                "valid_from": ago(1),
                "valid_until": future(10),
                "is_active": True,
            },
            {
                "code": "ROWINGVIP",
                "description": "Giảm 5% Máy chèo thuyền – dành cho khách đặt trước",
                "discount_type": "percent",
                "discount_value": 5,
                "min_order_amount": None,
                "max_discount_amount": 300_000,
                "applies_to": "product",
                "product_id": rowing_id,
                "usage_limit": 10,
                "per_user_limit": 1,
                "valid_from": ago(0),
                "valid_until": future(30),
                "is_active": True,
            },
        ]

        # ── 3. Vouchers theo danh mục ──────────────────────────────────────
        CATEGORY_VOUCHERS = [
            {
                "code": "OUTFIT15",
                "description": "Giảm 15% toàn bộ Quần áo thể thao, đơn từ 250k",
                "discount_type": "percent",
                "discount_value": 15,
                "min_order_amount": 250_000,
                "max_discount_amount": 150_000,
                "applies_to": "category",
                "category_id": cat_clothing_id,
                "usage_limit": 50,
                "per_user_limit": 2,
                "valid_from": ago(5),
                "valid_until": future(15),
                "is_active": True,
            },
            {
                "code": "NUTRITION10",
                "description": "Giảm 10% toàn bộ Dinh dưỡng thể thao, đơn từ 300k",
                "discount_type": "percent",
                "discount_value": 10,
                "min_order_amount": 300_000,
                "max_discount_amount": 100_000,
                "applies_to": "category",
                "category_id": cat_supplement_id,
                "usage_limit": 60,
                "per_user_limit": 2,
                "valid_from": ago(3),
                "valid_until": future(21),
                "is_active": True,
            },
            {
                "code": "BIGMACHINE",
                "description": "Giảm 3% cho Máy tập thể dục – áp dụng đơn từ 2 triệu",
                "discount_type": "percent",
                "discount_value": 3,
                "min_order_amount": 2_000_000,
                "max_discount_amount": 500_000,
                "applies_to": "category",
                "category_id": cat_machine_id,
                "usage_limit": 20,
                "per_user_limit": 1,
                "valid_from": ago(0),
                "valid_until": future(30),
                "is_active": True,
            },
            {
                "code": "ACCESSORY20",
                "description": "Giảm 20% Phụ kiện gym, đơn từ 150k – combo đồ tập ngon",
                "discount_type": "percent",
                "discount_value": 20,
                "min_order_amount": 150_000,
                "max_discount_amount": 80_000,
                "applies_to": "category",
                "category_id": cat_accessory_id,
                "usage_limit": 40,
                "per_user_limit": 2,
                "valid_from": ago(2),
                "valid_until": future(10),
                "is_active": True,
            },
        ]

        print("\nTạo voucher sản phẩm...")
        created = skipped = 0
        for v in PRODUCT_VOUCHERS + CATEGORY_VOUCHERS:
            existing = db.query(Voucher).filter(Voucher.code == v["code"]).first()
            if existing:
                print(f"  [skip] {v['code']} đã tồn tại")
                skipped += 1
                continue
            voucher = Voucher(
                code=v["code"],
                description=v.get("description"),
                discount_type=v["discount_type"],
                discount_value=v["discount_value"],
                min_order_amount=v.get("min_order_amount"),
                max_discount_amount=v.get("max_discount_amount"),
                applies_to=v["applies_to"],
                product_id=v.get("product_id"),
                category_id=v.get("category_id"),
                usage_limit=v.get("usage_limit"),
                per_user_limit=v.get("per_user_limit", 1),
                valid_from=v.get("valid_from"),
                valid_until=v.get("valid_until"),
                is_active=v["is_active"],
            )
            db.add(voucher)
            scope = f"product:{v['product_id'][:8]}" if v.get("product_id") else f"category:{v.get('category_id')}"
            print(f"  [+] {v['code']:20s}  {v['discount_type']:7s} {v['discount_value']:>8}  [{scope}]")
            created += 1

        db.commit()
        total = db.query(Voucher).count()
        print(f"\nHoàn tất: {created} tạo mới, {skipped} bỏ qua. Tổng voucher: {total}")

    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
