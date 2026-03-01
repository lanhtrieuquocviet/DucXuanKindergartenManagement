export default function WeeklyProgram() {
  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Chương trình tuần</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-3">Chương trình tuần</h1>

      {/* Description */}
      <p className="max-w-4xl text-sm leading-relaxed mb-6">
        Chương trình tuần được xây dựng dựa trên chương trình giáo dục mầm non
        của Bộ Giáo dục và Đào tạo, kết hợp các hoạt động học tập, vui chơi
        và trải nghiệm nhằm phát triển toàn diện cho trẻ về thể chất,
        trí tuệ, ngôn ngữ, tình cảm và kỹ năng xã hội.
      </p>

      {/* ===== PROGRAM BLOCK 1 ===== */}
      <div className="mb-10">
        <h2 className="font-semibold uppercase text-sm mb-1">
          CHƯƠNG TRÌNH TUẦN 5 – THÁNG 6 NĂM 2017
        </h2>
        <p className="text-sm">Dành cho trẻ từ 3 tuổi đến 6 tuổi</p>
        <p className="text-sm mb-4">
          Từ ngày 26/06/2017 tới ngày 30/06/2017
        </p>

        {/* Image */}
        <div className="w-full max-w-md mb-4">
          <img
            src="https://via.placeholder.com/600x350?text=weekly+program"
            alt="chuong-trinh-tuan"
            className="border"
          />
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Nội dung giáo dục</p>
            <ul className="list-disc list-inside mt-1">
              <li>Phát triển thể chất</li>
              <li>Phát triển nhận thức</li>
              <li>Phát triển ngôn ngữ</li>
              <li>Phát triển tình cảm – kỹ năng xã hội</li>
              <li>Phát triển thẩm mỹ</li>
            </ul>

            <p className="mt-3 font-medium">Giáo viên phụ trách</p>
            <p>(Đã ký)</p>
            <p>Võ Thị Kiều Nhiên</p>
          </div>

          <div>
            <p className="font-medium">Ban giám hiệu</p>
            <p>(Đã ký)</p>
            <p>Nguyễn Thị Hồng – Hiệu trưởng</p>
          </div>
        </div>
      </div>

      {/* ===== PROGRAM BLOCK 2 ===== */}
      <div>
        <h2 className="font-semibold uppercase text-sm mb-1">
          CHƯƠNG TRÌNH TUẦN 5 – THÁNG 6 NĂM 2017
        </h2>
        <p className="text-sm">Dành cho trẻ dưới 3 tuổi</p>
        <p className="text-sm mb-4">
          Từ ngày 26/06/2017 tới ngày 30/06/2017
        </p>

        {/* Image */}
        <div className="w-full max-w-md mb-4">
          <img
            src="https://via.placeholder.com/600x350?text=weekly+program"
            alt="chuong-trinh-tuan"
            className="border"
          />
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Nội dung giáo dục</p>
            <ul className="list-disc list-inside mt-1">
              <li>Vận động cơ bản</li>
              <li>Nhận biết màu sắc – hình dạng</li>
              <li>Nghe nhạc – vận động theo nhạc</li>
              <li>Hoạt động trải nghiệm</li>
            </ul>

            <p className="mt-3 font-medium">Giáo viên phụ trách</p>
            <p>(Đã ký)</p>
            <p>Võ Thị Kiều Nhiên</p>
          </div>

          <div>
            <p className="font-medium">Ban giám hiệu</p>
            <p>(Đã ký)</p>
            <p>Nguyễn Thị Hồng – Hiệu trưởng</p>
          </div>
        </div>
      </div>
    </div>
  );
}
