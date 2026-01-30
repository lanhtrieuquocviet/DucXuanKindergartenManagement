function StudySchedule() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        <span className="hover:text-green-600 cursor-pointer">Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Giới thiệu</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">Lịch học tập</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">
        Lịch học tập
      </h1>

      {/* Slogan */}
      <p className="text-pink-400 italic mb-8">
        Kết hợp hài hòa giữa học tập – vui chơi – rèn luyện kỹ năng sống.
      </p>

      {/* Content */}
      <div className="text-justify text-base leading-8 text-gray-800 space-y-6">

        <p>
          Lịch học tập tại Trường Mầm non Đức Xuân được xây dựng khoa học, phù hợp
          với đặc điểm tâm sinh lý của trẻ mầm non, đảm bảo cân đối giữa thời
          gian học tập, vui chơi, ăn uống và nghỉ ngơi.
        </p>

        <p>
          Nhà trường áp dụng chương trình giáo dục mầm non theo quy định của Bộ
          Giáo dục và Đào tạo, đồng thời lồng ghép các hoạt động trải nghiệm,
          phát triển kỹ năng sống và giáo dục kỹ năng xã hội cho trẻ.
        </p>

        <p>
          Trong ngày, trẻ được tham gia các hoạt động học có chủ đích, hoạt động
          vui chơi trong lớp, vui chơi ngoài trời, hoạt động góc và sinh hoạt
          tập thể.
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>Đón trẻ – trò chuyện đầu ngày</li>
          <li>Hoạt động học theo chủ đề</li>
          <li>Vui chơi trong lớp và ngoài trời</li>
          <li>Ăn trưa – nghỉ trưa</li>
          <li>Hoạt động chiều – trả trẻ</li>
        </ul>

        <p>
          Ngoài lịch học chính khóa, nhà trường còn tổ chức các hoạt động ngoại
          khóa, ngày hội – ngày lễ, hoạt động trải nghiệm thực tế nhằm giúp trẻ
          phát triển toàn diện cả về thể chất lẫn tinh thần.
        </p>

        <p>
          Lịch học tập được điều chỉnh linh hoạt theo từng độ tuổi, đảm bảo mỗi
          trẻ đều được quan tâm, chăm sóc và giáo dục phù hợp với khả năng và
          nhu cầu phát triển của mình.
        </p>

      </div>
    </div>
  );
}

export default StudySchedule;
