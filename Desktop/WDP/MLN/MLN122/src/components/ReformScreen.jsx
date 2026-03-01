import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaGlobeAsia, FaHandshake, FaBuilding, FaSeedling, FaLandmark, FaMoneyBillWave, FaIndustry, FaGavel } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../assets/styles/ReformScreen.css";

const events = [
  { year: 1986, title: "Đại hội VI – khởi xướng Đổi Mới", icon: <FaSeedling/>,  note: "Đổi mới tư duy quản lý; lấy phát triển kinh tế làm trọng tâm." },
  { year: 1987, title: "Luật Đầu tư nước ngoài",           icon: <FaBuilding/>,  note: "Mở cánh cửa FDI; các liên doanh đầu tiên xuất hiện." },
  { year: 1988, title: "Nghị quyết 10 (Khoán 10)",          icon: <FaGavel/>,     note: "Giao quyền sử dụng đất nông nghiệp; khuyến khích hộ gia đình sản xuất." },
  { year: 1989, title: "Cải cách giá–lương–tiền",           icon: <FaMoneyBillWave/>, note: "Xoá bỏ bao cấp giá; tăng tính thị trường trong phân phối." },
  { year: 1991, title: "Bình thường hoá quan hệ tài chính", icon: <FaGlobeAsia/>, note: "Tạo điều kiện tiếp cận vốn, công nghệ, thương mại." },
  { year: 1993, title: "Luật Đất đai 1993",                 icon: <FaLandmark/>,  note: "Xác lập quyền sử dụng đất ổn định, dài hạn cho sản xuất." },
  { year: 1994, title: "Hoa Kỳ bãi bỏ cấm vận",             icon: <FaHandshake/>, note: "Mở ra cơ hội thương mại mới, thu hút đầu tư." },
  { year: 1995, title: "Gia nhập ASEAN",                     icon: <FaGlobeAsia/>, note: "Hội nhập khu vực, mở rộng thị trường và chuỗi cung ứng." },
];

const policies = [
  { icon: <FaBuilding/>, title: "FDI", text: "Luật 1987 đặt nền cho làn sóng đầu tư nước ngoài; hình thành khu công nghiệp, liên doanh." },
  { icon: <FaGavel/>, title: "Khoán 10", text: "Trao quyền chủ động sản xuất nông nghiệp; tăng năng suất, đảm bảo an ninh lương thực." },
  { icon: <FaLandmark/>, title: "Đất đai 1993", text: "Ổn định quyền sử dụng đất; khuyến khích đầu tư dài hạn, tín dụng nông thôn." },
  { icon: <FaIndustry/>, title: "Công nghiệp hoá", text: "Tái cơ cấu, hình thành doanh nghiệp nhiều thành phần; tăng nội lực sản xuất." },
];

export default function ReformScreen(){
  const hostRef = useRef(null);
  const { ref, inView } = useInView({ threshold: .2, triggerOnce: true });
  const { scrollYProgress } = useScroll({ target: hostRef, offset: ["start end", "end start"] });
  const yFloat = useTransform(scrollYProgress, [0, 1], ["0vh", "-3vh"]); // nền trôi nhẹ

  return (
    <section ref={hostRef} className="reform-wrap">
      <motion.div className="bg-float" style={{ y: yFloat }} />
      <div className="container">
        <motion.h2
          ref={ref}
          className="rf-title"
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .32, ease: "easeOut" }}
        >
          1986 – 1995: “BÌNH MINH MỞ CỬA”
        </motion.h2>

        <motion.p
          className="rf-sub"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: .32, delay: .05 }}
        >
          Chuyển từ cơ chế bao cấp sang kinh tế thị trường định hướng XHCN; mở cửa thu hút đầu tư, tái khởi động động lực tăng trưởng.
        </motion.p>

        {/* Timeline: vẽ line dọc + thẻ sự kiện tilt/hover */}
        <div className={`timeline ${inView ? 'is-in' : ''}`}>
          <motion.div
            className="line"
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: .55, ease: "easeOut" }}
          />
          {events.map((ev, idx) => (
            <motion.div
              key={ev.year}
              className="tl-item"
              initial={{ opacity: 0, y: 22 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .28, delay: .07 * idx }}
            >
              <div className="dot" />
              <motion.div
                className="card tl-card"
                whileHover={{ y: -6, rotateZ: -0.6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
              >
                <div className="row1">
                  <motion.div
                    className="icon"
                    whileHover={{ scale: 1.12, rotate: 6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  >{ev.icon}</motion.div>
                  <div className="year">{ev.year}</div>
                </div>
                <div className="title">{ev.title}</div>
                <div className="note">{ev.note}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Policy grid */}
        <motion.div
          className="policy-grid"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .3, delay: .07 * events.length }}
        >
          {policies.map((p, i) => (
            <motion.div
              key={i}
              className="policy card"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
            >
              <div className="p-icon">{p.icon}</div>
              <div className="p-title">{p.title}</div>
              <div className="p-text">{p.text}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chỉ dấu kết quả (progress meters) */}
        <motion.div
          className="metric-row"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .3, delay: .07 * events.length + .1 }}
        >
          {[
            { label: "Lạm phát hạ nhiệt (cuối kỳ)", val: 20, unit: "%", color: "var(--primary)" },
            { label: "Xuất khẩu tăng trưởng bình quân", val: 15, unit: "%/năm", color: "var(--secondary)" },
            { label: "FDI đăng ký (xu hướng)", val: 100, unit: "+", color: "#8B5E3C" },
          ].map((m, i) => (
            <div key={i} className="metric card">
              <div className="m-label">{m.label}</div>
              <div className="meter">
                <div className="fill" style={{ width: `${Math.min(m.val, 100)}%`, background: m.color }} />
              </div>
              <div className="m-value">{m.val}{m.unit}</div>
            </div>
          ))}
        </motion.div>

        {/* Summary + nút điều hướng */}
        <motion.div
          className="rf-summary card"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .3, delay: .07 * events.length + .2 }}
        >
          <div className="pill">Kết quả then chốt</div>
          <ul>
            <li>FDI đăng ký tăng nhanh; xuất hiện KCN và liên doanh, nền tảng công nghiệp hoá được đặt lại.</li>
            <li>GDP phục hồi, lạm phát hạ nhiệt so với 1985; lưu thông hàng hoá cải thiện.</li>
            <li>Khung pháp lý cho kinh tế nhiều thành phần hình thành; hội nhập khu vực tăng tốc (ASEAN 1995).</li>
          </ul>
          <div className="rf-actions">
            <Link className="btn btn-red hover-lift" to="/screen-2">← Quay lại bối cảnh</Link>
          </div>
          <div className="footnote">* Các chỉ dấu/giá trị mang tính khái quát phục vụ minh hoạ tiến trình.</div>
        </motion.div>
      </div>
    </section>
  );
}
