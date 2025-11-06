import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[rgb(var(--color-bg-light))]">
            <Navbar />
            <main className="pt-20">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
