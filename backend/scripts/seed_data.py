"""
Seed data script for LuxeFurniture
Creates admin user and sample data for testing and development.
"""

import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.enums import UserRole, VipTier
from app.models.product import Category, Product, Collection
from app.models.banner import Banner
from app.core.security import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# CATEGORIES - 6 main categories with images
# =============================================================================
CATEGORIES = [
    {
        "name": "Phòng Khách",
        "slug": "phong-khach",
        "description": "Nội thất phòng khách sang trọng và hiện đại: sofa, bàn trà, kệ tivi, ghế thư giãn và các phụ kiện trang trí.",
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"
    },
    {
        "name": "Phòng Ngủ", 
        "slug": "phong-ngu",
        "description": "Nội thất phòng ngủ êm ái và tiện nghi: giường ngủ, tủ quần áo, bàn trang điểm, tab đầu giường.",
        "image_url": "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
    },
    {
        "name": "Phòng Ăn & Bếp",
        "slug": "phong-an-bep", 
        "description": "Nội thất phòng ăn và bếp tiện dụng: bàn ăn, ghế ăn, tủ bếp, kệ bếp và các phụ kiện nhà bếp.",
        "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800"
    },
    {
        "name": "Phòng Làm Việc",
        "slug": "phong-lam-viec",
        "description": "Nội thất văn phòng và phòng làm việc: bàn làm việc, ghế công thái học, kệ sách, tủ hồ sơ.",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800"
    },
    {
        "name": "Ngoại Thất",
        "slug": "ngoai-that",
        "description": "Nội thất sân vườn và ban công: bàn ghế ngoài trời, xích đu, ghế tắm nắng, ô che nắng và đèn trang trí.",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
    },
    {
        "name": "Phụ Kiện & Decor",
        "slug": "phu-kien-decor",
        "description": "Phụ kiện trang trí nội thất: đèn trang trí, thảm, gương, tranh treo tường, cây cảnh và các vật dụng decor.",
        "image_url": "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800"
    },
]

# =============================================================================
# COLLECTIONS - Themed furniture collections (bundle/combo products)
# Giá gốc = tổng giá các sản phẩm, sale_price = giá ưu đãi khi mua cả bộ
# =============================================================================
COLLECTIONS = [
    {
        "name": "Bộ Sưu Tập Minimalist 2025",
        "slug": "minimalist-2025",
        "description": "Phong cách tối giản với đường nét thanh lịch, màu sắc trung tính và chất liệu tự nhiên. Bao gồm: Kệ tivi gỗ óc chó, Giường gỗ tự nhiên, Tủ quần áo cửa lùa, Tủ bếp modular, Bàn làm việc nâng hạ, Ghế công thái học và Đèn bàn LED. Tiết kiệm đến 15% khi mua cả bộ!",
        "banner_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200",
        "is_active": True,
        "sale_price": 62000000  # Giá gốc ~73tr, tiết kiệm ~15%
    },
    {
        "name": "Scandinavian Nordic",
        "slug": "scandinavian-nordic",
        "description": "Nội thất phong cách Bắc Âu với gỗ sáng màu, thiết kế đơn giản và công năng cao. Bao gồm: Sofa góc chữ L, Ghế thư giãn bập bênh, Bàn ăn gỗ sồi 6 ghế, Ghế ăn gỗ bọc vải và Kệ sách 5 tầng. Tiết kiệm đến 12% khi mua trọn bộ!",
        "banner_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200",
        "is_active": True,
        "sale_price": 55000000  # Giá gốc ~63tr, tiết kiệm ~12%
    },
    {
        "name": "Luxury Premium",
        "slug": "luxury-premium",
        "description": "Dòng sản phẩm cao cấp với chất liệu thượng hạng, thiết kế sang trọng. Bao gồm: Sofa băng Monaco, Bàn trà đá Marble, Giường King Size bọc da, Bàn trang điểm gương LED, Nệm cao su non và Bàn ăn đá Marble 4 ghế. Tiết kiệm đến 18% khi mua cả bộ!",
        "banner_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
        "is_active": True,
        "sale_price": 99000000  # Giá gốc ~120tr, tiết kiệm ~18%
    },
    {
        "name": "Modern Industrial",
        "slug": "modern-industrial",
        "description": "Kết hợp giữa kim loại và gỗ, phong cách công nghiệp hiện đại với nét mạnh mẽ. Bao gồm: Kệ trang trí đa năng, Kệ rượu gỗ treo tường, Xe đẩy bếp di động và Tủ hồ sơ 4 ngăn. Tiết kiệm đến 10% khi mua trọn bộ!",
        "banner_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
        "is_active": True,
        "sale_price": 12500000  # Giá gốc ~14tr, tiết kiệm ~10%
    },
]

