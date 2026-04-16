import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { get, ENDPOINTS } from '../service/api';

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

const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();

function Homepage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [timetablePrograms, setTimetablePrograms] = useState([]);
  const [effectiveSeason, setEffectiveSeason] = useState(null);
  const [teacherTeam, setTeacherTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banners, setBanners] = useState([]);
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
        setBanners(urls);
      } catch {
        setBanners([]);
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
  const introPhotos = galleryPhotos.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <section className="relative mt-5 min-h-[440px] overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          {banners.length > 0 ? (
            <img
              src={banners[currentBanner]}
              alt="Trường mầm non Đức Xuân"
              className="h-full w-full object-cover transition-all duration-500"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-slate-200 text-slate-600">Chưa có banner hiển thị</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
          {banners.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full bg-white/35 text-xl text-white transition hover:bg-white/55"
                onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                aria-label="Banner trước"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full bg-white/35 text-xl text-white transition hover:bg-white/55"
                onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                aria-label="Banner tiếp theo"
              >
                ›
              </button>
            </>
          )}
        </div>
        <div className="relative z-10 max-w-2xl px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Trường mầm non chất lượng cao</p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">Cùng con lớn lên hạnh phúc và tự tin</h1>
          <p className="mt-4 text-sm leading-7 text-white/95 sm:text-base">
            Chương trình học trải nghiệm kết hợp chăm sóc toàn diện, tạo nền tảng tốt cho hành trình phát triển
            của trẻ trong những năm đầu đời.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/introduce-school" className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600">Khám phá ngay</Link>
            <Link to="/contact" className="rounded-full border border-white/80 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Đăng ký tư vấn</Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 rounded-3xl border border-amber-100 bg-amber-50/40 p-6 md:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-500">Về Đức Xuân Kindergarten</p>
          <h2 className="text-2xl font-bold leading-snug text-emerald-900 sm:text-3xl">Tiên phong giáo dục trải nghiệm cho trẻ mầm non</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Chúng tôi tập trung xây dựng môi trường học tập an toàn, giàu yêu thương, nơi mỗi em bé được tôn
            trọng cá tính và phát triển theo năng lực riêng.
          </p>
          <Link to="/photo-gallery" className="mt-5 inline-flex rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800">Đọc thêm</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {introPhotos.length > 0 ? (
            introPhotos.map((item, idx) => (
              <img
                key={item.id || idx}
                src={item.img}
                alt={item.title || `Hình ảnh hoạt động ${idx + 1}`}
                className="h-40 w-full rounded-xl object-cover sm:h-48"
              />
            ))
          ) : (
            <div className="grid h-40 place-items-center rounded-xl bg-slate-100 text-slate-500 sm:col-span-3">Chưa có ảnh thư viện</div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold text-emerald-900 sm:text-3xl">Vì sao chọn Đức Xuân Kindergarten?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE_ITEMS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="mb-2 font-bold text-emerald-900">{item.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-emerald-900 sm:text-3xl">Thông tin chương trình học</h2>
          <Link to="/schedule" className="text-sm font-bold text-emerald-700 hover:underline">Xem tất cả</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {timetablePrograms.map((program) => (
            <article key={program.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <h3 className="mb-2 font-bold text-emerald-900">{program.title}</h3>
              <p className="text-sm text-slate-600">Khung giờ hoạt động: {program.time}</p>
              <span className="mt-2 inline-block text-xs font-bold text-amber-600">
                Áp dụng: {program.season}
                {effectiveSeason ? ` • Hiện tại: ${effectiveSeason === 'summer' ? 'Mùa hè' : 'Mùa đông'}` : ''}
              </span>
            </article>
          ))}
          {timetablePrograms.length === 0 && (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">
              <h3 className="mb-2 font-bold text-emerald-900">Chưa có dữ liệu thời gian biểu</h3>
              <p>Nhà trường sẽ cập nhật chương trình học ngay khi thời khóa biểu được thiết lập.</p>
              <span className="mt-2 inline-block text-xs font-bold text-amber-600">Vui lòng quay lại sau</span>
            </article>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/60 to-white p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Đồng hành cùng bé mỗi ngày</p>
            <h2 className="text-2xl font-bold text-emerald-900 sm:text-3xl">Đội ngũ giáo viên</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Những thầy cô tận tâm, được đào tạo chuyên môn bài bản và luôn phối hợp chặt chẽ cùng phụ huynh
              trong quá trình phát triển của trẻ.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teacherTeam.map((teacher, index) => (
            <article
              key={teacher.id || `${teacher.name}-${index}`}
              className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={teacher.avatar || DEFAULT_TEACHER_AVATAR}
                  alt={teacher.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded-full bg-emerald-800/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {teacher.role || 'Giáo viên'}
                </span>
              </div>
              <h3 className="line-clamp-1 text-base font-bold text-emerald-900">{teacher.name}</h3>
              <p className="mt-2 min-h-[54px] text-sm leading-6 text-slate-600">
                <strong>Chuyên môn:</strong> {teacher.specialty}
              </p>
            </article>
          ))}
          {teacherTeam.length === 0 && (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm sm:col-span-2 xl:col-span-4">
              <h3 className="mb-2 font-bold text-emerald-900">Chưa có thông tin giáo viên</h3>
              <p>Nhà trường sẽ cập nhật hồ sơ đội ngũ giáo viên trong thời gian sớm nhất.</p>
            </article>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-700 p-6 text-white md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Ba mẹ cần tư vấn thêm?</h2>
          <p className="mt-2 text-white/90">Để lại thông tin để nhà trường hỗ trợ nhanh, nhận thông tin về chương trình học.</p>
        </div>
        <form className="grid gap-2 sm:grid-cols-2">
          <input type="text" disabled placeholder="Họ và tên cha/mẹ*" className="rounded-xl border-none bg-white px-3 py-2.5 text-sm text-slate-700" />
          <input type="tel" disabled placeholder="Số điện thoại*" className="rounded-xl border-none bg-white px-3 py-2.5 text-sm text-slate-700" />
          <input type="email" disabled placeholder="Email" className="rounded-xl border-none bg-white px-3 py-2.5 text-sm text-slate-700 sm:col-span-2" />
          <Link to="/contact" className="rounded-xl border border-white/80 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-white/20 sm:col-span-2">Đăng ký tư vấn</Link>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-emerald-900 sm:text-3xl">Tin tức - Sự kiện</h2>
          <Link to="/school-news" className="text-sm font-bold text-emerald-700 hover:underline">Xem thêm</Link>
        </div>
        {loading && <p className="py-3 text-slate-600">Đang tải dữ liệu tin tức...</p>}
        {error && <p className="py-3 text-red-600">{error}</p>}
        {!loading && !error && featured.length === 0 && <p className="py-3 text-slate-600">Chưa có bài viết.</p>}
        {!loading && !error && featured.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            {mainBlog && (
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md" onClick={() => navigate(`/news/${mainBlog.id}`)}>
                {mainBlog.image ? (
                  <img src={mainBlog.image} alt={mainBlog.title} className="h-60 w-full object-cover" />
                ) : (
                  <div className="grid h-60 place-items-center bg-slate-100 text-slate-500">Không có ảnh</div>
                )}
                <div className="p-4">
                  <span className="text-xs font-bold text-emerald-700">{mainBlog.category}</span>
                  <h3 className="mt-1 font-bold text-slate-900">{mainBlog.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{mainBlog.content || 'Nội dung đang được cập nhật.'}</p>
                </div>
              </article>
            )}
            <div className="grid gap-3">
              {sideBlogs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/news/${item.id}`)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h4 className="mb-1 font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : item.category}</p>
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
