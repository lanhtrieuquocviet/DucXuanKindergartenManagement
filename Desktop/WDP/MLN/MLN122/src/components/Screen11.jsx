import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaCity, FaHeartbeat, FaChartLine, FaLeaf, FaSmile } from "react-icons/fa";
import { Link } from "react-router-dom";
import vietnamGrowth from "../assets/images/background.jpg";
import "../assets/styles/Screen11.css";

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
  return (
    <span className={className}>
      {val.toLocaleString("vi-VN")} {suffix}
    </span>
  );
}

export default function Screen11() {
  const hostRef = useRef(null);
  const { ref, inView } = useInView({ threshold: 0.25, triggerOnce: true });

  // Parallax ảnh theo scroll
  const { scrollYProgress } = useScroll({
    target: hostRef,
    offset: ["start end", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-6vh", "6vh"]);

  const [mx, setMx] = useState(50);
  const [my, setMy] = useState(50);

  const photoStyles = {
    backgroundImage: `url(${vietnamGrowth})`,
    "--mx": `${mx}%`,
    "--my": `${my}%`,
  };

  return (
    <section ref={hostRef} className={`sweet-wrap ${inView ? "is-in" : ""}`}>
      {/* LEFT: Ảnh (parallax + spotlight theo chuột) */}
      <motion.div
        className="sw-photo"
        style={{ ...photoStyles, y: yParallax }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMx(((e.clientX - r.left) / r.width) * 100);
          setMy(((e.clientY - r.top) / r.height) * 100);
        }}
        title="Việt Nam thời kỳ hội nhập – đô thị hóa, phát triển bền vững"
      />

      {/* RIGHT: Nội dung */}
      <div ref={ref} className="sw-content container">
        <motion.h2
          className="sw-title"
          initial={{ opacity: 0, x: 26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 220, damping: 26, duration: 0.5 }}
        >
          TRÁI NGỌT – TÁC ĐỘNG TÍCH CỰC ĐẾN XÃ HỘI
        </motion.h2>

        <motion.p
          className="sw-lead"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          Sau gần bốn thập kỷ đổi mới, Việt Nam đã gặt hái những <b>thành tựu to lớn</b> về tăng trưởng kinh tế, giảm nghèo, phát triển hạ tầng và nâng cao chất lượng sống.
        </motion.p>

        {/* Các chỉ số phát triển */}
        <motion.div
          className="sw-stats"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35 }}
        >
          {[
            { icon: <FaChartLine />, label: "GDP bình quân đầu người", value: 4300, suffix: "USD" },
            { icon: <FaLeaf />, label: "Tỷ lệ nghèo", value: 3, suffix: "%" },
            { icon: <FaCity />, label: "Tỷ lệ đô thị hóa", value: 42, suffix: "%" },
          ].map((c, i) => (
            <motion.div
              key={i}
              className="chip hover-glow"
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              {c.icon} {c.label}: <Counter to={c.value} duration={1000} suffix={c.suffix} />
            </motion.div>
          ))}
        </motion.div>

        {/* Hai cột: đô thị hóa và chất lượng sống */}
        <motion.div
          className="fact-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          {[
            {
              icon: <FaCity />,
              title: "Đô thị hóa & Hạ tầng",
              text: "Tỷ lệ đô thị hóa đạt 42%; hệ thống giao thông, năng lượng và công nghệ phủ khắp toàn quốc.",
            },
            {
              icon: <FaHeartbeat />,
              title: "Tuổi thọ & Chất lượng sống",
              text: "Tuổi thọ trung bình đạt 74 tuổi; giáo dục, y tế và phúc lợi xã hội không ngừng nâng cao.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="fact card"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
            >
              <div className="f-icon">{f.icon}</div>
              <div className="f-title">{f.title}</div>
              <div className="f-text">{f.text}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trích dẫn tổng kết */}
        <motion.div
          className="quote-card card"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35 }}
        >
          <div className="q-mark">“</div>
          <div className="q-text">
            Thành tựu của hơn ba thập kỷ đổi mới là minh chứng cho
            <b> sức sống, nghị lực và tầm nhìn hội nhập của Việt Nam</b>.
          </div>
        </motion.div>

        {/* Nút chuyển */}
        <div className="sw-actions">
          <Link className="btn btn-outline hover-lift" to="/screen-12">
            Tiếp theo →
          </Link>
        </div>
      </div>
    </section>
  );
}