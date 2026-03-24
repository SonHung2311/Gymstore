"""
Seed 80+ đơn hàng thực tế trong 30 ngày qua.
- Phân bổ tự nhiên: 1–5 đơn/ngày, cuối tuần cao hơn
- ~80% delivered/cancelled, ~20% đang xử lý
- Tổng tiền tính thật từ giá sản phẩm
- Một số đơn có voucher
Chạy: python seed_orders.py
"""
import sys, os, random, uuid, string
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from app.database import SessionLocal
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.voucher import Voucher
from app.models import *  # noqa

# ── Vietnamese address pool ────────────────────────────────────────────────────

CITIES = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Bình Dương", "Đồng Nai", "Nha Trang"]

STREETS = [
    "123 Nguyễn Văn Linh, Q.7",      "45 Lê Văn Việt, Q.9",
    "78 Trần Hưng Đạo, Q.1",          "12 Hoàng Diệu, Q.4",
    "56 Phạm Văn Đồng, Thủ Đức",      "91 Đinh Tiên Hoàng, Q.Bình Thạnh",
    "34 Lý Tự Trọng, Q.1",            "67 Nguyễn Trãi, Q.5",
    "8 Trường Chinh, Thanh Xuân",      "22 Kim Mã, Ba Đình",
    "100 Lê Lợi, Hải Châu",           "15 Nguyễn Văn Cừ, Ninh Kiều",
    "48 Hùng Vương, Hồng Bàng",       "33 Bạch Đằng, Đà Nẵng",
    "77 Trần Phú, Nha Trang",         "5 Ngô Quyền, Long Xuyên",
]

NOTES = [
    None, None, None,  # Most orders have no note
    "Giao giờ hành chính",
    "Gọi trước khi giao",
    "Để hàng trước cửa",
    "Giao buổi sáng trước 10h",
    "Hàng dễ vỡ, đóng gói kỹ",
    None, None,
]

def rand_address(user: User) -> dict:
    return {
        "name": user.full_name or "Khách hàng",
        "phone": user.phone or f"09{random.randint(10000000, 99999999)}",
        "address": random.choice(STREETS),
        "city": random.choice(CITIES),
    }

def gen_display_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "GYM-" + "".join(random.choices(chars, k=6))

# ── Status / payment logic ─────────────────────────────────────────────────────

def rand_status_payment(created_at: datetime, is_old: bool):
    """
    is_old = order > 5 days ago → more likely to be resolved.
    Returns (status, payment_status, payment_method)
    """
    method = random.choices(["cod", "bank_transfer"], weights=[55, 45])[0]

    if is_old:
        # 80% resolved
        r = random.random()
        if r < 0.60:
            status = "delivered"
            pay = "paid"
        elif r < 0.78:
            status = "cancelled"
            pay = "refunded" if method == "bank_transfer" else "unpaid"
        elif r < 0.88:
            status = "shipping"
            pay = "paid" if method == "bank_transfer" else "unpaid"
        elif r < 0.94:
            status = "confirmed"
            pay = "pending_verification" if method == "bank_transfer" else "unpaid"
        else:
            status = "pending"
            pay = "pending_verification" if method == "bank_transfer" else "unpaid"
    else:
        # Recent orders: mostly in-progress
        r = random.random()
        if r < 0.30:
            status = "pending"
            pay = "pending_verification" if method == "bank_transfer" else "unpaid"
        elif r < 0.55:
            status = "confirmed"
            pay = "pending_verification" if method == "bank_transfer" else "unpaid"
        elif r < 0.75:
            status = "shipping"
            pay = "paid" if method == "bank_transfer" else "unpaid"
        elif r < 0.88:
            status = "delivered"
            pay = "paid"
        else:
            status = "cancelled"
            pay = "refunded" if method == "bank_transfer" else "unpaid"

    return status, pay, method

# ── Product category weights (supplements & equipment sell more) ───────────────

CATEGORY_WEIGHTS = {1: 2, 2: 3, 3: 1, 4: 5, 5: 3}  # cat_id → weight

def weighted_products(products: list) -> list:
    return random.choices(
        products,
        weights=[CATEGORY_WEIGHTS.get(p.category_id, 2) for p in products],
        k=random.randint(1, 3),
    )

# ── Seed ──────────────────────────────────────────────────────────────────────

