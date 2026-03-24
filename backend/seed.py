#!/usr/bin/env python3
"""
Seed script: 50 sản phẩm gym store đa dạng + admin account
Chạy từ thư mục backend: python seed.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.product import Category, Product, ProductAttribute, ProductVariant
from app.models.user import User
from app.services.product import create_product, slugify
from app.schemas.product import ProductCreate
from app.services.auth import hash_password
import uuid

db = SessionLocal()

# ── Helpers ────────────────────────────────────────────────────────────────────

def get_or_create_category(name: str, slug: str) -> Category:
    cat = db.query(Category).filter_by(slug=slug).first()
    if not cat:
        cat = Category(name=name, slug=slug)
        db.add(cat)
        db.flush()
    return cat

def add_attribute(product_id: str, name: str, values: list, order: int = 0):
    attr = ProductAttribute(product_id=product_id, name=name, values=values, display_order=order)
    db.add(attr)
    db.flush()
    return attr

def add_variant(product_id: str, attributes: dict, price: float | None, stock: int, sku: str | None = None):
    v = ProductVariant(
        id=str(uuid.uuid4()),
        product_id=product_id,
        attributes=attributes,
        price=price,
        stock_quantity=stock,
        sku=sku,
        is_active=True,
    )
    db.add(v)

def img(slug: str) -> list[str]:
    """Placeholder images dùng UI Avatars style."""
    base = "https://placehold.co/600x600/6b3f1f/ffffff"
    return [f"{base}?text={slug.replace('-', '+')[:20]}"]

# ── Categories ─────────────────────────────────────────────────────────────────

cat_clothing  = get_or_create_category("Quần áo thể thao", "quan-ao-the-thao")
cat_equipment = get_or_create_category("Tạ & Thiết bị", "ta-thiet-bi")
cat_machine   = get_or_create_category("Máy tập thể dục", "may-tap-the-duc")
cat_nutrition = get_or_create_category("Dinh dưỡng thể thao", "dinh-duong-the-thao")
cat_accessory = get_or_create_category("Phụ kiện gym", "phu-kien-gym")

db.commit()
print("✓ Categories")

# ── Products ───────────────────────────────────────────────────────────────────

PRODUCTS = [

    # ── QUẦN ÁO (12 sản phẩm) ──────────────────────────────────────────────────

    dict(
        name="Áo thun tập gym nam Dry-Fit",
        description="Chất liệu Polyester Dry-Fit thoáng khí, thấm hút mồ hôi nhanh. Thiết kế ôm vừa phải, tôn dáng khi tập luyện. Phù hợp gym, chạy bộ, đạp xe.",
        price=185000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S","M","L","XL","XXL"]), ("Màu sắc", ["Đen","Trắng","Xám","Xanh navy","Đỏ"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, None, 20), ({"Size":"M","Màu sắc":"Đen"}, None, 35),
            ({"Size":"L","Màu sắc":"Đen"}, None, 30), ({"Size":"XL","Màu sắc":"Đen"}, None, 15),
            ({"Size":"S","Màu sắc":"Trắng"}, None, 18), ({"Size":"M","Màu sắc":"Trắng"}, None, 28),
            ({"Size":"L","Màu sắc":"Trắng"}, None, 22), ({"Size":"M","Màu sắc":"Xám"}, None, 25),
            ({"Size":"L","Màu sắc":"Xám"}, None, 20), ({"Size":"M","Màu sắc":"Xanh navy"}, None, 15),
        ],
    ),
    dict(
        name="Áo tank top gym nam",
        description="Áo ba lỗ tập gym chất liệu cotton blend mềm mại. Thiết kế tay cắt rộng giúp thoải mái khi tập vai, ngực. Logo thêu tỉ mỉ.",
        price=145000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S","M","L","XL"]), ("Màu sắc", ["Đen","Xám than","Trắng","Xanh rêu"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, None, 25), ({"Size":"M","Màu sắc":"Đen"}, None, 40),
            ({"Size":"L","Màu sắc":"Đen"}, None, 35), ({"Size":"XL","Màu sắc":"Đen"}, None, 20),
            ({"Size":"M","Màu sắc":"Xám than"}, None, 30), ({"Size":"L","Màu sắc":"Xám than"}, None, 25),
            ({"Size":"M","Màu sắc":"Trắng"}, None, 20), ({"Size":"L","Màu sắc":"Trắng"}, None, 18),
        ],
    ),
    dict(
        name="Quần shorts tập gym nam",
        description="Quần đùi thể thao 2 lớp với lớp trong compression thoải mái. Túi kéo khóa chắc chắn, dây rút điều chỉnh eo. Phù hợp gym, bóng rổ, chạy bộ.",
        price=225000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S","M","L","XL","XXL"]), ("Màu sắc", ["Đen","Xanh navy","Xám"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, None, 20), ({"Size":"M","Màu sắc":"Đen"}, None, 35),
            ({"Size":"L","Màu sắc":"Đen"}, None, 30), ({"Size":"XL","Màu sắc":"Đen"}, None, 20),
            ({"Size":"M","Màu sắc":"Xanh navy"}, None, 25), ({"Size":"L","Màu sắc":"Xanh navy"}, None, 20),
            ({"Size":"M","Màu sắc":"Xám"}, None, 18), ({"Size":"L","Màu sắc":"Xám"}, None, 15),
        ],
    ),
    dict(
        name="Áo thun tập gym nữ",
        description="Áo croptop thể thao nữ chất liệu spandex co giãn 4 chiều. Thiết kế ôm body tôn dáng, phù hợp yoga, pilates, gym nhẹ nhàng.",
        price=165000, stock=0, category=cat_clothing,
        attrs=[("Size", ["XS","S","M","L"]), ("Màu sắc", ["Đen","Hồng pastel","Tím lavender","Trắng","Xanh mint"])],
        variants=[
            ({"Size":"XS","Màu sắc":"Đen"}, None, 15), ({"Size":"S","Màu sắc":"Đen"}, None, 25),
            ({"Size":"M","Màu sắc":"Đen"}, None, 30), ({"Size":"L","Màu sắc":"Đen"}, None, 20),
            ({"Size":"S","Màu sắc":"Hồng pastel"}, None, 20), ({"Size":"M","Màu sắc":"Hồng pastel"}, None, 25),
            ({"Size":"S","Màu sắc":"Tím lavender"}, None, 18), ({"Size":"M","Màu sắc":"Tím lavender"}, None, 22),
            ({"Size":"S","Màu sắc":"Xanh mint"}, None, 15), ({"Size":"M","Màu sắc":"Xanh mint"}, None, 18),
        ],
    ),
    dict(
        name="Quần legging tập gym nữ",
        description="Quần legging nữ chất liệu nylon spandex cao cấp, không trong suốt khi cúi người. Lưng cao tôn dáng, túi ẩn hai bên tiện lợi. Phù hợp yoga, gym, chạy bộ.",
        price=295000, stock=0, category=cat_clothing,
        attrs=[("Size", ["XS","S","M","L","XL"]), ("Màu sắc", ["Đen","Xanh cobalt","Hồng đậm","Xám"])],
        variants=[
            ({"Size":"XS","Màu sắc":"Đen"}, None, 20), ({"Size":"S","Màu sắc":"Đen"}, None, 35),
            ({"Size":"M","Màu sắc":"Đen"}, None, 40), ({"Size":"L","Màu sắc":"Đen"}, None, 25),
            ({"Size":"S","Màu sắc":"Xanh cobalt"}, None, 15), ({"Size":"M","Màu sắc":"Xanh cobalt"}, None, 20),
            ({"Size":"S","Màu sắc":"Hồng đậm"}, None, 18), ({"Size":"M","Màu sắc":"Hồng đậm"}, None, 22),
        ],
    ),
    dict(
        name="Sports bra nữ Medium Support",
        description="Áo bra thể thao nữ mức hỗ trợ trung bình, phù hợp yoga, pilates, gym vừa phải. Chất liệu microfiber mềm, đường khâu phẳng không cọ da. Dây vai điều chỉnh được.",
        price=215000, stock=0, category=cat_clothing,
        attrs=[("Size", ["XS","S","M","L","XL"]), ("Màu sắc", ["Đen","Trắng","Hồng","Xanh"])],
        variants=[
            ({"Size":"XS","Màu sắc":"Đen"}, None, 15), ({"Size":"S","Màu sắc":"Đen"}, None, 25),
            ({"Size":"M","Màu sắc":"Đen"}, None, 30), ({"Size":"L","Màu sắc":"Đen"}, None, 20),
            ({"Size":"S","Màu sắc":"Hồng"}, None, 20), ({"Size":"M","Màu sắc":"Hồng"}, None, 22),
            ({"Size":"S","Màu sắc":"Xanh"}, None, 15), ({"Size":"M","Màu sắc":"Xanh"}, None, 18),
        ],
    ),
    dict(
        name="Hoodie thể thao unisex",
        description="Áo hoodie nỉ bông dày dặn, giữ ấm sau buổi tập. Túi kangaroo rộng rãi, mũ điều chỉnh dây rút. Form oversize phong cách, phù hợp cả nam lẫn nữ.",
        price=485000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S","M","L","XL","XXL"]), ("Màu sắc", ["Đen","Xám","Kem","Xanh navy"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, None, 15), ({"Size":"M","Màu sắc":"Đen"}, None, 25),
            ({"Size":"L","Màu sắc":"Đen"}, None, 20), ({"Size":"XL","Màu sắc":"Đen"}, None, 12),
            ({"Size":"M","Màu sắc":"Xám"}, None, 20), ({"Size":"L","Màu sắc":"Xám"}, None, 18),
            ({"Size":"M","Màu sắc":"Kem"}, None, 15), ({"Size":"L","Màu sắc":"Kem"}, None, 12),
        ],
    ),
    dict(
        name="Quần jogger thể thao nam",
        description="Quần jogger co giãn 2 chiều, cạp chun và khóa kéo tiện lợi. Hai túi bên và một túi sau. Chất liệu cotton pha spandex mềm mại, thấm hút tốt.",
        price=325000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S","M","L","XL"]), ("Màu sắc", ["Đen","Xám melange","Xanh navy"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, None, 15), ({"Size":"M","Màu sắc":"Đen"}, None, 28),
            ({"Size":"L","Màu sắc":"Đen"}, None, 22), ({"Size":"XL","Màu sắc":"Đen"}, None, 12),
            ({"Size":"M","Màu sắc":"Xám melange"}, None, 22), ({"Size":"L","Màu sắc":"Xám melange"}, None, 18),
            ({"Size":"M","Màu sắc":"Xanh navy"}, None, 15), ({"Size":"L","Màu sắc":"Xanh navy"}, None, 12),
        ],
    ),
    dict(
        name="Giày tập gym nam",
        description="Giày thể thao đế bằng chuyên dụng cho tập tạ. Đế cao su mỏng tăng độ ổn định, cảm giác tiếp đất tốt khi squat và deadlift. Upper lưới thoáng khí.",
        price=850000, stock=0, category=cat_clothing,
        attrs=[("Size", ["39","40","41","42","43","44"]), ("Màu sắc", ["Đen/Trắng","Đen/Đỏ","Trắng/Xanh"])],
        variants=[
            ({"Size":"39","Màu sắc":"Đen/Trắng"}, None, 8), ({"Size":"40","Màu sắc":"Đen/Trắng"}, None, 12),
            ({"Size":"41","Màu sắc":"Đen/Trắng"}, None, 15), ({"Size":"42","Màu sắc":"Đen/Trắng"}, None, 18),
            ({"Size":"43","Màu sắc":"Đen/Trắng"}, None, 12), ({"Size":"44","Màu sắc":"Đen/Trắng"}, None, 8),
            ({"Size":"40","Màu sắc":"Đen/Đỏ"}, None, 10), ({"Size":"41","Màu sắc":"Đen/Đỏ"}, None, 12),
            ({"Size":"42","Màu sắc":"Đen/Đỏ"}, None, 15), ({"Size":"43","Màu sắc":"Đen/Đỏ"}, None, 10),
        ],
    ),
    dict(
        name="Tất thể thao cổ thấp (3 đôi)",
        description="Set 3 đôi tất thể thao cổ thấp, đệm lót gót chân và mũi chân chống ma sát. Vải cotton pha polyester kháng khuẩn, khử mùi tự nhiên.",
        price=95000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S (35-38)","M (39-42)","L (43-46)"]), ("Màu sắc", ["Trắng","Đen","Xám"])],
        variants=[
            ({"Size":"S (35-38)","Màu sắc":"Trắng"}, None, 30), ({"Size":"M (39-42)","Màu sắc":"Trắng"}, None, 50),
            ({"Size":"L (43-46)","Màu sắc":"Trắng"}, None, 30), ({"Size":"M (39-42)","Màu sắc":"Đen"}, None, 45),
            ({"Size":"M (39-42)","Màu sắc":"Xám"}, None, 35),
        ],
    ),
    dict(
        name="Bộ tập yoga nữ 2 món",
        description="Bộ áo croptop + quần legging yoga cao cấp. Chất liệu bamboo-blend mềm mịn, thoáng khí và thân thiện môi trường. Thiết kế đơn sắc thanh lịch.",
        price=520000, stock=0, category=cat_clothing,
        attrs=[("Size", ["XS","S","M","L"]), ("Màu sắc", ["Đen","Sage green","Sand beige"])],
        variants=[
            ({"Size":"XS","Màu sắc":"Đen"}, None, 10), ({"Size":"S","Màu sắc":"Đen"}, None, 18),
            ({"Size":"M","Màu sắc":"Đen"}, None, 22), ({"Size":"L","Màu sắc":"Đen"}, None, 15),
            ({"Size":"S","Màu sắc":"Sage green"}, None, 12), ({"Size":"M","Màu sắc":"Sage green"}, None, 15),
            ({"Size":"S","Màu sắc":"Sand beige"}, None, 10), ({"Size":"M","Màu sắc":"Sand beige"}, None, 12),
        ],
    ),
    dict(
        name="Áo compression tay dài nam",
        description="Áo giữ nhiệt compression hỗ trợ cơ bắp trong quá trình tập. Chất liệu 4D stretch, tăng lưu thông máu, giảm mỏi cơ. Phù hợp mặc lót khi tập trời lạnh.",
        price=265000, stock=0, category=cat_clothing,
        attrs=[("Size", ["S","M","L","XL"]), ("Màu sắc", ["Đen","Xanh navy","Xám"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, None, 15), ({"Size":"M","Màu sắc":"Đen"}, None, 25),
            ({"Size":"L","Màu sắc":"Đen"}, None, 20), ({"Size":"XL","Màu sắc":"Đen"}, None, 12),
            ({"Size":"M","Màu sắc":"Xanh navy"}, None, 18), ({"Size":"L","Màu sắc":"Xanh navy"}, None, 15),
        ],
    ),

    # ── TẠ & THIẾT BỊ (15 sản phẩm) ────────────────────────────────────────────

    dict(
        name="Tạ tay cao su (đôi)",
        description="Cặp tạ tay bọc cao su chống trơn trượt, không gỉ sét, không gây tiếng ồn khi đặt xuống sàn. Thiết kế ergonomic vừa tay. Màu sắc phân biệt theo trọng lượng.",
        price=0, stock=0, category=cat_equipment,
        attrs=[("Trọng lượng", ["2kg","4kg","6kg","8kg","10kg","12kg","15kg","20kg"])],
        variants=[
            ({"Trọng lượng":"2kg"}, 85000, 20), ({"Trọng lượng":"4kg"}, 145000, 20),
            ({"Trọng lượng":"6kg"}, 195000, 15), ({"Trọng lượng":"8kg"}, 265000, 15),
            ({"Trọng lượng":"10kg"}, 325000, 12), ({"Trọng lượng":"12kg"}, 385000, 10),
            ({"Trọng lượng":"15kg"}, 465000, 8), ({"Trọng lượng":"20kg"}, 620000, 5),
        ],
    ),
    dict(
        name="Tạ đĩa cao su lỗ tròn",
        description="Tạ đĩa bọc cao su chất lượng cao, lỗ tròn ở giữa. Bề mặt nhám chống trượt, không bong tróc sau thời gian dài sử dụng. Khắc nổi trọng lượng dễ nhận biết.",
        price=0, stock=0, category=cat_equipment,
        attrs=[("Trọng lượng", ["1.25kg","2.5kg","5kg","10kg","15kg","20kg"])],
        variants=[
            ({"Trọng lượng":"1.25kg"}, 65000, 30), ({"Trọng lượng":"2.5kg"}, 115000, 25),
            ({"Trọng lượng":"5kg"}, 215000, 20), ({"Trọng lượng":"10kg"}, 385000, 15),
            ({"Trọng lượng":"15kg"}, 545000, 10), ({"Trọng lượng":"20kg"}, 720000, 8),
        ],
    ),
    dict(
        name="Đòn tạ barbell thẳng 180cm",
        description="Đòn tạ thẳng dài 180cm, tải trọng tối đa 300kg. Tay cầm knurling sâu chống trượt, lỗ lắp đĩa 50mm chuẩn Olympic. Thép mạ chrome sáng bóng, bền bỉ.",
        price=1250000, stock=15, category=cat_equipment,
    ),
    dict(
        name="Kettlebell thép đúc",
        description="Kettlebell thép đúc nguyên khối, sơn nhám chống rỉ. Tay cầm rộng phù hợp một hoặc hai tay. Đế phẳng không lăn khi đặt xuống. Lý tưởng cho swing, Turkish get-up, snatch.",
        price=0, stock=0, category=cat_equipment,
        attrs=[("Trọng lượng", ["8kg","12kg","16kg","20kg","24kg","32kg"])],
        variants=[
            ({"Trọng lượng":"8kg"}, 285000, 10), ({"Trọng lượng":"12kg"}, 395000, 10),
            ({"Trọng lượng":"16kg"}, 520000, 8), ({"Trọng lượng":"20kg"}, 645000, 6),
            ({"Trọng lượng":"24kg"}, 780000, 5), ({"Trọng lượng":"32kg"}, 1020000, 4),
        ],
    ),
    dict(
        name="Bộ dây kháng lực 5 cấp độ",
        description="Set 5 dây kháng lực latex tự nhiên từ 5-150lbs. Màu sắc phân biệt cấp độ lực. Dùng tập kéo xô, hỗ trợ kéo xà, phục hồi chấn thương. Bao đựng kèm theo.",
        price=285000, stock=45, category=cat_equipment,
    ),
    dict(
        name="Xà đơn gắn cửa điều chỉnh",
        description="Xà đơn gắn khung cửa không cần khoan. Chiều dài điều chỉnh 60-100cm, chịu tải 150kg. Tay cầm xốp êm, thanh thép mạ chrome chống rỉ. Lắp đặt trong 2 phút.",
        price=325000, stock=28, category=cat_equipment,
    ),
    dict(
        name="Dây nhảy tốc độ bearing",
        description="Dây nhảy thể thao tốc độ cao với vòng bi (bearing) trơn mượt. Dây thép bọc PVC 3mm, tay cầm nhôm chống trượt. Điều chỉnh chiều dài linh hoạt. Phù hợp CrossFit, boxing.",
        price=175000, stock=60, category=cat_equipment,
    ),
    dict(
        name="Thảm tập yoga TPE 6mm",
        description="Thảm yoga cao su TPE thân thiện môi trường, không mùi. Dày 6mm êm ái bảo vệ khớp. Bề mặt lưới chống trượt 2 mặt. Kích thước 183x61cm. Kèm dây buộc cuộn.",
        price=365000, stock=35, category=cat_equipment,
    ),
    dict(
        name="Con lăn tập bụng AB Wheel",
        description="Con lăn tập cơ bụng với 2 bánh xe ổn định hơn loại 1 bánh. Tay cầm cao su chống trượt, trục thép chịu lực. Kèm miếng đệm gối bảo vệ đầu gối.",
        price=125000, stock=55, category=cat_equipment,
    ),
    dict(
        name="Foam roller massage cơ 45cm",
        description="Con lăn xốp EVA cao mật độ phục hồi cơ bắp sau tập. Bề mặt gân 3D massage sâu giải phóng điểm cứng cơ. Đường kính 15cm, dài 45cm. Chịu lực 300kg.",
        price=195000, stock=40, category=cat_equipment,
    ),
    dict(
        name="Bóng tập Balance Ball 65cm",
        description="Bóng tập thăng bằng / Swiss ball đường kính 65cm. Chất liệu PVC chống nổ, chịu tải 300kg. Bơm tay kèm theo. Phù hợp tập core, pilates, vật lý trị liệu.",
        price=245000, stock=22, category=cat_equipment,
    ),
    dict(
        name="Push-up bar xoay 360°",
        description="Tay cầm chống đẩy xoay 360° giảm áp lực cổ tay. Đế cao su chống trượt, tay cầm xốp êm ái. Tăng biên độ cử động so với chống đẩy thường. Bộ 2 cái.",
        price=155000, stock=48, category=cat_equipment,
    ),
    dict(
        name="Dây TRX suspension trainer",
        description="Dây treo TRX chính hãng cho phép tập toàn thân với hơn 300 bài tập. Tải trọng tối đa 200kg. Dây nylon military-grade, khóa carabiner an toàn. Kèm túi đựng và hướng dẫn.",
        price=685000, stock=18, category=cat_equipment,
    ),
    dict(
        name="Bộ tạ tay điều chỉnh 2-24kg",
        description="Cặp tạ tay điều chỉnh thay thế 15 bộ tạ truyền thống. Hệ thống chốt xoay tiện lợi thay đổi trọng lượng từ 2-24kg mỗi tạ. Tiết kiệm không gian tối đa.",
        price=3850000, stock=6, category=cat_equipment,
    ),
    dict(
        name="Cột xô cable máy tập",
        description="Cột xô đơn điều chỉnh 19 vị trí, tải trọng 50kg. Puli hướng lực đa chiều, kèm dây cáp thép + thanh kéo + dây đơn. Khung thép sơn tĩnh điện bền màu.",
        price=4200000, stock=4, category=cat_equipment,
    ),

    # ── MÁY TẬP (8 sản phẩm) ───────────────────────────────────────────────────

    dict(
        name="Xe đạp tập trong nhà Air Bike",
        description="Xe đạp tập kháng lực không khí (Air Bike), cường độ tăng theo tốc độ đạp. Tay cầm đôi tập thêm cánh tay, yên điều chỉnh độ cao. Màn LCD hiển thị nhịp tim, calo. Tải trọng 150kg.",
        price=8500000, stock=5, category=cat_machine,
    ),
    dict(
        name="Máy chạy bộ điện 2.5HP",
        description="Máy chạy bộ động cơ 2.5HP liên tục, tốc độ 1-16km/h, độ dốc 0-15%. Mặt chạy 130x46cm đệm giảm chấn 6 lớp. Màn LCD + điều khiển tay cầm. Gấp gọn tiện lợi. Tải trọng 120kg.",
        price=12500000, stock=3, category=cat_machine,
    ),
    dict(
        name="Bench đa năng điều chỉnh 7 vị trí",
        description="Ghế tập tạ điều chỉnh 7 góc từ -15° đến 85°. Khung thép chịu tải 300kg, đệm PU dày 6cm. Tay cầm vận chuyển tiện lợi. Chân đế chữ A ổn định, kèm gối tập mông.",
        price=1850000, stock=10, category=cat_machine,
    ),
    dict(
        name="Máy tập đa năng Smith Machine",
        description="Smith machine cơ bản với thanh tạ hướng dẫn trên ray. Khung thép 50x100mm, tải trọng 200kg. Tích hợp kéo xô cao/thấp, pulldown. Lắp đặt tại nhà hoàn hảo.",
        price=18500000, stock=2, category=cat_machine,
    ),
    dict(
        name="Máy tập Elliptical Trainer",
        description="Máy tập elliptical chuyển động elip tự nhiên, không tác động lên khớp gối. 16 mức kháng lực điện từ, tay cầm cố định và di động. Màn LCD Bluetooth. Tải trọng 120kg.",
        price=9800000, stock=3, category=cat_machine,
    ),
    dict(
        name="Máy chèo thuyền Rowing Machine",
        description="Máy tập rowing kháng lực gió, âm thanh nhẹ nhàng. Ghế trượt ray nhôm mượt mà, mái chèo gập khi không dùng. Màn hình LCD đo nhịp chèo, calo, thời gian. Tải trọng 150kg.",
        price=7200000, stock=4, category=cat_machine,
    ),
    dict(
        name="Giàn tập xà đơn xà kép đa năng",
        description="Giàn tập gia đình với xà đơn, xà kép, dip bar và thanh push-up. Khung thép ф38mm sơn tĩnh điện. Tải trọng 200kg. Lắp đặt không cần khoan tường. Kích thước 230x120x220cm.",
        price=3200000, stock=6, category=cat_machine,
    ),
    dict(
        name="Bục tập step aerobic điều chỉnh",
        description="Bục step aerobic điều chỉnh 3 mức cao (10/15/20cm). Bề mặt chống trượt, góc bo an toàn. Chịu tải 150kg. Nhẹ dễ di chuyển, stack nhiều bục lên nhau tiết kiệm chỗ.",
        price=485000, stock=20, category=cat_machine,
    ),

    # ── DINH DƯỠNG (10 sản phẩm) ────────────────────────────────────────────────

    dict(
        name="Whey Protein Isolate 2kg",
        description="Whey protein isolate tinh khiết 90% protein, chỉ 1g carb và 0.5g béo mỗi khẩu phần. Hấp thu nhanh sau tập, 27g protein/scoop. Không chứa gluten, phù hợp người ăn kiêng.",
        price=0, stock=0, category=cat_nutrition,
        attrs=[("Hương vị", ["Chocolate","Vanilla","Strawberry","Unflavored"]), ("Dung tích", ["1kg","2kg","5kg"])],
        variants=[
            ({"Hương vị":"Chocolate","Dung tích":"1kg"}, 620000, 15),
            ({"Hương vị":"Chocolate","Dung tích":"2kg"}, 1150000, 12),
            ({"Hương vị":"Chocolate","Dung tích":"5kg"}, 2650000, 5),
            ({"Hương vị":"Vanilla","Dung tích":"1kg"}, 620000, 12),
            ({"Hương vị":"Vanilla","Dung tích":"2kg"}, 1150000, 10),
            ({"Hương vị":"Strawberry","Dung tích":"1kg"}, 620000, 10),
            ({"Hương vị":"Unflavored","Dung tích":"2kg"}, 1080000, 8),
        ],
    ),
    dict(
        name="Mass Gainer tăng cân 3kg",
        description="Mass gainer tăng cân tạo khối cho người gầy khó hấp thu. 50g protein + 250g carb + 10g creatine mỗi khẩu phần. Calo cao 1250kcal/serving. Vitamin và khoáng chất đầy đủ.",
        price=0, stock=0, category=cat_nutrition,
        attrs=[("Hương vị", ["Chocolate","Vanilla","Cookies & Cream"])],
        variants=[
            ({"Hương vị":"Chocolate"}, 785000, 15),
            ({"Hương vị":"Vanilla"}, 785000, 12),
            ({"Hương vị":"Cookies & Cream"}, 785000, 10),
        ],
    ),
    dict(
        name="BCAA 2:1:1 Powder 300g",
        description="BCAA tỷ lệ 2:1:1 (Leucine:Isoleucine:Valine) dạng bột dễ pha. 5g BCAA mỗi khẩu phần, hỗ trợ phục hồi cơ bắp và giảm đau nhức sau tập. Thêm Glutamine và Citrulline.",
        price=0, stock=0, category=cat_nutrition,
        attrs=[("Hương vị", ["Watermelon","Lemon","Green Apple","Unflavored"])],
        variants=[
            ({"Hương vị":"Watermelon"}, 425000, 20),
            ({"Hương vị":"Lemon"}, 425000, 18),
            ({"Hương vị":"Green Apple"}, 425000, 15),
            ({"Hương vị":"Unflavored"}, 395000, 10),
        ],
    ),
    dict(
        name="Creatine Monohydrate 500g",
        description="Creatine monohydrate tinh khiết 99.9% micronized hấp thu nhanh hơn. 5g/khẩu phần tăng sức mạnh và hiệu suất tập ngắn cường độ cao. Chứng nhận Creapure® Germany.",
        price=385000, stock=35, category=cat_nutrition,
    ),
    dict(
        name="Pre-workout C4 Original",
        description="Pre-workout nổi tiếng thế giới giúp tăng năng lượng, tập trung và endurance. 150mg caffeine, beta-alanine, arginine AKG. Pha 1 scoop trước tập 20-30 phút.",
        price=0, stock=0, category=cat_nutrition,
        attrs=[("Hương vị", ["Fruit Punch","Watermelon","Blue Raspberry","Pink Lemonade"])],
        variants=[
            ({"Hương vị":"Fruit Punch"}, 520000, 15),
            ({"Hương vị":"Watermelon"}, 520000, 12),
            ({"Hương vị":"Blue Raspberry"}, 520000, 10),
            ({"Hương vị":"Pink Lemonade"}, 520000, 8),
        ],
    ),
    dict(
        name="Multivitamin thể thao 90 viên",
        description="Vitamin tổng hợp cho vận động viên với liều lượng cao hơn người bình thường. Bổ sung 23 vitamin và khoáng chất thiết yếu, hỗ trợ phục hồi và tăng cường miễn dịch.",
        price=285000, stock=40, category=cat_nutrition,
    ),
    dict(
        name="Omega-3 Fish Oil 1000mg (100 viên)",
        description="Dầu cá Omega-3 chuẩn hóa EPA 180mg + DHA 120mg mỗi viên. Hỗ trợ sức khỏe tim mạch, giảm viêm khớp sau tập luyện nặng. Không tanh nhờ quy trình tinh chế độc quyền.",
        price=195000, stock=50, category=cat_nutrition,
    ),
    dict(
        name="Protein bar High-Protein (12 thanh)",
        description="Thanh protein tiện lợi 20g protein, 5g đường tự nhiên, 220kcal. Phủ chocolate thật, nhân caramel hoặc peanut butter. Không dùng đường nhân tạo. Snack lành mạnh bất kỳ lúc nào.",
        price=0, stock=0, category=cat_nutrition,
        attrs=[("Hương vị", ["Chocolate Caramel","Peanut Butter","Cookies & Cream"])],
        variants=[
            ({"Hương vị":"Chocolate Caramel"}, 365000, 25),
            ({"Hương vị":"Peanut Butter"}, 365000, 22),
            ({"Hương vị":"Cookies & Cream"}, 365000, 20),
        ],
    ),
    dict(
        name="Collagen Peptides Powder 400g",
        description="Collagen thủy phân type I & III hỗ trợ xương khớp, da, tóc và móng. 10g collagen mỗi khẩu phần, hấp thu nhanh. Không mùi không vị, pha vào bất kỳ đồ uống nào.",
        price=485000, stock=28, category=cat_nutrition,
    ),
    dict(
        name="L-Carnitine 3000mg dạng lỏng",
        description="L-Carnitine Tartrate dạng lỏng hấp thu tối ưu. 3000mg/khẩu phần hỗ trợ chuyển hóa mỡ thành năng lượng, giảm mỡ trong khi giữ cơ. Thêm vitamin B5 và B12.",
        price=0, stock=0, category=cat_nutrition,
        attrs=[("Hương vị", ["Cherry","Lemon","Berry Mix"])],
        variants=[
            ({"Hương vị":"Cherry"}, 345000, 20),
            ({"Hương vị":"Lemon"}, 345000, 18),
            ({"Hương vị":"Berry Mix"}, 345000, 15),
        ],
    ),

    # ── PHỤ KIỆN (5 sản phẩm) ──────────────────────────────────────────────────

    dict(
        name="Găng tay tập gym da tổng hợp",
        description="Găng tay tập gym lòng bàn tay da tổng hợp chống chai, mu tay lưới thoáng khí. Dây cuốn cổ tay 20cm tăng cường ổn định. Phù hợp tập tạ, xà đơn, rowing.",
        price=0, stock=0, category=cat_accessory,
        attrs=[("Size", ["S","M","L","XL"]), ("Màu sắc", ["Đen","Đen/Đỏ"])],
        variants=[
            ({"Size":"S","Màu sắc":"Đen"}, 185000, 15), ({"Size":"M","Màu sắc":"Đen"}, 185000, 25),
            ({"Size":"L","Màu sắc":"Đen"}, 185000, 20), ({"Size":"XL","Màu sắc":"Đen"}, 185000, 12),
            ({"Size":"M","Màu sắc":"Đen/Đỏ"}, 195000, 18), ({"Size":"L","Màu sắc":"Đen/Đỏ"}, 195000, 15),
        ],
    ),
    dict(
        name="Đai lưng tập gym da thật 10cm",
        description="Đai lưng tập gym da bò thật dày 10mm rộng 10cm. Hỗ trợ cột sống khi tập squat, deadlift nặng. Khóa lever nhanh tiện lợi. Phù hợp tập PowerLifting và Strongman.",
        price=0, stock=0, category=cat_accessory,
        attrs=[("Size", ["S (60-75cm)","M (75-90cm)","L (90-105cm)","XL (105-120cm)"])],
        variants=[
            ({"Size":"S (60-75cm)"}, 485000, 8), ({"Size":"M (75-90cm)"}, 485000, 12),
            ({"Size":"L (90-105cm)"}, 485000, 10), ({"Size":"XL (105-120cm)"}, 485000, 6),
        ],
    ),
    dict(
        name="Knee sleeve bảo vệ đầu gối 7mm",
        description="Bộ đôi knee sleeve neoprene 7mm hỗ trợ và giữ ấm đầu gối khi tập squat nặng. Áp suất đồng đều giảm đau và ngăn ngừa chấn thương. IPF và USPA approved.",
        price=0, stock=0, category=cat_accessory,
        attrs=[("Size", ["S","M","L","XL","XXL"])],
        variants=[
            ({"Size":"S"}, 385000, 10), ({"Size":"M"}, 385000, 15),
            ({"Size":"L"}, 385000, 12), ({"Size":"XL"}, 385000, 8),
            ({"Size":"XXL"}, 385000, 5),
        ],
    ),
    dict(
        name="Bình nước thể thao Tritan 1L",
        description="Bình nước Tritan BPA-free trong suốt dễ theo dõi lượng nước uống. Nắp flip-top một tay tiện lợi, miệng rộng dễ cho đá. Vạch chia 100ml chính xác. Không mùi, không vị nhựa.",
        price=0, stock=0, category=cat_accessory,
        attrs=[("Màu sắc", ["Trong suốt","Đen","Xanh cobalt","Hồng"])],
        variants=[
            ({"Màu sắc":"Trong suốt"}, 145000, 30), ({"Màu sắc":"Đen"}, 145000, 25),
            ({"Màu sắc":"Xanh cobalt"}, 155000, 20), ({"Màu sắc":"Hồng"}, 155000, 18),
        ],
    ),
    dict(
        name="Túi gym canvas đa ngăn 40L",
        description="Túi thể thao canvas 40L với ngăn giày riêng biệt có lưới thoáng khí. 3 ngăn chính + 2 túi phụ. Dây đeo vai dày êm, tay cầm da tổng hợp bền. Kích thước 55x30x25cm.",
        price=0, stock=0, category=cat_accessory,
        attrs=[("Màu sắc", ["Đen","Xám","Navy","Olive"])],
        variants=[
            ({"Màu sắc":"Đen"}, 365000, 20), ({"Màu sắc":"Xám"}, 365000, 15),
            ({"Màu sắc":"Navy"}, 365000, 12), ({"Màu sắc":"Olive"}, 365000, 10),
        ],
    ),
]

# ── Insert products ─────────────────────────────────────────────────────────────

created = 0
for p in PRODUCTS:
    # Check duplicate
    existing = db.query(Product).filter_by(name=p["name"]).first()
    if existing:
        print(f"  skip (exists): {p['name']}")
        continue

    product = create_product(db, ProductCreate(
        name=p["name"],
        description=p.get("description"),
        price=p["price"],
        stock_quantity=p.get("stock", 0),
        category_id=p["category"].id,
        images=img(slugify(p["name"])),
        is_active=True,
    ))

    # Attributes + Variants
    for i, (attr_name, attr_values) in enumerate(p.get("attrs", [])):
        add_attribute(product.id, attr_name, attr_values, i)

    for (attr_combo, price_override, stock) in p.get("variants", []):
        add_variant(product.id, attr_combo, price_override, stock)

    db.flush()
    created += 1
    print(f"  ✓ {p['name']}")

db.commit()
print(f"\n✓ Đã tạo {created} sản phẩm mới")

# ── Admin account ───────────────────────────────────────────────────────────────

existing_admin = db.query(User).filter_by(email="admin@gymstore.com").first()
if not existing_admin:
    admin = User(
        id=str(uuid.uuid4()),
        email="admin@gymstore.com",
        password_hash=hash_password("admin123"),
        full_name="Admin GymStore",
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print("\n✓ Admin account: admin@gymstore.com / admin123")
else:
    print("\n  skip: admin@gymstore.com (đã tồn tại)")

db.close()
print("\nDone!")
