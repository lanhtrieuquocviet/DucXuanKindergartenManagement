import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { get, ENDPOINTS } from '../service/api';
import './Homepage.css';

const HIGHLIGHTS = [
  { title: 'Học toán tư duy', text: 'Giúp bé làm quen con số qua trò chơi tương tác trực quan.' },
  { title: 'Tư duy logic', text: 'Xây dựng nền tảng phân tích, quan sát và giải quyết vấn đề từ sớm.' },
  { title: 'Nhiều chuyến đi', text: 'Dã ngoại và hoạt động ngoài trời giúp bé tự tin, năng động hơn.' },
  { title: 'Đào tạo âm nhạc', text: 'Phát triển cảm thụ nghệ thuật và khả năng biểu đạt cảm xúc cho bé.' },
];

const WHY_CHOOSE_ITEMS = [
  {
    title: 'Rèn luyện thói quen tốt',
    text: 'Bé được xây dựng nền nếp sinh hoạt khoa học, tự lập và lễ phép ngay từ nhỏ.',
  },
  {
    title: 'Khơi mở tài năng nhí',
    text: 'Các hoạt động năng khiếu đa dạng giúp bé khám phá thế mạnh cá nhân.',
  },
  {
    title: 'Phương pháp hiện đại',
    text: 'Mô hình học tập kết hợp vui chơi, trải nghiệm và phát triển cảm xúc xã hội.',
  },
];

const COURSES = [
  { title: 'Lớp năng khiếu vẽ', price: '600.000đ', detail: 'Khơi gợi trí tưởng tượng và tư duy màu sắc.' },
  { title: 'Lớp năng khiếu múa', price: '700.000đ', detail: 'Phát triển nhịp điệu, sự dẻo dai và tự tin trình diễn.' },
  { title: 'Lớp năng khiếu thanh nhạc', price: '500.000đ', detail: 'Giúp bé cảm nhạc, phát âm rõ và biểu diễn tự nhiên.' },
];

const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1400&q=80',
];

const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();

