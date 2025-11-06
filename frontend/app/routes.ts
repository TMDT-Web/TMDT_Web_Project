import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

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
];export default [...userRoutes] satisfies RouteConfig;
