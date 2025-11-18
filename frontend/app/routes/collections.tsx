import { Link } from "react-router";

export default function Collections() {
  const collections = [
    {
      name: "Modern Minimalist",
      description: "Clean lines and contemporary aesthetics",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      items: 45
    },
    {
      name: "Classic Heritage",
      description: "Timeless pieces with traditional craftsmanship",
      image: "https://images.unsplash.com/photo-1565191999001-551c187427bb?w=800",
      items: 38
    },
    {
      name: "Scandinavian Comfort",
      description: "Nordic design meets functionality",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      items: 52
    },
    {
      name: "Industrial Chic",
      description: "Urban edge with raw materials",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
      items: 31
    },
    {
      name: "Coastal Living",
      description: "Breezy, light, and relaxed atmosphere",
      image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800",
      items: 29
    },
    {
      name: "Art Deco Luxury",
      description: "Opulent glamour from the golden age",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      items: 24
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[50vh] bg-cover bg-center" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1615873968403-89e068629265?w=1600')"
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center container-custom">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              Curated for You
            </p>
            <h1 className="text-5xl md:text-7xl font-light mb-6">Our Collections</h1>
            <p className="text-xl max-w-2xl mx-auto text-gray-200">
              Explore our carefully curated collections, each telling a unique story of design excellence
            </p>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <Link
                key={index}
                to={`/collections/${collection.name.toLowerCase().replace(/ /g, '-')}`}
                className="group luxury-card overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl mb-3 group-hover:text-[rgb(var(--color-secondary))] transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-[rgb(var(--color-text-muted))] mb-4">
                    {collection.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[rgb(var(--color-text-muted))]">
                      {collection.items} Items
                    </span>
                    <span className="text-sm tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                      EXPLORE
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
