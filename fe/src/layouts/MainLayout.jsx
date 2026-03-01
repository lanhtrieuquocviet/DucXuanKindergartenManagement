import Footer from '../components/Footer';
import Header from '../components/Header';
import LeftNav from '../components/LeftNav';
import RightNav from '../components/RightNav';

const MainLayout = ({ children }) => {
    return (
        <div className="page">
            <Header />

            <div className="layout">
                <LeftNav />
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
