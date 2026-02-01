export default function DocumentLibrary() {
  const documents = [
    {
      title: "Kế hoạch năm học 2022 – 2023",
      description: "Kế hoạch tổ chức các hoạt động giáo dục năm học 2022-2023",
      fileType: "PDF",
      link: "#",
    },
    {
      title: "Chương trình giáo dục mầm non",
      description: "Chương trình giáo dục theo quy định của Bộ GD&ĐT",
      fileType: "DOC",
      link: "#",
    },
    {
      title: "Nội quy trường học",
      description: "Nội quy dành cho giáo viên, học sinh và phụ huynh",
      fileType: "PDF",
      link: "#",
    },
    {
      title: "Thực đơn tuần tháng 6",
      description: "Thực đơn dinh dưỡng dành cho trẻ mầm non",
      fileType: "PDF",
      link: "#",
    },
    {
      title: "Chương trình tuần",
      description: "Kế hoạch hoạt động tuần cho các khối lớp",
      fileType: "DOC",
      link: "#",
    },
    {
      title: "Quy chế chuyên môn",
      description: "Quy định về công tác chuyên môn trong nhà trường",
      fileType: "PDF",
      link: "#",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4 text-gray-800">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Trang chủ <span className="mx-1">›</span> Thư viện{" "}
        <span className="mx-1">›</span>{" "}
        <span className="text-gray-700">Tài liệu</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="border p-4 hover:shadow-md transition cursor-pointer"
          >
            {/* File icon */}
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-green-100 text-green-700 flex items-center justify-center font-bold mr-3">
                {doc.fileType}
              </div>
              <h3 className="text-sm font-semibold leading-snug">
                {doc.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">
              {doc.description}
            </p>

            {/* Download */}
            <a
              href={doc.link}
              className="text-sm text-green-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              📥 Tải tài liệu
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
