import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaTicketAlt, FaShoppingBasket, FaChartLine, FaIdCard, FaWarehouse, FaBalanceScale, FaTruckLoading } from "react-icons/fa";
import { Link } from "react-router-dom";
import oldstreet from "../assets/images/oldstreet.jpg";
import "../assets/styles/HistoryScreen.css";

/* Counter mượt (easing cubic) */
function Counter({ to = 1000, duration = 900, suffix = "", className = "" }) {
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
  return <span className={className}>{val.toLocaleString()} {suffix}</span>;
}

export default function HistoryScreen() {
  const hostRef = useRef(null);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  // Parallax ảnh theo scroll
  const { scrollYProgress } = useScroll({ target: hostRef, offset: ["start end", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-6vh", "6vh"]);

  const [mx, setMx] = useState(50);
  const [my, setMy] = useState(50);

  const photoStyles = {
    backgroundImage: `url(${oldstreet})`,
    "--mx": `${mx}%`,
    "--my": `${my}%`,
  };

  return (
    <section ref={hostRef} className={`history-wrap ${inView ? "is-in" : ""}`}>
      {/* LEFT: Ảnh (parallax + spotlight theo chuột) */}
      <motion.div
        className="history-photo"
        style={{ ...photoStyles, y: yParallax }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMx(((e.clientX - r.left) / r.width) * 100);
          setMy(((e.clientY - r.top) / r.height) * 100);
        }}
        title="Khu phố Hà Nội thời bao cấp"
      />

      {/* RIGHT: Nội dung phong phú */}
      <div ref={ref} className="history-content container">
        <motion.h2
          className="hc-title"
          initial={{ opacity: 0, x: 26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 200, damping: 24, duration: 0.5 }}
        >
          BỐI CẢNH LỊCH SỬ – VIỆT NAM TRƯỚC NGƯỠNG CỬA ĐỔI MỚI
        </motion.h2>

        <motion.p
          className="hc-lead"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        >
          Sau 1975, nền kinh tế vận hành theo cơ chế <b>kế hoạch hoá tập trung bao cấp</b>. Nhu yếu phẩm phân phối qua <b>tem phiếu</b>,
          lưu thông hàng hóa hạn chế, động lực sản xuất suy giảm.
        </motion.p>

        <motion.p
          className="hc-par"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.38, ease: "easeOut", delay: 0.05 }}
        >
          <u>1981–1985</u>: Tăng trưởng GDP bình quân khoảng <b>2,3%</b>/năm; lạm phát có năm vượt <b>700%</b> (1985).
          Thu nhập bình quân đầu người ~<b>200 USD/năm</b>. Nhiều DNNN thua lỗ, sản xuất trì trệ — đời sống nhân dân khó khăn.
        </motion.p>

        <motion.div
          className="hc-stats"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.28 }}
        >
          {[
            { icon: <FaChartLine />, label: "GDP", value: 23, suffix: "%/5 năm" },
            { icon: <FaTicketAlt />, label: "Lạm phát", value: 700, suffix: "%" },
            { icon: <FaShoppingBasket />, label: "Thu nhập", value: 200, suffix: "USD/năm" },
          ].map((c, i) => (
            <motion.div
              key={i}
              className="chip hover-glow"
              style={{ animationDelay: `${i * 0.35}s` }}
              whileHover={{ scale: 1.01, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              title={c.label}
            >
              {c.icon} {c.label}: <Counter to={c.value} duration={800} suffix={c.suffix} />
            </motion.div>
          ))}
        </motion.div>

        {/* Lưới Fact (mô tả bối cảnh) */}
        <motion.div
          className="fact-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, show: {} }}
        >
          {[
            {
              icon: <FaIdCard />,
              title: "Tem phiếu & định lượng",
              text: "Gạo, vải vóc, xà phòng… được phân bổ bằng sổ mua hàng; cầu vượt cung kéo dài.",
            },
            {
              icon: <FaWarehouse />,
              title: "Kinh tế hiện vật",
              text: "Ưu tiên giao chỉ tiêu – cấp phát; giá cả hành chính, tín hiệu thị trường mờ nhạt.",
            },
            {
              icon: <FaBalanceScale />,
              title: "Méo mó giá–lương–tiền",
              text: "Giá bán thấp hơn chi phí, lương thực tế giảm; lạm phát bào mòn tích lũy.",
            },
            {
              icon: <FaTruckLoading />,
              title: "Hàng hóa khan hiếm",
              text: "Thiếu nguyên liệu – vật tư; khuyến khích sản xuất yếu, lưu thông ách tắc.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="fact card"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.28, delay: 0.05 * i }}
            >
              <div className="f-icon">{f.icon}</div>
              <div className="f-title">{f.title}</div>
              <div className="f-text">{f.text}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trích dẫn */}
        <motion.div
          className="quote-card card"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <div className="q-mark">“</div>
          <div className="q-text">
            Hàng hoá khan hiếm, sản xuất trì trệ, lạm phát cao — yêu cầu cấp bách đặt ra là phải
            <b> đổi mới tư duy</b> và cơ chế quản lý, giải phóng sức sản xuất.
          </div>
        </motion.div>

        {/* So sánh Trước/Manh nha đổi mới (Before/After) */}
        <motion.div
          className="ba-box"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.3 }}
        >
          <div className="ba-col">
            <div className="ba-title">Trước Đổi Mới</div>
            <ul>
              <li>Chỉ tiêu – cấp phát là chủ yếu</li>
              <li>Giá cả hành chính, chợ tự do bị kiểm soát</li>
              <li>Doanh nghiệp lỗ kéo dài, kỷ luật tài chính yếu</li>
              <li>Tem phiếu cho phần lớn nhu yếu phẩm</li>
            </ul>
          </div>
          <div className="ba-col">
            <div className="ba-title">Manh nha chuyển biến (1986–1988)</div>
            <ul>
              <li>Thí điểm khoán, giao quyền tự chủ hạn mức</li>
              <li>Khuyến khích lưu thông hàng hoá</li>
              <li>Chuẩn bị cải cách giá – lương – tiền</li>
              <li>Xác lập yêu cầu mở cửa – hội nhập</li>
            </ul>
          </div>
        </motion.div>

        <div className="hc-actions">
          <Link className="btn btn-outline hover-lift" to="/screen-3">Sang giai đoạn 1986–1995 →</Link>
        </div>

        <div className="footnote">* Một số chỉ dấu/số liệu mang tính khái quát để minh hoạ bối cảnh.</div>
      </div>
    </section>
  );
}
