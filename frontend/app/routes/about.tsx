export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[50vh] bg-cover bg-center" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1600')"
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              Our Story
            </p>
            <h1 className="text-5xl md:text-7xl font-light">About Luxe</h1>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="mb-6">Crafting Excellence Since 1995</h2>
              <div className="divider-luxury max-w-xs mx-auto"></div>
            </div>

            <div className="prose prose-lg max-w-none text-[rgb(var(--color-text-muted))] leading-relaxed">
              <p className="text-xl mb-8">
                For over 25 years, Luxe Furniture has been at the forefront of luxury interior design, 
                creating timeless pieces that transform houses into homes.
              </p>
              
              <p className="mb-6">
                Our journey began with a simple belief: that furniture should be more than functional. 
                It should tell a story, evoke emotion, and stand the test of time. Every piece in our 
                collection is carefully selected or custom-designed to embody these principles.
              </p>

              <p className="mb-6">
                We work with master craftsmen and renowned designers from around the world, ensuring 
                that each item meets our exacting standards for quality, comfort, and aesthetic appeal. 
                From sustainable sourcing to traditional techniques, we honor the art of furniture making 
                while embracing innovation.
              </p>

              <p>
                Today, Luxe Furniture continues to set the standard for luxury living, serving discerning 
                clients who appreciate the finer things in life and understand that true luxury is timeless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="mb-6">Our Values</h2>
            <div className="divider-luxury max-w-xs mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2 border-[rgb(var(--color-secondary))]">
                <span className="text-5xl">⚡</span>
              </div>
              <h3 className="text-2xl mb-4">Quality First</h3>
              <p className="text-[rgb(var(--color-text-muted))] leading-relaxed">
                We never compromise on quality. Every piece undergoes rigorous inspection 
                and meets the highest standards of craftsmanship.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2 border-[rgb(var(--color-secondary))]">
                <span className="text-5xl">🌱</span>
              </div>
              <h3 className="text-2xl mb-4">Sustainability</h3>
              <p className="text-[rgb(var(--color-text-muted))] leading-relaxed">
                We are committed to sustainable practices, from responsibly sourced materials 
                to eco-friendly production methods.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2 border-[rgb(var(--color-secondary))]">
                <span className="text-5xl">✨</span>
              </div>
              <h3 className="text-2xl mb-4">Timeless Design</h3>
              <p className="text-[rgb(var(--color-text-muted))] leading-relaxed">
                Our designs transcend trends, offering pieces that remain beautiful and 
                relevant for generations to come.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="section-padding bg-[rgb(var(--color-primary))] text-white">
        <div className="container-custom text-center">
          <h2 className="mb-6">Visit Our Showroom</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Experience our collections in person. Our design consultants are ready to help 
            you create your perfect space.
          </p>
          <a href="/contact" className="btn-secondary !text-white !border-white hover:!bg-white hover:!text-[rgb(var(--color-primary))]">
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
