/**
 * About Page - Giới thiệu
 * Minimal Scandinavian Design
 */
export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-narrow text-center">
          <h1 className="heading-minimal mb-6">Về Chúng Tôi</h1>
          <p className="text-minimal text-lg leading-relaxed">
            LuxeFurniture - Nơi nghệ thuật nội thất gặp gỡ cuộc sống hiện đại
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="aspect-square bg-[rgb(var(--color-bg-offwhite))]">
              <div className="w-full h-full flex items-center justify-center text-6xl text-[rgb(var(--color-wood))]">
                ✦
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold">Câu Chuyện Của Chúng Tôi</h2>
              <div className="space-y-4 text-minimal">
                <p>
                  Được thành lập vào năm 2020, LuxeFurniture ra đời từ niềm đam mê tạo nên những không gian sống 
                  tinh tế, tối giản nhưng đầy cảm hứng theo phong cách Scandinavian.
                </p>
                <p>
                  Chúng tôi tin rằng nội thất không chỉ là đồ vật, mà là cách bạn thể hiện cá tính, 
                  là nơi bạn tạo nên những kỷ niệm đáng nhớ cùng gia đình và bạn bè.
                </p>
                <p>
                  Mỗi sản phẩm của LuxeFurniture được tuyển chọn kỹ lưỡng, từ chất liệu tự nhiên cao cấp 
                  đến thiết kế tinh tế, mang đến sự hài hòa hoàn hảo giữa thẩm mỹ và công năng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-custom">
          <h2 className="text-3xl font-semibold text-center mb-16">Giá Trị Cốt Lõi</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="text-5xl text-[rgb(var(--color-wood))]">◈</div>
              <h3 className="text-xl font-semibold">Chất Lượng</h3>
              <p className="text-minimal">
                Chất liệu cao cấp, bền vững, thân thiện với môi trường
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="text-5xl text-[rgb(var(--color-moss))]">◈</div>
              <h3 className="text-xl font-semibold">Thiết Kế</h3>
              <p className="text-minimal">
                Phong cách tối giản, tinh tế, hòa quyện văn hóa Bắc Âu
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="text-5xl text-[rgb(var(--color-deep-green))]">◈</div>
              <h3 className="text-xl font-semibold">Trải Nghiệm</h3>
              <p className="text-minimal">
                Dịch vụ tận tâm, tư vấn chuyên nghiệp, hậu mãi chu đáo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section id="policy" className="section-padding">
        <div className="container-narrow">
          <h2 className="text-3xl font-semibold mb-12">Chính Sách</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Chính sách bảo hành</h3>
              <p className="text-minimal">
                Tất cả sản phẩm được bảo hành 12-24 tháng tùy loại. Bảo hành miễn phí lỗi do nhà sản xuất.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Chính sách đổi trả</h3>
              <p className="text-minimal">
                Đổi trả trong vòng 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả. Chi phí vận chuyển do shop chịu.
              </p>
            </div>
            <div id="shipping">
              <h3 className="text-xl font-semibold mb-3">Chính sách vận chuyển</h3>
              <p className="text-minimal">
                Miễn phí vận chuyển đơn hàng từ 10 triệu đồng trong nội thành TP.HCM. 
                Giao hàng toàn quốc trong 3-7 ngày làm việc.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
