import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { get, ENDPOINTS } from '../service/api';
import './Homepage.css';

const WHY_CHOOSE_ITEMS = [
  {
    title: 'Mầm non chất lượng cao',
    text: 'Kết hợp chương trình học trải nghiệm, vận động và phát triển cảm xúc để bé tự tin hội nhập.',
  },
  {
    title: 'Quy trình chăm sóc toàn diện',
    text: 'Từ dinh dưỡng, giấc ngủ đến theo dõi phát triển đều được cá nhân hóa theo từng độ tuổi.',
  },
  {
    title: 'Đội ngũ giáo viên tận tâm',
    text: 'Giáo viên và nhân sự được đào tạo bài bản, đồng hành cùng phụ huynh trong từng giai đoạn.',
  },
  {
    title: 'Cơ sở vật chất hiện đại',
    text: 'Cơ sở vật chất hiện đại, đầy đủ, an toàn và thân thiện cho trẻ.',
  },
];

const DEFAULT_TEACHER_AVATAR = 'https://via.placeholder.com/300x400.png?text=Avatar+3x4';

const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1400&q=80',
];

const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();

function Homepage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [timetablePrograms, setTimetablePrograms] = useState([]);
  const [effectiveSeason, setEffectiveSeason] = useState(null);
  const [teacherTeam, setTeacherTeam] = useState([]);
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
        setGalleryPhotos(normalized.slice(0, 6));
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
    const loadTimetablePrograms = async () => {
      try {
        const res = await get(ENDPOINTS.TIMETABLE_PUBLIC(), { includeAuth: false });
        const activities = Array.isArray(res?.data) ? res.data : [];
        const mapped = activities
          .filter((item) => (item?.content || '').trim())
          .slice(0, 6)
          .map((item, index) => ({
            id: item._id || `${item.startLabel || 'slot'}-${index}`,
            title: item.content,
            time: item.startLabel && item.endLabel ? `${item.startLabel} - ${item.endLabel}` : 'Theo thời gian biểu',
            season: item.appliesToSeason === 'summer'
              ? 'Mùa hè'
              : item.appliesToSeason === 'winter'
                ? 'Mùa đông'
                : 'Quanh năm',
          }));
        setTimetablePrograms(mapped);
        setEffectiveSeason(res?.effectiveSeason || null);
      } catch {
        setTimetablePrograms([]);
        setEffectiveSeason(null);
      }
    };
    loadTimetablePrograms();
  }, []);

  useEffect(() => {
    const loadOrganizationTeachers = async () => {
      try {
        const resp = await get(ENDPOINTS.PUBLIC_INFO.ORGANIZATION_STRUCTURE, { includeAuth: false });
        const data = resp?.data || {};
        const fromProfessionalGroup = Array.isArray(data?.professionalGroup?.members)
          ? data.professionalGroup.members
          : [];
        const fromDirectors = Array.isArray(data?.boardOfDirectors?.members)
          ? data.boardOfDirectors.members
          : [];

        const merged = [...fromDirectors, ...fromProfessionalGroup]
          .map((member, index) => {
            const item = typeof member === 'string' ? { fullName: member } : member;
            return {
              id: item.id || item._id || `${item.fullName || 'member'}-${index}`,
              name: item.fullName || 'Chưa cập nhật',
              role: item.position || 'Giáo viên',
              specialty: item.department || 'Đội ngũ giáo viên tận tâm, đồng hành cùng phụ huynh.',
              avatar: item.avatar || DEFAULT_TEACHER_AVATAR,
            };
          })
          .filter((item) => item.name !== 'Chưa cập nhật')
          .slice(0, 4);

        setTeacherTeam(merged);
      } catch {
        setTeacherTeam([]);
      }
    };
    loadOrganizationTeachers();
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
  const introPhotos = galleryPhotos.length > 0 ? galleryPhotos.slice(0, 3) : FALLBACK_BANNERS.slice(0, 3);

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
        <div className="home-v2-hero-overlay">
          <p className="home-v2-kicker">Trường mầm non chất lượng cao</p>
          <h1>Cùng con lớn lên hạnh phúc và tự tin</h1>
          <p>
            Chương trình học trải nghiệm kết hợp chăm sóc toàn diện, tạo nền tảng tốt cho hành trình phát triển
            của trẻ trong những năm đầu đời.
          </p>
          <div className="home-v2-cta-row">
            <Link to="/introduce-school" className="home-v2-btn-primary">Khám phá ngay</Link>
            <Link to="/contact" className="home-v2-btn-outline">Đăng ký tư vấn</Link>
          </div>
        </div>
      </section>

      <section className="home-v2-intro">
        <div>
          <p className="home-v2-kicker">Về Đức Xuân Kindergarten</p>
          <h2>Tiên phong giáo dục trải nghiệm cho trẻ mầm non</h2>
          <p>
            Chúng tôi tập trung xây dựng môi trường học tập an toàn, giàu yêu thương, nơi mỗi em bé được tôn
            trọng cá tính và phát triển theo năng lực riêng.
          </p>
          <Link to="/photo-gallery" className="home-v2-link-btn">Đọc thêm</Link>
        </div>
        <div className="home-v2-intro-images">
          {introPhotos.map((item, idx) => (
            <img
              key={item.id || idx}
              src={item.img || item}
              alt={item.title || `Hình ảnh hoạt động ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="home-v2-why">
        <h2>Vì sao chọn Đức Xuân Kindergarten?</h2>
        <div className="home-v2-why-grid">
          {WHY_CHOOSE_ITEMS.map((item) => (
            <article key={item.title} className="home-v2-why-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-v2-programs">
        <div className="home-v2-section-head">
          <h2>Thông tin chương trình học</h2>
          <Link to="/schedule">Xem tất cả</Link>
        </div>
        <div className="home-v2-program-grid">
          {timetablePrograms.map((program) => (
            <article key={program.id} className="home-v2-program-card">
              <h3>{program.title}</h3>
              <p>Khung giờ hoạt động: {program.time}</p>
              <span>
                Áp dụng: {program.season}
                {effectiveSeason ? ` • Hiện tại: ${effectiveSeason === 'summer' ? 'Mùa hè' : 'Mùa đông'}` : ''}
              </span>
            </article>
          ))}
          {timetablePrograms.length === 0 && (
            <article className="home-v2-program-card">
              <h3>Chưa có dữ liệu thời gian biểu</h3>
              <p>Nhà trường sẽ cập nhật chương trình học ngay khi thời khóa biểu được thiết lập.</p>
              <span>Vui lòng quay lại sau</span>
            </article>
          )}
        </div>
      </section>

      <section className="home-v2-campus">
        <h2>Đội ngũ giáo viên</h2>
        <div className="home-v2-campus-grid">
          {teacherTeam.map((teacher, index) => (
            <article key={teacher.id || `${teacher.name}-${index}`} className="home-v2-campus-card">
              <div className="home-v2-teacher-avatar-wrap">
                <img
                  src={teacher.avatar || DEFAULT_TEACHER_AVATAR}
                  alt={teacher.name}
                  className="home-v2-teacher-avatar"
                />
              </div>
              <h3>{teacher.name}</h3>
              <p><strong>Vai trò:</strong> {teacher.role}</p>
              <p><strong>Chuyên môn:</strong> {teacher.specialty}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-v2-consult">
        <div className="home-v2-consult-content">
          <h2>Ba mẹ cần tư vấn thêm?</h2>
          <p>Để lại thông tin để nhà trường hỗ trợ nhanh, nhận thông tin về chương trình học.</p>
        </div>
        <form className="home-v2-consult-form">
          <input type="text" disabled placeholder="Họ và tên cha/mẹ*" />
          <input type="tel" disabled placeholder="Số điện thoại*" />
          <input type="email" disabled placeholder="Email" />
          <Link to="/contact" className="home-v2-btn-outline">Đăng ký tư vấn</Link>
        </form>
      </section>

      <section className="home-v2-news">
        <div className="home-v2-section-head">
          <h2>Tin tức - Sự kiện</h2>
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

    </div>
  );
}

export default Homepage;
