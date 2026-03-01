function ParentsCouncil() {
  const council = [
    {
      id: 1,
      name: "Nguyễn Văn Hùng",
      position: "Trưởng ban",
      phone: "0987123456",
      email: "hungphhs@gmail.com",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 2,
      name: "Trần Thị Hoa",
      position: "Phó Trưởng ban",
      phone: "0978456123",
      email: "hoaphhs@gmail.com",
      avatar: "https://i.pravatar.cc/150?img=25",
    },
    {
      id: 3,
      name: "Lê Văn Minh",
      position: "Ủy viên",
      phone: "0963344556",
      email: "minhphhs@gmail.com",
      avatar: "https://i.pravatar.cc/150?img=33",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
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
          Hội Thường trực Phụ huynh học sinh
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-8">
        Hội Thường trực Phụ huynh học sinh
      </h1>

      {/* List */}
      <div className="space-y-6">
        {council.map((item) => (
          <div
            key={item.id}
            className="border rounded bg-white flex p-6 gap-6"
          >
            {/* Avatar */}
            <div className="w-[150px] h-[180px] border bg-gray-100 flex-shrink-0">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3 text-sm">
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
    </div>
  );
}

export default ParentsCouncil;
