import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { StrictMode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import "./app.css";

// Không phụ thuộc +types/*
export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
          {children}
          <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </StrictMode>
  );
}

// Error boundary gọn gàng, không phụ thuộc +types/*
export function ErrorBoundary({ error }: { error: unknown }) {
  let title = "Đã có lỗi xảy ra";
  let details = "Một lỗi không mong muốn đã xảy ra.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error as any)) {
    const err = error as any;
    title = err.status === 404 ? "Không tìm thấy trang (404)" : `Lỗi ${err.status}`;
    details =
      err.status === 404
        ? "Trang bạn yêu cầu không tồn tại."
        : err.statusText || details;
  } else if (error instanceof Error) {
    // Chỉ hiện chi tiết trong DEV
    if (import.meta.env?.DEV) {
      title = "Lỗi ứng dụng";
      details = error.message || details;
      stack = error.stack;
    }
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-gray-700">{details}</p>
      {stack && (
        <pre className="mt-4 w-full overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-100">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