# =============================================================================
# PRODUCTS - 5-6 products per category
# =============================================================================
PRODUCTS = [
    # =========================================================================
    # PHÒNG KHÁCH (Living Room) - 6 products
    # =========================================================================
    {
        "name": "Sofa Góc Chữ L Nordic",
        "slug": "sofa-goc-chu-l-nordic",
        "description": "Sofa góc chữ L phong cách Bắc Âu với vải bọc cao cấp chống bám bụi. Khung gỗ sồi tự nhiên, đệm mút D40 siêu đàn hồi. Thiết kế hiện đại phù hợp mọi không gian phòng khách.",
        "short_description": "Sofa góc Bắc Âu, vải cao cấp, khung gỗ sồi",
        "price": 25900000,
        "sale_price": 21900000,
        "sku": "PK-SOF-001",
        "category_slug": "phong-khach",
        "collection_slug": "scandinavian-nordic",
        "stock": 20,
        "weight": 95.0,
        "dimensions": {"length": 280, "width": 180, "height": 85, "unit": "cm"},
        "specs": {"material": "Vải bọc Hàn Quốc, Gỗ sồi tự nhiên, Mút D40", "color": "Xám nhạt", "color_hex": "#B8B8B8"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
            "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800"
        ]
    },
    {
        "name": "Sofa Băng 3 Chỗ Monaco",
        "slug": "sofa-bang-3-cho-monaco",
        "description": "Sofa băng 3 chỗ thiết kế thanh lịch với chân kim loại mạ vàng. Vải nhung mềm mại cao cấp, đệm lông vũ thoải mái. Phù hợp phòng khách nhỏ và căn hộ.",
        "short_description": "Sofa 3 chỗ vải nhung, chân mạ vàng",
        "price": 18500000,
        "sale_price": 15900000,
        "sku": "PK-SOF-002",
        "category_slug": "phong-khach",
        "collection_slug": "luxury-premium",
        "stock": 25,
        "weight": 65.0,
        "dimensions": {"length": 220, "width": 90, "height": 80, "unit": "cm"},
        "specs": {"material": "Vải nhung Ý, Khung thép, Đệm lông vũ", "color": "Xanh cổ vịt", "color_hex": "#008080"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ]
    },
    {
        "name": "Bàn Trà Mặt Đá Marble",
        "slug": "ban-tra-mat-da-marble",
        "description": "Bàn trà mặt đá marble tự nhiên với vân đá độc đáo. Chân kim loại sơn tĩnh điện chống gỉ. Thiết kế sang trọng làm điểm nhấn cho phòng khách.",
        "short_description": "Bàn trà đá marble, chân kim loại",
        "price": 8900000,
        "sale_price": 7500000,
        "sku": "PK-BAN-001",
        "category_slug": "phong-khach",
        "collection_slug": "luxury-premium",
        "stock": 30,
        "weight": 45.0,
        "dimensions": {"length": 120, "width": 60, "height": 45, "unit": "cm"},
        "specs": {"material": "Đá marble tự nhiên, Thép sơn tĩnh điện", "color": "Trắng vân xám", "color_hex": "#F5F5F5"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800",
            "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800"
        ]
    },
    {
        "name": "Kệ Tivi Gỗ Óc Chó 1.8m",
        "slug": "ke-tivi-go-oc-cho-1-8m",
        "description": "Kệ tivi gỗ óc chó nguyên khối với vân gỗ tự nhiên tuyệt đẹp. Thiết kế floating hiện đại, nhiều ngăn chứa tiện dụng. Sơn PU cao cấp bảo vệ bề mặt.",
        "short_description": "Kệ tivi gỗ óc chó, thiết kế floating",
        "price": 12500000,
        "sale_price": None,
        "sku": "PK-KTV-001",
        "category_slug": "phong-khach",
        "collection_slug": "minimalist-2025",
        "stock": 15,
        "weight": 55.0,
        "dimensions": {"length": 180, "width": 40, "height": 50, "unit": "cm"},
        "specs": {"material": "Gỗ óc chó nguyên khối, Sơn PU", "color": "Nâu óc chó", "color_hex": "#5C4033"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ]
    },
    {
        "name": "Ghế Thư Giãn Bập Bênh",
        "slug": "ghe-thu-gian-bap-benh",
        "description": "Ghế thư giãn bập bênh với thiết kế ergonomic thoải mái. Khung gỗ tần bì, đệm bọc vải lanh tự nhiên. Hoàn hảo để đọc sách và nghỉ ngơi.",
        "short_description": "Ghế bập bênh, khung gỗ tần bì",
        "price": 6900000,
        "sale_price": 5900000,
        "sku": "PK-GHE-001",
        "category_slug": "phong-khach",
        "collection_slug": "scandinavian-nordic",
        "stock": 35,
        "weight": 18.0,
        "dimensions": {"length": 70, "width": 80, "height": 100, "unit": "cm"},
        "specs": {"material": "Gỗ tần bì, Vải lanh, Mút cao cấp", "color": "Be tự nhiên", "color_hex": "#F5F5DC"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
        ]
    },
    {
        "name": "Kệ Trang Trí Đa Năng",
        "slug": "ke-trang-tri-da-nang",
        "description": "Kệ trang trí đa năng với thiết kế hình học độc đáo. Kết hợp gỗ và kim loại, phù hợp đặt sách, cây cảnh và đồ decor. Có thể treo tường hoặc đặt sàn.",
        "short_description": "Kệ trang trí gỗ kim loại, đa năng",
        "price": 3500000,
        "sale_price": 2900000,
        "sku": "PK-KTT-001",
        "category_slug": "phong-khach",
        "collection_slug": "modern-industrial",
        "stock": 50,
        "weight": 12.0,
        "dimensions": {"length": 100, "width": 25, "height": 180, "unit": "cm"},
        "specs": {"material": "Gỗ MDF phủ melamine, Khung sắt sơn tĩnh điện", "color": "Đen - Vân gỗ", "color_hex": "#2C2C2C"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800",
            "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800"
        ]
    },

    # =========================================================================
    # PHÒNG NGỦ (Bedroom) - 6 products
    # =========================================================================
    {
        "name": "Giường Ngủ King Size Bọc Da",
        "slug": "giuong-ngu-king-size-boc-da",
        "description": "Giường ngủ king size 1.8m với đầu giường bọc da thật cao cấp. Khung gỗ sồi chắc chắn, hệ thống lanh chịu lực tốt. Thiết kế sang trọng cho phòng ngủ master.",
        "short_description": "Giường 1.8m bọc da thật, khung gỗ sồi",
        "price": 32000000,
        "sale_price": 27900000,
        "sku": "PN-GIU-001",
        "category_slug": "phong-ngu",
        "collection_slug": "luxury-premium",
        "stock": 12,
        "weight": 120.0,
        "dimensions": {"length": 218, "width": 188, "height": 110, "unit": "cm"},
        "specs": {"material": "Da bò thật, Gỗ sồi Mỹ, Lanh cao cấp", "color": "Nâu cafe", "color_hex": "#6F4E37"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
            "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800",
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
        ]
    },
    {
        "name": "Giường Ngủ Gỗ Tự Nhiên 1.6m",
        "slug": "giuong-ngu-go-tu-nhien-1-6m",
        "description": "Giường ngủ queen size 1.6m từ gỗ tần bì tự nhiên. Thiết kế Nhật Bản đơn giản với đầu giường thấp. Hoàn thiện sơn lót nước thân thiện môi trường.",
        "short_description": "Giường 1.6m gỗ tần bì, phong cách Nhật",
        "price": 18500000,
        "sale_price": 15900000,
        "sku": "PN-GIU-002",
        "category_slug": "phong-ngu",
        "collection_slug": "minimalist-2025",
        "stock": 20,
        "weight": 85.0,
        "dimensions": {"length": 210, "width": 170, "height": 35, "unit": "cm"},
        "specs": {"material": "Gỗ tần bì tự nhiên, Sơn lót nước", "color": "Gỗ tự nhiên", "color_hex": "#DEB887"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800",
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
        ]
    },
    {
        "name": "Tủ Quần Áo Cửa Lùa 2.4m",
        "slug": "tu-quan-ao-cua-lua-2-4m",
        "description": "Tủ quần áo cửa lùa rộng 2.4m với gương toàn thân. Nội thất thông minh gồm thanh treo, ngăn kéo và kệ chia. Cửa trượt êm ái trên ray nhôm cao cấp.",
        "short_description": "Tủ cửa lùa 2.4m, có gương, nội thất thông minh",
        "price": 22000000,
        "sale_price": 18900000,
        "sku": "PN-TUA-001",
        "category_slug": "phong-ngu",
        "collection_slug": "minimalist-2025",
        "stock": 10,
        "weight": 150.0,
        "dimensions": {"length": 240, "width": 60, "height": 220, "unit": "cm"},
        "specs": {"material": "Gỗ MDF phủ Laminate, Gương Bỉ, Ray nhôm", "color": "Trắng ngà", "color_hex": "#FFFFF0"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1595428773637-4759b7d63c9b?w=800"
        ]
    },
    {
        "name": "Bàn Trang Điểm Gương LED",
        "slug": "ban-trang-diem-guong-led",
        "description": "Bàn trang điểm với gương LED 3 chế độ sáng. Mặt bàn đá sintered stone, nhiều ngăn chứa mỹ phẩm. Ghế đệm bọc nhung đi kèm.",
        "short_description": "Bàn trang điểm gương LED, mặt đá",
        "price": 9500000,
        "sale_price": 7900000,
        "sku": "PN-BTD-001",
        "category_slug": "phong-ngu",
        "collection_slug": "luxury-premium",
        "stock": 25,
        "weight": 45.0,
        "dimensions": {"length": 100, "width": 45, "height": 140, "unit": "cm"},
        "specs": {"material": "Đá sintered stone, Gương LED, Gỗ MDF", "color": "Trắng", "color_hex": "#FFFFFF"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800",
            "https://images.unsplash.com/photo-1595428773637-4759b7d63c9b?w=800"
        ]
    },
    {
        "name": "Tab Đầu Giường Gỗ Sồi",
        "slug": "tab-dau-giuong-go-soi",
        "description": "Tab đầu giường gỗ sồi tự nhiên với 2 ngăn kéo. Thiết kế Scandinavian với chân gỗ vát. Mặt bàn rộng đủ để đèn ngủ và sách.",
        "short_description": "Tab đầu giường gỗ sồi, 2 ngăn kéo",
        "price": 4500000,
        "sale_price": 3900000,
        "sku": "PN-TAB-001",
        "category_slug": "phong-ngu",
        "collection_slug": "scandinavian-nordic",
        "stock": 40,
        "weight": 18.0,
        "dimensions": {"length": 50, "width": 40, "height": 55, "unit": "cm"},
        "specs": {"material": "Gỗ sồi tự nhiên, Ray trượt êm", "color": "Gỗ sồi sáng", "color_hex": "#C4A35A"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800",
            "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800"
        ]
    },
    {
        "name": "Nệm Cao Su Non Premium",
        "slug": "nem-cao-su-non-premium",
        "description": "Nệm cao su non nhập khẩu với 5 vùng nâng đỡ cơ thể. Vỏ bọc vải tencel thoáng khí, có thể tháo giặt. Độ dày 25cm, đàn hồi cao.",
        "short_description": "Nệm cao su non 25cm, 5 vùng nâng đỡ",
        "price": 15000000,
        "sale_price": 12500000,
        "sku": "PN-NEM-001",
        "category_slug": "phong-ngu",
        "collection_slug": "luxury-premium",
        "stock": 30,
        "weight": 35.0,
        "dimensions": {"length": 200, "width": 160, "height": 25, "unit": "cm"},
        "specs": {"material": "Cao su non nhập khẩu, Vải tencel", "color": "Trắng kem", "color_hex": "#FFFDD0"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1631049035182-249067d7618e?w=800",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"
        ]
    },

    # =========================================================================
    # PHÒNG ĂN & BẾP (Dining & Kitchen) - 6 products
    # =========================================================================
    {
        "name": "Bàn Ăn Gỗ Sồi 6 Ghế",
        "slug": "ban-an-go-soi-6-ghe",
        "description": "Bộ bàn ăn gỗ sồi Mỹ cho 6-8 người với mặt bàn nguyên tấm. Chân bàn chữ X chắc chắn, hoàn thiện sơn PU chống nước. Đi kèm 6 ghế bọc da PU.",
        "short_description": "Bộ bàn ăn 6 ghế, gỗ sồi Mỹ nguyên tấm",
        "price": 28000000,
        "sale_price": 23900000,
        "sku": "PA-BAN-001",
        "category_slug": "phong-an-bep",
        "collection_slug": "scandinavian-nordic",
        "stock": 8,
        "weight": 95.0,
        "dimensions": {"length": 180, "width": 90, "height": 75, "unit": "cm"},
        "specs": {"material": "Gỗ sồi Mỹ nguyên tấm, Da PU, Sơn PU", "color": "Gỗ sồi tự nhiên", "color_hex": "#D2B48C"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
            "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
            "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800"
        ]
    },
    {
        "name": "Bàn Ăn Mặt Đá Marble 4 Ghế",
        "slug": "ban-an-mat-da-marble-4-ghe",
        "description": "Bộ bàn ăn mặt đá marble trắng Ý với vân đá tự nhiên. Chân thép sơn tĩnh điện màu vàng đồng. Bao gồm 4 ghế bọc nhung cao cấp.",
        "short_description": "Bàn đá marble Ý + 4 ghế nhung",
        "price": 35000000,
        "sale_price": 29900000,
        "sku": "PA-BAN-002",
        "category_slug": "phong-an-bep",
        "collection_slug": "luxury-premium",
        "stock": 6,
        "weight": 120.0,
        "dimensions": {"length": 140, "width": 80, "height": 75, "unit": "cm"},
        "specs": {"material": "Đá marble Ý, Thép mạ vàng đồng, Vải nhung", "color": "Trắng vân xám - Xanh navy", "color_hex": "#F8F8FF"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800",
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800"
        ]
    },
    {
        "name": "Ghế Ăn Gỗ Bọc Vải",
        "slug": "ghe-an-go-boc-vai",
        "description": "Ghế ăn gỗ cao su với đệm ngồi bọc vải linen. Thiết kế ergonomic thoải mái, lưng ghế cong ôm sát. Phù hợp nhiều phong cách bàn ăn.",
        "short_description": "Ghế ăn gỗ cao su, bọc vải linen",
        "price": 2200000,
        "sale_price": 1890000,
        "sku": "PA-GHE-001",
        "category_slug": "phong-an-bep",
        "collection_slug": "scandinavian-nordic",
        "stock": 60,
        "weight": 8.0,
        "dimensions": {"length": 45, "width": 52, "height": 80, "unit": "cm"},
        "specs": {"material": "Gỗ cao su, Vải linen, Mút D35", "color": "Xám pha", "color_hex": "#A9A9A9"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800",
            "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800"
        ]
    },
    {
        "name": "Tủ Bếp Trên Hệ Modular",
        "slug": "tu-bep-tren-he-modular",
        "description": "Tủ bếp trên hệ modular với cánh mở giảm chấn. Vật liệu Acrylic bóng gương dễ lau chùi. Tự chọn kích thước và bố cục theo nhu cầu.",
        "short_description": "Tủ bếp trên Acrylic, hệ modular",
        "price": 8500000,
        "sale_price": 7200000,
        "sku": "PA-TUB-001",
        "category_slug": "phong-an-bep",
        "collection_slug": "minimalist-2025",
        "stock": 15,
        "weight": 35.0,
        "dimensions": {"length": 120, "width": 35, "height": 70, "unit": "cm"},
        "specs": {"material": "Gỗ MDF chống ẩm, Acrylic bóng, Bản lề giảm chấn", "color": "Trắng bóng", "color_hex": "#FFFFFF"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
            "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800"
        ]
    },
    {
        "name": "Kệ Rượu Gỗ Treo Tường",
        "slug": "ke-ruou-go-treo-tuong",
        "description": "Kệ rượu treo tường bằng gỗ thông với chỗ treo ly. Thiết kế công nghiệp với khung sắt đen. Chứa được 8-12 chai rượu vang.",
        "short_description": "Kệ rượu gỗ thông, treo tường",
        "price": 2800000,
        "sale_price": 2400000,
        "sku": "PA-KRU-001",
        "category_slug": "phong-an-bep",
        "collection_slug": "modern-industrial",
        "stock": 35,
        "weight": 8.0,
        "dimensions": {"length": 80, "width": 25, "height": 60, "unit": "cm"},
        "specs": {"material": "Gỗ thông, Khung sắt sơn tĩnh điện", "color": "Gỗ thông - Đen", "color_hex": "#DEB887"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800"
        ]
    },
    {
        "name": "Xe Đẩy Bếp Di Động",
        "slug": "xe-day-bep-di-dong",
        "description": "Xe đẩy bếp đa năng 3 tầng với bánh xe xoay 360 độ. Khung thép không gỉ, mặt gỗ tre tự nhiên. Tiện lợi để dao thớt, gia vị và dụng cụ nấu.",
        "short_description": "Xe đẩy bếp 3 tầng, inox + gỗ tre",
        "price": 3200000,
        "sale_price": 2700000,
        "sku": "PA-XDB-001",
        "category_slug": "phong-an-bep",
        "collection_slug": "modern-industrial",
        "stock": 40,
        "weight": 12.0,
        "dimensions": {"length": 60, "width": 40, "height": 85, "unit": "cm"},
        "specs": {"material": "Thép không gỉ 304, Gỗ tre tự nhiên", "color": "Bạc - Vân tre", "color_hex": "#C0C0C0"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"
        ]
    },

    # =========================================================================
    # PHÒNG LÀM VIỆC (Office/Workspace) - 5 products
    # =========================================================================
    {
        "name": "Bàn Làm Việc Chữ L Nâng Hạ",
        "slug": "ban-lam-viec-chu-l-nang-ha",
        "description": "Bàn làm việc chữ L với hệ thống nâng hạ điện. Mặt bàn gỗ MDF phủ melamine chống trầy. Điều khiển độ cao từ 72-120cm, có nhớ 3 vị trí.",
        "short_description": "Bàn chữ L nâng hạ điện, nhớ vị trí",
        "price": 18500000,
        "sale_price": 15900000,
        "sku": "PLV-BAN-001",
        "category_slug": "phong-lam-viec",
        "collection_slug": "minimalist-2025",
        "stock": 15,
        "weight": 65.0,
        "dimensions": {"length": 180, "width": 160, "height": 120, "unit": "cm"},
        "specs": {"material": "Gỗ MDF chống trầy, Khung thép, Motor điện", "color": "Trắng - Đen", "color_hex": "#F5F5F5"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
            "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800",
            "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800"
        ]
    },
    {
        "name": "Ghế Công Thái Học Premium",
        "slug": "ghe-cong-thai-hoc-premium",
        "description": "Ghế văn phòng công thái học với lưng mesh thoáng khí. Hỗ trợ lưng 4D có thể điều chỉnh, tựa đầu nâng hạ. Chân xoay 360 độ với bánh xe PU.",
        "short_description": "Ghế ergonomic mesh, hỗ trợ lưng 4D",
        "price": 8900000,
        "sale_price": 7500000,
        "sku": "PLV-GHE-001",
        "category_slug": "phong-lam-viec",
        "collection_slug": "minimalist-2025",
        "stock": 25,
        "weight": 22.0,
        "dimensions": {"length": 65, "width": 65, "height": 130, "unit": "cm"},
        "specs": {"material": "Lưới mesh, Nhựa PA, Xốp đúc, Bánh xe PU", "color": "Đen - Xám", "color_hex": "#2F4F4F"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800",
            "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800"
        ]
    },
    {
        "name": "Kệ Sách 5 Tầng Gỗ Sồi",
        "slug": "ke-sach-5-tang-go-soi",
        "description": "Kệ sách 5 tầng gỗ sồi tự nhiên với thiết kế mở thoáng. Chân kim loại mạ đồng, kệ chịu lực tốt. Có thể dùng làm kệ trang trí hoặc vách ngăn.",
        "short_description": "Kệ sách 5 tầng gỗ sồi, chân đồng",
        "price": 7500000,
        "sale_price": 6500000,
        "sku": "PLV-KSA-001",
        "category_slug": "phong-lam-viec",
        "collection_slug": "scandinavian-nordic",
        "stock": 20,
        "weight": 35.0,
        "dimensions": {"length": 120, "width": 35, "height": 180, "unit": "cm"},
        "specs": {"material": "Gỗ sồi tự nhiên, Chân thép mạ đồng", "color": "Gỗ sồi sáng - Đồng", "color_hex": "#D2B48C"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800",
            "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800"
        ]
    },
    {
        "name": "Tủ Hồ Sơ 4 Ngăn Kéo",
        "slug": "tu-ho-so-4-ngan-keo",
        "description": "Tủ hồ sơ 4 ngăn kéo với khóa an toàn. Ngăn kéo ray bi êm ái, chịu tải 25kg mỗi ngăn. Thiết kế nhỏ gọn phù hợp góc làm việc.",
        "short_description": "Tủ hồ sơ 4 ngăn, có khóa, ray bi",
        "price": 4500000,
        "sale_price": 3900000,
        "sku": "PLV-THS-001",
        "category_slug": "phong-lam-viec",
        "collection_slug": "modern-industrial",
        "stock": 30,
        "weight": 28.0,
        "dimensions": {"length": 40, "width": 50, "height": 120, "unit": "cm"},
        "specs": {"material": "Thép sơn tĩnh điện, Ray bi, Khóa cam", "color": "Xám than", "color_hex": "#36454F"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
            "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800"
        ]
    },
    {
        "name": "Đèn Bàn LED Chống Cận",
        "slug": "den-ban-led-chong-can",
        "description": "Đèn bàn LED bảo vệ mắt với công nghệ chống cận. 5 chế độ sáng và 10 mức độ sáng. Có cổng sạc USB, hẹn giờ tắt tự động.",
        "short_description": "Đèn LED chống cận, 5 chế độ, có USB",
        "price": 1200000,
        "sale_price": 980000,
        "sku": "PLV-DEN-001",
        "category_slug": "phong-lam-viec",
        "collection_slug": "minimalist-2025",
        "stock": 80,
        "weight": 1.5,
        "dimensions": {"length": 20, "width": 20, "height": 45, "unit": "cm"},
        "specs": {"material": "Nhựa ABS, LED chip Hàn Quốc, Nhôm", "color": "Trắng", "color_hex": "#FFFFFF"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
            "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800"
        ]
    },

    # =========================================================================
    # NGOẠI THẤT (Outdoor) - 5 products
    # =========================================================================
    {
        "name": "Bộ Bàn Ghế Sân Vườn Mây Nhựa",
        "slug": "bo-ban-ghe-san-vuon-may-nhua",
        "description": "Bộ bàn ghế sân vườn gồm 1 bàn và 4 ghế, chất liệu mây nhựa PE cao cấp chống UV và chịu nước. Khung nhôm không gỉ, đệm ghế tháo giặt được.",
        "short_description": "Bộ bàn 4 ghế mây nhựa PE, chống UV",
        "price": 18500000,
        "sale_price": 14900000,
        "sku": "NT-BGS-001",
        "category_slug": "ngoai-that",
        "collection_slug": None,
        "stock": 15,
        "weight": 65.0,
        "dimensions": {"length": 150, "width": 90, "height": 75, "unit": "cm"},
        "specs": {"material": "Mây nhựa PE, Khung nhôm, Kính cường lực", "color": "Nâu tự nhiên", "color_hex": "#8B4513"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800"
        ]
    },
    {
        "name": "Xích Đu Treo Sân Vườn",
        "slug": "xich-du-treo-san-vuon",
        "description": "Xích đu treo sân vườn với ghế đan mây tự nhiên, khung thép sơn tĩnh điện. Đệm nước chống thấm, chịu tải đến 150kg. Lắp đặt dễ dàng.",
        "short_description": "Xích đu mây treo, khung thép, chịu 150kg",
        "price": 8900000,
        "sale_price": 7500000,
        "sku": "NT-XDU-001",
        "category_slug": "ngoai-that",
        "collection_slug": None,
        "stock": 20,
        "weight": 35.0,
        "dimensions": {"length": 120, "width": 80, "height": 200, "unit": "cm"},
        "specs": {"material": "Mây tự nhiên, Thép sơn tĩnh điện, Vải chống nước", "color": "Be tự nhiên", "color_hex": "#F5F5DC"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ]
    },
    {
        "name": "Ghế Tắm Nắng Gấp Gọn",
        "slug": "ghe-tam-nang-gap-gon",
        "description": "Ghế tắm nắng gấp gọn với 5 tư thế điều chỉnh. Chất liệu textilene thoáng khí, khung nhôm siêu nhẹ. Có bánh xe di chuyển dễ dàng.",
        "short_description": "Ghế tắm nắng gấp gọn, 5 tư thế",
        "price": 3900000,
        "sale_price": 3200000,
        "sku": "NT-GTN-001",
        "category_slug": "ngoai-that",
        "collection_slug": None,
        "stock": 35,
        "weight": 8.0,
        "dimensions": {"length": 190, "width": 65, "height": 35, "unit": "cm"},
        "specs": {"material": "Textilene, Khung nhôm, Bánh xe cao su", "color": "Xám đậm", "color_hex": "#4A4A4A"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
        ]
    },
    {
        "name": "Ô Che Nắng Lệch Tâm 3m",
        "slug": "o-che-nang-lech-tam-3m",
        "description": "Ô che nắng lệch tâm đường kính 3m với vải chống UV 98%. Hệ thống quay 360 độ, nghiêng đa hướng. Chân đế granite 25kg chắc chắn.",
        "short_description": "Ô lệch tâm 3m, quay 360°, chống UV",
        "price": 5500000,
        "sale_price": 4500000,
        "sku": "NT-OCN-001",
        "category_slug": "ngoai-that",
        "collection_slug": None,
        "stock": 25,
        "weight": 32.0,
        "dimensions": {"length": 300, "width": 300, "height": 250, "unit": "cm"},
        "specs": {"material": "Vải polyester chống UV, Cột nhôm, Chân granite", "color": "Be cát", "color_hex": "#C2B280"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
        ]
    },
    {
        "name": "Đèn Năng Lượng Mặt Trời Sân Vườn",
        "slug": "den-nang-luong-mat-troi-san-vuon",
        "description": "Bộ 4 đèn LED năng lượng mặt trời cắm sân vườn. Tự động sáng khi trời tối, chống nước IP65. Pin sạc 8-10 giờ sáng liên tục.",
        "short_description": "Bộ 4 đèn solar LED sân vườn",
        "price": 890000,
        "sale_price": 690000,
        "sku": "NT-DEN-001",
        "category_slug": "ngoai-that",
        "collection_slug": None,
        "stock": 100,
        "weight": 0.8,
        "dimensions": {"length": 12, "width": 12, "height": 40, "unit": "cm"},
        "specs": {"material": "Nhựa ABS chống UV, LED, Pin solar", "color": "Đen", "color_hex": "#000000"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
        ]
    },

    # =========================================================================
    # PHỤ KIỆN & DECOR - 6 products
    # =========================================================================
    {
        "name": "Đèn Chùm Pha Lê Hiện Đại",
        "slug": "den-chum-pha-le-hien-dai",
        "description": "Đèn chùm pha lê K9 cao cấp với thiết kế đương đại. 12 bóng LED tiết kiệm điện, điều khiển từ xa 3 chế độ sáng. Phù hợp phòng khách rộng.",
        "short_description": "Đèn chùm pha lê K9, 12 bóng LED",
        "price": 12500000,
        "sale_price": 9900000,
        "sku": "PK-DEN-001",
        "category_slug": "phu-kien-decor",
        "collection_slug": "luxury-premium",
        "stock": 10,
        "weight": 15.0,
        "dimensions": {"length": 80, "width": 80, "height": 60, "unit": "cm"},
        "specs": {"material": "Pha lê K9, Inox mạ vàng, LED", "color": "Trong suốt - Vàng", "color_hex": "#FFD700"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800",
            "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800"
        ]
    },
    {
        "name": "Thảm Lông Xù Phòng Khách",
        "slug": "tham-long-xu-phong-khach",
        "description": "Thảm lông xù cao cấp 4cm với sợi polyester siêu mềm. Đế chống trượt TPR, dễ vệ sinh bằng máy hút bụi. Kích thước 160x230cm.",
        "short_description": "Thảm lông xù 160x230cm, đế chống trượt",
        "price": 2900000,
        "sale_price": 2400000,
        "sku": "PK-THA-001",
        "category_slug": "phu-kien-decor",
        "collection_slug": "scandinavian-nordic",
        "stock": 40,
        "weight": 8.0,
        "dimensions": {"length": 230, "width": 160, "height": 4, "unit": "cm"},
        "specs": {"material": "Polyester, Đế TPR chống trượt", "color": "Xám nhạt", "color_hex": "#D3D3D3"},
        "is_featured": True,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
        ]
    },
    {
        "name": "Gương Trang Trí Mặt Trời",
        "slug": "guong-trang-tri-mat-troi",
        "description": "Gương trang trí hình mặt trời với khung kim loại mạ vàng đồng. Đường kính 80cm, gương HD chống méo. Điểm nhấn hoàn hảo cho phòng khách.",
        "short_description": "Gương mặt trời Ø80cm, khung mạ vàng",
        "price": 3500000,
        "sale_price": 2800000,
        "sku": "PK-GUO-001",
        "category_slug": "phu-kien-decor",
        "collection_slug": "luxury-premium",
        "stock": 25,
        "weight": 5.0,
        "dimensions": {"length": 80, "width": 80, "height": 5, "unit": "cm"},
        "specs": {"material": "Gương HD, Khung kim loại mạ vàng đồng", "color": "Vàng đồng", "color_hex": "#CD7F32"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
        ]
    },
    {
        "name": "Bộ Tranh Canvas Trừu Tượng",
        "slug": "bo-tranh-canvas-truu-tuong",
        "description": "Bộ 3 tranh canvas trừu tượng phong cách minimalist. In UV chất lượng cao, khung gỗ thông tự nhiên. Sẵn móc treo tường.",
        "short_description": "Bộ 3 tranh canvas 40x60cm",
        "price": 1800000,
        "sale_price": 1500000,
        "sku": "PK-TRA-001",
        "category_slug": "phu-kien-decor",
        "collection_slug": "minimalist-2025",
        "stock": 50,
        "weight": 3.0,
        "dimensions": {"length": 60, "width": 40, "height": 3, "unit": "cm"},
        "specs": {"material": "Canvas, Mực UV, Khung gỗ thông", "color": "Đa màu", "color_hex": "#808080"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ]
    },
    {
        "name": "Cây Cọ Nhân Tạo 1.5m",
        "slug": "cay-co-nhan-tao-1-5m",
        "description": "Cây cọ nhân tạo cao 1.5m với chậu xi măng giả đá. Lá PE chống UV bền màu, thân nhựa dẻo tự nhiên. Không cần tưới nước, luôn xanh tươi.",
        "short_description": "Cây cọ giả 1.5m, chậu xi măng",
        "price": 1200000,
        "sale_price": 980000,
        "sku": "PK-CAY-001",
        "category_slug": "phu-kien-decor",
        "collection_slug": "scandinavian-nordic",
        "stock": 60,
        "weight": 6.0,
        "dimensions": {"length": 30, "width": 30, "height": 150, "unit": "cm"},
        "specs": {"material": "Lá PE, Thân nhựa dẻo, Chậu xi măng", "color": "Xanh lá - Xám", "color_hex": "#228B22"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
        ]
    },
    {
        "name": "Nến Thơm Sáp Đậu Nành",
        "slug": "nen-thom-sap-dau-nanh",
        "description": "Nến thơm cao cấp từ sáp đậu nành 100% tự nhiên. Hương Lavender thư giãn, cháy 50 giờ. Hũ thủy tinh tái sử dụng, bấc cotton.",
        "short_description": "Nến sáp đậu nành, hương Lavender",
        "price": 350000,
        "sale_price": 290000,
        "sku": "PK-NEN-001",
        "category_slug": "phu-kien-decor",
        "collection_slug": None,
        "stock": 150,
        "weight": 0.4,
        "dimensions": {"length": 8, "width": 8, "height": 10, "unit": "cm"},
        "specs": {"material": "Sáp đậu nành, Bấc cotton, Hũ thủy tinh", "color": "Trắng ngà", "color_hex": "#FFFAF0"},
        "is_featured": False,
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ]
    },
]

