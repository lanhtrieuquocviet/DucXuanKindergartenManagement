import Header from "../components/Header";
import Footer from "../components/Footer";

const SimpleLayout = ({ children }) => {
  return (
    <div className="page">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default SimpleLayout;
