"""
Seed script: tạo review đa dạng cho sản phẩm từ user hiện có.
Mỗi sản phẩm nhận 0–9 review, nhiều chiều ý kiến.
Chạy: python seed_reviews.py
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.product import Product, ProductReview
from app.models.user import User
from app.models import *  # noqa

# ── Comment pools theo loại sản phẩm ─────────────────────────────────────────

COMMENTS_CLOTHING = [
    (5, "Chất vải cực kỳ thoáng mát, mặc tập cả buổi mà không thấy bí. Màu sắc đúng như hình, sẽ mua thêm màu khác."),
    (5, "Size chuẩn, mình 70kg mua L vừa đẹp. Đường may chắc chắn, giặt máy nhiều lần chưa thấy bung chỉ."),
    (4, "Chất liệu tốt, thấm hút mồ hôi ổn. Trừ 1 sao vì giao hàng hơi chậm so với dự kiến."),
    (4, "Mặc tập gym rất ổn, co giãn tốt. Tuy nhiên sau vài lần giặt màu có hơi phai một chút."),
    (3, "Chất vải ổn nhưng form không như hình, hơi rộng ở phần vai. Nên order nhỏ hơn 1 size."),
    (3, "Mặc được, không có gì đặc biệt nổi trội. Tầm giá này chấp nhận được thôi."),
    (2, "Hình online trông đẹp hơn thực tế nhiều. Chất vải mỏng hơn mình tưởng, không đáng giá tiền."),
    (5, "Thoải mái khi vận động, không bị cộm hay xước da. Thiết kế đơn giản nhưng tinh tế, dùng được cả khi đi ra ngoài."),
    (4, "Mình mua để tập yoga, vừa vặn và không bị lộ khi cúi. Chất liệu nhẹ, khô nhanh sau khi giặt."),
    (1, "Nhận hàng bị lỗi đường may ở nách, đã liên hệ shop xử lý. Shop phản hồi nhanh nhưng trải nghiệm ban đầu không vui."),
    (5, "Đây là lần thứ 3 mình mua sản phẩm này, lần nào cũng ổn. Trở thành item không thể thiếu trong túi gym."),
    (4, "Màu sắc tươi, trẻ trung. Chỉ hơi tiếc là không có túi nhỏ để đựng điện thoại."),
    (3, "Ổn cho việc tập luyện bình thường, nhưng nếu tập CrossFit cường độ cao thì hơi bí."),
    (5, "Mua cho ba mình tập, ông thích lắm. Chất vải dày vừa phải, không quá mỏng hay nóng."),
    (2, "Mình size M nhưng M ở đây hơi nhỏ so với thông thường, phải đổi lại size L. Nên có bảng đo chi tiết hơn."),
]

COMMENTS_EQUIPMENT = [
    (5, "Tạ cao su không mùi, không trầy sàn. Cân đúng trọng lượng, dùng được nửa năm vẫn tốt như mới."),
    (5, "Chất lượng tốt hơn mình kỳ vọng ở tầm giá này. Grip tốt, không bị trơn khi tay đổ mồ hôi."),
    (4, "Sản phẩm chắc chắn, đúng spec. Giao hàng cẩn thận, đóng gói kỹ. Sẽ mua thêm cặp nặng hơn."),
    (4, "Dùng ổn, không có tiếng ồn hay rung khi tập. Chỉ hơi khó lắp ráp lần đầu."),
    (3, "Chất lượng tương đương hàng TQ cùng giá. Không phải hàng premium nhưng dùng được."),
    (3, "Cân có sai số nhỏ nhưng không đáng kể. Được cái bền, đã rơi xuống sàn gỗ nhiều lần vẫn không vỡ."),
    (5, "Đây là bộ tôi mua sau khi thử nhiều brand khác. Definitely đáng tiền, chất liệu cao su đặc chắc chắn."),
    (2, "Sau 3 tháng lớp sơn bắt đầu bong ra. Trông không đẹp dù vẫn dùng được. Chất lượng finish chưa cao."),
    (5, "Lắp đặt dễ, hướng dẫn rõ ràng. Con tôi cũng dùng được, an toàn và chắc chắn."),
    (4, "Grip rubber chống trượt rất ổn. Cầm thoải mái ngay cả khi tay ướt. Recommend cho người mới tập."),
    (1, "Nhận hàng bị thiếu bu-lông, phải tự đi mua thêm. Trải nghiệm đầu tiên không tốt, dù sản phẩm sau khi lắp xong thì ổn."),
    (5, "Dùng được 8 tháng vẫn như mới. Cao su không bị cứng hay nứt, rất hài lòng với độ bền."),
    (3, "Tốt cho người mới bắt đầu, không nên kỳ vọng quá cao nếu bạn là người tập chuyên nghiệp."),
    (4, "Thiết kế gọn, để ở góc phòng không chiếm nhiều diện tích. Màu sắc đẹp, không quá flashy."),
]

COMMENTS_MACHINE = [
    (5, "Lắp ráp mất 2 tiếng nhưng hướng dẫn rõ ràng, tự làm được. Máy chạy êm, hàng xóm không phàn nàn gì."),
    (5, "Đầu tư xứng đáng. Tập tại nhà tiện hơn nhiều so với ra gym, tiết kiệm cả thời gian lẫn phí thành viên."),
    (4, "Máy ổn định, không bị rung khi chạy tốc độ cao. Màn hình hiển thị đủ thông số cần thiết."),
    (4, "Chất lượng tốt ở tầm giá tầm trung. Đã dùng 4 tháng chưa gặp vấn đề gì. Nên bôi trơn belt định kỳ."),
    (3, "Máy tạm, nhưng tiếng ồn khi tập hơi lớn. Cần mua thêm tấm cao su chống rung để đặt bên dưới."),
    (3, "Màn hình đôi khi bị lag, không hiển thị đúng. Phần cơ học thì ổn, chỉ software hơi kém."),
    (5, "Giao hàng cẩn thận, có đội lắp ráp hỗ trợ. Máy chắc chắn, dùng hàng ngày không có vấn đề gì."),
    (2, "Sau 6 tháng dây curoa bắt đầu có mùi cao su cháy. Phải gọi kỹ thuật đến kiểm tra. Bảo hành xử lý được nhưng hơi phiền."),
    (4, "Thiết kế nhỏ gọn phù hợp phòng không rộng. Điều chỉnh được độ nghiêng, tốc độ mượt."),
    (5, "Mình 90kg dùng thoải mái, không cảm giác máy bị quá tải. Build quality tốt hơn hẳn brand cùng giá."),
    (1, "Máy đến bị lỗi ngay từ đầu, motor không chạy. Shop đổi máy mới sau 1 tuần nhưng trải nghiệm rất tệ ban đầu."),
    (3, "Dùng được 1 năm thì có tiếng cọ xát nhẹ. Tra dầu thì hết, nhưng cũng hơi lo về độ bền lâu dài."),
    (5, "Bench điều chỉnh được 7 góc, rất linh hoạt cho các bài tập khác nhau. Đệm dày thoải mái, không bị đau lưng."),
    (4, "Máy chắc, an toàn khi dùng một mình. Weight capacity 150kg, mình không lo bị lọt."),
]

COMMENTS_SUPPLEMENT = [
    (5, "Mùi vị dễ uống, tan tốt trong nước lạnh. Mình dùng được 1 tháng thấy recovery sau buổi tập nhanh hơn rõ rệt."),
    (5, "Protein content cao, ít lactose nên không bị đầy bụng như whey concentrate. Vị chocolate rất ngon."),
    (4, "Chất lượng tốt, lab test certificate rõ ràng. Giá hơi cao nhưng đáng tiền vì hàng authentic."),
    (4, "Mix được với nước và sữa đều ngon. Bọt không quá nhiều. Dùng 2 lần/ngày thấy cơ bắp phát triển ổn."),
    (3, "Vị hơi ngọt quá với mình, nhưng nếu mix với nhiều nước hơn thì được. Tan tốt, không vón cục."),
    (3, "Dùng được, không có gì đặc biệt. Cùng giá có thể tìm được brand tốt hơn nếu chịu khó tìm kiếm."),
    (5, "Amino profile đầy đủ, hấp thu nhanh. Mình dùng sau workout, pump tốt và ít đau cơ hơn hẳn."),
    (2, "Bao bì đến bị móp méo, dù hàng bên trong còn sealed. Shop nên cải thiện đóng gói khi vận chuyển."),
    (5, "Đây là tháng thứ 6 mình dùng liên tục. Kết hợp với chế độ ăn clean thì hiệu quả rất rõ ràng."),
    (4, "Không gây kích ứng dạ dày, dùng được cả lúc đói. Điều này quan trọng với mình vì hay tập buổi sáng."),
    (1, "Mình bị dị ứng nhẹ ở da sau khi dùng. Không rõ do thành phần nào, đã ngừng dùng và hết. Nên ghi rõ hơn về allergen."),
    (5, "Creatine mono chuẩn, không tạp chất. Strength tăng rõ sau tuần loading. Giá tốt nhất thị trường mình tìm được."),
    (3, "Pre-workout có caffeine hơi cao, uống buổi chiều muộn là khó ngủ. Nên uống trước 3 giờ chiều."),
    (4, "BCAA tan nhanh, vị dễ uống. Mình dùng intra-workout, giúp duy trì năng lượng khi tập dài."),
    (2, "Mùi cá của omega-3 hơi nặng dù đã có enteric coating. Nếu để ý thì hơi khó chịu. Nên uống ngay sau bữa ăn."),
]

COMMENTS_ACCESSORY = [
    (5, "Chắc chắn, đường chỉ may kỹ. Dùng 6 tháng hàng ngày vẫn không bị bong hay rách. Xứng đáng 5 sao."),
    (5, "Vừa vặn, không bị xê dịch khi tập. Giữ nhiệt độ tốt, bình 1L cầm đi gym cả buổi đủ nước."),
    (4, "Chất lượng tốt hơn mình nghĩ ở tầm giá này. Màu sắc đẹp, ít mùi khi mới, để 1-2 ngày là hết."),
    (4, "Vừa tay, grip tốt. Có thể cảm nhận được tạ tốt hơn khi đeo. Phần wrist strap chắc chắn."),
    (3, "Dùng được nhưng đường may có vẻ không đều ở một số chỗ. Chức năng bình thường, mẫu mã ổn."),
    (3, "Kích thước đúng như mô tả. Chất liệu tạm, không quá cao cấp nhưng đủ dùng cho người tập bình thường."),
    (5, "Mua cho cả gia đình tập. Chất lượng đồng đều, đóng gói cẩn thận. Sẽ là khách hàng thân thiết."),
    (2, "Dây bị đứt sau 2 tháng dùng nhẹ. Chất liệu nhựa ở đầu nối không chắc lắm. Hơi thất vọng."),
    (5, "Thiết kế thông minh, dùng tiện lợi. Không bị đổ mồ hôi ra bàn tay khi tập tạ nặng."),
    (4, "Foam tốt, không bị xẹp sau nhiều lần dùng. Massage sau buổi tập thấy cơ thư giãn hơn rõ rệt."),
    (1, "Nhận sai màu so với order. Shop đã đổi lại nhưng mất thêm 1 tuần chờ đợi. Cần cải thiện quy trình."),
    (5, "Túi gym rộng, nhiều ngăn, đựng được cả quần áo thay và đồ tập. Chất canvas dày, nhìn chắc chắn."),
    (3, "Bình nước ổn nhưng nắp hơi khó mở khi tay ướt. Nên thiết kế flip-top thay vì vặn nắp."),
    (4, "Đai lưng hỗ trợ tốt khi deadlift nặng. Mình 80kg tập 120kg không cảm thấy đau lưng như trước."),
]

# ── Map sản phẩm → pool comment ───────────────────────────────────────────────

def get_pool(product_name: str):
    name = product_name.lower()
    if any(x in name for x in ["máy", "xe đạp", "bench", "smith", "elliptical", "rowing", "giàn", "bục"]):
        return COMMENTS_MACHINE
    if any(x in name for x in ["whey", "protein", "mass", "bcaa", "creatine", "pre-workout", "multivitamin",
                                 "omega", "collagen", "l-carnitine", "bar"]):
        return COMMENTS_SUPPLEMENT
    if any(x in name for x in ["tạ", "barbell", "kettlebell", "dây kháng", "xà đơn", "push-up", "trx",
                                 "ab wheel", "foam", "bóng", "thảm", "dây nhảy", "bộ dây"]):
        return COMMENTS_EQUIPMENT
    if any(x in name for x in ["găng", "đai", "knee", "bình nước", "túi gym"]):
        return COMMENTS_ACCESSORY
    return COMMENTS_CLOTHING  # default: quần áo


# ── Seed ──────────────────────────────────────────────────────────────────────

def seed():
    random.seed(42)  # reproducible
    db = SessionLocal()

    products = db.query(Product).filter(Product.is_active == True).all()
    users    = db.query(User).filter(User.role == "user").all()

    # Xóa review cũ nếu có (re-seed safe)
    db.query(ProductReview).delete()
    db.commit()

    total_created = 0

    for product in products:
        pool = get_pool(product.name)

        # Số review ngẫu nhiên 0–9, phân bố thực tế hơn
        weights = [5, 6, 9, 11, 13, 14, 13, 11, 9, 9]  # ít sản phẩm 0 review, nhiều nhất ở 5-6
        n_reviews = random.choices(range(10), weights=weights)[0]
        n_reviews = min(n_reviews, len(users))

        reviewers = random.sample(users, n_reviews)

        # Chọn comment ngẫu nhiên từ pool, đảm bảo đa dạng rating
        # Trộn pool để không lấy cùng một comment cho nhiều sản phẩm
        sampled_comments = random.sample(pool, min(n_reviews, len(pool)))
        # Nếu cần nhiều hơn pool, lấy thêm có lặp
        while len(sampled_comments) < n_reviews:
            sampled_comments.append(random.choice(pool))

        for user, (rating, comment) in zip(reviewers, sampled_comments):
            review = ProductReview(
                product_id=product.id,
                user_id=user.id,
                rating=rating,
                comment=comment,
            )
            db.add(review)
            total_created += 1

        if n_reviews > 0:
            ratings = [c[0] for c in sampled_comments[:n_reviews]]
            avg = sum(ratings) / len(ratings)
            print(f"  [{n_reviews}⭐ avg{avg:.1f}]  {product.name}")
        else:
            print(f"  [0 review]  {product.name}")

    db.commit()
    print(f"\nHoàn tất: {total_created} review cho {len(products)} sản phẩm.")
    db.close()


if __name__ == "__main__":
    seed()