function Homepage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await get('/blogs/categories');
        const cats = resp.data || resp;
        const posts = [];

        for (const c of cats) {
          try {
            const r2 = await get(`/blogs/published?category=${c._id}&limit=1`);
            const items = r2.data?.items || [];
            if (items.length > 0) {
              const b = items[0];
              posts.push({
                id: b._id,
                title: b.title || b.code || 'Bài viết mới',
                content: stripHtml(b.description),
                image: b.images?.[0] || null,
                category: c.name,
                createdAt: b.createdAt || null,
              });
            }
          } catch {
            // ignore
          }
        }
        setFeatured(posts);
      } catch (err) {
        setError(err.message || 'Không tải được tin nổi bật');
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const resp = await get(ENDPOINTS.IMAGE_LIBRARY.LIST, { includeAuth: false });
        const list = resp?.data || [];
        const normalized = list
          .filter((item) => (item?.imageUrls?.length || 0) > 0 || item?.imageUrl)
          .map((item) => ({
            title: item.title || 'Ảnh thư viện',
            img: item.imageUrls?.[0] || item.imageUrl,
            id: item._id || item.imageUrl,
          }));
        setGalleryPhotos(normalized.slice(0, 4));
      } catch {
        setGalleryPhotos([]);
      }
    };
    loadGallery();
  }, []);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const resp = await get(ENDPOINTS.BANNERS.HOMEPAGE, { includeAuth: false });
        const list = resp?.data?.banners || [];
        const urls = list.map((item) => item?.imageUrl).filter(Boolean);
        setBanners(urls.length > 0 ? urls : FALLBACK_BANNERS);
      } catch {
        setBanners(FALLBACK_BANNERS);
      }
    };
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const id = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  useEffect(() => {
    if (currentBanner >= banners.length) {
      setCurrentBanner(0);
    }
  }, [banners.length, currentBanner]);


  const mainBlog = featured[0];
  const sideBlogs = featured.slice(1, 4);
  const newsList = featured.slice(0, 3);

  return (
    <div className="home-v2">
      <section className="home-v2-hero">
        <div className="home-v2-hero-media">
          {banners.length > 0 ? (
            <img src={banners[currentBanner]} alt="Trường mầm non Đức Xuân" className="home-v2-hero-image" />
          ) : (
            <div className="home-v2-hero-image home-v2-hero-fallback">Chưa có banner hiển thị</div>
          )}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                className="home-v2-slider-btn home-v2-slider-prev"
                onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                aria-label="Banner trước"
              >
                ‹
              </button>
              <button
                type="button"
                className="home-v2-slider-btn home-v2-slider-next"
                onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                aria-label="Banner tiếp theo"
              >
                ›
              </button>
            </>
          )}
        </div>
        <div className="home-v2-hero-content">
          <p className="home-v2-kicker">Ngôi trường tốt nhất</p>
          <h1>dành cho con bạn</h1>
          <ul>
            <li>Cơ sở vật chất và chất lượng</li>
            <li>Giáo viên được đào tạo bài bản</li>
            <li>Môi trường vừa học vừa chơi</li>
          </ul>
          <div className="home-v2-cta-row">
            <Link to="/introduce-school" className="home-v2-btn-primary">Khám phá ngay</Link>
            <Link to="/contact" className="home-v2-btn-outline">Đăng ký tư vấn</Link>
          </div>
        </div>
      </section>

      <section className="home-v2-highlight-grid">
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className="home-v2-highlight-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="home-v2-intro">
        <div>
          <p className="home-v2-kicker">Phát triển tư duy với</p>
          <h2>Bộ não sáng tạo</h2>
          <p>
            Lấy trẻ làm trung tâm với lộ trình rõ ràng, tích hợp các ưu điểm của chương trình học
            hiện đại để bé phát triển toàn diện về thể chất, cảm xúc và tư duy.
          </p>
          <Link to="/introduce-school" className="home-v2-link-btn">Đọc thêm</Link>
        </div>
        <div className="home-v2-intro-images">
          {(galleryPhotos.length > 0 ? galleryPhotos.slice(0, 2) : FALLBACK_BANNERS.slice(0, 2)).map((item, idx) => (
            <img
              key={item.id || idx}
              src={item.img || item}
              alt={item.title || `Hình ảnh hoạt động ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="home-v2-why">
        <h2>Vì sao chọn Đức Xuân Kids?</h2>
        <div className="home-v2-why-grid">
          {WHY_CHOOSE_ITEMS.map((item) => (
            <article key={item.title} className="home-v2-why-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-v2-news">
        <div className="home-v2-section-head">
          <h2>Tin tức mới nhất</h2>
          <Link to="/school-news">Xem thêm</Link>
        </div>
        {loading && <p className="home-v2-state">Đang tải dữ liệu tin tức...</p>}
        {error && <p className="home-v2-state home-v2-error">{error}</p>}
        {!loading && !error && featured.length === 0 && <p className="home-v2-state">Chưa có bài viết.</p>}
        {!loading && !error && featured.length > 0 && (
          <div className="home-v2-news-layout">
            {mainBlog && (
              <article className="home-v2-main-news" onClick={() => navigate(`/news/${mainBlog.id}`)}>
                {mainBlog.image ? <img src={mainBlog.image} alt={mainBlog.title} /> : <div className="home-v2-no-image">Không có ảnh</div>}
                <div>
                  <span>{mainBlog.category}</span>
                  <h3>{mainBlog.title}</h3>
                  <p>{mainBlog.content || 'Nội dung đang được cập nhật.'}</p>
                </div>
              </article>
            )}
            <div className="home-v2-side-news">
              {sideBlogs.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(`/news/${item.id}`)}>
                  <h4>{item.title}</h4>
                  <p>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : item.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="home-v2-courses">
        <h2>Các khóa học nổi bật</h2>
        <div className="home-v2-course-grid">
          {COURSES.map((course) => (
            <article key={course.title} className="home-v2-course-card">
              <h3>{course.title}</h3>
              <p>{course.detail}</p>
              <strong>{course.price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="home-v2-testimonials">
        <h2>Cảm nhận từ phụ huynh</h2>
        <div className="home-v2-testimonial-grid">
          {newsList.map((item) => (
            <article key={item.id}>
              <p>"{(item.content || 'Môi trường học tập sáng tạo, an toàn và thân thiện cho trẻ.').slice(0, 150)}..."</p>
              <h4>{item.title}</h4>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Homepage;
