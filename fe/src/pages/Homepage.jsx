import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { get } from "../service/api";

const PAGE_SIZE = 4;

const VALUE_CARDS = [
  {
    title: "Chăm sóc và phát triển",
    text: "Chăm sóc và giúp trẻ phát triển khỏe mạnh là một trong những mục tiêu lớn được đưa lên hàng đầu, nhà trường luôn quan tâm đến chế độ dinh dưỡng và phòng chống dịch bệnh cho trẻ theo các độ tuổi, đảm bảo an toàn cho trẻ khi ở trường.",
  },
  {
    title: "Chương trình giáo dục",
    text: "Thực hiện theo Chương trình Giáo dục mầm non do Bộ GD&ĐT ban hành. Giáo viên linh hoạt trong việc ứng dụng các phương pháp dạy học tiên tiến, phù hợp với chương trình GDMN và định hướng phát triển theo khả năng của từng cá nhân trẻ.",
  },
  {
    title: "Môi trường lấy trẻ làm trung tâm",
    text: "Xây dựng môi trường giáo dục lấy trẻ làm trung tâm, đảm bảo môi trường sạch sẽ, an toàn và thân thiện. Tạo nhiều góc mở, sử dụng tối đa sản phẩm của trẻ trong việc trang trí môi trường lớp học.",
  },
  {
    title: "Phối hợp nhà trường – phụ huynh",
    text: "Phối hợp giữa nhà trường và Ban đại diện cha mẹ học sinh nhằm tạo sự thống nhất trong việc chăm sóc, nuôi dưỡng, giáo dục trẻ; tư vấn, chia sẻ, hỗ trợ cha mẹ học sinh khi cần.",
  },
  {
    title: "Hành trang vào đời",
    text: "Cây xanh bắt đầu sự sống bằng mầm non, trẻ bắt đầu hành trang vào đời bằng những kỹ năng được học từ những năm đầu tiên. Chuẩn bị tốt hành trang cho trẻ, giúp trẻ phát triển toàn diện là trách nhiệm của gia đình, nhà trường và xã hội.",
  },
];

const BENEFIT_CARDS = [
  { title: "Dinh dưỡng cân đối", text: "Chế độ dinh dưỡng quyết định sự phát triển thể lực, trí tuệ, tầm vóc và khả năng học tập của trẻ. Thực đơn tuần được xây dựng cân đối, đảm bảo nhu cầu dinh dưỡng hàng ngày." },
  { title: "Phát triển toàn diện", text: "Giúp trẻ phát triển hài hòa về thể chất, nhận thức, ngôn ngữ, tình cảm, kỹ năng xã hội và thẩm mỹ; chuẩn bị tốt tâm thế cho trẻ vào tiểu học." },
  { title: "Môi trường giáo dục LTLTT", text: "Trẻ được hoạt động trong môi trường lớp học khang trang, hiện đại, thân thiện, cởi mở – nơi mỗi trẻ là một cá nhân riêng biệt với nhu cầu và khả năng riêng." },
  { title: "Hoạt động tham quan dã ngoại", text: "Tham gia hoạt động tham quan dã ngoại giúp trẻ thêm tự tin, mạnh dạn, mở rộng tầm nhìn, nâng cao nhận thức về thế giới xung quanh." },
  { title: "Kỹ năng sống", text: "Gieo hành vi, gặt thói quen. Trẻ có cơ hội trải nghiệm, thích nghi và tự thể hiện mình, tạo lập những hành vi tích cực, chủ động, hòa đồng." },
];

const PROGRAM_ITEMS = [
  "Toán học",
  "Tạo hình nghệ thuật",
  "Làm quen chữ viết",
  "Ngôn ngữ & giao tiếp",
  "Khám phá thế giới",
  "Âm nhạc vận động",
  "Mỹ thuật thị giác",
  "Sức khỏe thể chất",
  "Kỹ năng sống",
];

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "").trim();

