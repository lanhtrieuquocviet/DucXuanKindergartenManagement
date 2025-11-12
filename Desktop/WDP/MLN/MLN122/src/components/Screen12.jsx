import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaBalanceScale,
  FaIndustry,
  FaLeaf,
  FaGlobeAsia,
  FaTimes,
} from "react-icons/fa";
import thornbg from "../assets/images/struggles.jpg";
import "../assets/styles/Screen12.css";

/* Counter nhẹ nhàng cho các số liệu */
function Counter({ to = 1000, duration = 900, suffix = "" }) {
  const [val, setVal] = useState(0);
  const start = useRef(null);
  useEffect(() => {
    let raf;
    const step = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min(1, (ts - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span className="highlight">
      {val.toLocaleString()} {suffix}
    </span>
  );
}

const CHALLENGES = [
  {
    id: "trap",
    icon: <FaBalanceScale />,
    title: "Bẫy thu nhập trung bình",
    desc: "Tăng trưởng chậm khi đạt ngưỡng thu nhập trung bình.",
    note: (
      <>
        Giai đoạn 2011–2020, tăng trưởng GDP trung bình khoảng{" "}
        <b className="highlight">6,2%</b>/năm nhưng năng suất lao động chỉ tăng{" "}
        <b className="highlight">~5%</b>/năm. <br />
        Tỷ trọng công nghiệp công nghệ cao trong GDP mới đạt{" "}
        <b className="highlight">12–15%</b>, thấp hơn nhiều so với Hàn Quốc (
        <b className="highlight">30%+</b>) thời kỳ cất cánh. <br />
        Để vượt “bẫy”, cần nâng chi tiêu R&D lên tối thiểu{" "}
        <b className="highlight">2% GDP</b> (hiện mới ~0,5%).
      </>
    ),
  },
  {
    id: "gap",
    icon: <FaIndustry />,
    title: "Chênh lệch giàu nghèo",
    desc: "Khoảng cách thu nhập giữa các vùng miền.",
    note: (
      <>
        Hệ số GINI duy trì quanh mức <b className="highlight">0,38–0,41</b>{" "}
        suốt thập kỷ qua. <br />
        Nhóm 20% giàu nhất chiếm{" "}
        <b className="highlight">45% tổng thu nhập</b>, trong khi 20% nghèo
        nhất chỉ chiếm <b className="highlight">7%</b>. <br />
        Ở vùng sâu, tỷ lệ nghèo đa chiều vẫn{" "}
        <b className="highlight">30%+</b>, cao gấp 5 lần trung bình quốc gia.
      </>
    ),
  },
  {
    id: "env",
    icon: <FaLeaf />,
    title: "Ô nhiễm môi trường",
    desc: "Áp lực từ công nghiệp hóa nhanh.",
    note: (
      <>
        Việt Nam nằm trong nhóm 10 nước ô nhiễm không khí cao nhất châu Á, nồng
        độ PM2.5 trung bình{" "}
        <b className="highlight">&gt; 30 µg/m³</b>. <br />
        Khoảng <b className="highlight">70%</b> nước thải công nghiệp chưa qua
        xử lý. <br />
        Thiệt hại kinh tế do ô nhiễm ước tính tương đương{" "}
        <b className="highlight">5% GDP/năm</b>.
      </>
    ),
  },
  {
    id: "global",
    icon: <FaGlobeAsia />,
    title: "Phụ thuộc kinh tế thế giới",
    desc: "Tác động mạnh từ biến động toàn cầu.",
    note: (
      <>
        Xuất khẩu chiếm hơn <b className="highlight">90% GDP</b> (2023), trong
        đó hơn <b className="highlight">70%</b> do khối FDI đóng góp. <br />
        Chuỗi cung ứng bị gián đoạn trong COVID-19 khiến tăng trưởng công
        nghiệp năm 2020 giảm còn{" "}
        <b className="highlight">2,6%</b>. <br />
        Cần nâng tỷ lệ giá trị nội địa trong sản phẩm xuất khẩu lên{" "}
        <b className="highlight">50%</b> vào 2030.
      </>
    ),
  },
];

export default function Screen12() {
  const hostRef = useRef(null);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { scrollYProgress } = useScroll({
    target: hostRef,
    offset: ["start end", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-6vh", "6vh"]);
  const [active, setActive] = useState(null);

  return (
    <section ref={hostRef} className={`thorn-wrap ${inView ? "is-in" : ""}`}>
      {/* LEFT: ảnh */}
      <motion.div
        className="thorn-photo"
        style={{ backgroundImage: `url(${thornbg})`, y: yParallax }}
        initial={{ opacity: 0, scale: 1.05 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        title="Những thách thức sau Đổi mới"
      />

      {/* RIGHT: nội dung */}
      <motion.div
        ref={ref}
        className="thorn-content container"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="thorn-title">“Gai Hoa Hồng” – Những Thách Thức Phải Đối Mặt</h2>
        <p className="thorn-lead">
          Sau hơn 35 năm hội nhập, Việt Nam đạt nhiều thành tựu, song vẫn đối
          mặt với không ít rào cản trên con đường phát triển bền vững: tăng
          trưởng chất lượng thấp, chênh lệch xã hội, và áp lực môi trường ngày
          càng rõ rệt.
        </p>

        <div className="thorn-grid">
          {CHALLENGES.map((c) => (
            <motion.div
              key={c.id}
              className="thorn-card card"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 250, damping: 18 }}
              onClick={() => setActive(c.id)}
            >
              <div className="t-icon">{c.icon}</div>
              <div className="t-title">{c.title}</div>
              <div className="t-desc">{c.desc}</div>

              {active === c.id && (
                <div className="t-note-overlay">
                  <button
                    className="close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(null);
                    }}
                  >
                    <FaTimes />
                  </button>
                  <div className="t-note-content">{c.note}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}