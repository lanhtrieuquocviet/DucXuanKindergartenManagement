import Footer from '../components/Footer';
import Header from '../components/Header';
import LeftNav from '../components/LeftNav';
import RightNav from '../components/RightNav';
import { useLocation } from 'react-router-dom';

const ROUTES_WITHOUT_LEFT_NAV = ['/public-information', '/public-info'];

const MainLayout = ({ children }) => {
    const { pathname } = useLocation();
    const showLeftNav = !ROUTES_WITHOUT_LEFT_NAV.some((r) => pathname === r || pathname.startsWith(r + '/'));

    return (
        <div className="page">
            <Header />

            <div className="layout">
                {showLeftNav && <LeftNav />}
                <main className="content">
                    {children}
                </main>
                <RightNav />
            </div>

            <Footer />
        </div>
    );
};

export default MainLayout;
