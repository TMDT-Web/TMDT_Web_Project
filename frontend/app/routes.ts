import { type RouteConfig, index, layout, prefix, route } from '@react-router/dev/routes';

const userRoutes = [
    layout('./components/layout.tsx', [
        index('./routes/home.tsx')
    ]),
    route('/auth/login', './pages/login.tsx')
];

// const adminRoutes = [
//     layout('admin/components/AdminLayout.tsx', [
//         // route('/admin', ''),
//         route('/admin/dashboard', './admin/components/DashBoard.tsx'),
//         route('/admin/user', './admin/pages/User.tsx'),
//         route('/admin/product', './admin/pages/Product.tsx'),
//         route('/admin/category', './admin/pages/Category.tsx'),
//         route('/admin/role', './admin/pages/Role.tsx'),
//         route('/admin/supplier', './admin/pages/Supplier.tsx'),
//         route('/admin/warranty', './admin/pages/Warranty.tsx'),
//         route('/admin/order', './admin/pages/Order.tsx'),
//         route('/admin/import', './admin/pages/Import.tsx'),
//         route(
//             '/admin/statistical/revenueandcoststatistics',
//             './admin/pages/RevenueAndCostStatistics.tsx'
//         ),
//         route('/admin/statistical/inventorystatistics', './admin/pages/InventoryStatistics.tsx'),
//     ]),
// ];

export default [...userRoutes] satisfies RouteConfig;