# =============================================================================
# BANNERS - Homepage carousel banners
# =============================================================================
BANNERS = [
    {
        "title": "Khuyến Mãi Mùa Đông 2025",
        "subtitle": "Giảm đến 40% tất cả nội thất phòng khách",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920",
        "link_url": "/category/phong-khach",
        "is_active": True,
        "display_order": 1
    },
    {
        "title": "Bộ Sưu Tập Luxury Premium",
        "subtitle": "Nội thất cao cấp với chất liệu thượng hạng",
        "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920",
        "link_url": "/collection/luxury-premium",
        "is_active": True,
        "display_order": 2
    },
    {
        "title": "Phong Cách Scandinavian",
        "subtitle": "Đơn giản, thanh lịch và tiện nghi",
        "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1920",
        "link_url": "/collection/scandinavian-nordic",
        "is_active": True,
        "display_order": 3
    },
    {
        "title": "Nội Thất Sân Vườn",
        "subtitle": "Tận hưởng không gian ngoài trời",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920",
        "link_url": "/category/ngoai-that",
        "is_active": True,
        "display_order": 4
    },
]

def seed_admin_user() -> None:
    """Create default admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        
        if existing_admin:
            logger.info("Admin user already exists: admin@gmail.com")
            return
        
        # Create admin with specified credentials
        admin = User(
            email="admin@gmail.com",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin@123"),
            role=UserRole.ADMIN,
            vip_tier=VipTier.DIAMOND,
            is_active=True,
            is_verified=True,
            phone="0123456789"
        )
        db.add(admin)
        db.commit()
        logger.info("Successfully created admin user: admin@gmail.com")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create admin user: {str(e)}")
        raise
    finally:
        db.close()


def seed_categories() -> dict[str, int]:
    """Create categories with idempotency check"""
    db = SessionLocal()
    try:
        category_map = {}
        
        for cat_data in CATEGORIES:
            # Check if category already exists
            category = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            
            if category:
                logger.info(f"Category already exists: {cat_data['name']}")
                category_map[cat_data["slug"]] = category.id
            else:
                # Create new category
                category = Category(**cat_data)
                db.add(category)
                db.flush()
                category_map[cat_data["slug"]] = category.id
                logger.info(f"✓ Created category: {cat_data['name']}")
        
        db.commit()
        logger.info(f"Total categories: {len(category_map)}")
        return category_map
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed categories: {str(e)}")
        raise
    finally:
        db.close()


def seed_collections() -> dict[str, int]:
    """Create or update collections with sale_price"""
    db = SessionLocal()
    try:
        collection_map = {}
        
        for coll_data in COLLECTIONS:
            # Check if collection already exists
            collection = db.query(Collection).filter(Collection.slug == coll_data["slug"]).first()
            
            if collection:
                # Update existing collection with new data (especially sale_price)
                for key, value in coll_data.items():
                    setattr(collection, key, value)
                collection_map[coll_data["slug"]] = collection.id
                logger.info(f"✓ Updated collection: {coll_data['name']} (sale_price: {coll_data.get('sale_price')})")
            else:
                # Create new collection
                collection = Collection(**coll_data)
                db.add(collection)
                db.flush()
                collection_map[coll_data["slug"]] = collection.id
                logger.info(f"✓ Created collection: {coll_data['name']} (sale_price: {coll_data.get('sale_price')})")
        
        db.commit()
        logger.info(f"Total collections: {len(collection_map)}")
        return collection_map
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed collections: {str(e)}")
        raise
    finally:
        db.close()


def seed_products(category_map: dict[str, int], collection_map: dict[str, int]) -> None:
    """Create products with proper data structure"""
    db = SessionLocal()
    created_count = 0
    skipped_count = 0
    
    try:
        for prod_data in PRODUCTS:
            # Check if product already exists
            product = db.query(Product).filter(Product.slug == prod_data["slug"]).first()
            
            if product:
                logger.debug(f"Product already exists: {prod_data['name']}")
                skipped_count += 1
                continue
            
            # Create a copy to avoid modifying original dict
            prod_copy = prod_data.copy()
            
            # Get category_id from map
            category_slug = prod_copy.pop("category_slug")
            category_id = category_map.get(category_slug)
            
            if not category_id:
                logger.warning(f"Category not found for product: {prod_copy['name']} (slug: {category_slug})")
                continue
            
            # Get collection_id from map (optional)
            collection_slug = prod_copy.pop("collection_slug", None)
            collection_id = collection_map.get(collection_slug) if collection_slug else None
            
            # Extract images and set thumbnail
            images = prod_copy.pop("images", [])
            thumbnail_url = images[0] if images else None
            
            # Create product with all required fields
            product = Product(
                category_id=category_id,
                collection_id=collection_id,
                thumbnail_url=thumbnail_url,
                images=images,
                **prod_copy
            )
            db.add(product)
            created_count += 1
            logger.info(f"✓ Created product: {prod_copy['name']}")
        
        db.commit()
        logger.info(f"Products created: {created_count}, skipped: {skipped_count}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed products: {str(e)}")
        raise
    finally:
        db.close()


def seed_banners() -> None:
    """Create or update homepage banners"""
    db = SessionLocal()
    try:
        created_count = 0
        updated_count = 0
        
        for banner_data in BANNERS:
            # Check if banner with same display_order exists
            banner = db.query(Banner).filter(Banner.display_order == banner_data["display_order"]).first()
            
            if banner:
                # Update existing banner
                for key, value in banner_data.items():
                    setattr(banner, key, value)
                updated_count += 1
                logger.info(f"✓ Updated banner: {banner_data['title']}")
            else:
                # Create new banner
                banner = Banner(**banner_data)
                db.add(banner)
                created_count += 1
                logger.info(f"✓ Created banner: {banner_data['title']}")
        
        db.commit()
        logger.info(f"Banners created: {created_count}, updated: {updated_count}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed banners: {str(e)}")
        raise
    finally:
        db.close()


def main() -> None:
    """Main seeding function with error handling and logging"""
    logger.info("=" * 70)
    logger.info("🚀 Starting LuxeFurniture Database Seeding Process...")
    logger.info("=" * 70)
    
    try:
        # Seed admin user
        logger.info("\n📌 [1/5] Seeding admin user...")
        seed_admin_user()
        
        # Seed categories
        logger.info("\n📌 [2/5] Seeding categories (6 categories)...")
        category_map = seed_categories()
        
        # Seed collections
        logger.info("\n📌 [3/5] Seeding collections (4 collections)...")
        collection_map = seed_collections()
        
        # Seed products
        logger.info("\n📌 [4/5] Seeding products (34 products)...")
        seed_products(category_map, collection_map)
        
        # Seed banners
        logger.info("\n📌 [5/5] Seeding banners (4 banners)...")
        seed_banners()
        
        # Success summary
        logger.info("\n" + "=" * 70)
        logger.info("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        logger.info("=" * 70)
        logger.info("\n📊 Seeding Summary:")
        logger.info("   • Admin user: 1")
        logger.info("   • Categories: 6 (Phòng Khách, Phòng Ngủ, Phòng Ăn & Bếp, Phòng Làm Việc, Ngoại Thất, Phụ Kiện & Decor)")
        logger.info("   • Collections: 4 (Minimalist 2025, Scandinavian Nordic, Luxury Premium, Modern Industrial)")
        logger.info("   • Products: 34 (5-6 per category)")
        logger.info("   • Banners: 4 (Homepage carousel)")
        logger.info("\n🔐 Default Admin Credentials:")
        logger.info("   Email:    admin@gmail.com")
        logger.info("   Password: admin@123")
        logger.info("   Role:     ADMIN")
        logger.info("   VIP Tier: DIAMOND")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error("\n" + "=" * 70)
        logger.error(f"❌ DATABASE SEEDING FAILED!")
        logger.error(f"   Error: {str(e)}")
        logger.error("=" * 70)
        raise


if __name__ == "__main__":
    main()
