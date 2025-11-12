import React, { useEffect, useMemo, useRef, useState } from "react";
import useInViewOnce from "../hooks/useInViewOnce";
import "../assets/styles/FactoryScreen.css";

// ICONS
import { FiCpu, FiPackage, FiShoppingBag } from "react-icons/fi";
import { FaIndustry, FaShip } from "react-icons/fa";

const PIPELINES = {
  electronics: {
    label: "Điện tử",
    parts: ["PCB", "Chipset", "Module Camera", "Pin/Li-ion"],
    brands: ["Samsung", "Intel"],
    progress: [
      { title: "Linh kiện", desc: "Nhập module/linh kiện tiêu chuẩn quốc tế." },
      { title: "Nhà máy VN", desc: "Lắp ráp/kiểm định tại Bắc Ninh – Thái Nguyên – TP.HCM..." },
      { title: "Container", desc: "Đóng gói, niêm phong, logistics cảng biển/đường hàng không." },
      { title: "Kệ hàng",  desc: "Phân phối toàn cầu vào hệ thống bán lẻ & OEM." }
    ]
  },
  textile: {
    label: "Dệt may",
    parts: ["Sợi/Vải", "Nhuộm/Hoàn tất", "Phụ liệu", "May công đoạn"],
    brands: ["Nike", "Adidas"],
    progress: [
      { title: "Vật liệu", desc: "Nguyên liệu sợi – dệt – nhuộm theo tiêu chuẩn môi trường." },
      { title: "Xưởng VN", desc: "Cắt may – QC – traceability đơn hàng." },
      { title: "Container", desc: "Đóng kiện, vận tải đường biển sang Mỹ/EU/Châu Á." },
      { title: "Kệ hàng",  desc: "Bán lẻ qua chuỗi thể thao & fashion toàn cầu." }
    ]
  }
};

function useCountUp(target=0, duration=1200){
  const [val, setVal] = useState(0);
  useEffect(()=>{
    let raf, start;
    const step = (t)=>{
      if(!start) start = t;
      const p = Math.min(1, (t - start)/duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if(p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return ()=> cancelAnimationFrame(raf);
  },[target, duration]);
  return val;
}

export default function FactoryScreen(){
  const wrapRef = useRef(null);
  const inView = useInViewOnce(wrapRef);
  const [mode, setMode] = useState("electronics");
  const data = PIPELINES[mode];

  const jobs      = useCountUp(mode==="electronics" ? 1200000 : 2800000, 1300);
  const exportVal = useCountUp(mode==="electronics" ? 120     : 45,      1100);
  const plants    = useCountUp(mode==="electronics" ? 60      : 420,     900);

  const Icons = useMemo(()=>({
    part:   mode==="electronics" ? <FiCpu/>        : <FiPackage/>,
    factory:<FaIndustry/>,
    ship:   <FaShip/>,
    shelf:  <FiShoppingBag/>
  }),[mode]);

  const movingItems = useMemo(()=>(
    mode==="electronics"
      ? [<FiPackage key="a"/>, <FiPackage key="b"/>, <FiCpu key="c"/>, <FiPackage key="d"/>]
      : [<FiPackage key="a"/>, <FiPackage key="b"/>, <FiPackage key="c"/>, <FiPackage key="d"/>]
  ),[mode]);

  return (
    <section ref={wrapRef} className={`factory-wrap ${inView ? "is-in":""}`}>
      <div className="container">
        <header className="fx-head">
          <h2 className="fx-title">Việt Nam – “Công Xưởng” Mới Của Thế Giới</h2>
          <p className="fx-sub">Infographic chuỗi cung ứng: từ linh kiện/vật liệu → nhà máy tại Việt Nam → logistics → bán lẻ quốc tế.</p>
        </header>

        <div className="fx-switch">
          <button className={`pill ${mode==="electronics"?"active":""}`} onClick={()=>setMode("electronics")}>⚡ Điện tử</button>
          <button className={`pill ${mode==="textile"?"active":""}`}     onClick={()=>setMode("textile")}>🧵 Dệt may</button>
        </div>

        <div className="pipeline card">
          <div className="stage">
            <div className="st-head"><div className="st-ico">{Icons.part}</div><div className="st-title">{data.progress[0].title}</div></div>
            <div className="st-body">
              <div className="parts">{data.parts.map((p,i)=><span className="part" key={i}>{p}</span>)}</div>
              <div className="st-note">{data.progress[0].desc}</div>
            </div>
          </div>

          <div className="arrow"><span className="arr" /></div>

          <div className="stage">
            <div className="st-head"><div className="st-ico"><FaIndustry/></div><div className="st-title">{data.progress[1].title}</div></div>
            <div className="st-body">
              <div className="brands">{data.brands.map((b,i)=><span className="brand" key={i}>{b}</span>)}</div>
              <div className="st-note">{data.progress[1].desc}</div>
            </div>
          </div>

          <div className="arrow"><span className="arr" /></div>

          <div className="stage">
            <div className="st-head"><div className="st-ico"><FaShip/></div><div className="st-title">{data.progress[2].title}</div></div>
            <div className="st-body"><div className="st-note">{data.progress[2].desc}</div></div>
          </div>

          <div className="arrow"><span className="arr" /></div>

          <div className="stage">
            <div className="st-head"><div className="st-ico"><FiShoppingBag/></div><div className="st-title">{data.progress[3].title}</div></div>
            <div className="st-body"><div className="st-note">{data.progress[3].desc}</div></div>
          </div>

          <div className="track">
            {movingItems.map((m, i)=><div className={`pkg pkg-${i}`} key={i} aria-hidden>{m}</div>)}
          </div>
        </div>

        <div className="fx-metrics">
          <div className="metric"><div className="m-title">Việc làm trực tiếp/gián tiếp</div><div className="m-val">{jobs.toLocaleString("vi-VN")}+</div><div className="m-foot">lao động (ước tính minh hoạ)</div></div>
          <div className="metric"><div className="m-title">Giá trị xuất khẩu</div><div className="m-val">{exportVal} tỷ USD</div><div className="m-foot">theo ngành chọn</div></div>
          <div className="metric"><div className="m-title">Số cơ sở/sản xuất</div><div className="m-val">{plants}+</div><div className="m-foot">nhà máy/xưởng</div></div>
        </div>

        <div className="fx-notes card">
          <div className="nx-col">
            <div className="nx-pill">Chuỗi điện tử</div>
            <ul>
              <li>Gia tăng nội địa hoá linh kiện qua thời gian.</li>
              <li>Ưu tiên chất lượng – kiểm định – tiêu chuẩn môi trường.</li>
              <li>Kết nối hệ sinh thái nhà cung ứng miền Bắc và miền Nam.</li>
            </ul>
          </div>
          <div className="nx-col">
            <div className="nx-pill">Chuỗi dệt may</div>
            <ul>
              <li>Truy xuất nguồn gốc & tuân thủ xanh (EU/US).</li>
              <li>Tối ưu logistics container – Cát Lái, Lạch Huyện.</li>
              <li>Lên nấc thang thiết kế/brand OEM–ODM.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