def seed():
    random.seed(None)  # truly random each run
    db = SessionLocal()
    try:
        products = db.query(Product).filter(Product.is_active == True).all()
        users    = db.query(User).filter(User.role == "user", User.is_active == True).all()
        vouchers = db.query(Voucher).filter(Voucher.is_active == True, Voucher.applies_to == "all").all()

        print(f"  {len(products)} sản phẩm | {len(users)} users | {len(vouchers)} all-voucher")

        # Xóa orders cũ
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.commit()

        now = datetime.now(timezone.utc)
        created_display_ids = set()

        # ── Build day schedule ──────────────────────────────────────────────
        # 30 days: 2–5 orders on weekends, 1–3 on weekdays, peak days boosted
        day_orders = []
        for d in range(30, 0, -1):
            dt = now - timedelta(days=d)
            weekday = dt.weekday()  # 0=Mon … 6=Sun
            is_weekend = weekday >= 5
            is_peak = d in {28, 21, 14, 7, 3}  # sale peaks ~weekly

            if is_peak:
                n = random.randint(5, 7)
            elif is_weekend:
                n = random.randint(2, 4)
            else:
                n = random.randint(1, 3)
            day_orders.append((dt, n))

        # Add a couple today
        day_orders.append((now - timedelta(hours=random.randint(1, 8)), 2))
        day_orders.append((now - timedelta(hours=random.randint(9, 20)), 1))

        total_created = 0
        for (base_dt, n_orders) in day_orders:
            for _ in range(n_orders):
                user = random.choice(users)
                is_old = (now - base_dt).days > 5

                # Order timestamp (random hour within the day)
                created_at = base_dt.replace(
                    hour=random.randint(7, 22),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59),
                    microsecond=0,
                )

                status, pay_status, method = rand_status_payment(created_at, is_old)

                # Pick 1–3 products (weighted by category)
                chosen = weighted_products(products)
                # De-duplicate product in same order
                seen_pids = set()
                items_data = []
                for p in chosen:
                    if p.id in seen_pids:
                        continue
                    seen_pids.add(p.id)
                    qty = random.choices([1, 2, 3], weights=[70, 22, 8])[0]
                    unit = float(p.price)
                    items_data.append({"product": p, "qty": qty, "unit": unit})

                raw_total = sum(i["unit"] * i["qty"] for i in items_data)

                # Occasionally apply a voucher (25% chance, only on non-cancelled orders)
                coupon_code = None
                discount = 0.0
                if status != "cancelled" and vouchers and random.random() < 0.25:
                    v = random.choice(vouchers)
                    min_amt = float(v.min_order_amount or 0)
                    if raw_total >= min_amt:
                        coupon_code = v.code
                        if v.discount_type == "percent":
                            d = raw_total * float(v.discount_value) / 100
                            if v.max_discount_amount:
                                d = min(d, float(v.max_discount_amount))
                        else:
                            d = float(v.discount_value)
                        discount = round(d, 2)

                total = round(max(raw_total - discount, 0), 2)

                # Unique display_id
                display_id = gen_display_id()
                while display_id in created_display_ids:
                    display_id = gen_display_id()
                created_display_ids.add(display_id)

                order = Order(
                    id=str(uuid.uuid4()),
                    display_id=display_id,
                    user_id=user.id,
                    status=status,
                    total_amount=Decimal(str(total)),
                    payment_method=method,
                    payment_status=pay_status,
                    shipping_address=rand_address(user),
                    note=random.choice(NOTES),
                    coupon_code=coupon_code,
                    discount_amount=Decimal(str(discount)),
                    created_at=created_at,
                    updated_at=created_at,
                )
                db.add(order)
                db.flush()

                for i in items_data:
                    sub = round(i["unit"] * i["qty"], 2)
                    db.add(OrderItem(
                        order_id=order.id,
                        product_id=i["product"].id,
                        quantity=i["qty"],
                        unit_price=Decimal(str(i["unit"])),
                        subtotal=Decimal(str(sub)),
                    ))

                total_created += 1

        db.commit()

        # ── Summary ─────────────────────────────────────────────────────────
        from sqlalchemy import func as sqlfunc
        stats = db.execute(
            __import__("sqlalchemy").text(
                "SELECT status, COUNT(*) as n FROM orders GROUP BY status ORDER BY n DESC"
            )
        ).fetchall()
        print(f"\nTổng: {total_created} đơn hàng\n")
        for row in stats:
            bar = "█" * (row[1] // 2)
            print(f"  {row[0]:15s} {row[1]:3d}  {bar}")

        revenue = db.execute(
            __import__("sqlalchemy").text(
                "SELECT SUM(total_amount) FROM orders WHERE status = 'delivered'"
            )
        ).scalar()
        print(f"\nDoanh thu đã hoàn thành: {int(revenue or 0):,}đ")

    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
