import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[40vh] bg-cover bg-center" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600')"
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              Get In Touch
            </p>
            <h1 className="text-5xl md:text-7xl font-light">Contact Us</h1>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="mb-8">Visit Our Showroom</h2>
              <div className="divider-luxury mb-12"></div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-xl mb-3 flex items-center gap-3">
                    <svg className="w-6 h-6 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Address
                  </h4>
                  <p className="text-[rgb(var(--color-text-muted))] ml-9">
                    123 Luxury Avenue<br />
                    District 1, Ho Chi Minh City<br />
                    Vietnam
                  </p>
                </div>

                <div>
                  <h4 className="text-xl mb-3 flex items-center gap-3">
                    <svg className="w-6 h-6 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone
                  </h4>
                  <p className="text-[rgb(var(--color-text-muted))] ml-9">
                    +84 (28) 1234 5678<br />
                    +84 (28) 8765 4321
                  </p>
                </div>

                <div>
                  <h4 className="text-xl mb-3 flex items-center gap-3">
                    <svg className="w-6 h-6 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </h4>
                  <p className="text-[rgb(var(--color-text-muted))] ml-9">
                    info@luxefurniture.com<br />
                    sales@luxefurniture.com
                  </p>
                </div>

                <div>
                  <h4 className="text-xl mb-3 flex items-center gap-3">
                    <svg className="w-6 h-6 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Hours
                  </h4>
                  <p className="text-[rgb(var(--color-text-muted))] ml-9">
                    Monday - Friday: 9:00 AM - 7:00 PM<br />
                    Saturday - Sunday: 10:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 luxury-card">
              <h3 className="text-2xl mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 tracking-wider">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[rgb(var(--color-secondary))] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 tracking-wider">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[rgb(var(--color-secondary))] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 tracking-wider">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[rgb(var(--color-secondary))] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 tracking-wider">
                    MESSAGE *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[rgb(var(--color-secondary))] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
