import { useState } from "react";

/* ===== MOCK DATA: 30 GIÁO VIÊN ===== */
const teachers = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Giáo viên ${i + 1}`,
  position: "Giáo viên",
  phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
  email: `giaovien${i + 1}@mnducxuan.edu.vn`,
  avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
}));

const PAGE_SIZE = 10;

export default function ProfessionalGroup() {
  const [page, setPage] = useState(1);

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
        {currentTeachers.map((item) => (
          <div
            key={item.id}
            className="border rounded bg-white flex flex-col sm:flex-row p-4 sm:p-6 gap-4 sm:gap-6"
          >
            {/* Avatar */}
            <div className="w-full sm:w-[150px] h-[200px] sm:h-[180px] sm:flex-shrink-0 border bg-gray-100 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-sm space-y-3">
              <div className="flex border-b pb-2">
                <div className="w-32 font-semibold">Họ và tên:</div>
                <div className="font-bold text-base">{item.name}</div>
              </div>

              <div className="flex border-b pb-2">
                <div className="w-32 font-semibold">Chức vụ:</div>
                <div>{item.position}</div>
              </div>

              <div className="flex border-b pb-2">
                <div className="w-32 font-semibold">Điện thoại:</div>
                <div>{item.phone}</div>
              </div>

              <div className="flex">
                <div className="w-32 font-semibold">Email:</div>
                <div className="text-blue-600">{item.email}</div>
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

