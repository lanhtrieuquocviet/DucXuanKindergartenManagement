export default function WeeklyMenu() {
  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Thực đơn tuần</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-3">Thực đơn tuần</h1>

      {/* Description */}
      <p className="max-w-4xl text-sm leading-relaxed mb-6">
        Thực đơn được sự kiểm tra và phê duyệt của bác sĩ dinh dưỡng.
        Thức ăn được chế biến tại trường để bảo đảm dinh dưỡng, vệ sinh
        và khẩu phần ăn được thiết kế theo nhu cầu các cá nhân trẻ.
      </p>

      {/* ===== MENU BLOCK 1 ===== */}
      <div className="mb-10">
        <h2 className="font-semibold uppercase text-sm mb-1">
          THỰC ĐƠN TUẦN 5 – THÁNG 6 NĂM 2017
        </h2>
        <p className="text-sm">Dành cho bé từ 3 tuổi đến 6 tuổi</p>
        <p className="text-sm mb-4">
          Từ ngày 26/06/2017 tới ngày 30/06/2017
        </p>

        {/* Image */}
        <div className="w-full max-w-md mb-4">
          <img
            src="https://via.placeholder.com/600x350?text=menu"
            alt="menu"
            className="border"
          />
        </div>

        {/* Info rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">
              Trường mầm non quốc tế Superkids dùng sữa
            </p>
            <p>Abbott hoặc Devondale, New Zealand, Vinamilk</p>

            <p className="mt-3 font-medium">Phụ trách giáo vụ</p>
            <p>(Đã ký)</p>
            <p>Võ Thị Kiều Nhiên</p>
          </div>

          <div>
            <p className="font-medium">Y tế Học đường</p>
            <p>(Đã ký)</p>
            <p>Bác sĩ, tiến sĩ Y khoa Hà Thị Hiền</p>
          </div>
        </div>
      </div>

      {/* ===== MENU BLOCK 2 ===== */}
      <div>
        <h2 className="font-semibold uppercase text-sm mb-1">
          THỰC ĐƠN TUẦN 5 – THÁNG 6 NĂM 2017
        </h2>
        <p className="text-sm">Dành cho bé dưới 3 tuổi</p>
        <p className="text-sm mb-4">
          Từ ngày 26/06/2017 tới ngày 30/06/2017
        </p>

        {/* Image */}
        <div className="w-full max-w-md mb-4">
          <img
            src="https://via.placeholder.com/600x350?text=menu"
            alt="menu"
            className="border"
          />
        </div>

        {/* Info rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">
              Trường mầm non quốc tế Superkids dùng sữa
            </p>
            <p>Abbott hoặc Devondale, New Zealand, Vinamilk</p>

            <p className="mt-3 font-medium">Phụ trách giáo vụ</p>
            <p>(Đã ký)</p>
            <p>Võ Thị Kiều Nhiên</p>
          </div>

          <div>
            <p className="font-medium">Y tế Học đường</p>
            <p>(Đã ký)</p>
            <p>Bác sĩ, tiến sĩ Y khoa Hà Thị Hiền</p>
          </div>
        </div>
      </div>
    </div>
  );
}
