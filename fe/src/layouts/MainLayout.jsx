import Footer from '../components/Footer';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
    return (
        <div className="page">
            <Header />

            <main className="content">
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default MainLayout;
