import { useState } from "react";
import teachers from "./teachers";
import "./SpecializedGroup.css";

const PAGE_SIZE = 10;

function SpecializedGroup() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(teachers.length / PAGE_SIZE);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentTeachers = teachers.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return (
    <div className="specialized-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        Trang chủ &gt; Giới thiệu &gt; Cơ cấu tổ chức &gt;{" "}
        <b>Tổ Chuyên môn</b>
      </div>

      <h1 className="page-title">Tổ Chuyên môn</h1>

      {/* Danh sách giáo viên */}
      {currentTeachers.map((t) => (
        <div key={t.id} className="teacher-card">
          <img src={t.avatar} alt={t.name} />

          <div className="teacher-info">
            <p>
              <span>Họ và tên:</span> <b>{t.name}</b>
            </p>
            <p>
              <span>Chức vụ:</span> {t.position}
            </p>
            <p>
              <span>Điện thoại:</span> {t.phone}
            </p>
            <p>
              <span>Email:</span> {t.email}
            </p>
          </div>
        </div>
      ))}

      {/* Phân trang */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          «
        </button>

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          ‹
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          ›
        </button>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(totalPages)}
        >
          »
        </button>
      </div>
    </div>
  );
}

export default SpecializedGroup;
