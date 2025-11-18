// app/routes.ts
import { type RouteConfig, layout, route, index } from "@react-router/dev/routes";
import AdminLayout from "./admin/components/AdminLayout";

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
    route('/auth/login', './pages/login.tsx'),
    route('/auth/register', './pages/register.tsx'),
    route('/auth/callback', './pages/GoogleCallback.tsx'),
    route('*', './pages/NotFound.tsx')
];

const adminRoutes = [
    // ===== ADMIN =====
  route("/admin/login", "./admin/pages/AdminLogin.tsx"),
  layout("./admin/components/AdminLayout.tsx", [
    // KHÔNG dùng Dashboard.tsx 2 lần. /admin dùng alias AdminIndex.tsx
    route("/admin", "./admin/pages/AdminIndex.tsx"),
    route("/admin/dashboard", "./admin/pages/Dashboard.tsx"),
    route("/admin/users", "./admin/pages/User.tsx"),
    route("/admin/products", "./admin/pages/Product.tsx"),
    route("/admin/categories", "./admin/pages/Category.tsx"),
    route("/admin/orders", "./admin/pages/Order.tsx"),
    route("/admin/roles", "./admin/pages/Role.tsx"),
    route("/admin/suppliers", "./admin/pages/Supplier.tsx"),
    route("/admin/warranty", "./admin/pages/Warranty.tsx"),
    route("/admin/import", "./admin/pages/Import.tsx"),
    route("/admin/statistical", "./admin/pages/Statistical.tsx"),
  ]),
];

export default [...userRoutes, ...adminRoutes] satisfies RouteConfig;
