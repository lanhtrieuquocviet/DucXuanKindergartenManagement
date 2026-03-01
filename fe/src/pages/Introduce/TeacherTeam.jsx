function TeacherTeam() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* ===== BREADCRUMB ===== */}
      <div className="text-sm text-gray-600 mb-6">
        <span className="hover:text-green-600 cursor-pointer">Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-green-600 cursor-pointer">Giới thiệu</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">
          Đội ngũ giáo viên
        </span>
      </div>

      {/* ===== TIÊU ĐỀ ===== */}
      <h1 className="text-3xl font-bold mb-2">
        Đội ngũ giáo viên
      </h1>

      {/* ===== SLOGAN ===== */}
      <p className="text-pink-400 italic mb-8">
        Tận tâm, yêu trẻ và tuyệt đối tôn trọng đạo đức nghề nghiệp.
      </p>

      {/* ===== NỘI DUNG ===== */}
      <div className="text-justify text-base leading-8 text-gray-800 space-y-6">

        <p>
          Trường Mầm non Đức Xuân là trường mầm non hàng đầu hiện nay về chất
          lượng đội ngũ nhân sự. Với mục tiêu lớn là phát triển tốt nhất về trí
          tuệ và nhân cách trẻ, Trường MN Đức Xuân xem tri thức của giáo viên là
          yếu tố quan trọng nhất để đạt được mục tiêu này.
        </p>

        <p>
          Do đó, để đạt được tiêu chuẩn trở thành giáo viên tại Trường MN Đức
          Xuân, các giáo viên phải đáp ứng hàng loạt các yêu cầu gắt gao của nhà
          trường về trình độ học vấn, nhân cách và kỹ năng giảng dạy.
        </p>

        <p>
          Giáo viên được tuyển vào Trường MN Đức Xuân phải qua những vòng sơ vấn
          và phỏng vấn rất gắt gao. Giáo viên phải soạn giáo án theo hoạt động
          được chỉ định và thực hiện tiết dạy mẫu trước Hội đồng chuyên môn.
        </p>

        <p>
          <strong>100%</strong> giáo viên có bằng Cử nhân Sư phạm Mầm non chính
          quy (<strong>100%</strong> giáo viên tốt nghiệp Đại học, Cao đẳng Sư
          phạm).
        </p>

        <p>
          <strong>100%</strong> giáo viên giảng dạy tiếng Anh ESL là giáo viên
          bản xứ (Hoa Kỳ, Úc), tốt nghiệp Cao học, Đại học loại giỏi, xuất sắc và
          có kinh nghiệm giảng dạy tiếng Anh tại các trường học và tổ chức giáo
          dục uy tín.
        </p>

        <p>
          <strong>100%</strong> bảo mẫu có trình độ Trung cấp trở lên. Trong đó,
          <strong>10%</strong> bảo mẫu có bằng Cao đẳng Sư phạm, <strong>75%</strong>
          bảo mẫu đang theo học Đại học/Cao đẳng Sư phạm.
        </p>

        <p>
          <strong>100%</strong> giáo viên, bảo mẫu và nhân viên có chứng nhận đủ
          điều kiện sức khỏe để tham gia chăm sóc trẻ.
        </p>

        <p>
          <strong>100%</strong> giáo viên, bảo mẫu và nhân viên có chứng nhận tập
          huấn về an toàn vệ sinh thực phẩm và sơ cấp cứu.
        </p>

        {/* ===== GẠCH ĐẦU DÒNG ===== */}
        <ul className="list-disc pl-6 space-y-2">
          <li>Trẻ, nhiệt tình, năng động, sáng tạo</li>
          <li>
            Tận tâm, yêu trẻ và tuyệt đối tôn trọng đạo đức nghề nghiệp
          </li>
          <li>
            Được tập huấn thường xuyên về phương pháp mới, phương pháp giáo dục
            trẻ thông minh sớm (“Bé yêu biết đọc”, phương án 0 tuổi), trí thông
            minh đa dạng (Multiple Intelligences), các hoạt động Montessori,
            KinderArts.
          </li>
        </ul>

        {/* ===== SĨ SỐ LỚP ===== */}
        <div>
          <p className="font-semibold mt-6 mb-2">Sĩ số lớp học:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Lớp nhà trẻ 18–24 tháng: 15 cháu với 2 cô giáo và 2 bảo mẫu</li>
            <li>Lớp nhà trẻ 25–36 tháng: 20 cháu với 2 cô giáo và 2 bảo mẫu</li>
            <li>Lớp mầm (3 tuổi – dưới 4 tuổi): 20 cháu với 2 cô giáo và 2 bảo mẫu</li>
            <li>Lớp chồi (4 tuổi – dưới 5 tuổi): 20 cháu với 2 cô giáo và 1 bảo mẫu</li>
            <li>Lớp lá (5 tuổi – 6 tuổi): 20 cháu với 2 cô giáo và 1 bảo mẫu</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default TeacherTeam;
