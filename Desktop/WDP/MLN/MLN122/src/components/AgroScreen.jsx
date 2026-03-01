import React, { useRef, useState } from "react";
import useInViewOnce from "../hooks/useInViewOnce";
import { LuCoffee, LuApple, LuFish, LuTruck } from "react-icons/lu";
import { TbGrain } from "react-icons/tb";
import "../assets/styles/AgroScreen.css";

const PRODUCTS = [
  {
    id: "coffee",
    name: "Cà phê",
    icon: <LuCoffee />,
    tags: ["Robusta", "Arabica", "Chế biến sâu"],
    note: "Việt Nam là nhà xuất khẩu Robusta lớn nhất thế giới.",
  },
  {
    id: "rice",
    name: "Gạo",
    icon: <TbGrain />,
    tags: ["ST25", "Jasmine", "Gạo thơm"],
    note: "Thuộc nhóm dẫn đầu xuất khẩu gạo chất lượng cao.",
  },
  {
    id: "shrimp",
    name: "Tôm",
    icon: <LuFish />,
    tags: ["Tôm thẻ", "Tôm sú", "ASC/BAP"],
    note: "Mũi nhọn thủy sản tại các thị trường Mỹ, EU, Nhật Bản.",
  },
  {
    id: "fruit",
    name: "Trái cây",
    icon: <LuApple />,
    tags: ["Sầu riêng", "Vải", "Thanh long"],
    note: "Mở rộng chính ngạch sang Trung Quốc và EU.",
  },
];

export default function AgroScreen() {
  const wrapRef = useRef(null);
  const inView = useInViewOnce(wrapRef);
  const [openId, setOpenId] = useState(null);

  const toggleCard = (id) => setOpenId((v) => (v === id ? null : id));

  return (
    <section ref={wrapRef} className={`agro-wrap ${inView ? "is-in" : ""}`}>
      <div className="container">
        <header className="ag-head">
          <h2 className="ag-title">Nông Sản Việt Chinh Phục Toàn Cầu</h2>
          <p className="ag-sub">
            Câu chuyện về các mặt hàng chủ lực: cà phê, gạo, tôm, trái cây… cùng chuỗi cung ứng – tiêu chuẩn – logistics.
          </p>
        </header>

        <div className="ag-gallery">
          {PRODUCTS.map((p, i) => {
            const isOpen = openId === p.id;
            return (
              <div
                key={p.id}
                className={`ag-card ${isOpen ? "pop-open" : ""}`}
                style={{ animationDelay: `${0.05 * i}s` }}
                onClick={() => toggleCard(p.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`ag-pop-${p.id}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCard(p.id);
                  }
                  if (e.key === "Escape" && isOpen) {
                    e.preventDefault();
                    setOpenId(null);
                  }
                }}
              >
                <div className="ag-ico">{p.icon}</div>
                <div className="ag-name">{p.name}</div>
                <div className="ag-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="ag-chip">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Pop-up cho MỌI sản phẩm */}
                <div className="ag-pop" id={`ag-pop-${p.id}`} aria-live="polite">
                  <div className="ag-pop-head">{p.name} Việt Nam</div>
                  <div className="ag-pop-text">{p.note}</div>
                  <div className="ag-pop-foot">
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="mini-pill">{t}</span>
                    ))}
                  </div>
                  <button
                    className="ag-pop-close"
                    aria-label="Đóng"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenId(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ag-stats">
          <div className="stat card">
            <div className="st-row">
              <div className="st-ico"><LuTruck /></div>
              <div className="st-title">Chuỗi cung ứng</div>
            </div>
            <div className="st-meter">
              <div className="fill" style={{ "--pct": "78%" }} />
            </div>
            <div className="st-foot">Mức tối ưu hóa logistics ước tính</div>
          </div>

          <div className="stat card">
            <div className="st-row">
              <div className="st-ico"><TbGrain /></div>
              <div className="st-title">Chế biến sâu</div>
            </div>
            <div className="st-meter">
              <div className="fill" style={{ "--pct": "62%" }} />
            </div>
            <div className="st-foot">Tỷ trọng giá trị gia tăng</div>
          </div>

          <div className="stat card">
            <div className="st-row">
              <div className="st-ico"><LuApple /></div>
              <div className="st-title">Đa dạng sản phẩm</div>
            </div>
            <div className="st-meter">
              <div className="fill" style={{ "--pct": "84%" }} />
            </div>
            <div className="st-foot">Danh mục – thị trường</div>
          </div>
        </div>
      </div>
    </section>
  );
}