function SectionHeading({ title, linkTo, linkLabel = "Xem thêm" }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <h2 className="text-xl md:text-2xl font-bold text-green-800 tracking-tight">{title}</h2>
      {linkTo ? (
        <Link
          to={linkTo}
          className="text-sm font-semibold text-green-700 hover:text-green-800 whitespace-nowrap"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function Homepage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await get("/blogs/categories");
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
                title: b.title || b.code,
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
        setError(err.message || "Không tải được tin nổi bật");
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);


  const totalPage = Math.ceil(featured.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentBlogs = featured.slice(startIndex, startIndex + PAGE_SIZE);
  const mainBlog = currentBlogs[0];
  const subBlogs = currentBlogs.slice(1);
  const newsList = featured.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 space-y-14 pb-14 pt-2">
      {/* ===== THẺ GIÁ TRỊ / SỨ MỆNH (như mnhoamai) ===== */}
      <section>
        <SectionHeading title="Giá trị cốt lõi" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VALUE_CARDS.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <h3 className="text-base font-semibold text-green-800 mb-2.5">{card.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{card.text}</p>
          </div>
        ))}
        </div>
      </section>

      {/* ===== GIỚI THIỆU TRƯỜNG (block lớn như mnhoamai) ===== */}
      <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-green-100">
        <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center mb-2 tracking-tight">
          Trường mầm non Đức Xuân
        </h2>
        <p className="text-center text-amber-700 font-medium mb-4">
          &ldquo;Hôm nay gieo hạt giống tốt, ngày mai ươm trồng những tài năng&rdquo;
        </p>
        <div className="max-w-3xl mx-auto text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            Khởi nguồn của hạnh phúc chính là sức khỏe. Một mầm cây có trở thành một cây xanh tốt, đơm hoa kết trái phải bắt đầu từ một hạt giống khỏe mạnh. Trường Mầm non Đức Xuân – Phường Đức Xuân, tỉnh Thái Nguyên luôn mong muốn là nơi gieo trồng những mầm cây mà CMHS đã tin yêu trao gửi.
          </p>
          <p>
            Trong những năm tháng đầu đời của các con là vòng tay yêu thương của gia đình. Những năm tháng tiếp theo, chúng tôi xin được đồng hành cùng quý phụ huynh trong việc trao đi những bài học và sẻ chia những yêu thương đó.
          </p>
        </div>
      </section>

      {/* ===== TRƯỜNG MẦM NON ĐỨC XUÂN MANG LẠI CHO CON BẠN ===== */}
      <section>
        <SectionHeading title="Những điều nhà trường mang lại cho bé" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {BENEFIT_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 hover:shadow-md transition"
            >
              <h3 className="text-base font-semibold text-green-800 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-6">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TỔNG QUAN CHƯƠNG TRÌNH ===== */}
      <section>
        <SectionHeading title="Tổng quan chương trình" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {PROGRAM_ITEMS.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl py-4 px-3 text-center shadow-sm border border-green-100 font-medium text-green-800 text-sm hover:shadow-md hover:bg-green-50/50 transition"
            >
              {item.toUpperCase()}
            </div>
          ))}
        </div>
      </section>

      {/* ===== GALLERY (placeholder + Xem thêm) ===== */}
      <section>
        <SectionHeading title="Thư viện ảnh" linkTo="/photo-gallery" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Link
              key={i}
              to="/photo-gallery"
              className="aspect-[4/3] rounded-2xl overflow-hidden bg-green-100 border border-green-100 hover:opacity-90 transition"
            >
              <div className="w-full h-full flex items-center justify-center text-green-600 text-sm">
                Ảnh hoạt động
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== TIN TỨC (như mnhoamai: list + Xem thêm) ===== */}
      <section>
        <SectionHeading title="Tin tức mới nhất" linkTo="/school-news" />

        {loading && <p className="text-center py-6 text-gray-500">Đang tải...</p>}
        {error && <p className="text-center py-6 text-red-600">{error}</p>}
        {!loading && !error && featured.length === 0 && (
          <p className="text-center py-6 text-gray-500">Chưa có bài viết.</p>
        )}

        {!loading && !error && newsList.length > 0 && (
          <ul className="space-y-3 mb-6">
            {newsList.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/news/${item.id}`)}
                  className="w-full text-left flex flex-wrap items-baseline gap-2 hover:text-green-700"
                >
                  <span className="font-medium text-gray-800 flex-1 min-w-0 line-clamp-2">
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                      : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Bài nổi bật + grid bài nhỏ (giữ logic cũ) */}
        {mainBlog && (
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-green-100 mb-6 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate(`/news/${mainBlog.id}`)}
          >
            {mainBlog.image ? (
              <img
                src={mainBlog.image}
                alt={mainBlog.title}
                className="w-full h-56 sm:h-72 object-cover"
              />
            ) : (
              <div className="w-full h-56 sm:h-72 bg-green-50 flex items-center justify-center text-gray-400">
                Không có ảnh
              </div>
            )}
            <div className="p-4">
              <span className="text-xs font-medium text-green-700">{mainBlog.category}</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-1">{mainBlog.title}</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{mainBlog.content}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subBlogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-green-100 cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`/news/${blog.id}`)}
            >
              {blog.image ? (
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-green-50 flex items-center justify-center text-gray-400 text-sm">
                  Không có ảnh
                </div>
              )}
              <div className="p-3">
                <span className="text-xs text-green-600">{blog.category}</span>
                <p className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2">
                  {blog.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {totalPage > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-green-200 text-sm disabled:opacity-50 hover:bg-green-50"
            >
              «
            </button>
            {Array.from({ length: totalPage }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                className={`px-4 py-1.5 rounded-lg text-sm ${
                  page === i + 1 ? "bg-green-600 text-white" : "border border-green-200 hover:bg-green-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPage}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-green-200 text-sm disabled:opacity-50 hover:bg-green-50"
            >
              »
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Homepage;
