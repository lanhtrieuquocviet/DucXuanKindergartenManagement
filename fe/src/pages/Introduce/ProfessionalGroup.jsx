import { useEffect, useState } from "react";
import { ENDPOINTS, get } from "../../service/api";

const PAGE_SIZE = 10;
const DEFAULT_AVATAR = "https://via.placeholder.com/300x400.png?text=Avatar+3x4";

export default function ProfessionalGroup() {
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resp = await get(ENDPOINTS.PUBLIC_INFO.ORGANIZATION_STRUCTURE, { includeAuth: false });
        const members = resp?.data?.professionalGroup?.members || [];
        setTeachers(Array.isArray(members) ? members : []);
      } catch (error) {
        console.error("Failed to load professional group", error);
        setTeachers([]);
      }
    };
    loadData();
  }, []);

  const totalPages = Math.ceil(teachers.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentTeachers = teachers.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ===== BREADCRUMB ===== */}
      <div className="text-sm text-gray-600 mb-6">
        <span className="hover:text-green-600 cursor-pointer">Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Giới thiệu</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">
          Cơ cấu tổ chức
        </span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">Tổ Chuyên môn</span>
      </div>

      {/* ===== TITLE ===== */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Tổ Chuyên môn</h1>

      {/* ===== LIST ===== */}
      <div className="space-y-6">
        {currentTeachers.length === 0 ? (
          <div className="border rounded bg-white p-6 text-gray-500">Chưa có dữ liệu Tổ chuyên môn.</div>
        ) : currentTeachers.map((item, idx) => (
          <div
            key={item.id || `${item.fullName}-${idx}`}
            className="border rounded bg-white flex flex-col sm:flex-row p-4 sm:p-6 gap-4 sm:gap-6"
          >
            {/* Avatar */}
            <div className="w-full sm:w-[150px] h-[200px] sm:h-[180px] sm:flex-shrink-0 border bg-gray-100 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
              <img
                src={item.avatar || DEFAULT_AVATAR}
                alt={item.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-sm space-y-3">
              <div className="flex border-b pb-2">
                <div className="w-32 font-semibold">Họ và tên:</div>
                <div className="font-bold text-base">{item.fullName || "—"}</div>
              </div>

              <div className="flex border-b pb-2">
                <div className="w-32 font-semibold">Chức vụ:</div>
                <div>{item.position || "Giáo viên"}</div>
              </div>

              <div className="flex border-b pb-2">
                <div className="w-32 font-semibold">Điện thoại:</div>
                <div>{item.phone || "—"}</div>
              </div>

              <div className="flex">
                <div className="w-32 font-semibold">Email:</div>
                <div className="text-blue-600">{item.email || "—"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== PAGINATION ===== */}
      <div className="flex justify-center flex-wrap mt-6 sm:mt-8 gap-1 sm:gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-4 py-1 border rounded transition
              ${
                page === i + 1
                  ? "bg-green-600 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

