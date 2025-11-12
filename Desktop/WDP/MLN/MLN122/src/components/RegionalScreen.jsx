import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useInViewOnce from "../hooks/useInViewOnce";
import "../assets/styles/RegionalScreen.css";

const ASEAN = [
  "Vietnam","Thailand","Laos","Cambodia","Myanmar","Malaysia",
  "Singapore","Indonesia","Philippines","Brunei"
];

const APEC = [
  "Australia","Brunei","Canada","Chile","China","Hong Kong","Indonesia","Japan",
  "Korea","Malaysia","Mexico","New Zealand","Papua New Guinea","Peru","Philippines",
  "Russia","Singapore","Chinese Taipei","Thailand","United States","Vietnam"
];

// toạ độ tương đối trên “bản đồ” giả lập (0–100%)
const NODES = [
  // Đông Nam Á
  { name:"Vietnam", x:63, y:52, group:"SEA", code:"VN" },
  { name:"Thailand", x:56, y:55, group:"SEA", code:"TH" },
  { name:"Laos", x:60, y:48, group:"SEA", code:"LA" },
  { name:"Cambodia", x:58, y:60, group:"SEA", code:"KH" },
  { name:"Myanmar", x:50, y:48, group:"SEA", code:"MM" },
  { name:"Malaysia", x:56, y:67, group:"SEA", code:"MY" },
  { name:"Singapore", x:56, y:73, group:"SEA", code:"SG" },
  { name:"Indonesia", x:62, y:78, group:"SEA", code:"ID" },
  { name:"Philippines", x:70, y:60, group:"SEA", code:"PH" },
  { name:"Brunei", x:63, y:70, group:"SEA", code:"BN" },

  // Châu Á–TBD mở rộng
  { name:"Japan", x:82, y:35, group:"PAC", code:"JP" },
  { name:"Korea", x:78, y:37, group:"PAC", code:"KR" },
  { name:"China", x:70, y:40, group:"PAC", code:"CN" },
  { name:"Hong Kong", x:71, y:48, group:"PAC", code:"HK" },
  { name:"Chinese Taipei", x:75, y:48, group:"PAC", code:"TW" },
  { name:"Australia", x:85, y:88, group:"PAC", code:"AU" },
  { name:"New Zealand", x:92, y:93, group:"PAC", code:"NZ" },
  { name:"United States", x:12, y:38, group:"PAC", code:"US" },
  { name:"Canada", x:14, y:26, group:"PAC", code:"CA" },
  { name:"Russia", x:40, y:24, group:"PAC", code:"RU" },
  { name:"Mexico", x:16, y:49, group:"PAC", code:"MX" },
  { name:"Chile", x:10, y:74, group:"PAC", code:"CL" },
  { name:"Peru", x:14, y:66, group:"PAC", code:"PE" },
  { name:"Papua New Guinea", x:80, y:84, group:"PAC", code:"PG" }
];

export default function RegionalScreen(){
  const wrapRef = useRef(null);
  const inView = useInViewOnce(wrapRef);
  const [hoverTag, setHoverTag] = useState(null); // "ASEAN" | "APEC" | null

  const activeSet = useMemo(()=>{
    const a = new Set();
    if(hoverTag === "ASEAN") ASEAN.forEach(c=>a.add(c));
    if(hoverTag === "APEC")  APEC.forEach(c=>a.add(c));
    return a;
  },[hoverTag]);

  const isHighlighted = (n) => activeSet.size ? activeSet.has(n.name) : false;

  return (
    <section ref={wrapRef} className={`regional-wrap ${inView ? "is-in":""}`}>
      <div className="container">
        <header className="rg-head">
          <h2 className="rg-title">1995–2007 · Vươn Ra Khu Vực</h2>
          <p className="rg-sub">Gia nhập ASEAN (1995), APEC (1998) và Hiệp định Thương mại song phương Việt–Mỹ (BTA, 2000) mở ra không gian hợp tác rộng lớn.</p>

          <div className="rg-badges">
            <span className={`rg-badge ${hoverTag==="ASEAN"?"active":""}`}
              onMouseEnter={()=>setHoverTag("ASEAN")}
              onMouseLeave={()=>setHoverTag(null)}
              onClick={()=>setHoverTag(hoverTag==="ASEAN"?null:"ASEAN")}
              title="Highlight các nước ASEAN"
            >
              <span className="b-ico">🌏</span> ASEAN
            </span>

            <span className={`rg-badge ${hoverTag==="APEC"?"active":""}`}
              onMouseEnter={()=>setHoverTag("APEC")}
              onMouseLeave={()=>setHoverTag(null)}
              onClick={()=>setHoverTag(hoverTag==="APEC"?null:"APEC")}
              title="Highlight các nền kinh tế APEC"
            >
              <span className="b-ico">🧭</span> APEC
            </span>
          </div>
        </header>

        <div className="geo-board">
          <div className="geo-bg" />
          {NODES.map((n, i)=>(
            <div
              key={n.name}
              className={`node ${n.group} ${isHighlighted(n)?"highlight":""} ${n.name==="Vietnam"?"vn":""}`}
              style={{ left:`${n.x}%`, top:`${n.y}%` }}
              title={n.name}
            >
              <span className="dot" />
              <span className="label">{n.code}</span>
            </div>
          ))}

          <div className="legend card">
            <div className="lg-row">
              <span className="lg-dot asean"></span> ASEAN
            </div>
            <div className="lg-row">
              <span className="lg-dot apec"></span> APEC
            </div>
            <div className="lg-row">
              <span className="lg-dot vn"></span> Việt Nam
            </div>
          </div>
        </div>

        <div className="rg-events">
          <div className="ev-card">
            <div className="ev-row1">
              <div className="ev-ico">🤝</div>
              <div className="ev-year">1995</div>
            </div>
            <div className="ev-title">Gia nhập ASEAN</div>
            <div className="ev-note">
              Việt Nam trở thành thành viên chính thức của ASEAN (28/07/1995), thúc đẩy hợp tác khu vực
              về thương mại, đầu tư và an ninh kinh tế.
            </div>
          </div>

          <div className="ev-card">
            <div className="ev-row1">
              <div className="ev-ico">🛰️</div>
              <div className="ev-year">1998</div>
            </div>
            <div className="ev-title">Tham gia APEC</div>
            <div className="ev-note">
              Tham gia Diễn đàn Hợp tác Kinh tế Châu Á–Thái Bình Dương (APEC), mở rộng liên kết với
              các nền kinh tế chủ chốt trong chuỗi giá trị toàn cầu.
            </div>
          </div>

          <div className="ev-card">
            <div className="ev-row1">
              <div className="ev-ico">📜</div>
              <div className="ev-year">2000</div>
            </div>
            <div className="ev-title">Ký BTA Việt–Mỹ</div>
            <div className="ev-note">
              Hiệp định Thương mại song phương tạo cú hích cho xuất khẩu, tiêu chuẩn hoá thể chế thương mại
              và chuẩn bị cho quá trình gia nhập WTO.
            </div>
          </div>
        </div>

        <div className="rg-actions">
          <Link className="btn btn-outline" to="/factory">Xem tiếp: Việt Nam – “Công xưởng” mới</Link>
        </div>
      </div>
    </section>
  );
}
