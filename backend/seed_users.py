"""
Seed script: tạo 17 user accounts với tên và email giống người thật.
Chạy từ thư mục backend/: python seed_users.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
from app.database import SessionLocal, engine
from app.models.user import User
from app.models import *  # noqa: ensure all models are registered


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


USERS = [
    {"full_name": "Nguyễn Minh Tuấn",   "email": "minhtuan.nguyen@gmail.com",   "phone": "0901234567"},
    {"full_name": "Trần Thị Lan Anh",   "email": "lananh.tran@gmail.com",        "phone": "0912345678"},
    {"full_name": "Lê Hoàng Nam",        "email": "hoangnam.le@yahoo.com",        "phone": "0923456789"},
    {"full_name": "Phạm Thị Thu Hằng",  "email": "thuhang.pham@gmail.com",       "phone": "0934567890"},
    {"full_name": "Vũ Đức Khải",        "email": "ducckhai.vu@gmail.com",         "phone": "0945678901"},
    {"full_name": "Đặng Thùy Linh",     "email": "thuylinh.dang@outlook.com",    "phone": "0956789012"},
    {"full_name": "Bùi Văn Hùng",       "email": "vanhung.bui@gmail.com",        "phone": "0967890123"},
    {"full_name": "Hoàng Thị Mỹ Duyên", "email": "myduyen.hoang@gmail.com",      "phone": "0978901234"},
    {"full_name": "Đinh Quốc Bảo",      "email": "quocbao.dinh@gmail.com",       "phone": "0989012345"},
    {"full_name": "Ngô Thị Phương Mai", "email": "phuongmai.ngo@gmail.com",      "phone": "0990123456"},
    {"full_name": "Trương Thanh Tú",    "email": "thanh.tu97@gmail.com",         "phone": "0901357924"},
    {"full_name": "Lý Thị Kim Ngân",    "email": "kimngan.ly@yahoo.com",         "phone": "0912468035"},
    {"full_name": "Hồ Ngọc Phát",       "email": "ngocphat.ho@gmail.com",        "phone": "0923579146"},
    {"full_name": "Mai Thanh Hương",    "email": "thanhuong.mai@gmail.com",      "phone": "0934680257"},
    {"full_name": "Phan Chí Công",      "email": "chicong.phan@outlook.com",     "phone": "0945791368"},
    {"full_name": "Võ Thị Ngọc Trinh",  "email": "ngoctrinh.vo@gmail.com",       "phone": "0956802479"},
    {"full_name": "Tạ Anh Khoa",        "email": "anhkhoa.ta@gmail.com",         "phone": "0967913580"},
]

DEFAULT_PASSWORD = "Zikky@2025"


def seed():
    db = SessionLocal()
    created = 0
    skipped = 0
    try:
        for u in USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                print(f"  [skip] {u['email']} đã tồn tại")
                skipped += 1
                continue
            user = User(
                email=u["email"],
                password_hash=hash_password(DEFAULT_PASSWORD),
                full_name=u["full_name"],
                phone=u["phone"],
                role="user",
                is_active=True,
            )
            db.add(user)
            created += 1
            print(f"  [+] {u['full_name']} <{u['email']}>")

        db.commit()
        print(f"\nHoàn tất: {created} tạo mới, {skipped} bỏ qua.")
        print(f"Mật khẩu mặc định: {DEFAULT_PASSWORD}")
    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
