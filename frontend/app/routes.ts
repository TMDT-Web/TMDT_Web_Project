// app/routes.ts
import { type RouteConfig, layout, route, index, prefix } from "@react-router/dev/routes";

const userRoutes = [
    layout('./components/MainLayout.tsx', [
      index('./routes/index.tsx'),
      route("/products", "./routes/products.tsx"),
      route("/products/:id", "./routes/products.$id.tsx"),
      route("/collections", "./routes/collections.tsx"),
      route("/about", "./routes/about.tsx"),
      route("/contact", "./routes/contact.tsx"),
      route("/cart", "./pages/cart.tsx"),
      route("/checkout", "./pages/checkout.tsx"),
      route("/account", "./pages/account.tsx"),
    ]),
    ...prefix('auth',[
      route('/login', './pages/login.tsx'),
      route('/register', './pages/register.tsx'),
      route('/callback', './pages/GoogleCallback.tsx'),
    ]),
    route('*', './pages/NotFound.tsx')
];

const adminRoutes = [
    ...prefix('admin',[
      route("/login", "./admin/pages/AdminLogin.tsx"),
      layout("./admin/components/AdminLayout.tsx", [
        index("./admin/pages/AdminIndex.tsx"),
        route("/dashboard", "./admin/pages/Dashboard.tsx"),
        route("/users", "./admin/pages/User.tsx"),
        route("/products", "./admin/pages/Product.tsx"),
        route("/categories", "./admin/pages/Category.tsx"),
        route("/orders", "./admin/pages/Order.tsx"),
        route("/roles", "./admin/pages/Role.tsx"),
        route("/suppliers", "./admin/pages/Supplier.tsx"),
        route("/warranty", "./admin/pages/Warranty.tsx"),
        route("/import", "./admin/pages/Import.tsx"),
        route("/statistical", "./admin/pages/Statistical.tsx"),
      ])
    ])
];

export default [...userRoutes, ...adminRoutes] satisfies RouteConfig;