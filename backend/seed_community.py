"""
Seed script: tạo dữ liệu cộng đồng sôi nổi từ user hiện có.
- 15 bài đăng đa chủ đề, mỗi người một tính cách
- Admin đăng bài kèm voucher
- Comment đa chiều, có tranh luận / đồng ý / hỏi thêm
- Like phân bổ tự nhiên
Chạy: python seed_community.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.community import Post, Comment, Like
from app.models.voucher import Voucher
from app.models.user import User
from app.models import *  # noqa

# ── Helpers ────────────────────────────────────────────────────────────────────

def ago(days: int, hours: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours)

def future(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)

# ── Vouchers đăng kèm bài viết ─────────────────────────────────────────────────

VOUCHERS = [
    {
        "code": "GYMFLASH20",
        "description": "Flash sale: giảm 20% toàn bộ đơn hàng, tối đa 200k",
        "discount_type": "percent",
        "discount_value": 20,
        "min_order_amount": 300_000,
        "max_discount_amount": 200_000,
        "applies_to": "all",
        "usage_limit": 50,
        "per_user_limit": 1,
        "valid_from": ago(21),
        "valid_until": future(7),
        "is_active": True,
    },
    {
        "code": "WELCOME15",
        "description": "Chào mừng thành viên mới – giảm 15% đơn đầu tiên",
        "discount_type": "percent",
        "discount_value": 15,
        "min_order_amount": 200_000,
        "max_discount_amount": 150_000,
        "applies_to": "all",
        "usage_limit": 100,
        "per_user_limit": 1,
        "valid_from": ago(12),
        "valid_until": future(30),
        "is_active": True,
    },
    {
        "code": "WEEKEND10",
        "description": "Ưu đãi cuối tuần – giảm 10% đơn từ 150k",
        "discount_type": "percent",
        "discount_value": 10,
        "min_order_amount": 150_000,
        "max_discount_amount": 100_000,
        "applies_to": "all",
        "usage_limit": 80,
        "per_user_limit": 2,
        "valid_from": ago(2),
        "valid_until": future(5),
        "is_active": True,
    },
    {
        "code": "SUPP30K",
        "description": "Giảm 30.000đ cho đơn hàng supplement từ 250k",
        "discount_type": "fixed",
        "discount_value": 30_000,
        "min_order_amount": 250_000,
        "max_discount_amount": None,
        "applies_to": "all",
        "usage_limit": 60,
        "per_user_limit": 1,
        "valid_from": ago(5),
        "valid_until": future(14),
        "is_active": True,
    },
]

# ── Bài đăng + comment + like ──────────────────────────────────────────────────
# Tính cách:
#  Nguyễn Minh Tuấn  → phân tích kỹ thuật, dùng từ chuyên môn
#  Trần Thị Lan Anh  → nhiệt tình, hay hỏi thêm
#  Lê Hoàng Nam      → hay phản biện, thách thức quan điểm
#  Phạm Thị Thu Hằng → chia sẻ cá nhân, cảm xúc
#  Vũ Đức Khải       → hài hước, dùng ngôn ngữ gen Z
#  Đặng Thùy Linh    → quan tâm dinh dưỡng / healthy
#  Bùi Văn Hùng      → bodybuilder nghiêm túc, thực chiến
#  Hoàng Thị Mỹ Duyên→ hay kể chuyện, warm
#  Đinh Quốc Bảo     → newbie, hỏi cơ bản ngây thơ
#  Ngô Thị Phương Mai→ deal hunter, hay hỏi giá
#  Trương Thanh Tú   → kinh nghiệm lâu năm, kiệm lời
#  Lý Thị Kim Ngân   → review chi tiết, cẩn thận
#  Hồ Ngọc Phát      → hay so sánh brand
#  Mai Thanh Hương   → quan tâm sức khoẻ nữ, dinh dưỡng
#  Phan Chí Công     → PT-vibe, hay khuyên
#  Võ Thị Ngọc Trinh → chia sẻ progress, motivate
#  Tạ Anh Khoa       → góc nhìn khác biệt, đôi khi cà khịa
#  admin             → thông báo chính thức, hỗ trợ

POSTS = [
    # ── Post 1 ── Admin: Flash sale GYMFLASH20 ────────────────────────────────
    {
        "author": "admin@gymstore.com",
        "title": "🔥 FLASH SALE 48H – Giảm 20% toàn bộ đơn hàng",
        "content": (
            "**Xin chào cộng đồng GymStore!**\n\n"
            "Nhân dịp kỷ niệm 1 năm thành lập, chúng mình tung chương trình Flash Sale 48 giờ:\n\n"
            "- Giảm **20%** toàn bộ đơn hàng\n"
            "- Áp dụng cho đơn từ **300.000đ** trở lên\n"
            "- Giảm tối đa **200.000đ**\n"
            "- Mỗi tài khoản dùng **1 lần**\n\n"
            "Mã voucher: `GYMFLASH20`\n\n"
            "Chương trình kết thúc sau 48 tiếng kể từ khi bài đăng này xuất hiện. Nhanh tay nào anh chị em! 💪"
        ),
        "tags": ["flash-sale", "voucher", "thông-báo"],
        "created_at": ago(21),
        "comments": [
            {"author": "vanhung.bui@gmail.com",     "content": "Vừa đặt xong 2 hộp whey, xài mã được rồi. Giảm được 180k. Cảm ơn shop!",           "at": ago(20, 22)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Ủa freeship không shop ơi? Hay chỉ giảm giá sản phẩm thôi 😂",                       "at": ago(20, 21)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Nhưng mà 300k mới áp dụng, ai mua ít thì không hưởng được. Điều kiện hơi cao.",       "at": ago(20, 20)},
            {"author": "admin@gymstore.com",          "content": "Freeship áp dụng riêng cho đơn từ 500k bạn nhé 😊 Mã GYMFLASH20 là giảm giá sản phẩm.", "at": ago(20, 19)},
            {"author": "phuongmai.ngo@gmail.com",    "content": "Mình gom đơn nhóm 4 người, xài 4 mã khác nhau ngon lành 🎉",                          "at": ago(20, 18)},
            {"author": "quocbao.dinh@gmail.com",     "content": "Mã nhập ở đâu vậy mọi người? Mình mới mua lần đầu chưa biết 😅",                       "at": ago(20, 17)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Bạn vào giỏ hàng → thanh toán → có ô nhập mã voucher bạn nhé!",                        "at": ago(20, 16)},
            {"author": "anhkhoa.ta@gmail.com",        "content": "Flash sale mà chỉ 48h thì các bạn tỉnh miền Tây có kịp đặt không khi logistic chậm 🤔", "at": ago(20, 15)},
        ],
        "liked_by": [
            "minhtuan.nguyen@gmail.com", "vanhung.bui@gmail.com", "phuongmai.ngo@gmail.com",
            "thuylinh.dang@outlook.com", "lananh.tran@gmail.com", "myduyen.hoang@gmail.com",
            "thanh.tu97@gmail.com", "kimngan.ly@yahoo.com", "ngocphat.ho@gmail.com",
            "thanhuong.mai@gmail.com", "chicong.phan@outlook.com", "ngoctrinh.vo@gmail.com",
        ],
    },

    # ── Post 2 ── Bùi Văn Hùng: Review whey sau 3 tháng ──────────────────────
    {
        "author": "vanhung.bui@gmail.com",
        "title": "Review thật lòng sau 3 tháng dùng Whey Isolate",
        "content": (
            "Mình tập được 4 năm, dùng đủ loại whey từ Gold Standard, Optimum, đến mấy brand nội địa.\n\n"
            "**Sau 3 tháng dùng Whey Isolate ở đây, honest review:**\n\n"
            "✅ Protein content đúng label (tự test bằng amino spike test)\n"
            "✅ Tiêu hoá tốt, không bị đầy bụng kể cả khi uống lúc đói\n"
            "✅ Vị chocolate chip không quá ngọt, mix với 300ml nước lạnh là ổn\n"
            "✅ Bọt ít, tan nhanh với bình lắc\n\n"
            "❌ Giá có nhỉnh hơn một chút so với mua trực tiếp trên Shopee\n"
            "❌ Túi zip đôi khi khó kéo\n\n"
            "Overall 8.5/10. Sẽ tiếp tục mua."
        ),
        "tags": ["review", "whey-protein", "supplement"],
        "created_at": ago(19),
        "comments": [
            {"author": "ngocphat.ho@gmail.com",      "content": "Bạn so sánh với ON Gold Standard thì cái nào protein per scoop cao hơn?",                "at": ago(18, 23)},
            {"author": "vanhung.bui@gmail.com",      "content": "ON GS 24g/30g scoop, cái này 25g/30g. Gần tương đương, nhưng cái này ít carb hơn.",      "at": ago(18, 22)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Amino spike test không chính xác lắm đâu bạn ơi, cần HPLC mới chuẩn.",                    "at": ago(18, 21)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Đúng là HPLC chuẩn hơn, nhưng amino spike test cũng là indicator khá tốt để sàng lọc.", "at": ago(18, 20)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Không đủ để kết luận, dễ false negative. Không tranh luận nữa nhưng mọi người nên biết.", "at": ago(18, 19)},
            {"author": "thuhang.pham@gmail.com",     "content": "Mình cũng dùng vị này, đồng ý với review. Thêm 1 ít bột cacao vào thì ngon hơn nữa 😋",  "at": ago(18, 18)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Túi zip khó kéo hả, mình cũng bị haha. Dùng kẹp túi thức ăn cho tiện bro",               "at": ago(18, 17)},
            {"author": "chicong.phan@outlook.com",   "content": "Với người tập 4 năm thì isolate đúng hơn concentrate vì tiêu hoá nhanh hơn post-workout.", "at": ago(18, 16)},
        ],
        "liked_by": [
            "minhtuan.nguyen@gmail.com", "lananh.tran@gmail.com", "thuhang.pham@gmail.com",
            "thuylinh.dang@outlook.com", "quocbao.dinh@gmail.com", "thanh.tu97@gmail.com",
            "chicong.phan@outlook.com", "ngoctrinh.vo@gmail.com", "anhkhoa.ta@gmail.com",
        ],
    },

    # ── Post 3 ── Lê Hoàng Nam: Tranh luận về Creatine ───────────────────────
    {
        "author": "hoangnam.le@yahoo.com",
        "title": "Creatine có thực sự hiệu quả hay chỉ là marketing?",
        "content": (
            "Mình thấy nhiều người ca ngợi creatine như thần dược, nhưng thực tế:\n\n"
            "1. 25–30% dân số là **non-responder** — tức uống cũng không tăng strength\n"
            "2. Phần lớn nghiên cứu được tài trợ bởi chính các hãng supplement\n"
            "3. Water retention ban đầu dễ bị nhầm với tăng muscle\n"
            "4. Nếu ăn đủ thịt đỏ (creatine tự nhiên), lợi ích có thể không đáng kể\n\n"
            "Mọi người nghĩ sao? Mình không nói creatine vô dụng, chỉ đặt câu hỏi liệu nó có bị over-hype không."
        ),
        "tags": ["creatine", "supplement", "thảo-luận"],
        "created_at": ago(17),
        "comments": [
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Cochrane meta-analysis 2021 trên 22 RCT cho thấy creatine tăng trung bình 8% sức mạnh. Đây là evidence level cao nhất.", "at": ago(16, 23)},
            {"author": "hoangnam.le@yahoo.com",      "content": "8% trung bình bao gồm cả responder. Với non-responder con số gần 0. Bạn cần stratify data mới meaningful.", "at": ago(16, 22)},
            {"author": "vanhung.bui@gmail.com",      "content": "Mình tập 4 năm, dùng creatine 2 lần. Lần nào deadlift cũng tăng trong 3 tuần đầu. Không phải placebo.", "at": ago(16, 21)},
            {"author": "chicong.phan@outlook.com",   "content": "Với mức giá creatine mono bây giờ, ngay cả với non-responder thì rủi ro tài chính gần như bằng 0. Cứ thử 8 tuần.", "at": ago(16, 20)},
            {"author": "anhkhoa.ta@gmail.com",       "content": "Điểm thú vị là creatine còn có benefit với cognitive function. Ít ai nói tới nhưng research khá solid.", "at": ago(16, 19)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Bro đang debate trong lúc mình thì đang squat 😂 Uống đi rồi biết ngay thôi.", "at": ago(16, 18)},
            {"author": "quocbao.dinh@gmail.com",     "content": "Non-responder là sao ạ? Uống mà không có tác dụng gì ấy ạ?",                                      "at": ago(16, 17)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "@Quốc Bảo: đúng rồi bạn, khoảng 25% người cơ thể đã bão hoà creatine từ chế độ ăn (đặc biệt người ăn nhiều thịt đỏ) nên supplement thêm ít tác dụng hơn.", "at": ago(16, 16)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Mình ăn chay nên chắc là responder 😅 Dùng creatine rõ ràng hơn người ăn thịt.",                    "at": ago(16, 15)},
        ],
        "liked_by": [
            "minhtuan.nguyen@gmail.com", "vanhung.bui@gmail.com", "chicong.phan@outlook.com",
            "anhkhoa.ta@gmail.com", "thuylinh.dang@outlook.com", "lananh.tran@gmail.com",
            "ngocphat.ho@gmail.com", "kimngan.ly@yahoo.com",
        ],
    },

    # ── Post 4 ── Võ Thị Ngọc Trinh: Progress 3 tháng ─────────────────────────
    {
        "author": "ngoctrinh.vo@gmail.com",
        "title": "3 tháng tập gym từ đầu — progress của mình 💪",
        "content": (
            "Hôm nay đúng 3 tháng mình bắt đầu tập, muốn chia sẻ để ai đang do dự có thêm động lực!\n\n"
            "**Tháng 1:** Đi tập 3 buổi/tuần, chủ yếu máy. Cơ thể đau ê ẩm cả tuần đầu 😭\n"
            "**Tháng 2:** Tăng lên 4 buổi, bắt đầu dùng free weight. Thêm protein shake.\n"
            "**Tháng 3:** Squat từ 20kg → 45kg. Bench từ 0 (không làm được) → 30kg x 8 reps.\n\n"
            "**Thay đổi cảm nhận:** Quần jeans rộng ra 1 size ở vòng đùi nhưng vừa hơn ở eo 😄 Ngủ ngon hơn nhiều.\n\n"
            "Ai cũng bắt đầu từ con số 0 hết nha. Đừng ngại 🙌"
        ),
        "tags": ["progress", "motivation", "gym-mới"],
        "created_at": ago(15),
        "comments": [
            {"author": "lananh.tran@gmail.com",      "content": "Ôi trời 3 tháng mà squat lên 45kg ngon quá! Bạn có PT hướng dẫn không hay tự học?",       "at": ago(14, 23)},
            {"author": "ngoctrinh.vo@gmail.com",     "content": "Mình tự học qua YouTube và hỏi thêm mấy anh trong gym. Không có budget thuê PT nên cố gắng tự học kỹ thuật.", "at": ago(14, 22)},
            {"author": "chicong.phan@outlook.com",   "content": "Tiến bộ nhanh vậy là tốt lắm! Lưu ý giai đoạn này tập trung kỹ thuật hơn trọng lượng nhé, dễ chấn thương.", "at": ago(14, 21)},
            {"author": "myduyen.hoang@gmail.com",    "content": "Mình cũng giống bạn, tháng đầu đau ơi là đau 😭 Nhưng qua được là thấy nghiện liền!", "at": ago(14, 20)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Bench 0 lên 30kg x8 trong 3 tháng là VN tier bro, siêu đấy 🔥",                            "at": ago(14, 19)},
            {"author": "thuhang.pham@gmail.com",     "content": "Cảm ơn bạn đã share! Mình đang do dự đi gym mà đọc xong quyết định đăng ký luôn tuần này.", "at": ago(14, 18)},
            {"author": "thanh.tu97@gmail.com",       "content": "Squat 45kg sau 3 tháng ok. Để ý form quan trọng hơn nặng. Chúc tiếp tục maintain.",       "at": ago(14, 17)},
        ],
        "liked_by": [
            "lananh.tran@gmail.com", "thuhang.pham@gmail.com", "myduyen.hoang@gmail.com",
            "ducckhai.vu@gmail.com", "chicong.phan@outlook.com", "thanh.tu97@gmail.com",
            "kimngan.ly@yahoo.com", "thanhuong.mai@gmail.com", "quocbao.dinh@gmail.com",
            "phuongmai.ngo@gmail.com", "minhtuan.nguyen@gmail.com", "thuylinh.dang@outlook.com",
            "admin@gymstore.com",
        ],
    },

    # ── Post 5 ── Đinh Quốc Bảo: Hỏi về bulking ──────────────────────────────
    {
        "author": "quocbao.dinh@gmail.com",
        "title": "Mới tập 2 tháng, không biết nên bulking hay cutting trước?",
        "content": (
            "Mọi người ơi cho mình hỏi tí 😅\n\n"
            "Mình 22 tuổi, 65kg, cao 1m72, body fat mình nghĩ tầm 18-20% (không đo chính xác).\n\n"
            "Mình đang phân vân:\n"
            "- **Bulking trước** để có cơ rồi sau đó cutting? \n"
            "- Hay **cutting trước** để lean xong mới build cơ?\n\n"
            "Mình muốn có body like 'athletic slim' kiểu vừa cơ vừa không quá to. Cảm ơn mọi người!"
        ),
        "tags": ["hỏi-đáp", "bulking", "cutting", "newbie"],
        "created_at": ago(14),
        "comments": [
            {"author": "chicong.phan@outlook.com",   "content": "Với 18-20% body fat, mình khuyên bạn không nên bulk thêm. Recomp (ăn maintenance + tập tốt) sẽ phù hợp hơn ở giai đoạn này.", "at": ago(13, 23)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Đồng ý với anh Phan. Body fat >18% mà bulk thêm dễ mập hơn là cơ. Với newbie thì body recomp khả thi và hiệu quả.", "at": ago(13, 22)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Thực ra với beginner thì cơ thể có thể vừa mất mỡ vừa tăng cơ cùng lúc dù ăn maintenance. Đừng rush vào bulk.", "at": ago(13, 21)},
            {"author": "vanhung.bui@gmail.com",      "content": "Tập đủ compound lift, ăn 2g protein/kg cân nặng, ngủ đủ giấc. Mọi thứ khác sẽ tự sắp xếp.",              "at": ago(13, 20)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Bro cứ tập đi rồi tính 🤣 2 tháng chưa cần lo bulk cut gì hết, lo kỹ thuật trước",                    "at": ago(13, 19)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Quan trọng nhất là chất lượng bữa ăn. Ưu tiên protein, giảm sugar và processed food. Không cần extreme approach.", "at": ago(13, 18)},
            {"author": "quocbao.dinh@gmail.com",     "content": "Cảm ơn mọi người nhiều! Mình sẽ thử recomp, ăn đủ protein và focus vào form kỹ thuật trước ạ 🙏",          "at": ago(13, 17)},
        ],
        "liked_by": [
            "chicong.phan@outlook.com", "minhtuan.nguyen@gmail.com", "hoangnam.le@yahoo.com",
            "thuylinh.dang@outlook.com", "vanhung.bui@gmail.com", "lananh.tran@gmail.com",
            "ngoctrinh.vo@gmail.com", "ducckhai.vu@gmail.com",
        ],
    },

    # ── Post 6 ── Admin: Voucher WELCOME15 mừng thành viên mới ───────────────
    {
        "author": "admin@gymstore.com",
        "title": "Quà tặng thành viên mới – Voucher WELCOME15",
        "content": (
            "Chào mừng tất cả thành viên mới của GymStore Community! 🎉\n\n"
            "Để tri ân các bạn mới đăng ký, GymStore tặng mã giảm giá dành riêng:\n\n"
            "**Mã: `WELCOME15`**\n"
            "- Giảm **15%** đơn hàng đầu tiên\n"
            "- Áp dụng cho đơn từ **200.000đ**\n"
            "- Giảm tối đa **150.000đ**\n"
            "- Hiệu lực: **30 ngày** kể từ hôm nay\n\n"
            "Hãy ghé cửa hàng và trải nghiệm ngay nhé! Nếu có thắc mắc, nhắn tin cho chúng mình qua trang Liên hệ. 💬"
        ),
        "tags": ["voucher", "thành-viên-mới", "thông-báo"],
        "created_at": ago(12),
        "comments": [
            {"author": "quocbao.dinh@gmail.com",     "content": "Ơ hay quá! Mình mới đăng ký hôm qua, dùng được mã này không shop ơi?",                      "at": ago(11, 23)},
            {"author": "admin@gymstore.com",          "content": "Được bạn nhé! Thành viên mới trong vòng 30 ngày đều dùng được mã WELCOME15 😊",               "at": ago(11, 22)},
            {"author": "phuongmai.ngo@gmail.com",    "content": "Tuyệt vời! Mình vừa giới thiệu thêm 2 người bạn vào đây rồi, để họ có mã xài 🤭",            "at": ago(11, 21)},
            {"author": "lananh.tran@gmail.com",      "content": "Mã này combine được với GYMFLASH20 không ạ?",                                                   "at": ago(11, 20)},
            {"author": "admin@gymstore.com",          "content": "Hiện tại mỗi đơn chỉ áp dụng 1 mã bạn nhé. Chọn mã nào giảm nhiều hơn cho bạn ấy!",          "at": ago(11, 19)},
            {"author": "myduyen.hoang@gmail.com",    "content": "GymStore hay lắm, thỉnh thoảng có deal ngon. Mình mua ở đây mấy tháng nay rồi rất ưng 😊",     "at": ago(11, 18)},
            {"author": "anhkhoa.ta@gmail.com",       "content": "Có voucher riêng cho khách hàng lâu năm không shop? Mình mua hơn 1 năm rồi chưa thấy 😅",     "at": ago(11, 17)},
            {"author": "admin@gymstore.com",          "content": "Có bạn ơi! Chương trình loyalty đang được chuẩn bị, sẽ ra mắt sớm. Stay tuned nhé 🔔",       "at": ago(11, 16)},
        ],
        "liked_by": [
            "quocbao.dinh@gmail.com", "phuongmai.ngo@gmail.com", "lananh.tran@gmail.com",
            "myduyen.hoang@gmail.com", "thuhang.pham@gmail.com", "hoangnam.le@yahoo.com",
            "ducckhai.vu@gmail.com", "ngoctrinh.vo@gmail.com", "vanhung.bui@gmail.com",
            "minhtuan.nguyen@gmail.com", "thuylinh.dang@outlook.com",
        ],
    },

    # ── Post 7 ── Nguyễn Minh Tuấn: Tập sáng vs tối ─────────────────────────
    {
        "author": "minhtuan.nguyen@gmail.com",
        "title": "Phân tích khoa học: Tập gym sáng sớm vs buổi tối",
        "content": (
            "Câu hỏi này mình thấy nhiều người hỏi, nên viết bài tổng hợp từ nghiên cứu:\n\n"
            "**Buổi sáng (6–8h):**\n"
            "- Cortisol cao nhất trong ngày → tốt để mobilize fat\n"
            "- Testosterone cũng peak vào buổi sáng ở nam\n"
            "- Nhưng: core temperature thấp → risk chấn thương cao hơn, cần warm-up kỹ hơn\n\n"
            "**Buổi tối (17–20h):**\n"
            "- Core temperature đạt đỉnh → muscle flexibility tốt nhất\n"
            "- Reaction time và hand-eye coordination tốt hơn ~5%\n"
            "- Strength output cao hơn 3–5% theo các nghiên cứu\n\n"
            "**Kết luận:** Buổi tối có lợi thế về performance. Nhưng consistency quan trọng hơn timing. Tập lúc nào duy trì được lâu dài, đó là tốt nhất."
        ),
        "tags": ["khoa-học", "lịch-tập", "thảo-luận"],
        "created_at": ago(11),
        "comments": [
            {"author": "hoangnam.le@yahoo.com",      "content": "Cortisol sáng cũng có hại cho muscle protein synthesis. Không hoàn toàn là lợi thế để build muscle.",  "at": ago(10, 23)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Đúng, nhưng mức cortisol physiological bình thường không ức chế MPS đủ mạnh. Chỉ cần ăn đủ protein là offset được.", "at": ago(10, 22)},
            {"author": "vanhung.bui@gmail.com",      "content": "Mình tập 5h sáng 4 năm nay rồi, vẫn progress bình thường. Lý thuyết là một chuyện, thực tế là chuyện khác.", "at": ago(10, 21)},
            {"author": "thanh.tu97@gmail.com",       "content": "Đồng ý với conclusion. Gym lúc nào tập được mà đi đủ buổi thì tốt rồi.",                               "at": ago(10, 20)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Mình tập 11h đêm vì làm ca 😂 Không sáng không tối, tối thui luôn. Vẫn chạy được",                    "at": ago(10, 19)},
            {"author": "lananh.tran@gmail.com",      "content": "Tập sáng còn được cái năng lượng tốt cả ngày, mình thấy mood cải thiện rõ khi tập trước 8h.",          "at": ago(10, 18)},
            {"author": "chicong.phan@outlook.com",   "content": "Với client của mình, người tập sáng consistency cao hơn vì ít bị sự kiện ban ngày cancel buổi tập.",    "at": ago(10, 17)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Tập sáng mình thích vì không phải nghĩ đến food timing phức tạp, cứ ăn sáng nhẹ rồi tập.",            "at": ago(10, 16)},
        ],
        "liked_by": [
            "hoangnam.le@yahoo.com", "vanhung.bui@gmail.com", "thanh.tu97@gmail.com",
            "chicong.phan@outlook.com", "thuylinh.dang@outlook.com", "lananh.tran@gmail.com",
            "kimngan.ly@yahoo.com", "ducckhai.vu@gmail.com", "myduyen.hoang@gmail.com",
            "phuongmai.ngo@gmail.com",
        ],
    },

    # ── Post 8 ── Vũ Đức Khải: Hài hước ─────────────────────────────────────
    {
        "author": "ducckhai.vu@gmail.com",
        "title": "POV: Bạn là người hay skip leg day 💀",
        "content": (
            "Tổng hợp những câu nói bất hủ của anh em skip leg day:\n\n"
            "- *'Hôm nay đau gối, thôi tập tay thay'*\n"
            "- *'Chân đã có đi bộ từ nhà ra gym rồi'*\n"
            "- *'Quần dài nên ai thấy đâu mà lo'*\n"
            "- *'Mình tập xe đạp rồi, chân ổn mà'*\n"
            "- *'Ngày mai tập chân, hứa luôn'* (ngày mai vẫn tay)\n\n"
            "Đừng giận, mình cũng là một trong số đó cho đến khi bạn gái cười ảnh mình mặc shorts 😭\n\n"
            "Ai đồng cảnh ngộ điểm danh 👇"
        ),
        "tags": ["hài-hước", "leg-day", "gym-life"],
        "created_at": ago(9),
        "comments": [
            {"author": "quocbao.dinh@gmail.com",     "content": "ĐIỂM DANH 🙋 Mình 3 tháng tập mà chân hầu như không tập gì 😂",                                   "at": ago(8, 23)},
            {"author": "vanhung.bui@gmail.com",      "content": "Leg day là bài test ý chí thật sự. Ai squat heavy đều biết cảm giác muốn quit sau warm-up.",       "at": ago(8, 22)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Thật ra tập chân quan trọng nhất vì kích thích testosterone nhiều nhất. Skip leg là tự hại mình.", "at": ago(8, 21)},
            {"author": "ducckhai.vu@gmail.com",      "content": "@Nam nói đúng nhưng mà sao mỗi lần nghe squat là mình muốn trốn 😭",                               "at": ago(8, 20)},
            {"author": "myduyen.hoang@gmail.com",    "content": "Hahaha cái POV 'ngày mai tập chân' này chuẩn quá trời 🤣 Mình cũng vậy hoài",                      "at": ago(8, 19)},
            {"author": "ngoctrinh.vo@gmail.com",     "content": "Mình tập chân đều vì squat giúp giảm vòng đùi nhanh lắm! Chị em đừng bỏ nha 😤",                  "at": ago(8, 18)},
            {"author": "chicong.phan@outlook.com",   "content": "Lower body là 50% body mass. Skip là bỏ qua một nửa potential growth. Think about it 👀",          "at": ago(8, 17)},
            {"author": "thanh.tu97@gmail.com",       "content": "Mình không skip. Chân to còn nặng hơn tay, tại sao bỏ.",                                           "at": ago(8, 16)},
            {"author": "anhkhoa.ta@gmail.com",       "content": "Thật ra chỉ cần nói 'mình không thích tập chân' thay vì tìm lý do. Ít nhất là trung thực 😅",      "at": ago(8, 15)},
        ],
        "liked_by": [
            "quocbao.dinh@gmail.com", "myduyen.hoang@gmail.com", "lananh.tran@gmail.com",
            "thuhang.pham@gmail.com", "ngoctrinh.vo@gmail.com", "minhtuan.nguyen@gmail.com",
            "hoangnam.le@yahoo.com", "vanhung.bui@gmail.com", "kimngan.ly@yahoo.com",
            "phuongmai.ngo@gmail.com", "thanhuong.mai@gmail.com", "thuylinh.dang@outlook.com",
            "admin@gymstore.com",
        ],
    },

    # ── Post 9 ── Trương Thanh Tú: Lịch tập PPL ─────────────────────────────
    {
        "author": "thanh.tu97@gmail.com",
        "title": "Lịch tập Push/Pull/Legs 6 ngày/tuần cho intermediate",
        "content": (
            "Chia sẻ lịch tập mình đang dùng, hiệu quả với người tập 1–3 năm:\n\n"
            "**Push A:** Bench Press, OHP, Incline DB, Tricep Pushdown, Lateral Raise\n"
            "**Pull A:** Barbell Row, Lat Pulldown, Face Pull, Barbell Curl, Hammer Curl\n"
            "**Legs A:** Squat, Romanian DL, Leg Press, Leg Curl, Calf Raise\n"
            "**Push B:** Incline Bench, Dips, Cable Fly, Overhead Extension, Rear Delt\n"
            "**Pull B:** Deadlift, Pull-up, Seated Cable Row, Incline Curl, Reverse Curl\n"
            "**Legs B:** Front Squat, Hip Thrust, Bulgarian Split Squat, Leg Extension, Tibialis Raise\n\n"
            "Progressive overload mỗi tuần +2.5kg hoặc +1 rep. Đơn giản nhưng hiệu quả."
        ),
        "tags": ["lịch-tập", "PPL", "intermediate", "program"],
        "created_at": ago(8),
        "comments": [
            {"author": "minhtuan.nguyen@gmail.com",  "content": "PPL 6 ngày volume khá cao. Bạn có deload week không? Và recovery như nào?",                          "at": ago(7, 23)},
            {"author": "thanh.tu97@gmail.com",       "content": "Deload mỗi 8 tuần. Ngủ 7-8 tiếng, protein 2g/kg. Chưa cần massage hay gì thêm.",                  "at": ago(7, 22)},
            {"author": "chicong.phan@outlook.com",   "content": "Lịch này solid cho intermediate. Newbie không nên dùng, full body 3 ngày/tuần phù hợp hơn.",        "at": ago(7, 21)},
            {"author": "vanhung.bui@gmail.com",      "content": "Tibialis Raise ít người biết nhưng giúp phòng shin splints rất tốt. Mình thêm vào từ lâu rồi.",   "at": ago(7, 20)},
            {"author": "lananh.tran@gmail.com",      "content": "Mình thấy 6 ngày quá nhiều với mình 😅 Bạn có version 4 ngày không?",                              "at": ago(7, 19)},
            {"author": "thanh.tu97@gmail.com",       "content": "Bỏ Push B và Pull B, chạy Push A, Pull A, Legs A, nghỉ 1, lặp lại. 4 ngày là đủ.",               "at": ago(7, 18)},
            {"author": "quocbao.dinh@gmail.com",     "content": "Cho mình hỏi OHP là bài gì vậy ạ? Mình hay bị confused bởi mấy từ viết tắt 😅",                   "at": ago(7, 17)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Overhead Press — đẩy tạ thẳng lên đầu. Bài kim cương cho vai bạn ơi.",                              "at": ago(7, 16)},
        ],
        "liked_by": [
            "minhtuan.nguyen@gmail.com", "chicong.phan@outlook.com", "vanhung.bui@gmail.com",
            "lananh.tran@gmail.com", "hoangnam.le@yahoo.com", "ngoctrinh.vo@gmail.com",
            "anhkhoa.ta@gmail.com", "thuhang.pham@gmail.com",
        ],
    },

    # ── Post 10 ── Đặng Thùy Linh: Meal prep sau tập ─────────────────────────
    {
        "author": "thuylinh.dang@outlook.com",
        "title": "Meal prep sau tập của mình — đơn giản, đủ dinh dưỡng",
        "content": (
            "Nhiều người hỏi mình ăn gì sau tập, chia sẻ meal prep 1 tuần nhé:\n\n"
            "**Protein sources (luân phiên):**\n"
            "- Ức gà luộc/áp chảo (~200g/bữa)\n"
            "- Cá hồi áp chảo (2 lần/tuần)\n"
            "- Trứng luộc + whey shake (những ngày bận)\n\n"
            "**Carbs:**\n"
            "- Cơm gạo lứt hoặc khoai lang (100–150g cooked)\n"
            "- Tránh cơm trắng buổi tối\n\n"
            "**Rau xanh:** Cải bó xôi, bông cải xanh, cà rốt — luộc sơ hoặc xào ít dầu\n\n"
            "Bữa sau tập ăn trong vòng 60 phút là tốt nhất. Không cần phức tạp, nhất quán mới là chìa khoá!"
        ),
        "tags": ["dinh-dưỡng", "meal-prep", "healthy-eating"],
        "created_at": ago(7),
        "comments": [
            {"author": "thanhuong.mai@gmail.com",    "content": "Mình cũng muốn meal prep nhưng sợ ăn đi ăn lại chán. Bạn không bị nhàm không?",                  "at": ago(6, 23)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Có chứ! Mình dùng sauce/gia vị khác nhau mỗi ngày. Ức gà hôm marinate sả ớt, hôm thì teriyaki.", "at": ago(6, 22)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Window 60 phút sau tập thực ra là myth đã bị debunk. Tổng protein cả ngày quan trọng hơn timing.", "at": ago(6, 21)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Phụ thuộc vào fasted state hay không. Nếu nhịn ăn trước tập thì timing có ý nghĩa hơn.",           "at": ago(6, 20)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Oke hai bạn đúng về mặt science. Mình viết đơn giản hoá, nhưng ăn sớm sau tập cũng là habit tốt.", "at": ago(6, 19)},
            {"author": "myduyen.hoang@gmail.com",    "content": "Gạo lứt với khoai lang thật sự ngon nếu nấu đúng cách! Mình add thêm mè vào cơm gạo lứt 😋",     "at": ago(6, 18)},
            {"author": "phuongmai.ngo@gmail.com",    "content": "Cá hồi đắt quá bạn ơi, dùng cá basa thay thế được không? Protein gần tương đương mà giá rẻ hơn nhiều.", "at": ago(6, 17)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Được chứ! Cá basa cũng ổn, protein ok, chỉ ít omega-3 hơn cá hồi thôi. Add thêm omega-3 supplement là đủ.", "at": ago(6, 16)},
        ],
        "liked_by": [
            "thanhuong.mai@gmail.com", "myduyen.hoang@gmail.com", "phuongmai.ngo@gmail.com",
            "lananh.tran@gmail.com", "thuhang.pham@gmail.com", "ngoctrinh.vo@gmail.com",
            "chicong.phan@outlook.com", "quocbao.dinh@gmail.com", "admin@gymstore.com",
        ],
    },

    # ── Post 11 ── Hồ Ngọc Phát: So sánh whey brands ─────────────────────────
    {
        "author": "ngocphat.ho@gmail.com",
        "title": "So sánh chi tiết 3 loại Whey đang hot trên thị trường VN",
        "content": (
            "Mình đã mua và dùng thử 3 loại trong 3 tháng vừa rồi, đây là bảng so sánh:\n\n"
            "| | Optimum Gold Standard | Dymatize ISO100 | MuscleTech Nitrotech |\n"
            "|---|---|---|---|\n"
            "| Protein/scoop | 24g | 25g | 30g |\n"
            "| Carb/scoop | 3g | 1g | 4g |\n"
            "| Giá (1kg) | ~800k | ~950k | ~700k |\n"
            "| Vị (theo mình) | 8/10 | 9/10 | 6/10 |\n"
            "| Tiêu hoá | Tốt | Rất tốt | Tạm |\n\n"
            "**Winner của mình:** Dymatize ISO100 nếu budget được. Optimum nếu muốn cân bằng giá/chất.\n\n"
            "Ai dùng brand nào khác, share thêm nhé!"
        ),
        "tags": ["review", "so-sánh", "whey-protein", "supplement"],
        "created_at": ago(5),
        "comments": [
            {"author": "vanhung.bui@gmail.com",      "content": "Mình add thêm: Rule1 Protein giá tầm Optimum nhưng macro tốt hơn, ít additive hơn. Đáng thử.",  "at": ago(4, 23)},
            {"author": "hoangnam.le@yahoo.com",      "content": "MuscleTech Nitrotech bị nhiều lab test chỉ ra protein content thấp hơn label. Cẩn thận.",       "at": ago(4, 22)},
            {"author": "ngocphat.ho@gmail.com",      "content": "@Nam mình cũng thấy vậy, đó là lý do mình cho điểm thấp nhất. Taste cũng không convince lắm.", "at": ago(4, 21)},
            {"author": "phuongmai.ngo@gmail.com",    "content": "Tính theo price per gram protein thì cái nào rẻ nhất bạn ơi?",                                   "at": ago(4, 20)},
            {"author": "ngocphat.ho@gmail.com",      "content": "Optimum: ~33k/10g protein. Dymatize: ~38k/10g. MuscleTech: ~23k/10g nhưng quality đáng ngờ.",  "at": ago(4, 19)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Ngoài macro còn phải xem amino acid profile, digestibility (PDCAAS/DIAAS score). Whey isolate thường score cao hơn concentrate.", "at": ago(4, 18)},
            {"author": "thanh.tu97@gmail.com",       "content": "Dùng gì quen cái đó. Đổi brand liên tục không thấy khác biệt nhiều.",                          "at": ago(4, 17)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Mình dùng cái rẻ nhất mua được 😂 Supplement not gonna out-eat a bad diet anyway",             "at": ago(4, 16)},
            {"author": "lananh.tran@gmail.com",      "content": "Bạn làm video review không? Đọc bảng so sánh thế này hữu ích lắm, muốn xem thêm!",            "at": ago(4, 15)},
        ],
        "liked_by": [
            "vanhung.bui@gmail.com", "phuongmai.ngo@gmail.com", "minhtuan.nguyen@gmail.com",
            "thanh.tu97@gmail.com", "lananh.tran@gmail.com", "thuhang.pham@gmail.com",
            "chicong.phan@outlook.com", "kimngan.ly@yahoo.com", "anhkhoa.ta@gmail.com",
            "quocbao.dinh@gmail.com",
        ],
    },

    # ── Post 12 ── Lý Thị Kim Ngân: Review chi tiết đồ tập ───────────────────
    {
        "author": "kimngan.ly@yahoo.com",
        "title": "Review chi tiết bộ leggings và sports bra sau 2 tháng dùng hàng ngày",
        "content": (
            "Mình mua bộ leggings + sports bra của GymStore tháng trước, sau 2 tháng giặt máy hàng tuần xin review:\n\n"
            "**Leggings:**\n"
            "✅ Co giãn 4 chiều, không bị tuột khi squat sâu\n"
            "✅ Cạp cao, bụng không bị 'muffin top'\n"
            "✅ Màu không phai sau 8 lần giặt máy 40°C\n"
            "❌ Đường may ở đùi trong đôi khi cọ nhẹ khi chạy dài\n\n"
            "**Sports bra:**\n"
            "✅ Support tốt cho B-C cup (mình B)\n"
            "✅ Dây không bị lệch dù tập cardio mạnh\n"
            "✅ Khô nhanh sau giặt\n"
            "❌ Giá hơi cao so với mặt bằng chung\n\n"
            "Overall 4.2/5. Sẽ mua thêm màu mới khi có deal."
        ),
        "tags": ["review", "đồ-tập", "leggings", "chị-em"],
        "created_at": ago(4),
        "comments": [
            {"author": "ngoctrinh.vo@gmail.com",     "content": "Mình cũng đang muốn mua! Bạn mua size nào? Mình 58kg cao 1m63.",                                  "at": ago(3, 23)},
            {"author": "kimngan.ly@yahoo.com",       "content": "Mình 55kg, 1m60, mua size S vừa vặn. Bạn thử size M cho chắc nhé!",                              "at": ago(3, 22)},
            {"author": "lananh.tran@gmail.com",      "content": "Cạp cao mà không bị roll down khi squat sâu là điểm cộng lớn, nhiều legging rẻ bị vấn đề này lắm!", "at": ago(3, 21)},
            {"author": "myduyen.hoang@gmail.com",    "content": "Mình cũng mua rồi, màu xanh teal đẹp lắm 🥹 Đồng ý về đường may nhưng sau vài buổi quen không thấy nữa.", "at": ago(3, 20)},
            {"author": "thanhuong.mai@gmail.com",    "content": "Sports bra support tốt thật không bạn? Mình hay gặp vấn đề này, hầu hết loại rẻ thì support kém.", "at": ago(3, 19)},
            {"author": "kimngan.ly@yahoo.com",       "content": "@Hương: Với B cup thì ổn. D cup trở lên mình không chắc vì không có kinh nghiệm 😅",              "at": ago(3, 18)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Lạc đề nhưng mình mua áo tập ở đây cũng xịn lắm, mọi người qua xem thử 😂",                      "at": ago(3, 17)},
            {"author": "phuongmai.ngo@gmail.com",    "content": "Có deal gì không bạn? Mình đang chờ có khuyến mãi mới mua vì giá hơi chát với mình.",            "at": ago(3, 16)},
        ],
        "liked_by": [
            "ngoctrinh.vo@gmail.com", "lananh.tran@gmail.com", "myduyen.hoang@gmail.com",
            "thanhuong.mai@gmail.com", "thuhang.pham@gmail.com", "phuongmai.ngo@gmail.com",
            "thuylinh.dang@outlook.com",
        ],
    },

    # ── Post 13 ── Mai Thanh Hương: Giảm cân giữ cơ ─────────────────────────
    {
        "author": "thanhuong.mai@gmail.com",
        "title": "Làm sao vừa giảm mỡ vừa không mất cơ? Mình đang loay hoay quá",
        "content": (
            "Mình 28 tuổi, tập gym được 6 tháng. Mục tiêu giảm 5kg mỡ nhưng giữ cơ (hay thậm chí tăng).\n\n"
            "Mình đang làm:\n"
            "- Calorie deficit 300kcal/ngày\n"
            "- Protein 1.6g/kg\n"
            "- Tập 4 buổi/tuần (2 strength + 2 cardio)\n\n"
            "Nhưng sau 6 tuần cân không giảm nhiều (~1kg). Body measurement thay đổi nhẹ nhưng mình không confirm được là mỡ giảm hay cơ giảm.\n\n"
            "Mọi người có kinh nghiệm gì không? Mình có đang làm đúng không?"
        ),
        "tags": ["giảm-cân", "body-recomp", "hỏi-đáp", "chị-em"],
        "created_at": ago(3),
        "comments": [
            {"author": "chicong.phan@outlook.com",   "content": "1kg trong 6 tuần với recomp là progress bình thường. Cân số không phản ánh hết, đo body measurement hàng tuần mới chuẩn.", "at": ago(2, 23)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Protein 1.6g/kg ok nhưng khi cutting nên up lên 2g/kg để bảo vệ cơ tốt hơn. Deficit 300kcal vừa phải, không nên cao hơn.", "at": ago(2, 22)},
            {"author": "thuylinh.dang@outlook.com",  "content": "Cardio 2 buổi bạn đang làm gì? LISS hay HIIT? HIIT giúp preserve muscle tốt hơn khi cutting.",  "at": ago(2, 21)},
            {"author": "thanhuong.mai@gmail.com",    "content": "Mình đang LISS 30-40 phút. HIIT thì bị đau khớp gối không làm được.",                           "at": ago(2, 20)},
            {"author": "vanhung.bui@gmail.com",      "content": "Gối đau khi HIIT thường do form không tốt hoặc chưa đủ strength ở chân. Đừng force nếu đau.",  "at": ago(2, 19)},
            {"author": "hoangnam.le@yahoo.com",      "content": "1kg/6 tuần là tốt rồi, đừng rush. Aggressive deficit sẽ mất cơ nhiều hơn. Bạn đang đúng hướng.", "at": ago(2, 18)},
            {"author": "lananh.tran@gmail.com",      "content": "Chị em hỏi câu này hay quá! Mình cũng đang câu hỏi tương tự, đọc reply của mọi người xong hiểu thêm nhiều 🙏", "at": ago(2, 17)},
            {"author": "anhkhoa.ta@gmail.com",       "content": "Dexa scan hoặc InBody test là cách accurate nhất để track body composition. Tốn tiền nhưng không mù quáng.", "at": ago(2, 16)},
        ],
        "liked_by": [
            "chicong.phan@outlook.com", "thuylinh.dang@outlook.com", "lananh.tran@gmail.com",
            "ngoctrinh.vo@gmail.com", "kimngan.ly@yahoo.com", "myduyen.hoang@gmail.com",
            "thuhang.pham@gmail.com", "quocbao.dinh@gmail.com",
        ],
    },

    # ── Post 14 ── Admin: Flash event cuối tuần + WEEKEND10 ──────────────────
    {
        "author": "admin@gymstore.com",
        "title": "Ưu đãi cuối tuần này – Voucher WEEKEND10 🎁",
        "content": (
            "Cuối tuần rồi, anh chị em nghỉ tập hay vẫn hit the gym? 💪\n\n"
            "GymStore có món quà nhỏ cho cuối tuần:\n\n"
            "**Mã: `WEEKEND10`**\n"
            "- Giảm **10%** đơn hàng từ **150.000đ**\n"
            "- Giảm tối đa **100.000đ**\n"
            "- Mỗi tài khoản dùng tối đa **2 lần**\n"
            "- Hiệu lực: **đến hết Chủ Nhật tuần này**\n\n"
            "Cùng với đó, **mã SUPP30K** giảm 30k cho đơn supplement từ 250k vẫn đang hoạt động đến cuối tháng!\n\n"
            "Chúc anh chị em tập luyện vui và khoẻ 🙌"
        ),
        "tags": ["voucher", "cuối-tuần", "thông-báo"],
        "created_at": ago(2),
        "comments": [
            {"author": "phuongmai.ngo@gmail.com",    "content": "Ôi đúng lúc mình đang muốn mua thêm BCAA! Đặt ngay đây 😍",                                     "at": ago(1, 23)},
            {"author": "ducckhai.vu@gmail.com",      "content": "2 lần per account xịn quá, mua sáng mua chiều chắc cũng được 🤣",                               "at": ago(1, 22)},
            {"author": "admin@gymstore.com",          "content": "Haha đúng rồi bạn! 2 lần nghĩa là có thể dùng trong 2 đơn khác nhau trong tuần 😄",              "at": ago(1, 21)},
            {"author": "vanhung.bui@gmail.com",      "content": "SUPP30K + WEEKEND10 dùng được trên 2 đơn khác nhau chứ shop?",                                   "at": ago(1, 20)},
            {"author": "admin@gymstore.com",          "content": "Được bạn! Mỗi đơn chỉ dùng 1 mã nhưng bạn có thể tách đơn và dùng 2 mã khác nhau trên 2 đơn.", "at": ago(1, 19)},
            {"author": "kimngan.ly@yahoo.com",       "content": "Cảm ơn shop luôn có deal cho anh em! Ủng hộ lâu dài 🙏",                                         "at": ago(1, 18)},
            {"author": "thuhang.pham@gmail.com",     "content": "Mình thích nhất là shop hay update voucher mới thay vì chỉ có 1 mã cố định. Cảm giác được chăm 😊", "at": ago(1, 17)},
        ],
        "liked_by": [
            "phuongmai.ngo@gmail.com", "ducckhai.vu@gmail.com", "vanhung.bui@gmail.com",
            "kimngan.ly@yahoo.com", "thuhang.pham@gmail.com", "lananh.tran@gmail.com",
            "thanhuong.mai@gmail.com", "ngoctrinh.vo@gmail.com", "quocbao.dinh@gmail.com",
            "myduyen.hoang@gmail.com", "thuylinh.dang@outlook.com",
        ],
    },

    # ── Post 15 ── Phạm Thị Thu Hằng: Chia sẻ 6 tháng ───────────────────────
    {
        "author": "thuhang.pham@gmail.com",
        "title": "6 tháng tập gym — những điều mình ước biết sớm hơn",
        "content": (
            "Hôm nay đúng 6 tháng kể từ ngày mình đăng ký gym lần đầu 🥹\n\n"
            "**Những điều mình ước biết từ đầu:**\n\n"
            "1. **Form quan trọng hơn trọng lượng** — Mình bị đau vai 2 tháng vì ego lifting bench press\n"
            "2. **Ngủ đủ giấc = tập năng** — Những tuần ngủ < 6 tiếng, buổi tập luôn tệ\n"
            "3. **Consistency > Intensity** — Tập nhẹ đều hơn tập nặng rồi nghỉ 1 tuần\n"
            "4. **Đừng so sánh với người khác trong gym** — Mỗi người một hành trình khác nhau\n"
            "5. **Supplement chỉ là 10%** — Ăn uống và ngủ nghỉ mới là 90%\n\n"
            "Ai đang ở tháng 1 hay tháng 2, cứ kiên trì nhé. Kết quả sẽ đến 🙌"
        ),
        "tags": ["chia-sẻ", "motivation", "lesson-learned", "6-tháng"],
        "created_at": ago(1),
        "comments": [
            {"author": "ngoctrinh.vo@gmail.com",     "content": "Bài này cần ghim lên cho người mới đọc! Điểm 1 và điểm 2 mình cũng học theo cách đau đớn 😭",   "at": ago(0, 10)},
            {"author": "chicong.phan@outlook.com",   "content": "Điểm 3 là chìa khoá. 80% client bỏ cuộc vì overtraining hoặc đặt kỳ vọng không thực tế.",      "at": ago(0, 9)},
            {"author": "minhtuan.nguyen@gmail.com",  "content": "Sleep hygiene là underrated nhất trong fitness. Melatonin, tối tắt màn hình sớm, phòng mát. Kết quả khác hẳn.", "at": ago(0, 8)},
            {"author": "ducckhai.vu@gmail.com",      "content": "Point 4 cực kỳ đúng. Mình từng bỏ tập 1 tháng vì nhìn mấy anh to mà nản 😂 Rồi tự nhủ thôi kệ focus vào mình.", "at": ago(0, 7)},
            {"author": "hoangnam.le@yahoo.com",      "content": "Supplement là 10% nhưng đúng supplement đúng thời điểm cũng không phải vô nghĩa. Đừng dismiss hoàn toàn.", "at": ago(0, 6)},
            {"author": "thuhang.pham@gmail.com",     "content": "@Nam đúng, mình viết theo nghĩa 'không cần rush mua tất cả ngay từ đầu', không phải nói supplement useless.", "at": ago(0, 5)},
            {"author": "myduyen.hoang@gmail.com",    "content": "Cảm ơn bạn đã chia sẻ chân thật! Mình forward bài này cho em gái vừa bắt đầu tập 😊",          "at": ago(0, 4)},
            {"author": "lananh.tran@gmail.com",      "content": "Điểm 4 chạm quá 🥹 Mình cũng hay nhìn chị kế bên gym rồi tự ti. Đọc xong nhắc nhở mình rồi.",  "at": ago(0, 3)},
            {"author": "admin@gymstore.com",          "content": "Cảm ơn bạn đã chia sẻ hành trình! Đây đúng là tinh thần của cộng đồng GymStore. Chúc bạn tiếp tục tiến bộ 💪", "at": ago(0, 2)},
        ],
        "liked_by": [
            "ngoctrinh.vo@gmail.com", "chicong.phan@outlook.com", "minhtuan.nguyen@gmail.com",
            "ducckhai.vu@gmail.com", "myduyen.hoang@gmail.com", "lananh.tran@gmail.com",
            "hoangnam.le@yahoo.com", "thuylinh.dang@outlook.com", "thanhuong.mai@gmail.com",
            "vanhung.bui@gmail.com", "kimngan.ly@yahoo.com", "phuongmai.ngo@gmail.com",
            "thanh.tu97@gmail.com", "quocbao.dinh@gmail.com", "anhkhoa.ta@gmail.com",
            "admin@gymstore.com",
        ],
    },
]

# ── Main seed ──────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        # ── 1. Build user lookup ──────────────────────────────────────────────
        all_users = db.query(User).all()
        user_by_email = {u.email: u for u in all_users}
        print(f"Tìm thấy {len(all_users)} user(s) trong DB.")

        # ── 2. Tạo vouchers ───────────────────────────────────────────────────
        print("\nTạo vouchers...")
        for v in VOUCHERS:
            existing = db.query(Voucher).filter(Voucher.code == v["code"]).first()
            if existing:
                print(f"  [skip] Voucher {v['code']} đã tồn tại")
                continue
            voucher = Voucher(**v)
            db.add(voucher)
            print(f"  [+] Voucher {v['code']}")
        db.commit()

        # ── 3. Xoá posts cũ (re-seed safe) ───────────────────────────────────
        print("\nXoá posts/comments/likes cũ...")
        db.query(Like).delete()
        db.query(Comment).delete()
        db.query(Post).delete()
        db.commit()

        # ── 4. Tạo posts + comments + likes ───────────────────────────────────
        print("\nTạo bài đăng...")
        for pd in POSTS:
            author = user_by_email.get(pd["author"])
            if not author:
                print(f"  [warn] Không tìm thấy user: {pd['author']}")
                continue

            post = Post(
                user_id=author.id,
                title=pd["title"],
                content=pd["content"],
                tags=pd["tags"],
                like_count=0,
                comment_count=0,
                created_at=pd["created_at"],
                updated_at=pd["created_at"],
            )
            db.add(post)
            db.flush()  # get post.id

            # Comments
            for c in pd.get("comments", []):
                c_author = user_by_email.get(c["author"])
                if not c_author:
                    continue
                comment = Comment(
                    post_id=post.id,
                    user_id=c_author.id,
                    content=c["content"],
                    created_at=c["at"],
                )
                db.add(comment)

            # Likes
            seen_likers = set()
            for email in pd.get("liked_by", []):
                liker = user_by_email.get(email)
                if not liker or liker.id in seen_likers:
                    continue
                seen_likers.add(liker.id)
                like = Like(user_id=liker.id, post_id=post.id)
                db.add(like)

            # Update denormalised counts
            post.comment_count = len(pd.get("comments", []))
            post.like_count = len(seen_likers)

            print(f"  [+] '{pd['title'][:50]}' — {post.like_count}❤  {post.comment_count}💬")

        db.commit()
        print(f"\nHoàn tất: {len(POSTS)} bài đăng, {sum(len(p.get('comments',[])) for p in POSTS)} comment, {sum(len(p.get('liked_by',[])) for p in POSTS)} like.")
    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
