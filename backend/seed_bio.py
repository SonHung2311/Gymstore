"""
Seed script: thêm bio đa dạng cho 17 user đã tạo.
Chạy từ thư mục backend/: python seed_bio.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.user import User
from app.models import *  # noqa

BIOS = {
    "minhtuan.nguyen@gmail.com":
        "Đam mê thể hình và calisthenics. Đang theo chương trình tăng cơ 6 tháng, mục tiêu squat 120kg trước hè.",
    "lananh.tran@gmail.com":
        "Yoga buổi sáng giúp mình bắt đầu ngày mới tốt hơn 🌿 Đang học thêm Pilates để cải thiện tư thế.",
    "hoangnam.le@yahoo.com":
        "Runner nghiệp dư. Vừa hoàn thành HM đầu tiên ở HCMC Marathon. Mục tiêu 2025: full marathon sub-5h.",
    "thuhang.pham@gmail.com":
        "Gym 4 buổi/tuần sau giờ làm. Ưu tiên compound lift và không tin vào các loại thực phẩm bổ sung 'thần thánh'.",
    "ducckhai.vu@gmail.com":
        "Cựu vận động viên bơi lội, giờ chuyển sang CrossFit. Thích thử thách bản thân với WOD khó nhất trong lớp.",
    "thuylinh.dang@outlook.com":
        "Chỉ mới bắt đầu tập gym được 3 tháng nhưng đã thấy khác biệt rõ rệt. Cảm ơn cộng đồng ở đây rất nhiều ❤️",
    "vanhung.bui@gmail.com":
        "Personal trainer với 5 năm kinh nghiệm. Chuyên về strength & conditioning. DM nếu cần tư vấn lịch tập.",
    "myduyen.hoang@gmail.com":
        "Thích tập Zumba và aerobic hơn tập tạ 😄 Quan trọng nhất là vui và đều đặn mỗi tuần.",
    "quocbao.dinh@gmail.com":
        "Kỹ sư IT ban ngày, gym rat ban đêm. PR mới nhất: deadlift 160kg. Đang nghiên cứu chế độ ăn low-carb cycling.",
    "phuongmai.ngo@gmail.com":
        "Mẹ 2 con vẫn cố squeeze 3 buổi gym/tuần. Nếu mình làm được thì ai cũng làm được!",
    "thanh.tu97@gmail.com":
        "Sinh viên Y khoa, tập gym để giữ tỉnh táo trong mùa thi. Đang tìm hiểu về sports nutrition.",
    "kimngan.ly@yahoo.com":
        "Hành trình giảm 15kg trong 8 tháng — không nhịn ăn, không thần dược. Chỉ cần kiên trì và đúng phương pháp.",
    "ngocphat.ho@gmail.com":
        "Muay Thai + gym = combo hoàn hảo. Đang chuẩn bị cho giải đấu phong trào cuối năm.",
    "thanhuong.mai@gmail.com":
        "Dietitian & fitness enthusiast. Tin rằng dinh dưỡng chiếm 70% thành công trong tập luyện.",
    "chicong.phan@outlook.com":
        "Tập gym vì sức khỏe, không vì body. 40 tuổi nhưng cảm giác khỏe hơn hồi 25 rất nhiều.",
    "ngoctrinh.vo@gmail.com":
        "Dance fitness & barre workout là niềm vui của mình. Vừa tập vừa nghe nhạc K-pop — không thể thiếu! 🎵",
    "anhkhoa.ta@gmail.com":
        "Bodybuilder amateur, đã tham gia 2 giải local. Off-season đang bulk slow và theo dõi từng bữa ăn qua MyFitnessPal.",
}


def seed():
    db = SessionLocal()
    updated = 0
    not_found = 0
    try:
        for email, bio in BIOS.items():
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"  [!] Không tìm thấy: {email}")
                not_found += 1
                continue
            user.bio = bio
            updated += 1
            print(f"  [✓] {user.full_name}")
        db.commit()
        print(f"\nHoàn tất: {updated} cập nhật, {not_found} không tìm thấy.")
    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
