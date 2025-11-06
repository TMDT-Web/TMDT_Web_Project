# LUXE FURNITURE - Premium Frontend Design

## Tổng Quan Thiết Kế

Frontend đã được thiết kế lại hoàn toàn với phong cách **sang trọng, tinh tế** phù hợp cho cửa hàng bán nội thất cao cấp.

## 🎨 Design System

### Color Palette
- **Primary (Rich Black)**: `rgb(26, 26, 26)` - Màu đen sang trọng
- **Secondary (Warm Gold/Bronze)**: `rgb(139, 115, 85)` - Vàng đồng ấm áp
- **Accent (Elegant Gold)**: `rgb(212, 175, 55)` - Vàng nhấn nhá
- **Background**: `rgb(250, 248, 246)` - Trắng ấm
- **Text Dark**: `rgb(26, 26, 26)`
- **Text Muted**: `rgb(115, 115, 115)`

### Typography
- **Headings**: Playfair Display (serif) - font chữ cổ điển, sang trọng
- **Body**: Montserrat (sans-serif) - font chữ hiện đại, dễ đọc
- **Letter Spacing**: Rộng hơn để tạo cảm giác cao cấp

### Components Chính

#### 1. Navbar
- Fixed position với backdrop blur
- Logo tinh tế
- Navigation links với hover effect mượt mà
- Icons cho Search, Account, Cart
- Responsive mobile menu

#### 2. Footer
- 4 cột: Brand, Quick Links, Customer Service, Newsletter
- Social media integration
- Newsletter subscription form

#### 3. Hero Section
- Full-screen slideshow với 3 slides
- Overlay tối để text nổi bật
- Smooth transitions
- Call-to-action buttons

#### 4. Product Cards
- Luxury card design với shadow effects
- Hover scale animation cho images
- Category badge
- Price display sang trọng

### 📄 Pages

#### Home (`/`)
- Hero slideshow
- Categories section (4 categories)
- Featured products (4 items)
- Parallax banner
- Why choose us section
- Newsletter section

#### Products (`/products`)
- Hero header
- Sidebar filters (Categories, Price Range)
- Product grid (3 columns)
- Pagination

#### Collections (`/collections`)
- Hero section
- Collection grid with 6 curated collections
- Hover effects với discover CTA

#### About (`/about`)
- Company story
- Values section (3 values)
- Showroom CTA

#### Contact (`/contact`)
- Contact information (Address, Phone, Email, Hours)
- Contact form
- Luxury card design

## 🚀 Chạy Project

```bash
cd frontend
npm install
npm run dev
```

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Tất cả components đều responsive với breakpoints:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

## 🎯 Features

### Animations
- Smooth page transitions
- Hover effects trên images và buttons
- Fade in/out cho slideshow
- Scale transforms

### Typography Scale
- H1: 5xl-7xl (tùy màn hình)
- H2: 4xl-5xl
- H3: 3xl-4xl
- H4: 2xl-3xl
- Body: base (16px)
- Small: sm (14px)

### Buttons
- **Primary**: Dark background, white text
- **Secondary**: Outlined, hover fill
- Uppercase text với letter-spacing
- Smooth hover transitions

### Spacing
- **Section Padding**: py-20 md:py-32
- **Container**: max-w-7xl với responsive padding
- Consistent gap trong grids: 8 (32px)

## 🔄 Integration với Backend

Frontend sử dụng các API endpoints từ backend:
- `GET /api/v1/products` - Lấy danh sách sản phẩm
- `GET /api/v1/products/{id}` - Chi tiết sản phẩm
- `GET /api/v1/categories` - Danh mục
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký

## 📝 TODO

- [ ] Product detail page design
- [ ] Shopping cart page
- [ ] Checkout flow
- [ ] User account pages
- [ ] Admin dashboard
- [ ] Image optimization
- [ ] Loading states
- [ ] Error handling UI
- [ ] Toast notifications styling
- [ ] Form validation UI

## 🎨 Design Principles

1. **Minimalism**: Ít nhưng chất lượng
2. **White Space**: Sử dụng khoảng trống hợp lý
3. **Typography**: Font chữ rõ ràng, hierarchy rõ ràng
4. **Color**: Palette hạn chế nhưng tinh tế
5. **Imagery**: High-quality, professional photos
6. **Animations**: Subtle, purposeful
7. **Consistency**: Tất cả components follow design system

## 🌟 Key Differentiators

- Luxury aesthetic với Playfair Display font
- Warm color palette (không phải cold/blue)
- Large hero images
- Ample white space
- Subtle animations
- Professional photography placeholders
- Clean, organized layouts
- Elegant hover states
