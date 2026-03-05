const directors = [
  {
    id: 1,
    name: "Lý Thị Bích",
    position: "Hiệu Trưởng",
    phone: "0976919797",
    email: "ngocbichbackan@gmail.com",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: 2,
    name: "Nghiêm Thị Hồng Hạnh",
    position: "Phó Hiệu trưởng",
    phone: "0978117998",
    email: "hanhmdx@gmail.com",
    avatar: "https://i.pravatar.cc/150?img=48",
  },
  {
    id: 3,
    name: "Triệu Thị Duyên",
    position: "Phó Hiệu Trưởng",
    phone: "0396409433",
    email: "trieuduyen78mnbk@gmail.com",
    avatar: "https://i.pravatar.cc/150?img=49",
  },
];

function BoardOfDirectors() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        <span className="hover:text-green-600 cursor-pointer">Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Giới thiệu</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Cơ cấu tổ chức</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">Ban Giám hiệu</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        Ban Giám hiệu
      </h1>

      {/* List */}
      <div className="space-y-6">
        {directors.map((item) => (
          <div
            key={item.id}
            className="border rounded bg-white flex flex-col sm:flex-row p-4 sm:p-6 gap-4 sm:gap-6"
          >
            {/* Avatar */}
            <div className="w-full sm:w-[150px] h-[200px] sm:h-[180px] sm:flex-shrink-0 border bg-gray-100 flex items-center justify-center mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
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

export default BoardOfDirectors;
