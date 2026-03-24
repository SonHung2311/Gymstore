"""
Seed script: tạo dữ liệu mẫu chat giữa khách hàng và admin (chăm sóc khách hàng).
Mỗi cuộc hội thoại có chủ đề và văn phong khác nhau.
Chạy từ thư mục backend/: python seed_chat.py
"""
import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models import *  # noqa

# ---------------------------------------------------------------------------
# Kịch bản hội thoại: (email_user, [(sender, content), ...], days_ago_start)
# sender: "user" | "admin"
# ---------------------------------------------------------------------------

SCENARIOS = [
    # ── 1. Hỏi về tình trạng đơn hàng (ngắn, lịch sự) ──────────────────────
    {
        "user_email": "minhtuan.nguyen@gmail.com",
        "days_ago": 2,
        "messages": [
            ("user",  "Chào shop, cho mình hỏi đơn hàng GYM-A1B2C3 của mình đã ship chưa ạ?"),
            ("admin", "Chào anh Minh Tuấn! Để em kiểm tra nhé... Đơn của anh hiện đang ở trạng thái đang vận chuyển, dự kiến giao ngày mai ạ 🚚"),
            ("user",  "Oke cảm ơn bạn nhé!"),
            ("admin", "Dạ anh cần hỗ trợ gì thêm cứ nhắn em ạ 😊"),
        ],
    },

    # ── 2. Khiếu nại hàng bị lỗi (dài, căng thẳng) ──────────────────────────
    {
        "user_email": "lananh.tran@gmail.com",
        "days_ago": 5,
        "messages": [
            ("user",  "Shop ơi mình nhận được hàng mà dây kéo túi đựng tạ bị đứt rồi. Mình vừa mở ra mà đã hỏng rồi, không chấp nhận được!!!"),
            ("admin", "Ôi em rất tiếc về sự cố này chị Lan Anh ơi 😔 Chị có thể chụp ảnh sản phẩm bị lỗi gửi cho em không ạ? Em sẽ xử lý đổi hàng ngay cho chị."),
            ("user",  "Đây này, nhìn rõ chưa"),
            ("admin", "Em đã nhận được ảnh rồi ạ. Lỗi này hoàn toàn do nhà sản xuất, em xin lỗi chị rất nhiều. Shop sẽ gửi đổi hàng mới cho chị trong 24h, không tính phí ship ạ."),
            ("user",  "Oke, lần này mình chờ. Nhưng mà giao cẩn thận hơn nhé, lần trước cũng bị móp hộp rồi đấy"),
            ("admin", "Dạ em ghi nhận ạ! Lần này shop sẽ đóng gói kỹ hơn và có bubble wrap bảo vệ thêm. Chị vui lòng cung cấp địa chỉ nhận hàng để em làm đơn đổi ạ?"),
            ("user",  "Vẫn địa chỉ cũ nha. 45 Lê Văn Việt Q9"),
            ("admin", "Dạ em đã ghi nhận. Mã đơn đổi hàng là EX-001, dự kiến giao trong 1-2 ngày làm việc ạ. Chị để ý điện thoại nhé 📦"),
        ],
    },

    # ── 3. Tư vấn sản phẩm (thân thiện, hay cười) ───────────────────────────
    {
        "user_email": "hoangnam.le@yahoo.com",
        "days_ago": 1,
        "messages": [
            ("user",  "Hey shop! Mình đang muốn mua tạ đôi 5kg nhưng không biết loại nào tốt hơn: loại gang hay cao su bọc ngoài nhỉ? 😄"),
            ("admin", "Chào anh Nam! Anh hỏi đúng chỗ rồi 😄 Tạ gang thì bền hơn, rẻ hơn nhưng dễ xước sàn. Tạ bọc cao su thì giá cao hơn chút nhưng êm hơn, không lo hỏng sàn. Anh tập ở nhà hay phòng gym ạ?"),
            ("user",  "Tập ở nhà, nhà mình lát gạch men ấy"),
            ("admin", "Vậy thì em khuyên anh dùng loại bọc cao su nhé! Bền hơn nhiều cho sàn gạch men, và lỡ rơi cũng ít kêu ầm hơn 😁 Bên em đang có Tạ Rubber 5kg, giá tốt lắm ạ."),
            ("user",  "Add giỏ hàng được không hay phải chat mua?"),
            ("admin", "Anh vào mục Cửa hàng tìm 'Tạ Rubber' là ra liền ạ! Đang có khuyến mãi mua 2 đôi giảm 5% nữa đó 😉"),
            ("user",  "Ngon! Cảm ơn bạn, vào mua ngay đây"),
        ],
    },

    # ── 4. Hỏi về chính sách đổi trả (từ ngữ công sở, formal) ───────────────
    {
        "user_email": "thuhang.pham@gmail.com",
        "days_ago": 7,
        "messages": [
            ("user",  "Kính chào GymStore, cho tôi hỏi về chính sách đổi trả sản phẩm của quý shop. Cụ thể sản phẩm tôi mua chưa dùng nhưng muốn đổi kích thước."),
            ("admin", "Kính chào chị Thùy Linh! Shop chúng em có chính sách đổi trả trong vòng 7 ngày kể từ ngày nhận hàng, với điều kiện sản phẩm còn nguyên tem mác và chưa qua sử dụng ạ."),
            ("user",  "Vậy kích thước tôi đang cần đổi là L sang XL, sản phẩm là áo thun tập gym. Thủ tục như thế nào?"),
            ("admin", "Dạ thủ tục khá đơn giản chị ạ: (1) Chị chat hoặc email cho shop kèm mã đơn hàng, (2) gửi lại hàng về địa chỉ kho, (3) shop nhận hàng và gửi đổi trong 2-3 ngày làm việc. Phí ship đổi lần đầu shop miễn phí ạ."),
            ("user",  "Tốt. Mã đơn của tôi là GYM-XY789Z. Tôi sẽ gửi lại hàng vào ngày mai."),
            ("admin", "Dạ em đã ghi nhận đơn GYM-XY789Z ạ. Chị gửi hàng về: 123 Nguyễn Văn Linh, Q.7, TP.HCM. Khi giao hàng cho bưu điện nhớ chụp bill vận chuyển để theo dõi nhé ạ."),
            ("user",  "Cảm ơn. Tôi sẽ liên hệ lại khi gửi xong."),
            ("admin", "Dạ chị cứ nhắn em bất cứ lúc nào ạ!"),
        ],
    },

    # ── 5. Hỏi giờ ship và vùng giao (rất ngắn) ─────────────────────────────
    {
        "user_email": "ducckhai.vu@gmail.com",
        "days_ago": 3,
        "messages": [
            ("user",  "Shop giao hàng Đà Nẵng không?"),
            ("admin", "Dạ shop giao toàn quốc anh ơi, kể cả Đà Nẵng ạ! Thường 2-3 ngày là tới nơi."),
            ("user",  "Oke mua liền"),
        ],
    },

    # ── 6. Tư vấn dinh dưỡng / whey protein (dài, nhiều câu hỏi) ────────────
    {
        "user_email": "thuylinh.dang@outlook.com",
        "days_ago": 4,
        "messages": [
            ("user",  "Mình muốn mua whey protein nhưng không biết chọn loại nào. Mình là con gái 55kg, mục tiêu là tone cơ chứ không tăng khối. Bạn tư vấn giúp mình với nhé 🙏"),
            ("admin", "Chào chị Thùy Linh! Mục tiêu tone cơ thì chị nên chọn Whey Isolate ạ - ít đường, ít chất béo, giúp phát triển cơ mà không tăng cân. Chị hiện đang tập mấy buổi/tuần ạ?"),
            ("user",  "Mình tập 4 buổi/tuần, bao gồm cả yoga và cardio"),
            ("admin", "Tuyệt! Với lịch đó thì Whey Isolate là lựa chọn tối ưu. Bên em có sản phẩm Gold Standard Whey, hương vị Chocolate và Vanilla rất được chị em ưa chuộng. Mỗi serving cung cấp 24g protein, ít lactose, dễ uống ạ."),
            ("user",  "Mình bị không dung nạp lactose nhẹ, vậy loại này có phù hợp không?"),
            ("admin", "Dạ Whey Isolate thì hàm lượng lactose cực thấp (gần như 0), nên rất phù hợp cho người không dung nạp lactose chị ơi! Chị có thể yên tâm ạ 😊"),
            ("user",  "Giá bao nhiêu? Và uống lúc nào thì tốt?"),
            ("admin", "Giá 1 hộp 2lb khoảng 650.000đ ạ, đang có deal mua 2 tặng shaker. Thời điểm uống tốt nhất là sau tập 30 phút - lúc cơ thể đang cần hấp thụ protein. Uống trước ngủ cũng ok chị nhé!"),
            ("user",  "Oke mình order thử 1 hộp xem. Có flavor nào nhẹ hơn không? Mình không thích quá ngọt"),
            ("admin", "Dạ có! Flavor Unflavored (không đường, không mùi) hoặc Vanilla nhẹ là ít ngọt nhất ạ. Nhiều người dùng Unflavored pha với sữa tươi rất thích nè. Chị muốn chọn loại nào em đặt order cho chị nhé?"),
            ("user",  "Vanilla nhé! Cảm ơn bạn nhiều lắm ❤️"),
            ("admin", "Dạ em đã tạo order Whey Isolate Gold Standard Vanilla 2lb cho chị rồi ạ! Chị thanh toán trong giỏ hàng nhé. Chúc chị tập vui và đạt mục tiêu sớm 💪✨"),
        ],
    },

    # ── 7. Phàn nàn về app / website (tech-savvy) ───────────────────────────
    {
        "user_email": "vanhung.bui@gmail.com",
        "days_ago": 1,
        "messages": [
            ("user",  "Website của shop bị lỗi ở trang checkout, bấm 'Đặt hàng' thì không có gì xảy ra hết. Mình đang dùng Chrome version mới nhất trên Mac."),
            ("admin", "Anh Văn Hùng ơi, mình xin lỗi vì sự bất tiện này ạ. Anh có thể thử: xoá cache trình duyệt rồi thử lại không ạ? Hoặc thử trên Firefox xem có vẫn bị không ạ?"),
            ("user",  "Đã thử clear cache rồi, vẫn bị. Firefox thì ổn."),
            ("admin", "Dạ cảm ơn anh phản hồi! Em đã report lên team kỹ thuật rồi ạ, họ đang check Chrome Mac. Anh dùng Firefox đặt trước đi nhé, em sẽ thông báo khi fix xong ạ."),
            ("user",  "Oke, mà cái bug này cần fix sớm nhé, user experience kém lắm"),
            ("admin", "Dạ anh nói đúng! Em đã escalate lên priority cao, trong hôm nay sẽ có bản vá ạ. Cảm ơn anh đã phản hồi để shop cải thiện ạ!"),
        ],
    },

    # ── 8. Hỏi mua combo (nhiệt tình, hay dùng emoji) ───────────────────────
    {
        "user_email": "myduyen.hoang@gmail.com",
        "days_ago": 2,
        "messages": [
            ("user",  "Chào shop!!! Mình muốn mua combo cho bạn trai tập gym lần đầu 🎁 Budget khoảng 2 triệu. Gợi ý cho mình với nheeee 🥺"),
            ("admin", "Chào chị Mỹ Duyên! Ơ cute quá, mua quà cho bạn trai tập gym 😍 Với budget 2tr, em gợi ý combo: Tạ đôi 5kg (350k) + Thảm tập yoga dày 6mm (250k) + Dây kháng lực 3 mức (199k) + Whey Protein 1 hộp nhỏ (499k). Còn dư chút để mua găng tay tập ạ!"),
            ("user",  "Oooo ngon quá!! Anh ấy cao 1m75, nặng 68kg thì tạ 5kg có yếu quá không?"),
            ("admin", "Với người mới bắt đầu thì 5kg vừa phải chị ơi! Quan trọng tập đúng kỹ thuật trước. Khi quen rồi mình mua thêm 8kg sau 😊 Bộ combo này rất chuẩn cho người mới!"),
            ("user",  "Ổn rồi em ơi! Có wrap quà không shop? 😁"),
            ("admin", "Dạ hiện shop chưa có dịch vụ wrap quà chị ơi 😅 Nhưng em có thể ghi note để đóng gói gọn gàng hơn và kèm thiệp chúc mừng nhé! Chị muốn ghi gì trong thiệp ạ?"),
            ("user",  "Ghi: 'Cố lên anh yêuu, em support 💪❤️' hehe"),
            ("admin", "Awww cute muốn xỉu 🥰 Em đã ghi nhận rồi ạ! Để em tổng hợp đơn cho chị nhé..."),
        ],
    },

    # ── 9. Hỏi về membership / tài khoản (ngắn, đơn giản) ──────────────────
    {
        "user_email": "quocbao.dinh@gmail.com",
        "days_ago": 6,
        "messages": [
            ("user",  "Tôi quên mật khẩu, không đăng nhập được"),
            ("admin", "Dạ anh Quốc Bảo vui lòng dùng chức năng 'Quên mật khẩu' ở trang đăng nhập ạ. Hệ thống sẽ gửi link reset về email của anh."),
            ("user",  "Ừ oke cảm ơn"),
        ],
    },

    # ── 10. Tư vấn lịch tập / kế hoạch (dài, kiểu học sinh/sinh viên) ───────
    {
        "user_email": "phuongmai.ngo@gmail.com",
        "days_ago": 3,
        "messages": [
            ("user",  "Shop ơi mình là học sinh lớp 12, muốn tập gym mùa hè này nhưng nhà không có điều kiện ra phòng gym. Mình muốn tập tại nhà, nên mua dụng cụ gì bắt đầu ạ?"),
            ("admin", "Chào bạn Phương Mai! Tập tại nhà hoàn toàn ổn nha bạn 💪 Cho bạn mới bắt đầu, em gợi ý: 1) Thảm tập 10mm để tránh đau lưng, 2) Dây kháng lực bộ 3 mức (thay thế tạ rất hiệu quả), 3) Chống đẩy grip bars nếu có thể. Tổng chi phí chỉ khoảng 400-500k thôi!"),
            ("user",  "Wow rẻ quá! Mà mình muốn giảm mỡ bụng chủ yếu, dây kháng lực có giúp được không ạ?"),
            ("admin", "Dây kháng lực rất hiệu quả cho tập cơ toàn thân bạn ơi! Nhưng giảm mỡ bụng thì cần kết hợp với cardio (nhảy dây, chạy bộ, nhảy jumping jack...) và kiểm soát ăn uống nữa nhé. Không có bài tập nào giảm mỡ 1 vùng riêng lẻ đâu bạn!"),
            ("user",  "Aaaa mình cứ nghĩ tập bụng thì giảm mỡ bụng 🤦 Cảm ơn shop nha! Vậy mình mua thảm + dây kháng lực trước nhé"),
            ("admin", "Bạn lựa chọn đúng rồi! Bắt đầu thế là hợp lý lắm. Trên youtube có channel 'Hana Giang Anh' hướng dẫn tiếng Việt rất tốt bạn tham khảo nha 😊 Chúc bạn đạt được mục tiêu hè này!"),
            ("user",  "Hihi cảm ơn shop, mình vào đặt hàng ngay đây!"),
        ],
    },

    # ── 11. Phàn nàn giao hàng chậm (tức giận, xúc phạm nhẹ) ───────────────
    {
        "user_email": "thanh.tu97@gmail.com",
        "days_ago": 4,
        "messages": [
            ("user",  "Sao đặt hàng 5 ngày rồi mà chưa thấy giao vậy??? Mua đồ online bây giờ chậm như rùa bò"),
            ("admin", "Dạ anh Thanh Tú ơi em rất xin lỗi vì sự chậm trễ này ạ 😔 Cho em kiểm tra đơn của anh nhé... Anh cung cấp mã đơn hàng được không ạ?"),
            ("user",  "GYM-TU2024, đặt hôm thứ 2"),
            ("admin", "Em kiểm tra rồi ạ - đơn của anh bị delay do đơn vị vận chuyển tắc nghẽn dịp cuối tuần. Hiện đã qua kho phân loại và dự kiến giao ngày mai trước 5h chiều ạ. Để bù đắp sự bất tiện, shop sẽ hoàn 20k voucher vào tài khoản anh ạ."),
            ("user",  "Thôi được, miễn có hàng là ok. Nhưng lần sau đừng để lâu vậy nữa"),
            ("admin", "Dạ em ghi nhận ạ! Anh nhận hàng xong nếu cần hỗ trợ gì cứ nhắn em nhé 🙏"),
        ],
    },

    # ── 12. Hỏi về tính năng cộng đồng / bài viết (tò mò, hỏi nhiều) ────────
    {
        "user_email": "kimngan.ly@yahoo.com",
        "days_ago": 8,
        "messages": [
            ("user",  "Mình thấy trên web có mục 'Cộng đồng' nhưng không biết là gì vậy shop?"),
            ("admin", "Chào chị Kim Ngân! Mục Cộng đồng là nơi các thành viên GymStore chia sẻ bài viết về lịch tập, chế độ ăn, kinh nghiệm tập gym chị ơi! Chị có thể đăng bài, thả tim và bình luận nhau ạ 💬"),
            ("user",  "Ồ hay nhỉ! Ai cũng post được không hay chỉ admin?"),
            ("admin", "Tất cả thành viên đã đăng ký tài khoản đều post được chị ơi! Nội dung chỉ cần liên quan đến gym, thể thao, dinh dưỡng là được ạ 😄"),
            ("user",  "Mình hay làm salad giảm cân, post công thức vào đó được không?"),
            ("admin", "Được chứ chị! Công thức dinh dưỡng, meal prep đều rất được cộng đồng bên em yêu thích đó. Chị cứ thoải mái chia sẻ nhé 🥗"),
            ("user",  "Haha được rồi. Để mình thử post xem sao"),
        ],
    },

    # ── 13. Hỏi hủy đơn (vắn tắt, thẳng thắn) ──────────────────────────────
    {
        "user_email": "ngocphat.ho@gmail.com",
        "days_ago": 1,
        "messages": [
            ("user",  "Hủy đơn GYM-PH456 giúp mình với, đặt nhầm"),
            ("admin", "Dạ anh Ngọc Phát ơi, em kiểm tra đơn... Đơn chưa xử lý nên có thể hủy được ạ. Em hủy ngay cho anh nhé?"),
            ("user",  "Ừ hủy đi"),
            ("admin", "Đã hủy đơn GYM-PH456 cho anh rồi ạ! Nếu anh thanh toán online thì tiền hoàn về trong 3-5 ngày làm việc nhé. Anh cần hỗ trợ gì thêm không ạ?"),
            ("user",  "Không cần, cảm ơn"),
        ],
    },

    # ── 14. Hỏi size áo (dễ thương, hay dùng tiếng Anh xen) ─────────────────
    {
        "user_email": "thanhuong.mai@gmail.com",
        "days_ago": 2,
        "messages": [
            ("user",  "Hi shop! Mình 1m62, 52kg thì mặc size S hay M của áo gym nhà shop nhỉ? Mình thích fitted nhưng không quá bó 🤔"),
            ("admin", "Chào chị Thanh Hương! Với số đo chị thì size S sẽ vừa fitted như chị muốn ạ! Size M sẽ hơi loose một chút. Áo gym của shop có khả năng co giãn 4 chiều nên thoải mái khi vận động nhé 😊"),
            ("user",  "Ơ nhưng mình vai hơi rộng, sợ size S chật vai"),
            ("admin", "À nếu vai hơi rộng thì chị có thể thử M để an toàn hơn ạ! Áo gym thì mặc hơi rộng một chút vẫn ổn, tập không bị khó chịu. Chị mua online nên em recommend M cho chắc ạ 🙌"),
            ("user",  "Oke lấy M thôi! Cảm ơn bạn 😘"),
        ],
    },

    # ── 15. Góp ý sản phẩm / wishlist (chi tiết, nghiêm túc) ─────────────────
    {
        "user_email": "chicong.phan@outlook.com",
        "days_ago": 10,
        "messages": [
            ("user",  "Chào GymStore, tôi muốn góp ý là shop nên nhập thêm dây nhảy tốc độ (speed rope) loại bearing cao cấp. Hiện tại loại shop đang bán chỉ là dây nhảy phổ thông, không phù hợp cho CrossFit."),
            ("admin", "Chào anh Chí Công! Cảm ơn anh đã góp ý rất cụ thể ạ. Anh đang tìm loại speed rope bearing loại nào vậy ạ - RPM, Rx, hay Rx2 ạ? Em sẽ report lên team mua hàng để cân nhắc bổ sung."),
            ("user",  "RPM hoặc WODFitters đều ổn. Cơ bản là cần vòng bi 2 đầu, dây thép mỏng đường kính 3mm. Nhiều bạn CrossFit bên tôi đang có nhu cầu mua chung."),
            ("admin", "Dạ thông tin rất chi tiết, em sẽ chuyển nguyên văn lên phòng kinh doanh ạ! Nếu shop quyết định nhập hàng thì em sẽ ưu tiên báo anh trước để anh đặt sớm. Anh có thể để lại số điện thoại hoặc email để em liên hệ thông báo không ạ?"),
            ("user",  "Email chicong.phan@outlook.com là được, tôi check thường xuyên."),
            ("admin", "Dạ em đã lưu ạ! Khoảng 2-3 tuần nữa sẽ có kết quả. Cảm ơn anh đã đóng góp giúp shop cải thiện sản phẩm ạ 🙏"),
        ],
    },

    # ── 16. Hỏi về voucher / khuyến mãi (hay dùng viết tắt, gen Z) ──────────
    {
        "user_email": "ngoctrinh.vo@gmail.com",
        "days_ago": 0,
        "messages": [
            ("user",  "shop ơi mình có voucher GYMVIP mà nhập vào ko dc ạ 😭"),
            ("admin", "Chào chị Ngọc Trinh! Chị kiểm tra giúp em: đơn hàng của chị có đạt tối thiểu 500k không ạ? Voucher GYMVIP yêu cầu giá trị đơn tối thiểu đó ạ 😊"),
            ("user",  "oke dc rồi, cảm ơn! mình nhập lại đúng điều kiện rồi"),
            ("admin", "Tuyệt vời chị ơi! Chúc chị order vui, hàng về sớm nhé 🎉"),
        ],
    },

    # ── 17. Hỏi whittle down (hỏi so sánh sản phẩm)  ─────────────────────────
    {
        "user_email": "anhkhoa.ta@gmail.com",
        "days_ago": 3,
        "messages": [
            ("user",  "Giữa ghế tập đa năng 3 triệu và bộ tạ đòn 4 triệu thì cái nào tốt hơn cho người mới? Mình chỉ đủ budget mua 1 thứ thôi"),
            ("admin", "Câu hỏi hay đó anh Anh Khoa! Phụ thuộc vào mục tiêu anh ạ: Ghế tập đa năng thì tập được nhiều nhóm cơ khác nhau, hợp với người muốn tập full body. Còn bộ tạ đòn thì nặng hơn, phù hợp với người muốn tăng sức mạnh tổng thể. Anh đang muốn giảm cân hay tăng cơ ạ?"),
            ("user",  "Tăng cơ, hiện tại mình gày lắm 60kg 1m78"),
            ("admin", "Với mục tiêu tăng cơ và vóc dáng anh đang có thì bộ tạ đòn sẽ hiệu quả hơn nhiều ạ! Big 3 (squat, bench press, deadlift) với tạ đòn là nền tảng tốt nhất để tăng cơ. Ghế tập mua sau cũng được khi đã có lực ổn định ạ."),
            ("user",  "Make sense! Vậy lấy tạ đòn. Kèm thêm cái gì nữa không?"),
            ("admin", "Anh lấy thêm: Đai lưng tập (bảo vệ lưng khi lift nặng) và găng tay tập (tránh chai tay) là đủ bộ cơ bản rồi ạ! Tổng khoảng thêm 300-400k, xứng đáng lắm 💪"),
            ("user",  "Ổn rồi! Mình vào đặt hàng nhé, cảm ơn shop"),
            ("admin", "Anh tập vui nhé! Có gì cần hỗ trợ cứ nhắn mình ạ 🏋️"),
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        # Tìm admin user
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            print("❌ Không tìm thấy admin user! Hãy chạy seed_users.py trước.")
            return

        print(f"✅ Admin: {admin.full_name} <{admin.email}>")

        # Xóa dữ liệu chat cũ
        db.query(Message).delete()
        db.query(ConversationParticipant).delete()
        db.query(Conversation).delete()
        db.commit()
        print("🗑️  Đã xóa dữ liệu chat cũ\n")

        now = datetime.now(timezone.utc)
        created_count = 0

        for scenario in SCENARIOS:
            user = db.query(User).filter(User.email == scenario["user_email"]).first()
            if not user:
                print(f"  [skip] User {scenario['user_email']} không tồn tại")
                continue

            days_ago = scenario["days_ago"]
            # Thời gian bắt đầu hội thoại
            base_time = now - timedelta(days=days_ago, hours=2)

            # Tạo conversation
            conv = Conversation(
                id=str(uuid.uuid4()),
                created_at=base_time,
            )
            db.add(conv)
            db.flush()

            # Thêm participants
            db.add(ConversationParticipant(
                conversation_id=conv.id,
                user_id=user.id,
                unread_count=0,
            ))
            db.add(ConversationParticipant(
                conversation_id=conv.id,
                user_id=admin.id,
                unread_count=0,
            ))

            # Thêm messages
            msg_time = base_time
            last_content = ""
            for i, (sender_role, content) in enumerate(scenario["messages"]):
                sender = user if sender_role == "user" else admin
                msg_time = msg_time + timedelta(minutes=2 + i * 3)

                msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    sender_id=sender.id,
                    content=content,
                    created_at=msg_time,
                )
                db.add(msg)
                last_content = content

            # Cập nhật preview của conversation
            preview = last_content[:97] + "..." if len(last_content) > 100 else last_content
            conv.last_message_at = msg_time
            conv.last_message_preview = preview

            db.flush()
            created_count += 1
            print(f"  [+] {user.full_name}: {len(scenario['messages'])} tin nhắn (chủ đề: {scenario['messages'][0][1][:40]}...)")

        db.commit()
        print(f"\n✅ Hoàn tất: {created_count} cuộc hội thoại được tạo.")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
