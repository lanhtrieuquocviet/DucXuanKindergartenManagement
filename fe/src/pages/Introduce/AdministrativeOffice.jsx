function AdministrativeOffice() {
  const staff = {
    name: "Âu Thị Thương",
    position: "Y sĩ",
    phone: "0346120220",
    email: "authuongmndx@gmail.com",
    avatar: "https://i.pravatar.cc/150?img=32",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        <span className="hover:text-green-600 cursor-pointer">Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Giới thiệu</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">
          Cơ cấu tổ chức
        </span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Tổ Hành chính - Văn phòng
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        Tổ Hành chính - Văn phòng
      </h1>

      {/* Card */}
      <div className="border rounded bg-white p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Avatar */}
        <div className="w-full sm:w-[150px] h-[200px] sm:h-[180px] border bg-gray-100 sm:flex-shrink-0 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
          <img
            src={staff.avatar}
            alt={staff.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-sm space-y-3">
          <div className="flex border-b pb-2">
            <div className="w-32 font-semibold">Họ và tên:</div>
            <div className="font-bold text-base">{staff.name}</div>
          </div>

          <div className="flex border-b pb-2">
            <div className="w-32 font-semibold">Chức vụ:</div>
            <div>{staff.position}</div>
          </div>

          <div className="flex border-b pb-2">
            <div className="w-32 font-semibold">Điện thoại:</div>
            <div>{staff.phone}</div>
          </div>

          <div className="flex">
            <div className="w-32 font-semibold">Email:</div>
            <div className="text-blue-600">{staff.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdministrativeOffice;
